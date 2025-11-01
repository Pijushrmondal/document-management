import { Injectable } from '@nestjs/common';
import { MetricsAggregatorService } from './services/metrics-aggregator.service';
import {
  SystemMetricsDto,
  UserMetricsDto,
  DocumentMetricsDto,
  ActionMetricsDto,
  TaskMetricsDto,
  WebhookMetricsDto,
  DetailedMetricsDto,
} from './dto/metrics-response.dto';

@Injectable()
export class MetricsService {
  constructor(private readonly metricsAggregator: MetricsAggregatorService) {}

  /**
   * Get system-wide metrics
   */
  async getSystemMetrics(): Promise<SystemMetricsDto> {
    const [
      docs_total,
      folders_total,
      actions_month,
      tasks_today,
      users_total,
      webhooks_total,
      storage_mb,
      audit_logs_total,
    ] = await Promise.all([
      this.metricsAggregator.getTotalDocuments(),
      this.metricsAggregator.getTotalFolders(),
      this.metricsAggregator.getActionsThisMonth(),
      this.metricsAggregator.getTasksToday(),
      this.metricsAggregator.getTotalUsers(),
      this.metricsAggregator.getTotalWebhooks(),
      this.metricsAggregator.getTotalStorage(),
      this.metricsAggregator.getTotalAuditLogs(),
    ]);

    return new SystemMetricsDto({
      docs_total,
      folders_total,
      actions_month,
      tasks_today,
      users_total,
      webhooks_total,
      storage_mb,
      audit_logs_total,
    });
  }

  /**
   * Get user-specific metrics
   */
  async getUserMetrics(userId: string): Promise<UserMetricsDto> {
    const [
      totalDocuments,
      documentsThisMonth,
      totalTags,
      totalActions,
      actionsThisMonth,
      creditsUsed,
      tasksByStatus,
      totalStorage,
    ] = await Promise.all([
      this.metricsAggregator.getTotalDocuments(userId),
      this.metricsAggregator.getDocumentsThisMonth(userId),
      this.metricsAggregator.getTotalFolders(userId),
      this.metricsAggregator.getTotalCreditsUsed(userId), // Assuming 5 credits per action
      this.metricsAggregator.getActionsThisMonth(userId),
      this.metricsAggregator.getTotalCreditsUsed(userId),
      this.metricsAggregator.getTasksByStatus(userId),
      this.metricsAggregator.getTotalStorage(userId),
    ]);

    const totalTasks =
      tasksByStatus.pending +
      tasksByStatus.in_progress +
      tasksByStatus.completed +
      tasksByStatus.failed +
      tasksByStatus.cancelled;

    return new UserMetricsDto({
      userId,
      documents: {
        total: totalDocuments,
        thisMonth: documentsThisMonth,
      },
      tags: {
        total: totalTags,
      },
      actions: {
        total: Math.round(totalActions),
        thisMonth: actionsThisMonth,
        creditsUsed,
      },
      tasks: {
        total: totalTasks,
        pending: tasksByStatus.pending,
        completed: tasksByStatus.completed,
      },
      storage: {
        totalBytes: Math.round(totalStorage * 1024 * 1024),
        totalMB: totalStorage,
      },
    });
  }

  /**
   * Get document metrics
   */
  //   async getDocumentMetrics(userId?: string): Promise<DocumentMetricsDto> {
  //     const [
  //       totalDocuments,
  //       documentsByType,
  //       documentsByMonth,
  //       totalStorage,
  //       topFolders,
  //     ] = await Promise.all([
  //       this.metricsAggregator.getTotalDocuments(userId),
  //       this.metricsAggregator.getDocumentsByType(userId),
  //       this.metricsAggregator.getDocumentsByMonth(userId),
  //       this.metricsAggregator.getTotalStorage(userId),
  //       this.metricsAggregator.getTopFolders(userId, 10),
  //     ]);

  //     const averageFileSize =
  //       totalDocuments > 0
  //         ? Math.round((totalStorage * 1024 * 1024) / totalDocuments)
  //         : 0;

