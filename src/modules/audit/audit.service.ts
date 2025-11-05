import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditRepository } from './audit.repository';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditResponseDto } from './dto/audit-response.dto';
import {
  AuditAction,
  AuditLogDocument,
  EntityType,
} from 'src/database/schemas/audit-log.schema';
import { User, UserDocument } from 'src/database/schemas/user.schema';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Log an audit event
   */
  async log(createDto: CreateAuditLogDto): Promise<void> {
    try {
      await this.auditRepository.create(createDto);
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Quick logging helpers
   */
  async logUserLogin(
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.USER_LOGIN,
      entityType: EntityType.USER,
      entityId: userId,
      metadata: metadata || {},
    });
  }

  async logDocumentUpload(
    userId: string,
    documentId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DOCUMENT_UPLOAD,
      entityType: EntityType.DOCUMENT,
      entityId: documentId,
      metadata: metadata || {},
    });
  }

  async logDocumentDelete(
    userId: string,
    documentId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.DOCUMENT_DELETE,
      entityType: EntityType.DOCUMENT,
      entityId: documentId,
      metadata: metadata || {},
    });
  }

  async logTagCreate(
    userId: string,
    tagId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.TAG_CREATE,
      entityType: EntityType.TAG,
      entityId: tagId,
      metadata: metadata || {},
    });
  }

  async logTagAssign(
    userId: string,
    documentId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.TAG_ASSIGN,
      entityType: EntityType.TAG,
      entityId: documentId,
      metadata: metadata || {},
    });
  }

  async logActionRun(
    userId: string,
    actionId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.ACTION_RUN,
      entityType: EntityType.ACTION,
      entityId: actionId,
      metadata: metadata || {},
    });
  }

  async logWebhookReceived(
    userId: string,
    webhookId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.WEBHOOK_RECEIVED,
      entityType: EntityType.WEBHOOK,
      entityId: webhookId,
      metadata: metadata || {},
    });
  }

  async logTaskCreated(
    userId: string,
    taskId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.TASK_CREATED,
      entityType: EntityType.TASK,
      entityId: taskId,
      metadata: metadata || {},
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQueryDto): Promise<{
    logs: AuditResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { logs, total } = await this.auditRepository.findAll(query);

    return {
      logs: logs.map((log) => this.toResponseDto(log)),
      total,
      limit: query.limit || 50,
      offset: query.offset || 0,
    };
  }

  async getUserAuditTrail(
    userId: string,
    page: number = 1,
    limit: number = 50,
    from?: string,
    to?: string,
  ): Promise<{
    logs: AuditResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { logs, total } = await this.auditRepository.findByUserId(
      userId,
      page,
      limit,
      from,
      to,
    );

    return {
      logs: logs.map((log) => this.toResponseDto(log)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEntityAuditTrail(
    entityType: EntityType,
    entityId: string,
  ): Promise<AuditResponseDto[]> {
    const logs = await this.auditRepository.findByEntity(entityType, entityId);
    return logs.map((log) => this.toResponseDto(log));
  }

  async findById(logId: string, userId?: string): Promise<AuditResponseDto> {
    const log = await this.auditRepository.findById(logId);

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    // If userId is provided, ensure the user can only access their own logs
    // (unless they're admin, which is handled by the controller)
    if (userId && log.userId.toString() !== userId) {
      throw new NotFoundException('Audit log not found');
    }

    return this.toResponseDto(log);
  }

  /**
   * Cleanup old logs (for maintenance)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    return this.auditRepository.deleteOlderThan(cutoffDate);
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<{
    today: number;
    week: number;
    total: number;
    totalUsers: number;
  }> {
    const [today, week, total, totalUsers] = await Promise.all([
      this.auditRepository.getTodayLogsCount(),
      this.auditRepository.getWeekLogsCount(),
      this.auditRepository.getTotalLogsCount(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      today,
      week,
      total,
      totalUsers,
    };
  }

  /**
   * Helper to convert to DTO
   */
  private toResponseDto(log: AuditLogDocument): AuditResponseDto {
    return new AuditResponseDto({
      id: log._id.toString(),
      timestamp: log.timestamp,
      userId: log.userId.toString(),
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      method: log.method,
      path: log.path,
      statusCode: log.statusCode,
      duration: log.duration,
    });
  }
}
