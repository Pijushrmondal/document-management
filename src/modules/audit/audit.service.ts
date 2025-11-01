import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditResponseDto } from './dto/audit-response.dto';
import {
  AuditAction,
  AuditLogDocument,
  EntityType,
} from 'src/database/schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

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

  /**
   * Get user's audit trail
   */
  async getUserAuditTrail(
    userId: string,
    limit: number = 50,
  ): Promise<AuditResponseDto[]> {
    const logs = await this.auditRepository.findByUserId(userId, limit);
    return logs.map((log) => this.toResponseDto(log));
  }

  /**
   * Get entity audit trail
   */
  async getEntityAuditTrail(
    entityType: EntityType,
    entityId: string,
  ): Promise<AuditResponseDto[]> {
    const logs = await this.auditRepository.findByEntity(entityType, entityId);
    return logs.map((log) => this.toResponseDto(log));
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
