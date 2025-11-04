import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TagsRepository } from './tags.repository';
import { Tag, TagSchema } from 'src/database/schemas/tag.schema';
import {
  DocumentTag,
  DocumentTagSchema,
} from 'src/database/schemas/document-tag.schema';
import { DocumentsModule } from '@/modules/documents/documents.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: DocumentTag.name, schema: DocumentTagSchema },
    ]),
    forwardRef(() => DocumentsModule),
  ],
  controllers: [TagsController],
  providers: [TagsService, TagsRepository],
  exports: [TagsService, TagsRepository],
})
export class TagsModule {}
