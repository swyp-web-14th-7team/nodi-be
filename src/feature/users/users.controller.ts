import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from '@/feature/users/users.service';
import { type User } from '@/prisma/client';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AuthGuard } from '@/common/guard/auth.guard';
import { RolesGuard } from '@/common/guard/roles.guard';
import { UserRole } from '@/common/enum/user-role.enum';
import { Roles } from '@/common/decorator/roles.decorator';
import { UserResponse } from '@/feature/users/type/user-response.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles([UserRole.USER])
  getMe(@CurrentUser() user: User): UserResponse {
    return UserResponse.fromUser(user);
  }
}
