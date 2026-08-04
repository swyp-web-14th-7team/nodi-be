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

export const PROFILE_CARD_LINK_BASE_URL: Record<
  ProfileCardLinkType,
  string | null
> = {
  [ProfileCardLinkType.EMAIL]: null,
  [ProfileCardLinkType.INSTAGRAM]: 'https://www.instagram.com/',
  [ProfileCardLinkType.GITHUB]: 'https://github.com/',
  [ProfileCardLinkType.LINKEDIN]: 'https://www.linkedin.com/in/',
  [ProfileCardLinkType.BEHANCE]: 'https://www.behance.net/',
  [ProfileCardLinkType.NOTION]: null,
  [ProfileCardLinkType.WEBSITE]: null,
};

export function toProfileCardLinkUrl(type: ProfileCardLinkType, value: string) {
  const input = value.trim();
  if (type === ProfileCardLinkType.EMAIL) return input;

  const bare = input.replace(/^https?:\/\//i, '');
  const baseUrl = PROFILE_CARD_LINK_BASE_URL[type];
  if (!baseUrl) return `https://${bare}`;

  const baseHost = new URL(baseUrl).host.replace(/^www\./i, '');
  const inputHost = bare.split('/')[0].replace(/^www\./i, '');

  return inputHost.toLowerCase() === baseHost.toLowerCase()
    ? `https://${bare}`
    : `${baseUrl}${bare.replace(/^\/+/, '')}`;
}
