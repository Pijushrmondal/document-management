import { UserRole } from '../enum/user-role.enum';

/**
 * Permission utility to check what actions a role can perform
 */
export class Permissions {
  /**
   * Check if a role can perform write operations (CREATE, UPDATE, DELETE)
   */
  static canWrite(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.USER;
  }

  /**
   * Check if a role can perform read operations
   */
  static canRead(role: UserRole): boolean {
    return true; // All roles can read
  }

  /**
   * Check if a role has full access (can access/modify any user's data)
   */
  static hasFullAccess(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  /**
   * Check if a role is read-only (support/moderator)
   */
  static isReadOnly(role: UserRole): boolean {
    return role === UserRole.SUPPORT || role === UserRole.MODERATOR;
  }

  /**
   * Check if a role can run actions (user and admin)
   */
  static canRunActions(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.USER;
  }

  /**
   * Check if a role can view usage metrics
   */
  static canViewUsage(role: UserRole): boolean {
    return true; // All roles can view their own usage
  }

  /**
   * Determine if a user can access another user's resource
   * @param userRole - Role of the requesting user
   * @param resourceOwnerId - Owner of the resource
   * @param requestingUserId - ID of the requesting user
   */
  static canAccessResource(
    userRole: UserRole,
    resourceOwnerId: string,
    requestingUserId: string,
  ): boolean {
    // Admin can access any resource
    if (this.hasFullAccess(userRole)) {
      return true;
    }

    // Support/Moderator can view all resources (read-only)
    if (this.isReadOnly(userRole)) {
      return true;
    }

    // Regular users can only access their own resources
    return resourceOwnerId === requestingUserId;
  }

  /**
   * Determine if a user can modify another user's resource
   * @param userRole - Role of the requesting user
   * @param resourceOwnerId - Owner of the resource
   * @param requestingUserId - ID of the requesting user
   */
  static canModifyResource(
    userRole: UserRole,
    resourceOwnerId: string,
    requestingUserId: string,
  ): boolean {
    // Read-only roles cannot modify
    if (this.isReadOnly(userRole)) {
      return false;
    }

    // Admin can modify any resource
    if (this.hasFullAccess(userRole)) {
      return true;
    }

    // Users can only modify their own resources
    return resourceOwnerId === requestingUserId;
  }
}
