import {
  IsObject,
  IsArray,
  IsString,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ScopeType {
  FOLDER = 'folder',
  FILES = 'files',
}

class ScopeDto {
  @IsEnum(ScopeType)
  type: ScopeType;

  @ValidateIf((o) => o.type === ScopeType.FOLDER)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ValidateIf((o) => o.type === ScopeType.FILES)
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids?: string[];
}

class MessageDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class RunActionDto {
  @IsObject()
  @ValidateNested()
  @Type(() => ScopeDto)
  scope: ScopeDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @ArrayMinSize(1)
  messages: MessageDto[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  actions: string[];
}
