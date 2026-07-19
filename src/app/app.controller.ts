import { Controller, Get, Headers } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HealthCheckResponse } from '@/app/type/health-check-response.type';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    @InjectPinoLogger(AppController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get('health')
  @ApiExcludeEndpoint()
  getHealth(@Headers('host') host: string): HealthCheckResponse {
    const uptime = process.uptime();
    return {
      status: 'health',
      host,
      version: process.env.npm_package_version ?? 'unknown',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    };
  }

  @Get()
  @ApiExcludeEndpoint()
  getHello(): string {
    return 'server is running!';
  }
}
