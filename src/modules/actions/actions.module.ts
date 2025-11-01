import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { ActionsRepository } from './actions.repository';
import { MockProcessor } from './processors/mock-processor';

import { DocumentsModule } from '../documents/documents.module';
import { TagsModule } from '../tags/tags.module';
import { Action } from 'rxjs/internal/scheduler/Action';
import { Usage, UsageSchema } from 'src/database/schemas/usage.schema';
import { ActionSchema } from 'src/database/schemas/action.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Action.name, schema: ActionSchema },
      { name: Usage.name, schema: UsageSchema },
    ]),
    DocumentsModule,
    TagsModule,
  ],
  controllers: [ActionsController],
  providers: [ActionsService, ActionsRepository, MockProcessor],
  exports: [ActionsService, ActionsRepository],
})
export class ActionsModule {}
