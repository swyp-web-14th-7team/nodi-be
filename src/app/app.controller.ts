import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from '@/lib/prisma/prisma.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
    @InjectPinoLogger(AppController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get()
  getHello(): string {
    this.logger.info({ sdf: 'sdf' }, 'Hello Worldsdfdsf');
    return this.appService.getHello();
  }
}
