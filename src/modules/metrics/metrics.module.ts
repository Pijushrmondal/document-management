import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MetricsAggregatorService } from './services/metrics-aggregator.service';
import { User, UserSchema } from 'src/database/schemas/user.schema';
import {
  DocumentModel,
  DocumentSchema,
} from 'src/database/schemas/document.schema';
import { Tag, TagSchema } from 'src/database/schemas/tag.schema';
import { Action } from 'rxjs/internal/scheduler/Action';
import { Usage, UsageSchema } from 'src/database/schemas/usage.schema';
import { Task, TaskSchema } from 'src/database/schemas/task.schema';
import {
  WebhookEvent,
  WebhookEventSchema,
} from 'src/database/schemas/webhook-event.schema';
import {
  AuditLog,
  AuditLogSchema,
} from 'src/database/schemas/audit-log.schema';
import { ActionSchema } from 'src/database/schemas/action.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: DocumentModel.name, schema: DocumentSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Usage.name, schema: UsageSchema },
      { name: Task.name, schema: TaskSchema },
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService, MetricsAggregatorService],
  exports: [MetricsService],
})
export class MetricsModule {}
