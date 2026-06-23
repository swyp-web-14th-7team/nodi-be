import { Controller, Post } from '@nestjs/common';
import { AuthService } from '@/feature/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/login')
  async getGoogleLoginUrl() {}
}
