import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WebhooksRepository } from './webhooks.repository';
import { TasksService } from '../tasks/tasks.service';
import { AuditService } from '../audit/audit.service';
import { ContentClassifier } from './classifiers/content-classifier';
import { UnsubscribeExtractor } from './extractors/unsubscribe-extractor';
import { OcrWebhookDto } from './dto/ocr-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { WebhookQueryDto } from './dto/webhook-query.dto';
import {
  ContentClassification,
  WebhookEventDocument,
  WebhookEventStatus,
} from 'src/database/schemas/webhook-event.schema';
import { TaskType } from 'src/database/schemas/task.schema';

@Injectable()
export class WebhooksService {
  // System user ID for webhook-created tasks
  private readonly SYSTEM_USER_ID = '000000000000000000000001';

  constructor(
    private readonly webhooksRepository: WebhooksRepository,
    private readonly tasksService: TasksService,
    private readonly auditService: AuditService,
    private readonly contentClassifier: ContentClassifier,
    private readonly unsubscribeExtractor: UnsubscribeExtractor,
  ) {}

  /**
   * Process OCR webhook
   */
  // async processOcrWebhook(
  //   ocrWebhookDto: OcrWebhookDto,
  //   userId?: string,
  // ): Promise<WebhookResponseDto> {
  //   const effectiveUserId = userId || this.SYSTEM_USER_ID;

  //   // Check if webhook with this imageId already exists
  //   const existingEvent = await this.webhooksRepository.findByImageId(
  //     ocrWebhookDto.imageId,
  //   );

  //   if (existingEvent) {
  //     throw new ConflictException(
  //       `Webhook event with imageId '${ocrWebhookDto.imageId}' already exists`,
  //     );
  //   }

  //   // 1. Create webhook event record
  //   const webhookEvent = await this.webhooksRepository.create({
  //     source: ocrWebhookDto.source,
  //     imageId: ocrWebhookDto.imageId,
  //     text: ocrWebhookDto.text,
  //     meta: ocrWebhookDto.meta || {},
  //     status: WebhookEventStatus.RECEIVED,
  //     classification: ContentClassification.UNKNOWN,
  //   });

  //   try {
  //     // 2. Update status to processing
  //     await this.webhooksRepository.updateStatus(
  //       webhookEvent._id.toString(),
  //       WebhookEventStatus.PROCESSING,
  //     );

  //     // 3. Classify content
  //     const classification = this.contentClassifier.classify(
  //       ocrWebhookDto.text,
  //     );

  //     // 4. Extract unsubscribe info for ads
  //     let unsubscribeInfo = null;
  //     const tasksCreated: any[] = [];

  //     if (classification === ContentClassification.AD) {
  //       unsubscribeInfo = this.unsubscribeExtractor.extract(ocrWebhookDto.text);

  //       // 5. Create task if unsubscribe info found
  //       if (
  //         unsubscribeInfo &&
  //         this.unsubscribeExtractor.validate(unsubscribeInfo)
  //       ) {
  //         // Check rate limit
  //         const canCreate = await this.tasksService.canCreateTask(
  //           effectiveUserId,
  //           ocrWebhookDto.source,
  //         );

  //         if (canCreate) {
  //           try {
  //             const task = await this.tasksService.createTask(effectiveUserId, {
  //               source: ocrWebhookDto.source,
  //               type: TaskType.UNSUBSCRIBE,
  //               channel: unsubscribeInfo.channel,
  //               target: unsubscribeInfo.target,
  //               title: `Unsubscribe from ${ocrWebhookDto.source}`,
  //               description: `Unsubscribe detected from: ${unsubscribeInfo.target}`,
  //               metadata: {
  //                 webhookEventId: webhookEvent._id.toString(),
  //                 imageId: ocrWebhookDto.imageId,
  //                 extractedText: ocrWebhookDto.text.substring(0, 500),
  //               },
  //             });

  //             // Add task to webhook event
  //             await this.webhooksRepository.addTask(
  //               webhookEvent._id.toString(),
  //               task.id,
  //             );

  //             tasksCreated.push({
  //               taskId: task.id,
  //               type: task.type,
  //               channel: task.channel,
  //               target: task.target,
  //               status: task.status,
  //             });
  //           } catch (error) {
  //             console.error('Failed to create task:', error);
  //             // Continue processing even if task creation fails
  //           }
  //         } else {
  //           console.log('Rate limit exceeded for task creation');
  //         }
  //       }
  //     }

  //     // 6. Update webhook event with results
  //     await this.webhooksRepository.updateStatus(
  //       webhookEvent._id.toString(),
  //       WebhookEventStatus.PROCESSED,
  //       {
  //         classification,
  //         unsubscribeInfo,
  //       },
  //     );

  //     // 7. Log audit event
  //     await this.auditService.logWebhookReceived(
  //       effectiveUserId,
  //       webhookEvent._id.toString(),
  //       {
  //         source: ocrWebhookDto.source,
  //         imageId: ocrWebhookDto.imageId,
  //         classification,
  //         tasksCreated: tasksCreated.length,
  //       },
  //     );

  //     // 8. Return response
  //     return new WebhookResponseDto({
  //       id: webhookEvent._id.toString(),
  //       source: ocrWebhookDto.source,
  //       imageId: ocrWebhookDto.imageId,
  //       classification,
  //       status: WebhookEventStatus.PROCESSED,
  //       unsubscribeInfo,
  //       tasksCreated,
  //       receivedAt: webhookEvent.receivedAt,
  //       processedAt: new Date(),
  //     });
  //   } catch (error) {
  //     // Handle processing failure
  //     await this.webhooksRepository.updateStatus(
  //       webhookEvent._id.toString(),
  //       WebhookEventStatus.FAILED,
  //       {
  //         errorMessage: error.message,
  //       },
  //     );

  //     throw error;
  //   }
  // }

  /**
   * Get webhook event by ID
   */
  async getWebhookEvent(id: string): Promise<WebhookResponseDto> {
    const event = await this.webhooksRepository.findById(id);

    if (!event) {
      throw new NotFoundException('Webhook event not found');
    }

    return this.toResponseDto(event);
  }

  /**
   * Query webhook events
   */
  async queryWebhookEvents(query: WebhookQueryDto): Promise<{
    events: WebhookResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { events, total } = await this.webhooksRepository.query(query);

    return {
      events: events.map((event) => this.toResponseDto(event)),
      total,
      page: query.page || 1,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  /**
   * Get webhook statistics
   */
  async getStats(): Promise<{
    total: number;
    byClassification: Record<ContentClassification, number>;
    byStatus: Record<WebhookEventStatus, number>;
  }> {
    return this.webhooksRepository.getStats();
  }

  /**
   * Convert to response DTO
   */
  private toResponseDto(event: WebhookEventDocument): WebhookResponseDto {
    return new WebhookResponseDto({
      id: event._id.toString(),
      source: event.source,
      imageId: event.imageId,
      classification: event.classification,
      status: event.status,
      unsubscribeInfo: event.unsubscribeInfo,
      tasksCreated:
        event.taskIds?.map((taskId) => ({
          taskId: taskId.toString(),
          type: 'unsubscribe',
          channel: event.unsubscribeInfo?.channel || '',
          target: event.unsubscribeInfo?.target || '',
          status: 'pending',
        })) || [],
      receivedAt: event.receivedAt,
      processedAt: event.processedAt,
    });
  }
}
