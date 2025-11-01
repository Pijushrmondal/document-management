import { AuditAction, EntityType } from 'src/database/schemas/audit-log.schema';

export class AuditResponseDto {
  id: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;

  constructor(partial: Partial<AuditResponseDto>) {
    Object.assign(this, partial);
  }
}
