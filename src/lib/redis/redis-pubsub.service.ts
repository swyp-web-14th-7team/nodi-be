import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { finalize, Observable, Subject } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
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

  async countChannels(pattern: string): Promise<number> {
    const channels = await this.pub.pubsub('CHANNELS', pattern);
    return channels.length;
  }

  get localChannelCount(): number {
    return this.channels.size;
  }
}
