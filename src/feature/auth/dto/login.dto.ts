import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '@/common/enum/provider.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: 'string', enum: Object.values(Provider) })
  @IsEnum(Provider)
  @IsString()
  @IsNotEmpty()
  provider: keyof typeof Provider;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;
}
