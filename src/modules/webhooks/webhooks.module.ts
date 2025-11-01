import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhooksRepository } from './webhooks.repository';
import { ContentClassifier } from './classifiers/content-classifier';
import { UnsubscribeExtractor } from './extractors/unsubscribe-extractor';

import { TasksModule } from '../tasks/tasks.module';
import {
  WebhookEvent,
  WebhookEventSchema,
} from 'src/database/schemas/webhook-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
    ]),
    TasksModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhooksRepository,
    ContentClassifier,
    UnsubscribeExtractor,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
