import { UserRole } from '@/common/enum/user-role.enum';

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
