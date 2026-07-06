import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { SkillResponse } from '@/module/skills/type/skill-response.type';
import { ProfileCardInterestResponse } from '@/module/profile-cards/type/profile-card-interest-response.type';
import { ProfileCard } from '@/module/profile-cards/type/user-profile-card.type';
import { UserProfileCard } from '@/prisma/client';

export class ProfileCardResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ nullable: true })
  cardImageUrl: string | null;

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

  static fromProfileCard(
    item: ProfileCard | UserProfileCard,
  ): ProfileCardResponse {
    const response: ProfileCardResponse = {
      id: item.id,
      nickname: item.nickname,
      cardImageUrl: item.cardImageUrl,
      isActive: item.isActive,
      isDefault: item.isDefault ?? false,
      userId: item.userId,
      createdAt: FormattedDate.fromDate(item.createdAt),
      updatedAt: FormattedDate.fromDate(item.updatedAt),
    };

    // include 로 관계가 로드된 경우(ProfileCard)에만 skills/interests 매핑
    if ('profileCardSkills' in item) {
      response.skills = item.profileCardSkills.map((pcs) =>
        SkillResponse.fromSkill(pcs.skill),
      );
      response.interests = item.profileCardInterests.map((pci) =>
        ProfileCardInterestResponse.fromInterest(pci.interest),
      );
    }

    return response;
  }
}
