export class UsageStatsDto {
  totalCredits: number;
  actionsCount: number;
  period: string;
  breakdown: Array<{
    date: string;
    credits: number;
    actionType: string;
  }>;

  constructor(partial: Partial<UsageStatsDto>) {
    Object.assign(this, partial);
  }
}
