import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@/prisma/client';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { type SecureContextOptions } from 'tls';
import { readFileSync } from 'fs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly dbHost: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(PrismaService.name) private readonly logger: PinoLogger,
  ) {
    const url = new URL(configService.getOrThrow<string>('DATABASE_URL'));
    const dbCaPath = configService.get<string>('DB_SSL_CA_PATH');
    const certs: SecureContextOptions & {
      rejectUnauthorized?: boolean;
    } = dbCaPath
      ? {
          ca: readFileSync(dbCaPath),
          rejectUnauthorized: true,
        }
      : { rejectUnauthorized: false };
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      connectionLimit: 5,
      connectTimeout: 5000,
      ssl: certs,
    });
    super({ adapter });
    this.dbHost = `${url.hostname}:${url.port}/${url.pathname.slice(1)}`;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.info(`PrismaClient connected to ${this.dbHost}`);
    } catch (e) {
      this.logger.error(e);
      process.exit(1);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
