import { UserRole } from '@/common/enum/user-role.enum';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.USER;
}
