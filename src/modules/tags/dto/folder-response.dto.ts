export class FolderResponseDto {
  id: string;
  name: string;
  documentCount: number;
  createdAt: Date;

  constructor(partial: Partial<FolderResponseDto>) {
    Object.assign(this, partial);
  }
}
