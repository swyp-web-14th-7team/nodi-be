// TS enum 대신 const 객체로 둔다.
// Prisma 의 status 는 number 로 생성되는데, number 를 TS enum 과 직접 비교하면
// @typescript-eslint/no-unsafe-enum-comparison 이 발생한다. 리터럴 유니온이면 number 비교로 취급된다.
export const ConnectionRequestStatus = {
  PENDING: 0,
  ACCEPTED: 1,
  REJECTED: 2,
  CANCELED: 3, // 요청자 취소
} as const;

export type ConnectionRequestStatus =
  (typeof ConnectionRequestStatus)[keyof typeof ConnectionRequestStatus];
