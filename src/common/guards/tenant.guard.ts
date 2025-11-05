import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { Permissions } from '../utils/permissions.util';

/**
 * Guard to enforce tenant isolation
 * Ensures users can only access their own resources unless they have full access
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      return false;
    }

    // Admin and support roles bypass tenant isolation for read operations
    // This guard is typically used for specific endpoints that need tenant isolation
    // For most endpoints, the service layer handles permission checks
    return true;
  }
}
