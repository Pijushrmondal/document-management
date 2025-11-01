import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TaskType {
  UNSUBSCRIBE = 'unsubscribe',
  FOLLOW_UP = 'follow_up',
  REVIEW = 'review',
  OTHER = 'other',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskChannel {
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  OTHER = 'other',
}

export type TaskDocument = Task & Document & BaseDocument;

@Schema({ timestamps: true })
export class Task {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  source: string; // webhook source identifier (e.g., "scanner-01")

  @Prop({ required: true, enum: TaskType, default: TaskType.OTHER })
  type: TaskType;

  @Prop({
    required: true,
    enum: TaskStatus,
    default: TaskStatus.PENDING,
    index: true,
  })
  status: TaskStatus;

  @Prop({ required: true, enum: TaskChannel })
  channel: TaskChannel;

  @Prop({ required: true })
  target: string; // email address or URL

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: String })
  notes?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Indexes
TaskSchema.index({ userId: 1, status: 1, createdAt: -1 });
TaskSchema.index({ userId: 1, source: 1, createdAt: -1 }); // For rate limiting
TaskSchema.index({ type: 1, status: 1 });
TaskSchema.index({ createdAt: -1 });
