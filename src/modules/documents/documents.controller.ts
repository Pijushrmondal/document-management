import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  Res,
  HttpStatus,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from './documents.service';

import * as fs from 'fs';
import { JwtAuthGuard } from '@/common/guards';
import { MAX_FILE_SIZE, multerConfig } from '@/common/utils/file-upload.util';
import { CurrentUser } from '@/common/decorators';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { DocumentListDto } from './dto/document-list.dto';
import { SearchDocumentDto } from './dto/search-document.dto';

@Controller('v1/docs')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDocument(
    @CurrentUser('sub') userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(userId, file, uploadDto);
  }

  @Get()
  async listDocuments(
    @CurrentUser('sub') userId: string,
    @Query() query: DocumentListDto,
  ) {
    return this.documentsService.findAll(userId, query.page, query.limit);
  }

  @Post('search')
  async searchDocuments(
    @CurrentUser('sub') userId: string,
    @Body() searchDto: SearchDocumentDto,
  ): Promise<{ results: DocumentResponseDto[]; total: number }> {
    const results = await this.documentsService.searchDocuments(
      userId,
      searchDto,
    );

    return {
      results,
      total: results.length,
    };
  }

  @Get(':id')
  async getDocument(
    @Param('id') documentId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.findById(documentId, userId);
  }

  @Get(':id/download')
  async downloadDocument(
    @Param('id') documentId: string,
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, filename, mimeType } =
      await this.documentsService.downloadDocument(documentId, userId);

    const file = fs.createReadStream(filePath);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  @Delete(':id')
  async deleteDocument(
    @Param('id') documentId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ message: string }> {
    await this.documentsService.deleteDocument(documentId, userId);
    return { message: 'Document deleted successfully' };
  }
}
