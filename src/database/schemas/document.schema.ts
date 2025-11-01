import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentDocument = DocumentModel & Document & BaseDocument;

@Schema({ timestamps: true })
export class DocumentModel {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  filename: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  fileSize: number; // in bytes

  @Prop({ required: true })
  filePath: string; // path to stored file

  @Prop({ type: String, default: '' })
  textContent: string; // extracted text for search

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentModel);

// Indexes
DocumentSchema.index({ ownerId: 1, createdAt: -1 });
DocumentSchema.index({ ownerId: 1, filename: 1 });
DocumentSchema.index({ textContent: 'text' }); // Full-text search
