import { AuditAction, EntityType } from 'src/database/schemas/audit-log.schema';

export class CreateAuditLogDto {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
}
