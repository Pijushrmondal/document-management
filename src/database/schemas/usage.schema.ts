import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageDocument = Usage & Document & BaseDocument;

@Schema({ timestamps: true })
export class Usage {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  actionType: string;

  @Prop({ required: true, default: 5 })
  credits: number;

  @Prop({ type: Object, required: true })
  scope: {
    type: 'folder' | 'files';
    name?: string; // folder name
    ids?: string[]; // file ids
  };

  @Prop({ type: Object })
  result?: {
    success: boolean;
    outputDocumentIds?: string[];
    error?: string;
  };

  @Prop({ required: true, type: Date, index: true })
  timestamp: Date;

  @Prop({ required: true, index: true })
  month: string; // YYYY-MM format for fast monthly queries

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UsageSchema = SchemaFactory.createForClass(Usage);

// Indexes
UsageSchema.index({ userId: 1, month: 1 });
UsageSchema.index({ userId: 1, timestamp: -1 });
UsageSchema.index({ actionType: 1, timestamp: -1 });
