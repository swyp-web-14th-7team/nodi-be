import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ description: '토큰 타입 (bearer)', example: 'bearer' })
  tokenType: string;

  // TODO: 유저도 반환
}
