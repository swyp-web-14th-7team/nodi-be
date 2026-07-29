import { Module } from '@nestjs/common';
import { RedisService } from '@/lib/redis/redis.service';
import { RedisPubsubService } from '@/lib/redis/redis-pubsub.service';

@Module({
  providers: [RedisService, RedisPubsubService],
  exports: [RedisService, RedisPubsubService],
})
export class RedisModule {}
