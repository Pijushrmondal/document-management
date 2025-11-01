import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AuditAction {
  // Auth
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',

  // Documents
  DOCUMENT_UPLOAD = 'document.upload',
  DOCUMENT_VIEW = 'document.view',
  DOCUMENT_DOWNLOAD = 'document.download',
  DOCUMENT_DELETE = 'document.delete',
  DOCUMENT_UPDATE = 'document.update',

  // Tags
  TAG_CREATE = 'tag.create',
  TAG_DELETE = 'tag.delete',
  TAG_ASSIGN = 'tag.assign',
  TAG_REMOVE = 'tag.remove',

  // Actions (Scoped Actions)
  ACTION_RUN = 'action.run',
  ACTION_COMPLETE = 'action.complete',
  ACTION_FAIL = 'action.fail',

  // Webhooks
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_PROCESSED = 'webhook.processed',
  WEBHOOK_FAILED = 'webhook.failed',

  // Tasks
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
}

export enum EntityType {
  USER = 'user',
  DOCUMENT = 'document',
  TAG = 'tag',
  ACTION = 'action',
  WEBHOOK = 'webhook',
  TASK = 'task',
}

export type AuditLogDocument = AuditLog & Document & BaseDocument;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, type: Date, index: true })
  timestamp: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: AuditAction, index: true })
  action: AuditAction;

  @Prop({ required: true, enum: EntityType })
  entityType: EntityType;

  @Prop({ required: false, type: String })
  entityId?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  method?: string; // HTTP method

  @Prop({ type: String })
  path?: string; // Request path

  @Prop({ type: Number })
  statusCode?: number; // Response status

  @Prop({ type: Number })
  duration?: number; // Request duration in ms

  @Prop()
  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ timestamp: -1 });
