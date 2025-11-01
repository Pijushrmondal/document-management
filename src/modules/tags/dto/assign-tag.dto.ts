import { IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class AssignTagDto {
  @IsMongoId()
  documentId: string;

  @IsMongoId()
  tagId: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}
