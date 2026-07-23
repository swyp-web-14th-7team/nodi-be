import { ApiPropertyOptional } from '@nestjs/swagger';
import { PROFILE_CARD_LINK_TYPE_DESCRIPTION } from '@/module/profile-cards/type/profile-card-link-type.enum';
import { ProfileCardLinkInputDto } from '@/module/profile-cards/dto/profile-card-link-input.dto';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDefaultProfileCardDto {
  @ApiPropertyOptional({ description: '프로필 카드 닉네임 (1 ~ 255자)' })
  @Length(1, 255)
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiPropertyOptional({
    description: `링크 목록 (전체 교체: 넘긴 목록으로 덮어씀). 각 항목 type — ${PROFILE_CARD_LINK_TYPE_DESCRIPTION}`,
    type: [ProfileCardLinkInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileCardLinkInputDto)
  links?: ProfileCardLinkInputDto[];
}
