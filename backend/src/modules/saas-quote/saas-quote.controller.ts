import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { SaaSQuoteService } from './saas-quote.service';
import { SaaSPdfGeneratorService } from './saas-pdf-generator.service';
import { CreateSaaSQuoteDto } from './dto/saas-quote.dto';
import { SuperAdminGuard } from '../../core/guards/super-admin.guard';

@Controller('super-admin/saas-quotes')
export class SaaSQuoteController {
  constructor(
    private quoteService: SaaSQuoteService,
    private pdfService: SaaSPdfGeneratorService
  ) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  async createQuote(@Body() dto: CreateSaaSQuoteDto) {
    return this.quoteService.create(dto);
  }

  @Get()
  async listQuotes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.quoteService.findAll({ page, limit, tenantId, status, search });
  }

  @Get(':id')
  async getQuote(@Param('id') id: string) {
    return this.quoteService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(SuperAdminGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.quoteService.updateStatus(id, status);
  }

  @Post(':id/convert')
  @UseGuards(SuperAdminGuard)
  async convertToSubscription(@Param('id') id: string) {
    return this.quoteService.convertToSubscription(id);
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  async updateQuote(
    @Param('id') id: string,
    @Body() dto: any // Using any here to bypass dto import temporarily or we could import UpdateSaaSQuoteDto. Let's import it.
  ) {
    return this.quoteService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  async deleteQuote(@Param('id') id: string) {
    return this.quoteService.remove(id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    // Vérification d'autorisation (lève 403 ou 404 si refusé)
    await this.quoteService.findOne(id);

    const pdfBuffer = await this.pdfService.generateSaaSQuotePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="saas-quote-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }
}
