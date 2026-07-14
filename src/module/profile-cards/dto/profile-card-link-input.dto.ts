import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import {
  PROFILE_CARD_LINK_TYPE_DESCRIPTION,
  ProfileCardLinkType,
} from '@/module/profile-cards/type/profile-card-link-type.enum';

export class ProfileCardLinkInputDto {
  @ApiProperty({
    enum: ProfileCardLinkType,
    description: `링크 종류 — ${PROFILE_CARD_LINK_TYPE_DESCRIPTION}`,
  })
  @IsEnum(ProfileCardLinkType)
  type: ProfileCardLinkType;

  @ApiProperty({ description: '링크(URL) 또는 이메일 값' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  value: string;
}
