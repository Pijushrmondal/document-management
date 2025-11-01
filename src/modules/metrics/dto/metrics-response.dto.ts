export class SystemMetricsDto {
  docs_total: number;
  folders_total: number;
  actions_month: number;
  tasks_today: number;
  users_total: number;
  webhooks_total: number;
  storage_mb: number;
  audit_logs_total: number;

  constructor(partial: Partial<SystemMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class UserMetricsDto {
  userId: string;
  documents: {
    total: number;
    thisMonth: number;
  };
  tags: {
    total: number;
  };
  actions: {
    total: number;
    thisMonth: number;
    creditsUsed: number;
  };
  tasks: {
    total: number;
    pending: number;
    completed: number;
  };
  storage: {
    totalBytes: number;
    totalMB: number;
  };

  constructor(partial: Partial<UserMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class DocumentMetricsDto {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByMonth: Array<{ month: string; count: number }>;
  averageFileSize: number;
  totalStorage: number;
  topFolders: Array<{ name: string; count: number }>;

  constructor(partial: Partial<DocumentMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class ActionMetricsDto {
  totalActions: number;
  totalCreditsUsed: number;
  actionsByType: Record<string, number>;
  actionsByMonth: Array<{ month: string; count: number; credits: number }>;
  averageCreditsPerAction: number;
  successRate: number;

  constructor(partial: Partial<ActionMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class TaskMetricsDto {
  totalTasks: number;
  tasksByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  tasksByType: Record<string, number>;
  completionRate: number;
  averageCompletionTime?: number;
  todayTasks: number;
  overdueTasks: number;

  constructor(partial: Partial<TaskMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class WebhookMetricsDto {
  totalWebhooks: number;
  webhooksByClassification: {
    official: number;
    ad: number;
    unknown: number;
  };
  webhooksByStatus: {
    received: number;
    processing: number;
    processed: number;
    failed: number;
  };
  webhooksBySource: Array<{ source: string; count: number }>;
  tasksCreated: number;
  processingSuccessRate: number;

  constructor(partial: Partial<WebhookMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class AuditMetricsDto {
  totalLogs: number;
  logsByAction: Array<{ action: string; count: number }>;
  logsByUser: Array<{ userId: string; count: number }>;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    userId: string;
  }>;

  constructor(partial: Partial<AuditMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class DetailedMetricsDto {
  system: SystemMetricsDto;
  documents: DocumentMetricsDto;
  actions: ActionMetricsDto;
  tasks: TaskMetricsDto;
  webhooks: WebhookMetricsDto;
  generatedAt: Date;

  constructor(partial: Partial<DetailedMetricsDto>) {
    Object.assign(this, partial);
  }
}
