import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { finalize, Observable, Subject } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { buildRedisOptions, getRedisUrl } from '@/lib/redis/redis.config';

@Injectable()
export class RedisPubsubService implements OnModuleInit, OnModuleDestroy {
  private readonly sub: Redis;
  private readonly pub: Redis;
  private readonly channels = new Map<string, Subject<string>>();
  private readonly redisUrl: string;

  constructor(
    configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisPubsubService.name);

    this.sub = new Redis(buildRedisOptions(configService));
    this.pub = new Redis(buildRedisOptions(configService));
    this.redisUrl = getRedisUrl(configService);

    this.sub.on('error', (err) => this.logger.error(`sub: ${err.message}`));
    this.pub.on('error', (err) => this.logger.error(`pub: ${err.message}`));

    this.sub.on('message', (channel, raw) => {
      this.channels.get(channel)?.next(raw);
    });
  }

  async onModuleInit() {
    await Promise.all([this.sub.connect(), this.pub.connect()]);
    await Promise.all([this.sub.ping(), this.pub.ping()]);
    this.logger.info(`Redis Pub/Sub connected to ${this.redisUrl}`);
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.sub.quit(), this.pub.quit()]);
  }

  subscribe(channel: string): Observable<string> {
    let subject = this.channels.get(channel);
    if (!subject) {
      subject = new Subject<string>();
      this.channels.set(channel, subject);
      void this.sub.subscribe(channel);
    }

    return subject.asObservable().pipe(
      finalize(() => {
        if (!subject.observed) {
          this.channels.delete(channel);
          void this.sub.unsubscribe(channel);
        }
      }),
    );
  }

  async publish(channel: string, message: string) {
    await this.pub.publish(channel, message);
  }

  /**
   * PUBSUB CHANNELS 는 이 Redis 서버에 붙은 모든 클라이언트를 합쳐
   * 구독자가 1명 이상인 채널을 돌려준다. 즉 blue/green 등 다른 인스턴스의
   * 구독도 함께 잡히므로 localChannelNames 와 1:1 로 대응하지 않는다.
   */
  async listChannels(pattern: string): Promise<string[]> {
    const channels = await this.pub.pubsub('CHANNELS', pattern);
    return channels.map((channel) => String(channel));
  }

  async countChannels(pattern: string): Promise<number> {
    return (await this.listChannels(pattern)).length;
  }

  /** 이 프로세스가 Subject 를 들고 있는 채널명. 패턴 필터는 걸려 있지 않다. */
  get localChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }

  get localChannelCount(): number {
    return this.channels.size;
  }
}
