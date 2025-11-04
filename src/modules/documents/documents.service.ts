import { DocumentDocument } from '../../database/schemas/document.schema';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';

import * as fs from 'fs';
import * as path from 'path';
import { TagsService } from '@/modules/tags/tags.service';
import { extractTextFromFile } from '@/common/utils/file-upload.util';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { SearchDocumentDto, SearchScope } from './dto/search-document.dto';
@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly tagsService: TagsService,
  ) {}

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    // Create document record
    const document = await this.documentsRepository.create({
      ownerId: userId,
      filename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
    });

    try {
      // Assign primary tag
      await this.tagsService.assignPrimaryTag(
        document._id.toString(),
        uploadDto.primaryTag,
        userId,
      );

      // Assign secondary tags
      if (uploadDto.secondaryTags && uploadDto.secondaryTags.length > 0) {
        await this.tagsService.assignSecondaryTags(
          document._id.toString(),
          uploadDto.secondaryTags,
          userId,
        );
      }

      // Extract text content asynchronously (in background)
      this.extractAndUpdateText(
        document._id.toString(),
        file.path,
        file.mimetype,
      ).catch((error) => {
        console.error('Error extracting text:', error);
      });

      return this.toResponseDto(
        document,
        uploadDto.primaryTag,
        uploadDto.secondaryTags,
      );
    } catch (error) {
      // If tag assignment fails, delete the uploaded file and document
      await this.deleteDocument(document._id.toString(), userId);
      throw error;
    }
  }

  async findById(
    documentId: string,
    userId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsRepository.findByIdAndOwner(
      documentId,
      userId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.toResponseDtoWithTags(document);
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    documents: DocumentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { documents, total } = await this.documentsRepository.findByOwner(
      userId,
      page,
      limit,
    );

    const documentsWithTags = await Promise.all(
      documents.map((doc) => this.toResponseDtoWithTags(doc)),
    );

    return {
      documents: documentsWithTags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDocumentsByFolder(
    folderName: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    documents: DocumentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    // Get document IDs for this folder
    const documentIds = await this.tagsService.getDocumentsByFolder(
      folderName,
      userId,
    );

    if (documentIds.length === 0) {
      return {
        documents: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    // Get paginated documents
    const { documents, total } =
      await this.documentsRepository.findByIdsWithPagination(
        documentIds,
        userId,
        page,
        limit,
      );

    const documentsWithTags = await Promise.all(
      documents.map((doc) => this.toResponseDtoWithTags(doc)),
    );

    return {
      documents: documentsWithTags,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchDocuments(
    userId: string,
    searchDto: SearchDocumentDto,
  ): Promise<DocumentResponseDto[]> {
    // Validate scope rule: must be EITHER folder OR files, not both
    this.validateSearchScope(searchDto);

    let documents: DocumentDocument[];

    if (searchDto.scope === SearchScope.FOLDER) {
      // Search within a folder (primary tag)
      const folderName = searchDto.ids[0]; // First id is the folder name
      const documentIds = await this.tagsService.getDocumentsByFolder(
        folderName,
        userId,
      );

      if (documentIds.length === 0) {
        return [];
      }

      documents = await this.documentsRepository.searchFullTextInDocuments(
        searchDto.q,
        documentIds,
        userId,
      );
    } else {
      // Search within specific files
      documents = await this.documentsRepository.searchFullTextInDocuments(
        searchDto.q,
        searchDto.ids,
        userId,
      );
    }

    return Promise.all(documents.map((doc) => this.toResponseDtoWithTags(doc)));
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.documentsRepository.findByIdAndOwner(
      documentId,
      userId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete all document-tag associations from database
    await this.tagsService.removeAllDocumentTags(documentId);

    // Delete file from filesystem
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete document record
    await this.documentsRepository.deleteById(documentId);
  }

  async downloadDocument(
    documentId: string,
    userId: string,
  ): Promise<{ filePath: string; filename: string; mimeType: string }> {
    const document = await this.documentsRepository.findByIdAndOwner(
      documentId,
      userId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return {
      filePath: document.filePath,
      filename: document.filename,
      mimeType: document.mimeType,
    };
  }

  // ==================== Helper Methods ====================

  private validateSearchScope(searchDto: SearchDocumentDto): void {
    if (searchDto.scope === SearchScope.FOLDER && searchDto.ids.length !== 1) {
      throw new BadRequestException(
        'Folder scope must have exactly one folder name',
      );
    }

    if (searchDto.scope === SearchScope.FILES && searchDto.ids.length === 0) {
      throw new BadRequestException(
        'Files scope must have at least one file ID',
      );
    }
  }

  private async extractAndUpdateText(
    documentId: string,
    filePath: string,
    mimeType: string,
  ): Promise<void> {
    try {
      const textContent = extractTextFromFile(filePath, mimeType);
      await this.documentsRepository.updateTextContent(documentId, textContent);
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  }

  private async toResponseDtoWithTags(
    document: DocumentDocument,
  ): Promise<DocumentResponseDto> {
    const { primary, secondary } = await this.tagsService.getAllDocumentTags(
      document._id.toString(),
    );

    return new DocumentResponseDto({
      id: document._id.toString(),
      ownerId: document.ownerId.toString(),
      filename: document.filename,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      textContent: document.textContent,
      primaryTag: primary?.name,
      secondaryTags: secondary.map((tag) => tag.name),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  private toResponseDto(
    document: DocumentDocument,
    primaryTag?: string,
    secondaryTags?: string[],
  ): DocumentResponseDto {
    return new DocumentResponseDto({
      id: document._id.toString(),
      ownerId: document.ownerId.toString(),
      filename: document.filename,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      textContent: document.textContent,
      primaryTag,
      secondaryTags,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }
}
