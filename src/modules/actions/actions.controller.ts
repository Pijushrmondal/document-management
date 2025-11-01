import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActionsService } from './actions.service';
import { RunActionDto } from './dto/run-action.dto';
import { ActionResponseDto } from './dto/action-response.dto';
import { UsageStatsDto } from './dto/usage-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  /**
   * Run a scoped action
   */
  //   @Post('run')
  //   async runAction(
  //     @CurrentUser('sub') userId: string,
  //     @Body() runActionDto: RunActionDto,
  //   ): Promise<ActionResponseDto> {
  //     return this.actionsService.runAction(userId, runActionDto);
  //   }

  /**
   * Get action by ID
   */
  @Get(':id')
  async getAction(
    @Param('id') actionId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<ActionResponseDto> {
    return this.actionsService.getAction(actionId, userId);
  }

  /**
   * Get action history
   */
  @Get()
  async getActionHistory(
    @CurrentUser('sub') userId: string,
  ): Promise<ActionResponseDto[]> {
    return this.actionsService.getActionHistory(userId);
  }

  /**
   * Get monthly usage
   */
  @Get('usage/month')
  async getMonthlyUsage(
    @CurrentUser('sub') userId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<UsageStatsDto> {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const monthNum = month ? parseInt(month, 10) : undefined;

    return this.actionsService.getMonthlyUsage(userId, yearNum, monthNum);
  }

  /**
   * Get all-time usage
   */
  @Get('usage/all')
  async getAllTimeUsage(@CurrentUser('sub') userId: string): Promise<{
    totalCredits: number;
    monthlyBreakdown: Array<{ month: string; credits: number }>;
  }> {
    return this.actionsService.getAllTimeUsage(userId);
  }
}
