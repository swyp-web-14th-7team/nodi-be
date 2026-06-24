import { Controller, Get } from '@nestjs/common';
import { AuthService } from '@/feature/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  async getGoogleLoginUrl(): Promise<{ url: string }> {
    // TODO: device_id 쿠키 저장
    const url: string = await this.authService.getGoogleAuthUrl();
    return { url };
  }
}
