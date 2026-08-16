import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';
import { QuincaillerieInventoryService } from './quincaillerie-inventory.service';
import { CreateInventorySessionDto, UpdateInventoryLineDto } from './dto/inventory.dto';

@Controller('quincaillerie/inventory')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.QUINCAILLERIE)
export class QuincaillerieInventoryController {
  constructor(private readonly inventoryService: QuincaillerieInventoryService) {}

  @Post('sessions')
  createSession(@Body() dto: CreateInventorySessionDto) {
    return this.inventoryService.createSession(dto);
  }

  @Get('sessions')
  findAllSessions(
    @Query('periodType') periodType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.inventoryService.findAllSessions({ periodType, dateFrom, dateTo });
  }

  @Get('sessions/:id')
  findSession(@Param('id') id: string) {
    return this.inventoryService.findSession(id);
  }

  @Put('sessions/:sessionId/lines/:lineId')
  updateLine(
    @Param('sessionId') sessionId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateInventoryLineDto,
  ) {
    return this.inventoryService.updateLine(sessionId, lineId, dto);
  }

  @Post('sessions/:id/complete')
  completeSession(@Param('id') id: string) {
    return this.inventoryService.completeSession(id);
  }

  @Post('sessions/:id/apply-adjustments')
  applyAdjustments(@Param('id') id: string) {
    return this.inventoryService.applyAdjustments(id);
  }
}
