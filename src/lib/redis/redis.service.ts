import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private client: Redis;
  private readonly redisUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(RedisService.name) private readonly logger: PinoLogger,
  ) {
    const host = configService.get<string>('REDIS_HOST') ?? 'localhost';
    const port = configService.get<number>('REDIS_PORT') ?? 6379;
    const username = configService.get<string>('REDIS_USERNAME') ?? '';
    const password = configService.get<string>('REDIS_PASSWORD') ?? '';

    this.client = new Redis({
      host,
      port,
      username,
      password,
      lazyConnect: true,
    });
    this.redisUrl = `${host}:${port}`;

    this.client.on('error', (err) => {
      this.logger.error(`RedisClient error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.info(`RedisClient disconnected`);
  }

  async onModuleInit() {
    await this.client.connect();
    await this.client.ping();
    this.logger.info(`RedisClient connected to ${this.redisUrl}`);
  }

  // async hset(key: string, value: object) {
  //   await this.client.hset(key, value);
  // }
  //
  // async hget(key: string, field: string) {
  //   return this.client.hget(key, field);
  // }

  async set(key: string, value: string, ttl: number = 300) {
    await this.client.setex(key, ttl, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }
}
