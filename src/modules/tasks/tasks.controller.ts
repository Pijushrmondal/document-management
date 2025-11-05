import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { JwtAuthGuard, ReadOnlyGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Create a new task
   */
  @Post()
  @UseGuards(ReadOnlyGuard)
  async createTask(
    @CurrentUser('sub') userId: string,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(userId, createTaskDto);
  }

  /**
   * Get all tasks with filters
   */
  @Get()
  async getTasks(
    @CurrentUser('sub') userId: string,
    @Query() query: TaskQueryDto,
  ): Promise<{
    tasks: TaskResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.tasksService.getTasks(userId, query);
  }

  /**
   * Get task statistics
   */
  @Get('stats')
  async getStats(@CurrentUser('sub') userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  }> {
    return this.tasksService.getStats(userId);
  }

  /**
   * Get today's tasks
   */
  @Get('today')
  async getTodayTasks(
    @CurrentUser('sub') userId: string,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.getTodayTasks(userId);
  }

  /**
   * Get overdue tasks
   */
  @Get('overdue')
  async getOverdueTasks(
    @CurrentUser('sub') userId: string,
  ): Promise<TaskResponseDto[]> {
    return this.tasksService.getOverdueTasks(userId);
  }

  /**
   * Get specific task
   */
  @Get(':id')
  async getTask(
    @Param('id') taskId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.getTask(taskId, userId);
  }

  /**
   * Update task
   */
  @Patch(':id')
  @UseGuards(ReadOnlyGuard)
  async updateTask(
    @Param('id') taskId: string,
    @CurrentUser('sub') userId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateTask(taskId, userId, updateTaskDto);
  }

  /**
   * Mark task as completed
   */
  @Patch(':id/complete')
  @UseGuards(ReadOnlyGuard)
  async completeTask(
    @Param('id') taskId: string,
    @CurrentUser('sub') userId: string,
    @Body('notes') notes?: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.completeTask(taskId, userId, notes);
  }

  /**
   * Mark task as failed
   */
  @Patch(':id/fail')
  @UseGuards(ReadOnlyGuard)
  async failTask(
    @Param('id') taskId: string,
    @CurrentUser('sub') userId: string,
    @Body('notes') notes?: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.failTask(taskId, userId, notes);
  }

  /**
   * Cancel task
   */
  @Patch(':id/cancel')
  @UseGuards(ReadOnlyGuard)
  async cancelTask(
    @Param('id') taskId: string,
    @CurrentUser('sub') userId: string,
    @Body('notes') notes?: string,
  ): Promise<TaskResponseDto> {
    return this.tasksService.cancelTask(taskId, userId, notes);
  }

  /**
   * Delete task
   */
  @Delete(':id')
  @UseGuards(ReadOnlyGuard)
  async deleteTask(
    @Param('id') taskId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ message: string }> {
    await this.tasksService.deleteTask(taskId, userId);
    return { message: 'Task deleted successfully' };
  }
}
