import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
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
  q: string;

  @IsEnum(SearchScope)
  scope: SearchScope;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ValidateIf(
    (o) => o.scope === SearchScope.FOLDER || o.scope === SearchScope.FILES,
  )
  ids: string[];
}
