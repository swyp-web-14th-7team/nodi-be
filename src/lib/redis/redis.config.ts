import { ConfigService } from '@nestjs/config';

export const buildRedisOptions = (configService: ConfigService) => {
  const host = configService.get<string>('REDIS_HOST') ?? 'localhost';
  const port = configService.get<number>('REDIS_PORT') ?? 6379;
  const username = configService.get<string>('REDIS_USERNAME') ?? '';
  const password = configService.get<string>('REDIS_PASSWORD') ?? '';

  return {
    host,
    port,
    username,
    password,
    lazyConnect: true,
  };
};

export const getRedisUrl = (configService: ConfigService) => {
  const host = configService.get<string>('REDIS_HOST') ?? 'localhost';
  const port = configService.get<number>('REDIS_PORT') ?? 6379;

  return `${host}:${port}`;
};
