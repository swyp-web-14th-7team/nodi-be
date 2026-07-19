import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProfileCardLinkInputDto } from '@/module/profile-cards/dto/profile-card-link-input.dto';
import { PROFILE_CARD_LINK_TYPE_DESCRIPTION } from '@/module/profile-cards/type/profile-card-link-type.enum';
import { ProfileCardExperienceInputDto } from '@/module/profile-cards/dto/profile-card-experience-input.dto';

export class UpdateProfileCardDto {
  @ApiPropertyOptional({ description: '스킬 ID 목록', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  skillIds?: number[];

  @ApiPropertyOptional({ description: '관심사 ID 목록', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  interestIds?: number[];

  @ApiPropertyOptional({ description: '개성 ID (카드당 하나만 선택)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  personalityId?: number;

  @ApiPropertyOptional({ description: '한 줄 소개' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '공개 여부 (true: 공개, false: 비공개)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '소속 상태' })
  @Min(1)
  @IsNumber()
  @IsOptional()
  affiliationStatusId?: number;

  @ApiPropertyOptional({ description: '소속 명칭' })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  affiliation?: string;

  @ApiPropertyOptional({ description: '프로필 카드 이미지 URL' })
  @Length(10, 500)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  cardImageUrl?: string;

  @ApiPropertyOptional({ description: '프로필 이미지 URL' })
  @Length(10, 500)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    description: `링크 목록 (전체 교체: 넘긴 목록으로 덮어씀). 각 항목 type — ${PROFILE_CARD_LINK_TYPE_DESCRIPTION}`,
    type: [ProfileCardLinkInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfileCardLinkInputDto)
  links?: ProfileCardLinkInputDto[];

  @ApiPropertyOptional({
    description:
      '관련 경험 목록 (전체 교체: 넘긴 목록으로 덮어씀). sortOrder 는 표시 순서이며 1이 대표 경험, 목록 내 중복 불가',
    type: [ProfileCardExperienceInputDto],
  })
  @Type(() => ProfileCardExperienceInputDto)
  @ValidateNested({ each: true })
  @ArrayUnique((e: ProfileCardExperienceInputDto) => e.sortOrder)
  @IsArray()
  @IsOptional()
  experiences: ProfileCardExperienceInputDto[];
}
