import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';
import { JwtPayload } from '@/module/auth/type/jwt-payload.type';
import { UsersService } from '@/module/users/users.service';
import { User } from '@/prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly JWT_SECRET: string;

  constructor(
    private readonly usersService: UsersService,
    readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectPinoLogger(AuthGuard.name) private readonly logger: PinoLogger,
  ) {
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req: Request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);
    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    const payload: JwtPayload = await this.jwtService.verifyAsync<JwtPayload>(
      token,
      { secret: this.JWT_SECRET },
    );
    const user: User | null = await this.usersService.findUnique({
      id: payload.sub,
    });
    if (!user) throw new UnauthorizedException('인증에 실패하였습니다.');
    req['user'] = user;
    this.logger.assign({ user: { id: user.id, role: user.role } });
    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type.toLowerCase() === 'bearer' ? token : undefined;
  }
}
