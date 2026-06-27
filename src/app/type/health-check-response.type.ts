import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResponse {
  @ApiProperty({ description: 'health', example: 'health' })
  status: string;

  @ApiProperty({ description: 'host', example: 'localhost' })
  host: string;

  @ApiProperty({ description: 'uptime', example: '0h 0m 4s' })
  uptime: string;
}
