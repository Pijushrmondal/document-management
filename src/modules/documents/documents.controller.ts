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
import { JwtAuthGuard, ReadOnlyGuard } from '@/common/guards';
import { MAX_FILE_SIZE, multerConfig } from '@/common/utils/file-upload.util';
import { CurrentUser } from '@/common/decorators';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { DocumentListDto } from './dto/document-list.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { JwtPayload } from '@/common/interface/jwt-payload.interface';

@Controller('v1/docs')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(ReadOnlyGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDocument(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.uploadDocument(
      user.sub,
      user.role,
      file,
      uploadDto,
    );
  }

  @Get()
  async listDocuments(
    @CurrentUser() user: JwtPayload,
    @Query() query: DocumentListDto,
    @Query('userId') targetUserId?: string, // For admin to query specific user
  ) {
    // Support/Moderator cannot use userId param - ignore it
    const isReadOnly = user.role === 'support' || user.role === 'moderator';
    const finalUserId = isReadOnly ? undefined : targetUserId;

    return this.documentsService.findAll(
      user.sub,
      user.role,
      query.page,
      query.limit,
      finalUserId,
    );
  }

  @Post('search')
  async searchDocuments(
    @CurrentUser() user: JwtPayload,
    @Body() searchDto: SearchDocumentDto,
  ): Promise<{ results: DocumentResponseDto[]; total: number }> {
    const results = await this.documentsService.searchDocuments(
      user.sub,
      user.role,
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
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.findById(documentId, user.sub, user.role);
  }

  @Get(':id/download')
  async downloadDocument(
    @Param('id') documentId: string,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { filePath, filename, mimeType } =
      await this.documentsService.downloadDocument(
        documentId,
        user.sub,
        user.role,
      );

    const file = fs.createReadStream(filePath);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  @Delete(':id')
  @UseGuards(ReadOnlyGuard)
  async deleteDocument(
    @Param('id') documentId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.documentsService.deleteDocument(
      documentId,
      user.sub,
      user.role,
    );
    return { message: 'Document deleted successfully' };
  }
}
