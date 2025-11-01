import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentsRepository } from './documents.repository';
import {
  DocumentModel,
  DocumentSchema,
} from 'src/database/schemas/document.schema';
import { TagsModule } from '@/modules/tags/tags.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentModel.name, schema: DocumentSchema },
    ]),
    TagsModule, // Import TagsModule to use TagsService
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
  exports: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
