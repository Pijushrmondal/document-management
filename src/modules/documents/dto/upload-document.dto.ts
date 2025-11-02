import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primaryTag: string;

  @Transform(({ obj, value }) => {
    // Handle form data array format: secondaryTags[]=value1&secondaryTags[]=value2
    if (obj['secondaryTags[]'] !== undefined) {
      const tagsArray = obj['secondaryTags[]'];
      return Array.isArray(tagsArray) ? tagsArray : [tagsArray];
    }
    // Handle single string value: secondaryTags=value
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        return value;
      }
      // If it's a string, convert to array
      if (typeof value === 'string') {
        // Handle comma-separated values: "tag1,tag2"
        return value.includes(',')
          ? value.split(',').map((t) => t.trim())
          : [value];
      }
    }
    return [];
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  secondaryTags?: string[] = [];
}
