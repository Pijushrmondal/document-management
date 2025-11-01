import { Usage, UsageDocument } from './../../database/schemas/usage.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ActionStatus,
  Action,
  ActionDocument,
} from 'src/database/schemas/action.schema';

@Injectable()
export class ActionsRepository {
  constructor(
    @InjectModel(Action.name) private actionModel: Model<ActionDocument>,
    @InjectModel(Usage.name) private usageModel: Model<UsageDocument>,
  ) {}

  // ==================== Action Operations ====================

  async createAction(data: Partial<Action>): Promise<ActionDocument> {
    const action = new this.actionModel({
      ...data,
      userId: new Types.ObjectId(data.userId as any),
    });
    return action.save();
  }

  async findActionById(id: string): Promise<ActionDocument | null> {
    return this.actionModel.findById(id).exec();
  }

  async updateActionStatus(
    id: string,
    status: ActionStatus,
    updates?: Partial<Action>,
  ): Promise<ActionDocument | null> {
    return this.actionModel
      .findByIdAndUpdate(id, { status, ...updates }, { new: true })
      .exec();
  }

  async findActionsByUser(
    userId: string,
    limit: number = 20,
  ): Promise<ActionDocument[]> {
    return this.actionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  // ==================== Usage Operations ====================

  async createUsage(data: {
    userId: string;
    actionType: string;
    credits: number;
    scope: any;
    result?: any;
  }): Promise<UsageDocument> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const usage = new this.usageModel({
      userId: new Types.ObjectId(data.userId),
      actionType: data.actionType,
      credits: data.credits,
      scope: data.scope,
      result: data.result,
      timestamp: now,
      month,
    });

    return usage.save();
  }

  async getMonthlyUsage(
    userId: string,
    year: number,
    month: number,
  ): Promise<{ total: number; breakdown: UsageDocument[] }> {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const breakdown = await this.usageModel
      .find({
        userId: new Types.ObjectId(userId),
        month: monthStr,
      })
      .sort({ timestamp: -1 })
      .exec();

    const total = breakdown.reduce((sum, usage) => sum + usage.credits, 0);

    return { total, breakdown };
  }

  async getTotalCreditsUsed(userId: string): Promise<number> {
    const result = await this.usageModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$credits' } } },
    ]);

    return result[0]?.total || 0;
  }

  async getUsageByMonth(
    userId: string,
  ): Promise<Array<{ month: string; credits: number }>> {
    return this.usageModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$month',
          credits: { $sum: '$credits' },
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          _id: 0,
          month: '$_id',
          credits: 1,
        },
      },
    ]);
  }
}
