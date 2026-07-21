import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { JwtPayload } from '@/module/auth/type/jwt-payload.type';
import { UsersService } from '@/module/users/users.service';
import { User } from '@/prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Roles } from '@/common/decorator/roles.decorator';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly JWT_SECRET: string;

  constructor(
    private readonly usersService: UsersService,
    readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectPinoLogger(AuthGuard.name) private readonly logger: PinoLogger,
  ) {
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req: Request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);
    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    // 1) 서명 검증 — DB 없이 payload(role 포함) 확보.
    //    만료/위조 토큰은 500 이 아니라 401 로 변환한다. (프론트는 message 로 구분)
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.JWT_SECRET,
      });
    } catch (err) {
      if (err instanceof TokenExpiredError)
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    // 2) 앞단 role 컷 — DB 조회 이전, 토큰 role 로 미달이면 즉시 거절.
    //    role claim 이 없는 구 토큰은 통과시켜 최종 권위인 DB(user.role) 검사로 위임.
    const requiredRoles = this.reflector.getAllAndOverride<
      number[] | undefined
    >(Roles, [ctx.getHandler(), ctx.getClass()]);
    if (
      requiredRoles?.length &&
      payload.role !== undefined &&
      !requiredRoles.includes(payload.role)
    )
      throw new ForbiddenException('접근 권한이 없습니다.');

    // 3) 통과한 요청만 DB 로드
    const user: User | null = await this.usersService.findUnique({
      id: payload.sub,
    });
    if (!user) throw new UnauthorizedException('인증에 실패하였습니다.');
    req['user'] = user;
    this.logger.assign({
      user: { id: user.id, role: user.role, nickname: user.nickname },
    });
    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }
}
