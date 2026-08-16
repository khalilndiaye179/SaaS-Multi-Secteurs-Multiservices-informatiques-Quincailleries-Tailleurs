import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto, CreateInvoiceDto } from './dto/billing-document.dto';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { BillingDocumentType } from '@prisma/client';
import { BillingSequenceService } from './billing-sequence.service';

@Injectable()
export class BusinessBillingService {
  constructor(
    private prisma: PrismaService,
    private billingSequence: BillingSequenceService,
  ) {}

  // ─── DEVIS ───
  async createQuote(dto: CreateQuoteDto) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    const number = await this.billingSequence.getNextSequenceNumber(tenantId, BillingDocumentType.QUOTE, 'DEV');

    let totalAmount = 0;
    const linesData = dto.lines.map((line) => {
      const vatRate = dto.applyVat ? (line.vatRate ?? 18) : 0;
      const totalPrice = Math.round(line.quantity * line.unitPrice * (1 + vatRate / 100));
      totalAmount += totalPrice;
      return {
        stockItemId: line.stockItemId || null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate,
        totalPrice,
      };
    });

    return this.prisma.extended.quote.create({
      data: {
        number,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        notes: dto.notes,
        totalAmount,
        status: 'DRAFT',
        lines: {
          create: linesData,
        },
      } as any,
      include: { lines: true },
    });
  }

  async findAllQuotes() {
    return this.prisma.extended.quote.findMany({
      include: { lines: true, invoice: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async convertQuoteToInvoice(quoteId: string) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    const quote = await this.prisma.extended.quote.findFirst({
      where: { id: quoteId },
      include: { lines: true },
    });

    if (!quote) throw new NotFoundException('Devis introuvable.');

    const number = await this.billingSequence.getNextSequenceNumber(tenantId, BillingDocumentType.INVOICE, 'FAC');

    const invoice = await this.prisma.extended.invoice.create({
      data: {
        number,
        sourceQuoteId: quote.id,
        clientName: quote.clientName,
        clientPhone: quote.clientPhone,
        clientEmail: quote.clientEmail,
        notes: quote.notes,
        totalAmount: quote.totalAmount,
        status: 'DRAFT',
        lines: {
          create: quote.lines.map((l) => ({
            stockItemId: l.stockItemId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            vatRate: l.vatRate,
            totalPrice: l.totalPrice,
          })),
        },
      } as any,
      include: { lines: true },
    });

    await this.prisma.extended.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' },
    });

    return invoice;
  }

  // ─── FACTURES ───
  async createInvoice(dto: CreateInvoiceDto) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    const number = await this.billingSequence.getNextSequenceNumber(tenantId, BillingDocumentType.INVOICE, 'FAC');

    let totalAmount = 0;
    const linesData = dto.lines.map((line) => {
      const vatRate = dto.applyVat ? (line.vatRate ?? 18) : 0;
      const totalPrice = Math.round(line.quantity * line.unitPrice * (1 + vatRate / 100));
      totalAmount += totalPrice;
      return {
        stockItemId: line.stockItemId || null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        vatRate,
        totalPrice,
      };
    });

    return this.prisma.extended.invoice.create({
      data: {
        number,
        sourceQuoteId: dto.quoteId || null,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        notes: dto.notes,
        totalAmount,
        status: 'DRAFT',
        lines: {
          create: linesData,
        },
      } as any,
      include: { lines: true },
    });
  }

  async findAllInvoices() {
    return this.prisma.extended.invoice.findMany({
      include: { lines: true, sourceQuote: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteQuote(id: string) {
    const quote = await this.prisma.extended.quote.findFirst({ where: { id } });
    if (!quote) throw new NotFoundException('Devis introuvable.');
    return this.prisma.extended.quote.delete({ where: { id } });
  }

  async deleteInvoice(id: string) {
    const invoice = await this.prisma.extended.invoice.findFirst({ where: { id } });
    if (!invoice) throw new NotFoundException('Facture introuvable.');
    return this.prisma.extended.invoice.delete({ where: { id } });
  }
}

