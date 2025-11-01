import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ContentClassification,
  WebhookEventStatus,
} from 'src/database/schemas/webhook-event.schema';

export class WebhookQueryDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsEnum(ContentClassification)
  classification?: ContentClassification;

  @IsOptional()
  @IsEnum(WebhookEventStatus)
  status?: WebhookEventStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
