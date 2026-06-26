import { Controller, Get, Headers } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HealthCheckResponse } from '@/app/type/health-check-response.type';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    @InjectPinoLogger(AppController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get('health')
  getHealth(@Headers('host') host: string): HealthCheckResponse {
    const uptime = process.uptime();
    return {
      status: 'health',
      host,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    };
  }

  @Get()
  getHello(): string {
    return 'server is running!';
  }
}
