import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { OcrWebhookDto } from './dto/ocr-webhook.dto';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { WebhookQueryDto } from './dto/webhook-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@/common/enum/user-role.enum';

@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * OCR Webhook endpoint (Public - no auth required)
   */
  //   @Public()
  //   @Post('ocr')
  //   async handleOcrWebhook(
  //     @Body() ocrWebhookDto: OcrWebhookDto,
  //   ): Promise<WebhookResponseDto> {
  //     return this.webhooksService.processOcrWebhook(ocrWebhookDto);
  //   }

  /**
   * Get webhook event by ID (Admin/Support only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async getWebhookEvent(@Param('id') id: string): Promise<WebhookResponseDto> {
    return this.webhooksService.getWebhookEvent(id);
  }

  /**
   * Query webhook events (Admin/Support only)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  async queryWebhookEvents(@Query() query: WebhookQueryDto): Promise<{
    events: WebhookResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.webhooksService.queryWebhookEvents(query);
  }

  /**
   * Get webhook statistics (Admin only)
   */
  @Get('stats/summary')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.webhooksService.getStats();
  }
}
