import {
  TaskChannel,
  TaskStatus,
  TaskType,
} from 'src/database/schemas/task.schema';

export class TaskResponseDto {
  id: string;
  userId: string;
  source: string;
  type: TaskType;
  status: TaskStatus;
  channel: TaskChannel;
  target: string;
  title?: string;
  description?: string;
  metadata: Record<string, any>;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}
