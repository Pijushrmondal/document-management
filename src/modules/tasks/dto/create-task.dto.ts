import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { TaskChannel, TaskType } from 'src/database/schemas/task.schema';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  source: string;

  @IsEnum(TaskType)
  type: TaskType;

  @IsEnum(TaskChannel)
  channel: TaskChannel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  target: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
