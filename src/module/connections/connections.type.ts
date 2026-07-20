import { Prisma } from '@/prisma/client';
import { DisplayProfileCard } from '@/module/profile-cards/profile-cards.type';

// 연결 성립 시점의 카드(Date 포함)를 Json 컬럼에 저장 가능한 형태로 평탄화한다.
// Date 등은 Prisma.InputJsonValue 로 바로 넣을 수 없으므로 직렬화 후 파싱한다.
export const toCardSnapshot = (
  card: DisplayProfileCard,
): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(card)) as Prisma.InputJsonValue;
