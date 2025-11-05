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
import { JwtAuthGuard, ReadOnlyGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentsService } from '@/modules/documents/documents.service';
import { DocumentListDto } from '@/modules/documents/dto/document-list.dto';
import { DocumentResponseDto } from '@/modules/documents/dto/document-response.dto';
import { JwtPayload } from '@/common/interface/jwt-payload.interface';

@Controller('v1')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ==================== Tag Endpoints ====================

  @Post('tags')
  @UseGuards(ReadOnlyGuard)
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
    @CurrentUser() user: JwtPayload,
  ): Promise<TagResponseDto> {
    return this.tagsService.findTagById(tagId, user.sub, user.role);
  }

  @Delete('tags/:id')
  @UseGuards(ReadOnlyGuard)
  async deleteTag(
    @Param('id') tagId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.tagsService.deleteTag(tagId, user.sub, user.role);
    return { message: 'Tag deleted successfully' };
  }

  // ==================== Folder Endpoints ====================

  @Get('folders')
  async getFolders(
    @CurrentUser() user: JwtPayload,
    @Query('userId') targetUserId?: string, // For admin to query specific user
  ): Promise<FolderResponseDto[]> {
    // Support/Moderator cannot use userId param - ignore it
    const isReadOnly = user.role === 'support' || user.role === 'moderator';
    const finalUserId = isReadOnly ? undefined : targetUserId;

    return this.tagsService.getFolders(user.sub, user.role, finalUserId);
  }

  @Get('folders/:name/docs')
  async getDocumentsByFolder(
    @Param('name') folderName: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: DocumentListDto,
  ): Promise<{
    documents: DocumentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.documentsService.findDocumentsByFolder(
      folderName,
      user.sub,
      user.role,
      query.page,
      query.limit,
    );
  }
}
