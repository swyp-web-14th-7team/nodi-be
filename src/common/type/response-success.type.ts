import { ApiProperty } from '@nestjs/swagger';

export class ResponseSuccess<T> {
  @ApiProperty({ description: '상태 코드' })
  status: number;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  data: T;

  constructor(data: T, status: number = 200) {
    this.status = status;
    this.timestamp = new Date();
    this.data = data;
  }
}
