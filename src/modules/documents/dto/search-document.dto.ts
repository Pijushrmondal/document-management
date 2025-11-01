import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';

export enum SearchScope {
  FOLDER = 'folder',
  FILES = 'files',
}

export class SearchDocumentDto {
  @IsString()
  @IsNotEmpty()
  q: string; // search query

  @IsEnum(SearchScope)
  scope: SearchScope;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ValidateIf(
    (o) => o.scope === SearchScope.FOLDER || o.scope === SearchScope.FILES,
  )
  ids: string[]; // folder name OR file IDs based on scope
}
