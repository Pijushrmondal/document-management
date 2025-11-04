import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { FolderResponseDto } from './dto/folder-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from '@/modules/documents/documents.service';
import { DocumentListDto } from '@/modules/documents/dto/document-list.dto';
import { DocumentResponseDto } from '@/modules/documents/dto/document-response.dto';

@Controller('v1')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ==================== Tag Endpoints ====================

  @Post('tags')
  async createTag(
    @CurrentUser('sub') userId: string,
    @Body() createTagDto: CreateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagsService.createTag(userId, createTagDto);
  }

  @Get('tags')
  async getAllTags(
    @CurrentUser('sub') userId: string,
  ): Promise<TagResponseDto[]> {
    return this.tagsService.findAllTags(userId);
  }

  @Get('tags/:id')
  async getTag(
    @Param('id') tagId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<TagResponseDto> {
    return this.tagsService.findTagById(tagId, userId);
  }

  @Delete('tags/:id')
  async deleteTag(
    @Param('id') tagId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ message: string }> {
    await this.tagsService.deleteTag(tagId, userId);
    return { message: 'Tag deleted successfully' };
  }

  // ==================== Folder Endpoints ====================

  @Get('folders')
  async getFolders(
    @CurrentUser('sub') userId: string,
  ): Promise<FolderResponseDto[]> {
    return this.tagsService.getFolders(userId);
  }

  @Get('folders/:name/docs')
  async getDocumentsByFolder(
    @Param('name') folderName: string,
    @CurrentUser('sub') userId: string,
    @Query() query: DocumentListDto,
  ): Promise<{
    documents: DocumentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.documentsService.findDocumentsByFolder(
      folderName,
      userId,
      query.page,
      query.limit,
    );
  }
}
