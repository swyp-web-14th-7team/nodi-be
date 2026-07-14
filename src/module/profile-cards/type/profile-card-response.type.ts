import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { ProfileCardInterestResponse } from '@/module/profile-cards/type/profile-card-interest-response.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';
import { UserProfileCard } from '@/prisma/client';

export class PersonalityResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;
}

export class AffiliationStatusResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class PurposeResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class ProfileCardResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ nullable: true, description: '프로필 카드 배경 이미지 url' })
  cardImageUrl: string | null;

  @ApiProperty({ nullable: true, description: '프로필 이미지 url' })
  profileImageUrl: string | null;

  @ApiProperty()
  description: string;

  @ApiProperty({ nullable: true })
  affiliation: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: FormattedDate;

  @ApiProperty()
  updatedAt: FormattedDate;

  @ApiPropertyOptional({ type: [String], description: '스킬 명칭 문자열' })
  skills?: string[];

  @ApiPropertyOptional()
  interests?: ProfileCardInterestResponse[];

  @ApiPropertyOptional({ type: PersonalityResponse, nullable: true })
  personality?: PersonalityResponse | null;

  @ApiPropertyOptional({ type: AffiliationStatusResponse, nullable: true })
  affiliationStatus?: AffiliationStatusResponse | null;

  @ApiPropertyOptional({ type: PurposeResponse, nullable: true })
  purpose?: PurposeResponse | null;

  @ApiPropertyOptional({ nullable: true, description: '기반 템플릿 직군 이름' })
  jobTypeName?: string | null;

  static fromProfileCard(
    item: DisplayProfileCard | UserProfileCard,
  ): ProfileCardResponse {
    const response: ProfileCardResponse = {
      id: item.id,
      nickname: item.nickname,
      cardImageUrl: item.cardImageUrl,
      profileImageUrl: item.profileImageUrl,
      description: item.description,
      affiliation: item.affiliation,
      isActive: item.isActive,
      isDefault: item.isDefault ?? false,
      userId: item.userId,
      createdAt: FormattedDate.fromDate(item.createdAt),
      updatedAt: FormattedDate.fromDate(item.updatedAt),
    };

    // include 로 관계가 로드된 경우(ProfileCard)에만 관계 필드 매핑
    if ('profileCardSkills' in item) {
      response.skills = item.profileCardSkills.map((pcs) => pcs.skill.name);
      response.interests = item.profileCardInterests.map((pci) =>
        ProfileCardInterestResponse.fromInterest(pci.interest),
      );
      response.personality = item.personality
        ? {
            id: item.personality.id,
            name: item.personality.name,
            imageUrl: item.personality.imageUrl,
          }
        : null;
      response.affiliationStatus = item.affiliationStatus
        ? { id: item.affiliationStatus.id, name: item.affiliationStatus.name }
        : null;
      response.purpose = item.purpose
        ? { id: item.purpose.id, name: item.purpose.name }
        : null;
      response.jobTypeName = item.template?.jobType.name ?? null;
    }

    return response;
  }
}
