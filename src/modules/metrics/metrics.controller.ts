import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import {
  SystemMetricsDto,
  UserMetricsDto,
  DocumentMetricsDto,
  ActionMetricsDto,
  TaskMetricsDto,
  WebhookMetricsDto,
  DetailedMetricsDto,
} from './dto/metrics-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@/common/enum/user-role.enum';

@Controller('v1/metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Get system-wide metrics (Admin/Support only)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getSystemMetrics(): Promise<SystemMetricsDto> {
    return this.metricsService.getSystemMetrics();
  }

  /**
   * Get current user's metrics
   */
  @Get('me')
  async getMyMetrics(
    @CurrentUser('sub') userId: string,
  ): Promise<UserMetricsDto> {
    return this.metricsService.getUserMetrics(userId);
  }

  /**
   * Get document metrics (Admin/Support only)
   */
  //   @Get('documents')
  //   @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  //   async getDocumentMetrics(
  //     @Query('userId') userId?: string,
  //   ): Promise<DocumentMetricsDto> {
  //     return this.metricsService.getDocumentMetrics(userId);
  //   }

  /**
   * Get action metrics (Admin/Support only)
   */
  //   @Get('actions')
  //   @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  //   async getActionMetrics(
  //     @Query('userId') userId?: string,
  //   ): Promise<ActionMetricsDto> {
  //     return this.metricsService.getActionMetrics(userId);
  //   }

  /**
   * Get task metrics (Admin/Support only)
   */
  //   @Get('tasks')
  //   @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  //   async getTaskMetrics(
  //     @Query('userId') userId?: string,
  //   ): Promise<TaskMetricsDto> {
  //     return this.metricsService.getTaskMetrics(userId);
  //   }

  /**
   * Get webhook metrics (Admin only)
   */
  //   @Get('webhooks')
  //   @Roles(UserRole.ADMIN)
  //   async getWebhookMetrics(): Promise<WebhookMetricsDto> {
  //     return this.metricsService.getWebhookMetrics();
  //   }

  /**
   * Get detailed metrics (all combined) (Admin only)
   */
  //   @Get('detailed')
  //   @Roles(UserRole.ADMIN)
  //   async getDetailedMetrics(
  //     @Query('userId') userId?: string,
  //   ): Promise<DetailedMetricsDto> {
  //     return this.metricsService.getDetailedMetrics(userId);
  //   }
}
