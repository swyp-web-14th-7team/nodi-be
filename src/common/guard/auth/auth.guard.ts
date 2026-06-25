import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Request } from 'express';
import { AuthService } from '@/feature/auth/auth.service';
import { JwtPayload } from '@/feature/auth/type/jwt-payload.type';
import { UsersService } from '@/feature/users/users.service';
import { User } from '@/prisma/client';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req: Request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);
    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    const payload: JwtPayload = await this.authService.verifyTokenAsync(
      token,
      'accessToken',
    );
    const user: User | null = await this.usersService.findUnique({
      id: payload.sub,
    });
    if (!user) throw new UnauthorizedException('인증에 실패하였습니다.');
    req['user'] = user;
    return true;
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type.toLowerCase() === 'bearer' ? token : undefined;
  }
}
