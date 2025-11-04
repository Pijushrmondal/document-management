import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditResponseDto } from './dto/audit-response.dto';
import { AuditPaginationDto } from './dto/audit-pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@/common/enum/user-role.enum';

@Controller('v1/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

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

  @Get('me')
  async getMyAuditTrail(
    @CurrentUser('sub') userId: string,
    @Query() query: AuditPaginationDto,
  ): Promise<{
    logs: AuditResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.auditService.getUserAuditTrail(userId, query.page, query.limit);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getUserAuditTrail(
    @Param('userId') userId: string,
    @Query() query: AuditPaginationDto,
  ): Promise<{
    logs: AuditResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.auditService.getUserAuditTrail(
      userId,
      query.page,
      query.limit,
      query.from,
      query.to,
    );
  }

  @Get(':logId')
  async getAuditLogById(
    @Param('logId') logId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<AuditResponseDto> {
    return this.auditService.findById(logId, userId);
  }
}