  //     return new DocumentMetricsDto({
  //       totalDocuments,
  //       documentsByType,
  //       documentsByMonth,
  //       averageFileSize,
  //       totalStorage: Math.round(totalStorage * 1024 * 1024),
  //       topFolders,
  //     });
  //   }

  /**
   * Get action metrics
   */
  //   async getActionMetrics(userId?: string): Promise<ActionMetricsDto> {
  //     const [totalCreditsUsed, actionsByType, actionsByMonth, successRate] =
  //       await Promise.all([
  //         this.metricsAggregator.getTotalCreditsUsed(userId),
  //         this.metricsAggregator.getActionsByType(userId),
  //         this.metricsAggregator.getActionsByMonth(userId),
  //         this.metricsAggregator.getActionSuccessRate(userId),
  //       ]);

  //     const totalActions = Math.round(totalCreditsUsed / 5); // 5 credits per action

  //     return new ActionMetricsDto({
  //       totalActions,
  //       totalCreditsUsed,
  //       actionsByType,
  //       actionsByMonth,
  //       averageCreditsPerAction: totalActions > 0 ? 5 : 0,
  //       successRate,
  //     });
  //   }

  /**
   * Get task metrics
   */
  //   async getTaskMetrics(userId?: string): Promise<TaskMetricsDto> {
  //     const [tasksByStatus, completionRate, todayTasks, overdueTasks] =
  //       await Promise.all([
  //         this.metricsAggregator.getTasksByStatus(userId),
  //         this.metricsAggregator.getTaskCompletionRate(userId),
  //         this.metricsAggregator.getTasksToday(userId),
  //         this.metricsAggregator.getOverdueTasks(userId),
  //       ]);

  //     const totalTasks = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);

  //     // Mock task types for now
  //     const tasksByType = {
  //       unsubscribe: tasksByStatus.completed,
  //       follow_up: tasksByStatus.pending,
  //       review: tasksByStatus.in_progress,
  //     };

  //     return new TaskMetricsDto({
  //       totalTasks,
  //       tasksByStatus,
  //       tasksByType,
  //       completionRate,
  //       todayTasks,
  //       overdueTasks,
  //     });
  //   }

  /**
   * Get webhook metrics
   */
  //   async getWebhookMetrics(): Promise<WebhookMetricsDto> {
  //     const [
  //       totalWebhooks,
  //       webhooksByClassification,
  //       webhooksByStatus,
  //       webhooksBySource,
  //       tasksCreated,
  //       processingSuccessRate,
  //     ] = await Promise.all([
  //       this.metricsAggregator.getTotalWebhooks(),
  //       this.metricsAggregator.getWebhooksByClassification(),
  //       this.metricsAggregator.getWebhooksByStatus(),
  //       this.metricsAggregator.getWebhooksBySource(10),
  //       this.metricsAggregator.getWebhookTasksCreated(),
  //       this.metricsAggregator.getWebhookSuccessRate(),
  //     ]);

  //     return new WebhookMetricsDto({
  //       totalWebhooks,
  //       webhooksByClassification,
  //       webhooksByStatus,
  //       webhooksBySource,
  //       tasksCreated,
  //       processingSuccessRate,
  //     });
  //   }

  /**
   * Get detailed metrics (all metrics combined)
   */
  //   async getDetailedMetrics(userId?: string): Promise<DetailedMetricsDto> {
  //     const [system, documents, actions, tasks, webhooks] = await Promise.all([
  //       this.getSystemMetrics(),
  //       this.getDocumentMetrics(userId),
  //       this.getActionMetrics(userId),
  //       this.getTaskMetrics(userId),
  //       this.getWebhookMetrics(),
  //     ]);

  //     return new DetailedMetricsDto({
  //       system,
  //       documents,
  //       actions,
  //       tasks,
  //       webhooks,
  //       generatedAt: new Date(),
  //     });
  //   }
}
