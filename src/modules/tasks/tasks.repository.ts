import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import {
  Task,
  TaskDocument,
  TaskStatus,
} from 'src/database/schemas/task.schema';

@Injectable()
export class TasksRepository {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  /**
   * Create a new task
   */
  async create(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      userId: new Types.ObjectId(userId),
      dueDate: createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : undefined,
    });
    return task.save();
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<TaskDocument | null> {
    return this.taskModel.findById(id).exec();
  }

  /**
   * Find task by ID and user
   */
  async findByIdAndUser(
    id: string,
    userId: string,
  ): Promise<TaskDocument | null> {
    return this.taskModel
      .findOne({
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  /**
   * Find tasks by user with filters
   */
  async findByUser(
    userId: string,
    query: TaskQueryDto,
  ): Promise<{ tasks: TaskDocument[]; total: number }> {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const skip = ((query.page || 1) - 1) * (query.limit || 20);

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit || 20)
        .exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return { tasks, total };
  }

  /**
   * Update task
   */
  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDocument | null> {
    const updates: any = { ...updateTaskDto };

    // If status is being changed to completed, set completedAt
    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      updates.completedAt = new Date();
    }

    if (updateTaskDto.dueDate) {
      updates.dueDate = new Date(updateTaskDto.dueDate);
    }

    return this.taskModel.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  /**
   * Delete task
   */
  async delete(id: string): Promise<TaskDocument | null> {
    return this.taskModel.findByIdAndDelete(id).exec();
  }

  /**
   * Count tasks created today for rate limiting
   */
  async countTodayTasks(userId: string, source: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.taskModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        source,
        createdAt: { $gte: startOfDay },
      })
      .exec();
  }

  /**
   * Check if rate limit is exceeded
   */
  async canCreateTask(
    userId: string,
    source: string,
    maxPerDay: number = 3,
  ): Promise<boolean> {
    const count = await this.countTodayTasks(userId, source);
    return count < maxPerDay;
  }

  /**
   * Get tasks statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  }> {
    const stats = await this.taskModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      if (stat._id === TaskStatus.PENDING) result.pending = stat.count;
      if (stat._id === TaskStatus.IN_PROGRESS) result.inProgress = stat.count;
      if (stat._id === TaskStatus.COMPLETED) result.completed = stat.count;
      if (stat._id === TaskStatus.FAILED) result.failed = stat.count;
    });

    return result;
  }

  /**
   * Get tasks created today
   */
  async getTodayTasks(userId: string): Promise<TaskDocument[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.taskModel
      .find({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: startOfDay },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<TaskDocument[]> {
    return this.taskModel
      .find({
        userId: new Types.ObjectId(userId),
        status: { $in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        dueDate: { $lt: new Date() },
      })
      .sort({ dueDate: 1 })
      .exec();
  }
}
