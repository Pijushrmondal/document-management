import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag, TagDocument } from 'src/database/schemas/tag.schema';
import {
  DocumentTag,
  DocumentTagDocument,
} from 'src/database/schemas/document-tag.schema';

@Injectable()
export class TagsRepository {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(DocumentTag.name)
    private documentTagModel: Model<DocumentTagDocument>,
  ) {}

  async createTag(
    ownerId: string,
    createTagDto: CreateTagDto,
  ): Promise<TagDocument> {
    const tag = new this.tagModel({
      ...createTagDto,
      ownerId: new Types.ObjectId(ownerId),
    });
    return tag.save();
  }

  async findTagById(tagId: string): Promise<TagDocument | null> {
    return this.tagModel.findById(tagId).exec();
  }

  async findTagByName(
    name: string,
    ownerId: string,
  ): Promise<TagDocument | null> {
    return this.tagModel
      .findOne({
        name,
        ownerId: new Types.ObjectId(ownerId),
      })
      .exec();
  }

  async findTagsByOwner(ownerId: string): Promise<TagDocument[]> {
    return this.tagModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find all tags (for admin and read-only roles)
   */
  async findAllTags(): Promise<TagDocument[]> {
    return this.tagModel.find().sort({ name: 1 }).exec();
  }

  async findOrCreateTag(name: string, ownerId: string): Promise<TagDocument> {
    let tag = await this.findTagByName(name, ownerId);

    if (!tag) {
      tag = await this.createTag(ownerId, { name });
    }

    return tag;
  }

  async deleteTag(tagId: string): Promise<TagDocument | null> {
    return this.tagModel.findByIdAndDelete(tagId).exec();
  }

  // ==================== Document-Tag Operations ====================

  async assignTag(
    documentId: string,
    tagId: string,
    isPrimary: boolean = false,
  ): Promise<DocumentTagDocument> {
    const documentTag = new this.documentTagModel({
      documentId: new Types.ObjectId(documentId),
      tagId: new Types.ObjectId(tagId),
      isPrimary,
    });
    return documentTag.save();
  }

  async findDocumentTags(documentId: string): Promise<DocumentTagDocument[]> {
    return this.documentTagModel
      .find({ documentId: new Types.ObjectId(documentId) })
      .populate('tagId')
      .exec();
  }

  async findPrimaryTag(
    documentId: string,
  ): Promise<DocumentTagDocument | null> {
    return this.documentTagModel
      .findOne({
        documentId: new Types.ObjectId(documentId),
        isPrimary: true,
      })
      .populate('tagId')
      .exec();
  }

  async findSecondaryTags(documentId: string): Promise<DocumentTagDocument[]> {
    return this.documentTagModel
      .find({
        documentId: new Types.ObjectId(documentId),
        isPrimary: false,
      })
      .populate('tagId')
      .exec();
  }

  async removePrimaryTag(documentId: string): Promise<void> {
    await this.documentTagModel
      .updateMany(
        { documentId: new Types.ObjectId(documentId), isPrimary: true },
        { isPrimary: false },
      )
      .exec();
  }

  async setPrimaryTag(documentId: string, tagId: string): Promise<void> {
    // First, remove all primary tags for this document
    await this.removePrimaryTag(documentId);

    // Then set the new primary tag
    await this.documentTagModel
      .updateOne(
        {
          documentId: new Types.ObjectId(documentId),
          tagId: new Types.ObjectId(tagId),
        },
        { isPrimary: true },
        { upsert: true },
      )
      .exec();
  }

  async removeTag(documentId: string, tagId: string): Promise<void> {
    await this.documentTagModel
      .deleteOne({
        documentId: new Types.ObjectId(documentId),
        tagId: new Types.ObjectId(tagId),
      })
      .exec();
  }

  async removeAllDocumentTags(documentId: string): Promise<void> {
    await this.documentTagModel
      .deleteMany({ documentId: new Types.ObjectId(documentId) })
      .exec();
  }

  async countDocumentsByTag(tagId: string): Promise<number> {
    return this.documentTagModel
      .countDocuments({
        tagId: new Types.ObjectId(tagId),
        isPrimary: true,
      })
      .exec();
  }

  async findDocumentsByTag(
    tagId: string,
    isPrimary: boolean = true,
  ): Promise<DocumentTagDocument[]> {
    return this.documentTagModel
      .find({
        tagId: new Types.ObjectId(tagId),
        isPrimary,
      })
      .populate('documentId')
      .exec();
  }

  // ==================== Folder Operations ====================

  async getFoldersWithCounts(
    ownerId: string,
  ): Promise<Array<{ tag: TagDocument; documentCount: number }>> {
    const tags = await this.findTagsByOwner(ownerId);

    const foldersWithCounts = await Promise.all(
      tags.map(async (tag) => {
        const documentCount = await this.countDocumentsByTag(
          tag._id.toString(),
        );
        return {
          tag,
          documentCount,
        };
      }),
    );

    return foldersWithCounts.filter((folder) => folder.documentCount > 0);
  }
}
