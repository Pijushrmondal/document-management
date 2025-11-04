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

  async findByIds(ids: any[], ownerId: string): Promise<DocumentDocument[]> {
    const cleanedIds = ids
      .map((str) => str.match(/ObjectId\('([a-f0-9]+)'\)/)?.[1])
      .filter(Boolean);

    return this.documentModel
      .find({
        _id: { $in: cleanedIds.map((id) => new Types.ObjectId(id)) },
        ownerId: new Types.ObjectId(ownerId),
      })
      .exec();
  }

  async findByIdsWithPagination(
    ids: string[],
    ownerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ documents: DocumentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const objectIds = ids
      .map((id) => {
        // Handle both plain string IDs and ObjectId string format
        const match = id.match(/ObjectId\('([a-f0-9]+)'\)/);
        return match ? match[1] : id;
      })
      .filter(Boolean)
      .map((id) => new Types.ObjectId(id));

    const [documents, total] = await Promise.all([
      this.documentModel
        .find({
          _id: { $in: objectIds },
          ownerId: new Types.ObjectId(ownerId),
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel
        .countDocuments({
          _id: { $in: objectIds },
          ownerId: new Types.ObjectId(ownerId),
        })
        .exec(),
    ]);

    return { documents, total };
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
    documentIds: any[],
    ownerId: string,
  ): Promise<DocumentDocument[]> {
    const cleanedIds = documentIds
      .map((str) => str.match(/ObjectId\('([a-f0-9]+)'\)/)?.[1])
      .filter(Boolean);

    return this.documentModel
      .find(
        {
          $text: { $search: query },
          _id: { $in: cleanedIds.map((id) => new Types.ObjectId(id)) },
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
