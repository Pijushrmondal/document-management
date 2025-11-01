import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Action } from 'rxjs/internal/scheduler/Action';
import { ActionDocument } from 'src/database/schemas/action.schema';
import {
  AuditLog,
  AuditLogDocument,
} from 'src/database/schemas/audit-log.schema';
import {
  DocumentDocument,
  DocumentModel,
} from 'src/database/schemas/document.schema';
import { Tag, TagDocument } from 'src/database/schemas/tag.schema';
import { Task, TaskDocument } from 'src/database/schemas/task.schema';
import { Usage, UsageDocument } from 'src/database/schemas/usage.schema';
import { User, UserDocument } from 'src/database/schemas/user.schema';
import {
  WebhookEvent,
  WebhookEventDocument,
} from 'src/database/schemas/webhook-event.schema';

@Injectable()
export class MetricsAggregatorService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Action.name) private actionModel: Model<ActionDocument>,
    @InjectModel(Usage.name) private usageModel: Model<UsageDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(WebhookEvent.name)
    private webhookModel: Model<WebhookEventDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Get total document count
   */
  async getTotalDocuments(userId?: string): Promise<number> {
    const filter = userId ? { ownerId: userId } : {};
    return this.documentModel.countDocuments(filter).exec();
  }

  /**
   * Get documents count this month
   */
  async getDocumentsThisMonth(userId?: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const filter: any = {
      createdAt: { $gte: startOfMonth },
    };

    if (userId) {
      filter.ownerId = userId;
    }

    return this.documentModel.countDocuments(filter).exec();
  }

  /**
   * Get total folders (primary tags)
   */
  async getTotalFolders(userId?: string): Promise<number> {
    const filter = userId ? { ownerId: userId } : {};
    return this.tagModel.countDocuments(filter).exec();
  }

  /**
   * Get actions count this month
   */
  async getActionsThisMonth(userId?: string): Promise<number> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const filter: any = { month };

    if (userId) {
      filter.userId = userId;
    }

    return this.usageModel.countDocuments(filter).exec();
  }

  /**
   * Get tasks count today
   */
  async getTasksToday(userId?: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const filter: any = {
      createdAt: { $gte: startOfDay },
    };

    if (userId) {
      filter.userId = userId;
    }

    return this.taskModel.countDocuments(filter).exec();
  }

  /**
   * Get total users
   */
  async getTotalUsers(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  /**
   * Get total webhooks
   */
  async getTotalWebhooks(): Promise<number> {
    return this.webhookModel.countDocuments().exec();
  }

  /**
   * Get total storage in MB
   */
  async getTotalStorage(userId?: string): Promise<number> {
    const filter = userId ? { ownerId: userId } : {};

    const result = await this.documentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$fileSize' },
        },
      },
    ]);

    const totalBytes = result[0]?.totalBytes || 0;
    return Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // MB with 2 decimals
  }

  /**
   * Get total audit logs
   */
  async getTotalAuditLogs(userId?: string): Promise<number> {
    const filter = userId ? { userId } : {};
    return this.auditLogModel.countDocuments(filter).exec();
  }

  /**
   * Get documents by MIME type
   */
  async getDocumentsByType(userId?: string): Promise<Record<string, number>> {
    const filter = userId ? { ownerId: userId } : {};

    const result = await this.documentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$mimeType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const documentsByType: Record<string, number> = {};
    result.forEach((item) => {
      documentsByType[item._id] = item.count;
    });

    return documentsByType;
  }

  /**
   * Get documents by month (last 12 months)
   */
  async getDocumentsByMonth(
    userId?: string,
  ): Promise<Array<{ month: string; count: number }>> {
    const filter = userId ? { ownerId: userId } : {};

    const result = await this.documentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    return result.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      count: item.count,
    }));
  }

  /**
   * Get total credits used
   */
  async getTotalCreditsUsed(userId?: string): Promise<number> {
    const filter = userId ? { userId } : {};

    const result = await this.usageModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: '$credits' },
        },
      },
    ]);

    return result[0]?.total || 0;
  }

  /**
   * Get actions by type
   */
  async getActionsByType(userId?: string): Promise<Record<string, number>> {
    const filter = userId ? { userId } : {};

    const result = await this.usageModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const actionsByType: Record<string, number> = {};
    result.forEach((item) => {
      actionsByType[item._id] = item.count;
    });

    return actionsByType;
  }

  /**
   * Get actions by month
   */
  // async getActionsByMonth(userId?: string): Promise
  //   Array<{ month: string; count: number; credits: number }>
  // > {
  //   const filter = userId ? { userId } : {};

  //   const result = await this.usageModel.aggregate([
  //     { $match: filter },
  //     {
  //       $group: {
  //         _id: '$month',
  //         count: { $sum: 1 },
  //         credits: { $sum: '$credits' },
  //       },
  //     },
  //     { $sort: { _id: -1 } },
  //     { $limit: 12 },
  //   ]);

  //   return result.map((item) => ({
  //     month: item._id,
  //     count: item.count,
  //     credits: item.credits,
  //   }));
  // }

  /**
   * Get action success rate
   */
  async getActionSuccessRate(userId?: string): Promise<number> {
    const filter = userId ? { userId } : {};

    const [total, successful] = await Promise.all([
      this.actionModel.countDocuments(filter).exec(),
      this.actionModel
        .countDocuments({ ...filter, status: 'completed' })
        .exec(),
    ]);

    if (total === 0) return 0;
    return Math.round((successful / total) * 100);
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(userId?: string): Promise<{
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const filter = userId ? { userId } : {};

    const result = await this.taskModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    result.forEach((item) => {
      if (item._id in stats) {
        stats[item._id as keyof typeof stats] = item.count;
      }
    });

    return stats;
  }

  /**
   * Get task completion rate
   */
  // async getTaskCompletionRate(userId?: string): Promise<number> {
  //   const filter = userId ? { userId } : {};

  //   const [total, completed] = await Promise.all([
  //     this.taskModel.countDocuments(filter).exec(),
  //     this.taskModel
  //       .countDocuments({ ...filter, status: TaskStatus.COMPLETED })
  //       .exec(),
  //   ]);

  //   if (total === 0) return 0;
  //   return Math.round((completed / total) * 100);
  // }

  /**
   * Get overdue tasks count
   */
  // async getOverdueTasks(userId?: string): Promise<number> {
  //   const filter: any = {
  //     status: { $in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
  //     dueDate: { $lt: new Date() },
  //   };

  //   if (userId) {
  //     filter.userId = userId;
  //   }

  //   return this.taskModel.countDocuments(filter).exec();
  // }

  /**
   * Get webhooks by classification
   */
  async getWebhooksByClassification(): Promise<{
    official: number;
    ad: number;
    unknown: number;
  }> {
    const result = await this.webhookModel.aggregate([
      {
        $group: {
          _id: '$classification',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      official: 0,
      ad: 0,
      unknown: 0,
    };

    result.forEach((item) => {
      if (item._id in stats) {
        stats[item._id as keyof typeof stats] = item.count;
      }
    });

    return stats;
  }

  /**
   * Get webhooks by status
   */
  async getWebhooksByStatus(): Promise<{
    received: number;
    processing: number;
    processed: number;
    failed: number;
  }> {
    const result = await this.webhookModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      received: 0,
      processing: 0,
      processed: 0,
      failed: 0,
    };

    result.forEach((item) => {
      if (item._id in stats) {
        stats[item._id as keyof typeof stats] = item.count;
      }
    });

    return stats;
  }

  /**
   * Get webhooks by source
   */
  // async getWebhooksBySource(limit: number = 10): Promise
  //   Array<{ source: string; count: number }>
  // > {
  //   const result = await this.webhookModel.aggregate([
  //     {
  //       $group: {
  //         _id: '$source',
  //         count: { $sum: 1 },
  //       },
  //     },
  //     { $sort: { count: -1 } },
  //     { $limit: limit },
  //   ]);

  //   return result.map((item) => ({
  //     source: item._id,
  //     count: item.count,
  //   }));
  // }

  /**
   * Get tasks created by webhooks
   */
  async getWebhookTasksCreated(): Promise<number> {
    const result = await this.webhookModel.aggregate([
      {
        $project: {
          taskCount: { $size: { $ifNull: ['$taskIds', []] } },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$taskCount' },
        },
      },
    ]);

    return result[0]?.total || 0;
  }

  /**
   * Get webhook processing success rate
   */
  async getWebhookSuccessRate(): Promise<number> {
    const [total, processed] = await Promise.all([
      this.webhookModel.countDocuments().exec(),
      this.webhookModel.countDocuments({ status: 'processed' }).exec(),
    ]);

    if (total === 0) return 0;
    return Math.round((processed / total) * 100);
  }

  /**
   * Get top folders by document count
   */
  // async getTopFolders(userId?: string, limit: number = 10): Promise
  //   Array<{ name: string; count: number }>
  // > {
  //   const filter = userId ? { ownerId: userId } : {};

  //   const tags = await this.tagModel.find(filter).exec();
  //   const tagCounts = await Promise.all(
  //     tags.map(async (tag) => {
  //       const count = await this.documentModel
  //         .countDocuments({
  //           _id: {
  //             $in: await this.documentModel
  //               .find({ ownerId: tag.ownerId })
  //               .distinct('_id'),
  //           },
  //         })
  //         .exec();

  //       return { name: tag.name, count };
  //     }),
  //   );

  //   return tagCounts
  //     .sort((a, b) => b.count - a.count)
  //     .slice(0, limit);
  // }
}
