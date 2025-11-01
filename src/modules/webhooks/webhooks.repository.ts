import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { WebhookQueryDto } from './dto/webhook-query.dto';
import {
  ContentClassification,
  WebhookEvent,
  WebhookEventDocument,
  WebhookEventStatus,
} from 'src/database/schemas/webhook-event.schema';

@Injectable()
export class WebhooksRepository {
  constructor(
    @InjectModel(WebhookEvent.name)
    private webhookEventModel: Model<WebhookEventDocument>,
  ) {}

  /**
   * Create webhook event
   */
  async create(data: Partial<WebhookEvent>): Promise<WebhookEventDocument> {
    const webhookEvent = new this.webhookEventModel({
      ...data,
      receivedAt: new Date(),
    });
    return webhookEvent.save();
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<WebhookEventDocument | null> {
    return this.webhookEventModel.findById(id).exec();
  }

  /**
   * Find by image ID
   */
  async findByImageId(imageId: string): Promise<WebhookEventDocument | null> {
    return this.webhookEventModel.findOne({ imageId }).exec();
  }

  /**
   * Update webhook event
   */
  async update(
    id: string,
    updates: Partial<WebhookEvent>,
  ): Promise<WebhookEventDocument | null> {
    return this.webhookEventModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
  }

  /**
   * Update status
   */
  async updateStatus(
    id: string,
    status: WebhookEventStatus,
    additionalUpdates?: Partial<WebhookEvent>,
  ): Promise<WebhookEventDocument | null> {
    const updates: any = { status, ...additionalUpdates };

    if (status === WebhookEventStatus.PROCESSED) {
      updates.processedAt = new Date();
    }

    return this.webhookEventModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
  }

  /**
   * Add task to webhook event
   */
  async addTask(id: string, taskId: string): Promise<void> {
    await this.webhookEventModel
      .findByIdAndUpdate(id, {
        $push: { taskIds: new Types.ObjectId(taskId) },
      })
      .exec();
  }

  /**
   * Query webhook events
   */
  async query(
    query: WebhookQueryDto,
  ): Promise<{ events: WebhookEventDocument[]; total: number }> {
    const filter: any = {};

    if (query.source) {
      filter.source = query.source;
    }

    if (query.classification) {
      filter.classification = query.classification;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);

    const [events, total] = await Promise.all([
      this.webhookEventModel
        .find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(query.limit || 20)
        .exec(),
      this.webhookEventModel.countDocuments(filter).exec(),
    ]);

    return { events, total };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    byClassification: Record<ContentClassification, number>;
    byStatus: Record<WebhookEventStatus, number>;
  }> {
    const [classificationStats, statusStats] = await Promise.all([
      this.webhookEventModel.aggregate([
        {
          $group: {
            _id: '$classification',
            count: { $sum: 1 },
          },
        },
      ]),
      this.webhookEventModel.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const total = await this.webhookEventModel.countDocuments().exec();

    const byClassification: any = {
      [ContentClassification.OFFICIAL]: 0,
      [ContentClassification.AD]: 0,
      [ContentClassification.UNKNOWN]: 0,
    };

    const byStatus: any = {
      [WebhookEventStatus.RECEIVED]: 0,
      [WebhookEventStatus.PROCESSING]: 0,
      [WebhookEventStatus.PROCESSED]: 0,
      [WebhookEventStatus.FAILED]: 0,
    };

    classificationStats.forEach((stat) => {
      byClassification[stat._id] = stat.count;
    });

    statusStats.forEach((stat) => {
      byStatus[stat._id] = stat.count;
    });

    return { total, byClassification, byStatus };
  }
}
