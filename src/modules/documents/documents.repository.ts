import {
  DocumentDocument,
  DocumentModel,
} from '../../database/schemas/document.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

export interface CreateDocumentData {
  ownerId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  textContent?: string;
}

@Injectable()
export class DocumentsRepository {
  constructor(
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
  ) {}

  async create(data: CreateDocumentData): Promise<DocumentDocument> {
    const document = new this.documentModel({
      ...data,
      ownerId: new Types.ObjectId(data.ownerId),
    });
    return document.save();
  }

  async findById(id: string): Promise<DocumentDocument | null> {
    return this.documentModel.findById(id).exec();
  }

  async findByIdAndOwner(
    id: string,
    ownerId: string,
  ): Promise<DocumentDocument | null> {
    return this.documentModel
      .findOne({
        _id: new Types.ObjectId(id),
        ownerId: new Types.ObjectId(ownerId),
      })
      .exec();
  }

  async findByOwner(
    ownerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ documents: DocumentDocument[]; total: number }> {
    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.documentModel
        .find({ ownerId: new Types.ObjectId(ownerId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel
        .countDocuments({ ownerId: new Types.ObjectId(ownerId) })
        .exec(),
    ]);

    return { documents, total };
  }

  async findByIds(ids: string[], ownerId: string): Promise<DocumentDocument[]> {
    return this.documentModel
      .find({
        _id: { $in: ids.map((id) => new Types.ObjectId(id)) },
        ownerId: new Types.ObjectId(ownerId),
      })
      .exec();
  }

  async searchFullText(
    query: string,
    ownerId: string,
  ): Promise<DocumentDocument[]> {
    return this.documentModel
      .find(
        {
          $text: { $search: query },
          ownerId: new Types.ObjectId(ownerId),
        },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(50)
      .exec();
  }

  async searchFullTextInDocuments(
    query: string,
    documentIds: string[],
    ownerId: string,
  ): Promise<DocumentDocument[]> {
    return this.documentModel
      .find(
        {
          $text: { $search: query },
          _id: { $in: documentIds.map((id) => new Types.ObjectId(id)) },
          ownerId: new Types.ObjectId(ownerId),
        },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .exec();
  }

  async deleteById(id: string): Promise<DocumentDocument | null> {
    return this.documentModel.findByIdAndDelete(id).exec();
  }

  async countByOwner(ownerId: string): Promise<number> {
    return this.documentModel
      .countDocuments({ ownerId: new Types.ObjectId(ownerId) })
      .exec();
  }

  async updateTextContent(
    id: string,
    textContent: string,
  ): Promise<DocumentDocument | null> {
    return this.documentModel
      .findByIdAndUpdate(id, { textContent }, { new: true })
      .exec();
  }
}
