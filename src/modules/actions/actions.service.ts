import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ActionsRepository } from './actions.repository';
import { DocumentsRepository } from '../documents/documents.repository';
import { TagsService } from '../tags/tags.service';
import { AuditService } from '../audit/audit.service';
import { MockProcessor } from './processors/mock-processor';
import { RunActionDto } from './dto/run-action.dto';
import { ActionResponseDto, ActionOutputDto } from './dto/action-response.dto';
import { UsageStatsDto } from './dto/usage-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import {
  ActionDocument,
  ActionStatus,
} from 'src/database/schemas/action.schema';
import mongoose from 'mongoose';

@Injectable()
export class ActionsService {
  private readonly CREDITS_PER_ACTION = 5;

  constructor(
    private readonly actionsRepository: ActionsRepository,
    private readonly documentsRepository: DocumentsRepository,
    private readonly tagsService: TagsService,
    private readonly auditService: AuditService,
    private readonly mockProcessor: MockProcessor,
  ) {}

  /**
   * Run a scoped action
   */
  async runAction(
    userId: string,
    runActionDto: RunActionDto,
  ): Promise<ActionResponseDto> {
    // 1. Validate scope (folder XOR files)
    this.validateScope(runActionDto.scope);

    // 2. Create action record
    const action = await this.actionsRepository.createAction({
      userId: new mongoose.Types.ObjectId(userId),
      status: ActionStatus.PENDING,
      scope: runActionDto.scope,
      messages: runActionDto.messages,
      actions: runActionDto.actions,
      creditsUsed: this.CREDITS_PER_ACTION,
    });

    try {
      // 3. Update status to running
      await this.actionsRepository.updateActionStatus(
        action._id.toString(),
        ActionStatus.RUNNING,
        { executedAt: new Date() },
      );

      // 4. Collect context from documents
      const context = await this.collectContext(userId, runActionDto.scope);

      // 5. Process with mock processor
      const outputs = this.mockProcessor.process(
        context,
        runActionDto.messages,
        runActionDto.actions,
      );

      // 6. Save outputs as documents
      const outputDocuments = await this.saveOutputs(
        userId,
        outputs,
        action._id.toString(),
      );

      // 7. Update action with outputs
      await this.actionsRepository.updateActionStatus(
        action._id.toString(),
        ActionStatus.COMPLETED,
        {
          outputs: outputDocuments.map((doc) => ({
            type: doc.type,
            documentId: doc.id,
            filename: doc.filename,
          })),
          completedAt: new Date(),
        },
      );

      // 8. Track usage
      await this.actionsRepository.createUsage({
        userId,
        actionType: runActionDto.actions.join(','),
        credits: this.CREDITS_PER_ACTION,
        scope: runActionDto.scope,
        result: {
          success: true,
          outputDocumentIds: outputDocuments.map((d) => d.id),
        },
      });

      // 9. Log audit event
      await this.auditService.logActionRun(userId, action._id.toString(), {
        scope: runActionDto.scope,
        actions: runActionDto.actions,
        outputCount: outputDocuments.length,
      });

      // 10. Return response
      return this.toResponseDto(action, outputDocuments);
    } catch (error) {
      // Handle failure
      await this.actionsRepository.updateActionStatus(
        action._id.toString(),
        ActionStatus.FAILED,
        {
          error: error.message,
          completedAt: new Date(),
        },
      );

      await this.actionsRepository.createUsage({
        userId,
        actionType: runActionDto.actions.join(','),
        credits: this.CREDITS_PER_ACTION,
        scope: runActionDto.scope,
        result: {
          success: false,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Get action by ID
   */
  async getAction(
    actionId: string,
    userId: string,
  ): Promise<ActionResponseDto> {
    const action = await this.actionsRepository.findActionById(actionId);

    if (!action) {
      throw new NotFoundException('Action not found');
    }

    if (action.userId.toString() !== userId) {
      throw new NotFoundException('Action not found');
    }

    return this.toResponseDto(action, []);
  }

  /**
   * Get user's action history
   */
  async getActionHistory(userId: string): Promise<ActionResponseDto[]> {
    const actions = await this.actionsRepository.findActionsByUser(userId, 50);
    return actions.map((action) => this.toResponseDto(action, []));
  }

  /**
   * Get monthly usage
   */
  async getMonthlyUsage(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<UsageStatsDto> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const { total, breakdown } = await this.actionsRepository.getMonthlyUsage(
      userId,
      targetYear,
      targetMonth,
    );

    return new UsageStatsDto({
      totalCredits: total,
      actionsCount: breakdown.length,
      period: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      breakdown: breakdown.map((usage) => ({
        date: usage.timestamp.toISOString().split('T')[0],
        credits: usage.credits,
        actionType: usage.actionType,
      })),
    });
  }

  /**
   * Get all-time usage stats
   */
  async getAllTimeUsage(userId: string): Promise<{
    totalCredits: number;
    monthlyBreakdown: Array<{ month: string; credits: number }>;
  }> {
    const [totalCredits, monthlyBreakdown] = await Promise.all([
      this.actionsRepository.getTotalCreditsUsed(userId),
      this.actionsRepository.getUsageByMonth(userId),
    ]);

    return {
      totalCredits,
      monthlyBreakdown,
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Validate scope rule: folder XOR files
   */
  private validateScope(scope: any): void {
    const hasFolder = scope.type === 'folder' && scope.name;
    const hasFiles =
      scope.type === 'files' && scope.ids && scope.ids.length > 0;

    if (!hasFolder && !hasFiles) {
      throw new BadRequestException(
        'Scope must specify either folder or files',
      );
    }

    if (scope.type === 'folder' && !scope.name) {
      throw new BadRequestException('Folder scope must have a folder name');
    }

    if (scope.type === 'files' && (!scope.ids || scope.ids.length === 0)) {
      throw new BadRequestException(
        'Files scope must have at least one file ID',
      );
    }
  }

  /**
   * Collect document context for processing
   */
  private async collectContext(userId: string, scope: any): Promise<any> {
    let documentIds: string[];

    if (scope.type === 'folder') {
      // Get all documents in folder (by primary tag)
      documentIds = await this.tagsService.getDocumentsByFolder(
        scope.name,
        userId,
      );

      if (documentIds.length === 0) {
        throw new BadRequestException(
          `No documents found in folder '${scope.name}'`,
        );
      }
    } else {
      documentIds = scope.ids;
    }

    // Fetch documents
    const documents = await this.documentsRepository.findByIds(
      documentIds,
      userId,
    );

    if (documents.length === 0) {
      throw new BadRequestException(
        'No documents found for the specified scope',
      );
    }

    // Build context
    return {
      documents: documents.map((doc) => ({
        id: doc._id.toString(),
        filename: doc.filename,
        textContent: doc.textContent || '',
      })),
    };
  }

  /**
   * Save processor outputs as documents
   */
  private async saveOutputs(
    userId: string,
    outputs: any[],
    actionId: string,
  ): Promise<Array<{ id: string; type: string; filename: string }>> {
    const savedDocuments = [];

    for (const output of outputs) {
      // Save file to disk
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filename = `${Date.now()}-${output.filename}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, output.content);

      // Create document record
      const document = await this.documentsRepository.create({
        ownerId: userId,
        filename: output.filename,
        mimeType: output.type === 'csv' ? 'text/csv' : 'text/markdown',
        fileSize: Buffer.byteLength(output.content),
        filePath,
        textContent: output.content,
      });

      // Tag as generated output
      await this.tagsService.assignPrimaryTag(
        document._id.toString(),
        'ai-generated',
        userId,
      );

      await this.tagsService.assignSecondaryTag(
        document._id.toString(),
        `action-${actionId}`,
        userId,
      );

      //   savedDocuments.push({
      //     id: document._id.toString(),
      //     type: output.type,
      //     filename: output.filename,
      //   });
    }

    return savedDocuments;
  }

  /**
   * Convert to response DTO
   */
  private toResponseDto(
    action: ActionDocument,
    outputs: Array<{ id: string; type: string; filename: string }>,
  ): ActionResponseDto {
    return new ActionResponseDto({
      id: action._id.toString(),
      status: action.status,
      scope: action.scope,
      actions: action.actions,
      creditsUsed: action.creditsUsed,
      outputs: (outputs.length > 0 ? outputs : action.outputs || []).map(
        (output) =>
          new ActionOutputDto({
            type: output.type,
            documentId: output.documentId || output.id,
            filename: output.filename,
            url: `/v1/docs/${output.documentId || output.id}/download`,
          }),
      ),
      error: action.error,
      executedAt: action.executedAt,
      completedAt: action.completedAt,
      createdAt: action.createdAt,
    });
  }
}
