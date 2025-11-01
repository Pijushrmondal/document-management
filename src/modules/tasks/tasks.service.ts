import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { TaskDocument, TaskStatus } from 'src/database/schemas/task.schema';

@Injectable()
export class TasksService {
  private readonly MAX_TASKS_PER_DAY = 3;

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new task
   */
  async createTask(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    // Check rate limit
    const canCreate = await this.tasksRepository.canCreateTask(
      userId,
      createTaskDto.source,
      this.MAX_TASKS_PER_DAY,
    );

    if (!canCreate) {
      throw new ConflictException(
        `Rate limit exceeded. Maximum ${this.MAX_TASKS_PER_DAY} tasks per day per source.`,
      );
    }

    // Create task
    const task = await this.tasksRepository.create(userId, createTaskDto);

    // Log audit event
    await this.auditService.logTaskCreated(userId, task._id.toString(), {
      type: task.type,
      source: task.source,
      channel: task.channel,
      target: task.target,
    });

    return this.toResponseDto(task);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string, userId: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findByIdAndUser(taskId, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.toResponseDto(task);
  }

  /**
   * Get all user tasks with filters
   */
  async getTasks(
    userId: string,
    query: TaskQueryDto,
  ): Promise<{
    tasks: TaskResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { tasks, total } = await this.tasksRepository.findByUser(
      userId,
      query,
    );

    return {
      tasks: tasks.map((task) => this.toResponseDto(task)),
      total,
      page: query.page || 1,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    // Verify task exists and belongs to user
    const existingTask = await this.tasksRepository.findByIdAndUser(
      taskId,
      userId,
    );

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Update task
    const task = await this.tasksRepository.update(taskId, updateTaskDto);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Log audit event
    await this.auditService.log({
      userId,
      action: 'task.updated' as any,
      entityType: 'task' as any,
      entityId: taskId,
      metadata: {
        updates: updateTaskDto,
      },
    });

    return this.toResponseDto(task);
  }

  /**
   * Mark task as completed
   */
  async completeTask(
    taskId: string,
    userId: string,
    notes?: string,
  ): Promise<TaskResponseDto> {
    return this.updateTask(taskId, userId, {
      status: TaskStatus.COMPLETED,
      notes,
    });
  }

  /**
   * Mark task as failed
   */
  async failTask(
    taskId: string,
    userId: string,
    notes?: string,
  ): Promise<TaskResponseDto> {
    return this.updateTask(taskId, userId, {
      status: TaskStatus.FAILED,
      notes,
    });
  }

  /**
   * Cancel task
   */
  async cancelTask(
    taskId: string,
    userId: string,
    notes?: string,
  ): Promise<TaskResponseDto> {
    return this.updateTask(taskId, userId, {
      status: TaskStatus.CANCELLED,
      notes,
    });
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.tasksRepository.findByIdAndUser(taskId, userId);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.tasksRepository.delete(taskId);

    // Log audit event
    await this.auditService.log({
      userId,
      action: 'task.deleted' as any,
      entityType: 'task' as any,
      entityId: taskId,
      metadata: {
        type: task.type,
        status: task.status,
      },
    });
  }

  /**
   * Get task statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  }> {
    return this.tasksRepository.getStats(userId);
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.getTodayTasks(userId);
    return tasks.map((task) => this.toResponseDto(task));
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<TaskResponseDto[]> {
    const tasks = await this.tasksRepository.getOverdueTasks(userId);
    return tasks.map((task) => this.toResponseDto(task));
  }

  /**
   * Check if user can create more tasks today for a given source
   */
  async canCreateTask(userId: string, source: string): Promise<boolean> {
    return this.tasksRepository.canCreateTask(
      userId,
      source,
      this.MAX_TASKS_PER_DAY,
    );
  }

  /**
   * Get remaining task slots for today
   */
  async getRemainingTaskSlots(userId: string, source: string): Promise<number> {
    const count = await this.tasksRepository.countTodayTasks(userId, source);
    return Math.max(0, this.MAX_TASKS_PER_DAY - count);
  }

  /**
   * Convert to response DTO
   */
  private toResponseDto(task: TaskDocument): TaskResponseDto {
    return new TaskResponseDto({
      id: task._id.toString(),
      userId: task.userId.toString(),
      source: task.source,
      type: task.type,
      status: task.status,
      channel: task.channel,
      target: task.target,
      title: task.title,
      description: task.description,
      metadata: task.metadata,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      notes: task.notes,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  }
}
