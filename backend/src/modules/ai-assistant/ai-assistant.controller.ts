import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiInventoryAuditDto, AiChatPromptDto, AiAutoReorderDto } from './dto/ai-assistant.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';

@Controller('ai-assistant')
@UseGuards(SectorPermissionGuard)
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  @Post('inventory-audit')
  async performInventoryAudit(@Body() dto: AiInventoryAuditDto) {
    return this.aiService.performInventoryAudit(dto);
  }

  @Post('auto-reorder')
  async generateAutoPurchaseOrders(@Body() dto: AiAutoReorderDto) {
    return this.aiService.generateAutoPurchaseOrders(dto);
  }

  @Post('chat')
  async processChatPrompt(@Body() dto: AiChatPromptDto) {
    return this.aiService.processChatPrompt(dto);
  }
}
