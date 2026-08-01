import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthGuard } from '@/common/guard/auth.guard';
import { UsersService } from '@/module/users/users.service';

/**
 * 선택적 인증 가드.
 *
 * @remarks
 * 토큰이 유효하면 AuthGuard 와 똑같이 req.user 를 채우고, 토큰이 없거나 만료/위조면
 * 401 대신 "비로그인" 으로 간주해 통과시킨다. 같은 엔드포인트를 로그인/비로그인 모두에게
 * 열어두되 응답만 달리하고 싶을 때 사용한다.
 *
 * 권한 부족(ForbiddenException)은 삼키지 않고 그대로 전파한다 — 토큰을 제시했는데 역할이
 * 모자란 것은 "비로그인" 이 아니라 명백한 거절 대상이기 때문.
 *
 * Nest 는 생성자를 선언하지 않은 파생 클래스의 design:paramtypes 메타데이터를 읽지 못하므로
 * 부모와 동일한 의존성을 명시적으로 받아 super 로 넘긴다. 로거 토큰도 부모와 같은 것을
 * 재사용한다 (실제로 로그를 남기는 주체가 AuthGuard 의 로직이므로).
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard implements CanActivate {
  constructor(
    usersService: UsersService,
    configService: ConfigService,
    jwtService: JwtService,
    reflector: Reflector,
    @InjectPinoLogger(AuthGuard.name) logger: PinoLogger,
  ) {
    super(usersService, configService, jwtService, reflector, logger);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(ctx);
    } catch (err) {
      if (err instanceof UnauthorizedException) return true;
      throw err;
    }
  }
}
