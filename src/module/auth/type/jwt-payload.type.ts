export type JwtPayload = {
  sub: string;
  /**
   * 토큰 발급 시점의 역할 (앞단 role 컷 최적화용).
   * 최종 권위는 DB 의 user.role 이며, role claim 이 없는 구 토큰은 DB 검사로 위임된다.
   */
  role?: number;
};
