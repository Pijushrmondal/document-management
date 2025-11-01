import { BaseDocument } from '@/common/types/mongoose.types';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DocumentTagDocument = DocumentTag & Document & BaseDocument;

@Schema({ timestamps: true })
export class DocumentTag {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Document', index: true })
  documentId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Tag', index: true })
  tagId: Types.ObjectId;

  @Prop({ required: true, default: false, index: true })
  isPrimary: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const DocumentTagSchema = SchemaFactory.createForClass(DocumentTag);

// Indexes
// Ensure unique combination of document and tag
DocumentTagSchema.index({ documentId: 1, tagId: 1 }, { unique: true });

// Ensure only one primary tag per document
DocumentTagSchema.index(
  { documentId: 1, isPrimary: 1 },
  {
    unique: true,
    partialFilterExpression: { isPrimary: true },
  },
);

// Index for querying by tag and primary status
DocumentTagSchema.index({ tagId: 1, isPrimary: 1 });
