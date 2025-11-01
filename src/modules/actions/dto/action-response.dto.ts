import { ActionStatus } from 'src/database/schemas/action.schema';

export class ActionOutputDto {
  type: string;
  documentId: string;
  filename: string;
  url: string;

  constructor(partial: Partial<ActionOutputDto>) {
    Object.assign(this, partial);
  }
}

export class ActionResponseDto {
  id: string;
  status: ActionStatus;
  scope: {
    type: 'folder' | 'files';
    name?: string;
    ids?: string[];
  };
  actions: string[];
  creditsUsed: number;
  outputs: ActionOutputDto[];
  error?: string;
  executedAt?: Date;
  completedAt?: Date;
  createdAt: Date;

  constructor(partial: Partial<ActionResponseDto>) {
    Object.assign(this, partial);
  }
}
