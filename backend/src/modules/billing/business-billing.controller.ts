import { Controller, Get, Post, Patch, Body, Param, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { BusinessBillingService } from './business-billing.service';
import { CreateQuoteDto, CreateInvoiceDto } from './dto/billing-document.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

import { PricingCalculatorService } from './pricing-calculator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { Public } from '../../core/auth/public.decorator';

@Controller('business-billing')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.QUINCAILLERIE, SectorType.MULTISERVICES_IT, SectorType.TAILLEUR)
export class BusinessBillingController {

  constructor(
    private billingService: BusinessBillingService,
    private pricingCalculator: PricingCalculatorService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  @Public()
  @Get('pricing-plans')
  async getPricingPlans() {
    return this.pricingCalculator.getAllPricingOptions();
  }

  @Post('quotes')
  async createQuote(@Body() dto: CreateQuoteDto) {
    return this.billingService.createQuote(dto);
  }

  @Get('quotes')
  async findAllQuotes() {
    return this.billingService.findAllQuotes();
  }

  @Get('quotes/:id/pdf')
  async downloadQuotePdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.pdfGenerator.generateQuotePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=devis-${id}.pdf`,
    });
    return new StreamableFile(buffer);
  }

  @Post('quotes/:id/convert')
  async convertQuoteToInvoice(@Param('id') quoteId: string) {
    return this.billingService.convertQuoteToInvoice(quoteId);
  }

  @Post('invoices')
  async createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices')
  async findAllInvoices() {
    return this.billingService.findAllInvoices();
  }

  @Patch('invoices/:id/status')
  async updateInvoiceStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.billingService.updateInvoiceStatus(id, body.status);
  }

  @Patch('invoices/:id/payment')
  async registerPayment(@Param('id') id: string, @Body() body: { amount: number; method?: string; reference?: string; notes?: string }) {
    return this.billingService.registerPayment(id, body.amount, body.method, body.reference, body.notes);
  }

  @Get('invoices/:id/payments')
  async getInvoicePayments(@Param('id') id: string) {
    return this.billingService.getInvoicePayments(id);
  }

  @Get('invoices/:id/pdf')
  async downloadInvoicePdf(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.pdfGenerator.generateInvoicePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=facture-${id}.pdf`,
    });
    return new StreamableFile(buffer);
  }

  @Post('quotes/:id/delete')
  async deleteQuote(@Param('id') id: string) {
    return this.billingService.deleteQuote(id);
  }

  @Post('invoices/:id/delete')
  async deleteInvoice(@Param('id') id: string) {
    return this.billingService.deleteInvoice(id);
  }
}

