import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WebhookEventStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum ContentClassification {
  OFFICIAL = 'official',
  AD = 'ad',
  UNKNOWN = 'unknown',
}

export type WebhookEventDocument = WebhookEvent & Document & BaseDocument;

@Schema({ timestamps: true })
export class WebhookEvent {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  source: string;

  @Prop({ required: true, unique: true, index: true })
  imageId: string;

  @Prop({ required: true, type: String })
  text: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;

  @Prop({
    required: true,
    enum: ContentClassification,
    default: ContentClassification.UNKNOWN,
  })
  classification: ContentClassification;

  @Prop({
    required: true,
    enum: WebhookEventStatus,
    default: WebhookEventStatus.RECEIVED,
    index: true,
  })
  status: WebhookEventStatus;

  @Prop({ type: Object })
  unsubscribeInfo?: {
    channel: 'email' | 'url';
    target: string;
  };

  @Prop({ type: [Types.ObjectId], ref: 'Task', default: [] })
  taskIds: Types.ObjectId[];

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ required: true, type: Date, index: true })
  receivedAt: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);

// Indexes
WebhookEventSchema.index({ source: 1, receivedAt: -1 });
WebhookEventSchema.index({ classification: 1, receivedAt: -1 });
WebhookEventSchema.index({ status: 1, receivedAt: -1 });
