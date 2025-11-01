import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditResponseDto } from './dto/audit-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@/common/enum/user-role.enum';

@Controller('v1/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Query audit logs (Admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async queryLogs(@Query() query: AuditQueryDto): Promise<{
    logs: AuditResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    return this.auditService.queryLogs(query);
  }

  /**
   * Get current user's audit trail
   */
  @Get('me')
  async getMyAuditTrail(
    @CurrentUser('sub') userId: string,
  ): Promise<AuditResponseDto[]> {
    return this.auditService.getUserAuditTrail(userId, 100);
  }

  /**
   * Get specific user's audit trail (Admin/Support only)
   */
  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getUserAuditTrail(
    @Query('userId') userId: string,
  ): Promise<AuditResponseDto[]> {
    return this.auditService.getUserAuditTrail(userId, 100);
  }
}
