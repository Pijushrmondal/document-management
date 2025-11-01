import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class OcrWebhookDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  imageId: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
