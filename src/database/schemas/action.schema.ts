import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ActionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type ActionDocument = Action & Document & BaseDocument;

@Schema({ timestamps: true })
export class Action {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ActionStatus,
    default: ActionStatus.PENDING,
    index: true,
  })
  status: ActionStatus;

  @Prop({ type: Object, required: true })
  scope: {
    type: 'folder' | 'files';
    name?: string;
    ids?: string[];
  };

  @Prop({ type: Array, default: [] })
  messages: Array<{
    role: string;
    content: string;
  }>;

  @Prop({ type: [String], required: true })
  actions: string[]; // e.g., ['make_csv', 'make_document']

  @Prop({ type: Array, default: [] })
  outputs: Array<{
    type: string;
    documentId: string;
    filename: string;
    content?: string;
  }>;

  @Prop({ type: String })
  error?: string;

  @Prop({ type: Number, default: 5 })
  creditsUsed: number;

  @Prop()
  executedAt?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const ActionSchema = SchemaFactory.createForClass(Action);

// Indexes
ActionSchema.index({ userId: 1, status: 1, createdAt: -1 });
ActionSchema.index({ status: 1, createdAt: -1 });
