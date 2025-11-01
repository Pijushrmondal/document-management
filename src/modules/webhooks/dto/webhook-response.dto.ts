import {
  ContentClassification,
  WebhookEventStatus,
} from 'src/database/schemas/webhook-event.schema';

export class WebhookResponseDto {
  id: string;
  source: string;
  imageId: string;
  classification: ContentClassification;
  status: WebhookEventStatus;
  unsubscribeInfo?: {
    channel: 'email' | 'url';
    target: string;
  };
  tasksCreated: Array<{
    taskId: string;
    type: string;
    channel: string;
    target: string;
    status: string;
  }>;
  receivedAt: Date;
  processedAt?: Date;

  constructor(partial: Partial<WebhookResponseDto>) {
    Object.assign(this, partial);
  }
}
