export class DocumentResponseDto {
  id: string;
  ownerId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  textContent?: string;
  primaryTag?: string;
  secondaryTags?: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<DocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
