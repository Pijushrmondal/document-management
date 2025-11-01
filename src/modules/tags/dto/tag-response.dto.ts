export class TagResponseDto {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TagResponseDto>) {
    Object.assign(this, partial);
  }
}
