import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditQueryDto } from './dto/audit-query.dto';
import {
  AuditLog,
  AuditLogDocument,
} from 'src/database/schemas/audit-log.schema';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createDto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel({
      ...createDto,
      userId: new Types.ObjectId(createDto.userId),
      timestamp: new Date(),
    });
    return auditLog.save();
  }

  async findAll(
    query: AuditQueryDto,
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const filter: any = {};

    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.entityType) {
      filter.entityType = query.entityType;
    }

    if (query.from || query.to) {
      filter.timestamp = {};
      if (query.from) {
        filter.timestamp.$gte = new Date(query.from);
      }
      if (query.to) {
        filter.timestamp.$lte = new Date(query.to);
      }
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(query.offset || 0)
        .limit(query.limit || 50)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { logs, total };
  }

  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 50,
    from?: string,
    to?: string,
  ): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { userId: new Types.ObjectId(userId) };

    // Add date range filter if provided
    if (from || to) {
      filter.timestamp = {};
      if (from) {
        filter.timestamp.$gte = new Date(from);
      }
      if (to) {
        filter.timestamp.$lte = new Date(to);
      }
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { logs, total };
  }

  async findByAction(
    action: string,
    limit: number = 50,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .exec();
  }

  async countByAction(action: string): Promise<number> {
    return this.auditLogModel.countDocuments({ action }).exec();
  }

  async countByUser(userId: string): Promise<number> {
    return this.auditLogModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.auditLogModel
      .deleteMany({ timestamp: { $lt: date } })
      .exec();
    return result.deletedCount;
  }

  async findById(logId: string): Promise<AuditLogDocument | null> {
    return this.auditLogModel.findById(logId).exec();
  }

  /**
   * Get statistics methods
   */
  async getTotalLogsCount(): Promise<number> {
    return this.auditLogModel.countDocuments().exec();
  }

  async getTodayLogsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.auditLogModel
      .countDocuments({
        timestamp: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .exec();
  }

  async getWeekLogsCount(): Promise<number> {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.auditLogModel
      .countDocuments({
        timestamp: {
          $gte: weekAgo,
          $lte: now,
        },
      })
      .exec();
  }
}
