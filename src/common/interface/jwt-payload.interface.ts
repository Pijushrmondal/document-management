import { UserRole } from '../enum/user-role.enum';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
