import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormattedDate } from '@/common/type/formatted-date.type';
import { ProfileCardInterestResponse } from '@/module/profile-cards/type/profile-card-interest-response.type';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';
import { Experience } from '@/prisma/client';
import { PROFILE_CARD_LINK_TYPE_DESCRIPTION } from '@/module/profile-cards/type/profile-card-link-type.enum';

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

export class ProfileCardLinkResponse {
  @ApiProperty({
    description: `링크 종류 — ${PROFILE_CARD_LINK_TYPE_DESCRIPTION}`,
  })
  type: number;

  @ApiProperty({ description: '링크(URL) 또는 이메일 값' })
  value: string;
}

export class ProfileExperienceResponse {
  @ApiProperty({ description: '경험 제목', maxLength: 500 })
  title: string;

  @ApiProperty({ description: '경험 설명', maxLength: 2000 })
  description: string;

  @ApiProperty({ description: '관련 url', nullable: true, maxLength: 500 })
  relatedUrl: string | null;

  @ApiProperty({ description: '경험 순서 (1이면 대표경험)', minimum: 1 })
  sortOrder: number;

  static fromExperience(item: Experience): ProfileExperienceResponse {
    return {
      title: item.title,
      description: item.description,
      relatedUrl: item.relatedUrl,
      sortOrder: item.sortOrder,
    };
  }
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

  @ApiPropertyOptional({
    type: [ProfileCardLinkResponse],
    description: `링크 목록. 각 항목 type — ${PROFILE_CARD_LINK_TYPE_DESCRIPTION}`,
  })
  links?: ProfileCardLinkResponse[];

  @ApiProperty({
    type: [ProfileExperienceResponse],
    description:
      '관련 경험. **목록 조회**(GET /profile-cards, GET /public/profile-cards)에서는 ' +
      '대표 경험(sortOrder 가장 앞) 1개만 포함되고, **단건 조회·생성·수정**에서는 ' +
      'sortOrder 오름차순 전체가 포함됩니다.',
  })
  experiences: ProfileExperienceResponse[];

  // 모든 호출부가 관계를 include 한 DisplayProfileCard 를 넘긴다.
  // (get/getAll/update/create 통일. getAll 은 experiences 를 대표 1개만 포함)
  static fromProfileCard(item: DisplayProfileCard): ProfileCardResponse {
    return {
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
      skills: item.profileCardSkills.map((pcs) => pcs.skill.name),
      interests: item.profileCardInterests.map((pci) =>
        ProfileCardInterestResponse.fromInterest(pci.interest),
      ),
      personality: item.personality
        ? {
            id: item.personality.id,
            name: item.personality.name,
            imageUrl: item.personality.imageUrl,
          }
        : null,
      affiliationStatus: item.affiliationStatus
        ? { id: item.affiliationStatus.id, name: item.affiliationStatus.name }
        : null,
      purpose: item.purpose
        ? { id: item.purpose.id, name: item.purpose.name }
        : null,
      jobTypeName: item.jobType.name,
      links: item.profileCardLinks.map((link) => ({
        type: link.type,
        value: link.value,
      })),
      experiences: item.experiences.map((experience: Experience) =>
        ProfileExperienceResponse.fromExperience(experience),
      ),
    };
  }
}
