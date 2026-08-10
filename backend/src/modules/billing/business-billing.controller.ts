import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BusinessBillingService } from './business-billing.service';
import { CreateQuoteDto, CreateInvoiceDto } from './dto/billing-document.dto';
import { SectorPermissionGuard } from '../../core/guards/sector-permission.guard';
import { RequireSector } from '../../core/tenant/sector.decorator';
import { SectorType } from '../../core/types/tenant.types';

@Controller('business-billing')
@UseGuards(SectorPermissionGuard)
@RequireSector(SectorType.QUINCAILLERIE, SectorType.MULTISERVICES_IT, SectorType.TAILLEUR)
export class BusinessBillingController {

  constructor(private billingService: BusinessBillingService) {}

  @Post('quotes')
  async createQuote(@Body() dto: CreateQuoteDto) {
    return this.billingService.createQuote(dto);
  }

  @Get('quotes')
  async findAllQuotes() {
    return this.billingService.findAllQuotes();
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

  @Post('quotes/:id/delete')
  async deleteQuote(@Param('id') id: string) {
    return this.billingService.deleteQuote(id);
  }

  @Post('invoices/:id/delete')
  async deleteInvoice(@Param('id') id: string) {
    return this.billingService.deleteInvoice(id);
  }
}

