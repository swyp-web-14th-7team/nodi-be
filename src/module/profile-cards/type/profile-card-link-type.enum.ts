/** ProfileCardLink.type 값 (링크 종류) */
export enum ProfileCardLinkType {
  EMAIL = 0,
  INSTAGRAM = 1,
  GITHUB = 2,
  LINKEDIN = 3,
  BEHANCE = 4,
  NOTION = 5,
  WEBSITE = 6,
}

/** Swagger description 등에서 재사용하는 type 매핑 설명 */
export const PROFILE_CARD_LINK_TYPE_DESCRIPTION =
  '0: EMAIL, 1: INSTAGRAM, 2: GITHUB, 3: LINKEDIN, 4: BEHANCE, 5: NOTION, 6: WEBSITE';
