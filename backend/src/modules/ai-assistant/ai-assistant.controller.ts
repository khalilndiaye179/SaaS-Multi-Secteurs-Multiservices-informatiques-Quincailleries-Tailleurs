import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiInventoryAuditDto, AiChatPromptDto, AiAutoReorderDto } from './dto/ai-assistant.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';

import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('ai-assistant')
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  @Post('super-admin/inventory-audit')
  @UseGuards(SuperAdminGuard)
  async performSuperAdminAudit() {
    return this.aiService.auditSuperAdminSaaS();
  }

  @Post('inventory-audit')
  @UseGuards(SectorPermissionGuard)
  async performInventoryAudit(@Body() dto: AiInventoryAuditDto) {
    return this.aiService.performInventoryAudit(dto);
  }

  @Post('auto-reorder')
  @UseGuards(SectorPermissionGuard)
  async generateAutoPurchaseOrders(@Body() dto: AiAutoReorderDto) {
    return this.aiService.generateAutoPurchaseOrders(dto);
  }

  @Post('chat')
  @UseGuards(SectorPermissionGuard)
  async processChatPrompt(@Body() dto: AiChatPromptDto) {
    return this.aiService.processChatPrompt(dto);
  }
}
