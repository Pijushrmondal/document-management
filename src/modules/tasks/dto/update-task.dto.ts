import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from 'src/database/schemas/task.schema';

export class UpdateTaskDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
