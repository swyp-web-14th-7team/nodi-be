import { Reflector } from '@nestjs/core';
import { UserRole } from '@/common/enum/user-role.enum';

export const Roles = Reflector.createDecorator<UserRole[]>();
