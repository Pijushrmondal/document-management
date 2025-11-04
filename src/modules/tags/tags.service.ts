import { TagDocument } from './../../database/schemas/tag.schema';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TagsRepository } from './tags.repository';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { FolderResponseDto } from './dto/folder-response.dto';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  // ==================== Tag CRUD ====================

  async createTag(
    userId: string,
    createTagDto: CreateTagDto,
  ): Promise<TagResponseDto> {
    // Check if tag already exists for this user
    const existingTag = await this.tagsRepository.findTagByName(
      createTagDto.name,
      userId,
    );

    if (existingTag) {
      throw new ConflictException(
        `Tag with name '${createTagDto.name}' already exists`,
      );
    }

    const tag = await this.tagsRepository.createTag(userId, createTagDto);
    return this.toResponseDto(tag);
  }

  async findTagById(tagId: string, userId: string): Promise<TagResponseDto> {
    const tag = await this.tagsRepository.findTagById(tagId);

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    // Ensure user owns this tag
    if (tag.ownerId.toString() !== userId) {
      throw new NotFoundException('Tag not found');
    }

    return this.toResponseDto(tag);
  }

  async findAllTags(userId: string): Promise<TagResponseDto[]> {
    const tags = await this.tagsRepository.findTagsByOwner(userId);
    return tags.map((tag) => this.toResponseDto(tag));
  }

  async findOrCreateTag(name: string, userId: string): Promise<TagResponseDto> {
    const tag = await this.tagsRepository.findOrCreateTag(name, userId);
    return this.toResponseDto(tag);
  }

  async deleteTag(tagId: string, userId: string): Promise<void> {
    const tag = await this.tagsRepository.findTagById(tagId);

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.ownerId.toString() !== userId) {
      throw new NotFoundException('Tag not found');
    }

    // Check if tag is being used
    const documentCount = await this.tagsRepository.countDocumentsByTag(tagId);

    if (documentCount > 0) {
      throw new BadRequestException(
        `Cannot delete tag. It is assigned to ${documentCount} document(s)`,
      );
    }

    await this.tagsRepository.deleteTag(tagId);
  }

  // ==================== Document-Tag Operations ====================

  async assignPrimaryTag(
    documentId: string,
    tagName: string,
    userId: string,
  ): Promise<void> {
    // Find or create the tag
    const tag = await this.tagsRepository.findOrCreateTag(tagName, userId);

    // Set as primary tag (this will automatically remove other primary tags)
    await this.tagsRepository.setPrimaryTag(documentId, tag._id.toString());
  }

  async assignSecondaryTag(
    documentId: string,
    tagName: string,
    userId: string,
  ): Promise<void> {
    // Find or create the tag
    const tag = await this.tagsRepository.findOrCreateTag(tagName, userId);

    try {
      // Assign as secondary tag
      await this.tagsRepository.assignTag(
        documentId,
        tag._id.toString(),
        false,
      );
    } catch (error) {
      // Tag might already be assigned
      if (error.code === 11000) {
        // Duplicate key error - tag already assigned, ignore
        return;
      }
      throw error;
    }
  }

  async assignSecondaryTags(
    documentId: string,
    tagNames: string[],
    userId: string,
  ): Promise<void> {
    await Promise.all(
      tagNames.map((tagName) =>
        this.assignSecondaryTag(documentId, tagName, userId),
      ),
    );
  }

  async getPrimaryTag(documentId: string): Promise<TagResponseDto | null> {
    const documentTag = await this.tagsRepository.findPrimaryTag(documentId);

    if (!documentTag || !documentTag.tagId) {
      return null;
    }

    return this.toResponseDto(documentTag.tagId as any);
  }

  async getSecondaryTags(documentId: string): Promise<TagResponseDto[]> {
    const documentTags =
      await this.tagsRepository.findSecondaryTags(documentId);

    return documentTags
      .filter((dt) => dt.tagId)
      .map((dt) => this.toResponseDto(dt.tagId as any));
  }

  async getAllDocumentTags(documentId: string): Promise<{
    primary: TagResponseDto | null;
    secondary: TagResponseDto[];
  }> {
    const [primary, secondary] = await Promise.all([
      this.getPrimaryTag(documentId),
      this.getSecondaryTags(documentId),
    ]);

    return { primary, secondary };
  }

  async removeDocumentTag(
    documentId: string,
    tagId: string,
    userId: string,
  ): Promise<void> {
    // Verify tag ownership
    const tag = await this.tagsRepository.findTagById(tagId);

    if (!tag || tag.ownerId.toString() !== userId) {
      throw new NotFoundException('Tag not found');
    }

    // Check if it's a primary tag
    const primaryTag = await this.tagsRepository.findPrimaryTag(documentId);

    if (primaryTag && primaryTag.tagId.toString() === tagId) {
      throw new BadRequestException('Cannot remove primary tag');
    }

    await this.tagsRepository.removeTag(documentId, tagId);
  }

  async removeAllDocumentTags(documentId: string): Promise<void> {
    await this.tagsRepository.removeAllDocumentTags(documentId);
  }

  // ==================== Folder Operations ====================

  async getFolders(userId: string): Promise<FolderResponseDto[]> {
    const foldersWithCounts =
      await this.tagsRepository.getFoldersWithCounts(userId);
    return foldersWithCounts.map(({ tag, documentCount }) => ({
      id: tag._id.toString(),
      name: tag.name,
      documentCount,
      createdAt: tag.createdAt,
    }));
  }

  async getDocumentsByFolder(
    folderName: string,
    userId: string,
  ): Promise<string[]> {
    // Find the tag
    const tag = await this.tagsRepository.findTagByName(folderName, userId);

    if (!tag) {
      throw new NotFoundException(`Folder '${folderName}' not found`);
    }

    // Get all documents with this primary tag
    const documentTags = await this.tagsRepository.findDocumentsByTag(
      tag._id.toString(),
      true,
    );

    // Filter out null documentIds (in case referenced documents were deleted)
    return documentTags
      .filter((dt) => dt.documentId != null)
      .map((dt) => dt.documentId.toString());
  }

  // ==================== Helper Methods ====================

  async validateTagOwnership(tagId: string, userId: string): Promise<void> {
    const tag = await this.tagsRepository.findTagById(tagId);

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.ownerId.toString() !== userId) {
      throw new NotFoundException('Tag not found');
    }
  }

  private toResponseDto(tag: TagDocument): TagResponseDto {
    return new TagResponseDto({
      id: tag._id.toString(),
      name: tag.name,
      ownerId: tag.ownerId.toString(),
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    });
  }
}
