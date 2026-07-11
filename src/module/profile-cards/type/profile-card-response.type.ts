import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { SkillResponse } from '@/module/skills/type/skill-response.type';
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

export class ProfileCardResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ nullable: true })
  cardImageUrl: string | null;

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

  @ApiPropertyOptional()
  skills?: SkillResponse[];

  @ApiPropertyOptional()
  interests?: ProfileCardInterestResponse[];

  @ApiPropertyOptional({ type: PersonalityResponse, nullable: true })
  personality?: PersonalityResponse | null;

  @ApiPropertyOptional({ type: AffiliationStatusResponse, nullable: true })
  affiliationStatus?: AffiliationStatusResponse | null;

  static fromProfileCard(
    item: DisplayProfileCard | UserProfileCard,
  ): ProfileCardResponse {
    const response: ProfileCardResponse = {
      id: item.id,
      nickname: item.nickname,
      cardImageUrl: item.cardImageUrl,
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
      response.skills = item.profileCardSkills.map((pcs) =>
        SkillResponse.fromSkill(pcs.skill),
      );
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
    }

    return response;
  }
}
