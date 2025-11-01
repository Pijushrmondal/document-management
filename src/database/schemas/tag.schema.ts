import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TagDocument = Tag & Document & BaseDocument;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  ownerId: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

TagSchema.index({ name: 1, ownerId: 1 }, { unique: true });
