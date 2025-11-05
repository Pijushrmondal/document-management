import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../interface/jwt-payload.interface';
import { Permissions } from '../utils/permissions.util';

/**
 * Guard to prevent read-only roles (support/moderator) from performing write operations
 */
@Injectable()
export class ReadOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      return false;
    }

    // Check if user has read-only role
    if (Permissions.isReadOnly(user.role)) {
      const error = new ForbiddenException(
        `Role '${user.role}' has read-only access. Write operations are not allowed.`,
      );
      // Add readOnly flag to the exception response
      (error.getResponse() as any).readOnly = true;
      throw error;
    }

    return true;
  }
}
