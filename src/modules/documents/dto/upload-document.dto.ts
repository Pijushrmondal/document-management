import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primaryTag: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  secondaryTags?: string[] = [];
}
