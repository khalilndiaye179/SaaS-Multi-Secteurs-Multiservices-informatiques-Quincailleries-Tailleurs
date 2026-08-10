import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuoteDto, CreateInvoiceDto } from './dto/billing-document.dto';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Injectable()
export class BusinessBillingService {
  constructor(private prisma: PrismaService) {}

  // ─── DEVIS ───
  async createQuote(dto: CreateQuoteDto) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context missing.');

    const year = new Date().getFullYear();
    const count = await this.prisma.extended.quote.count();
    const number = `DEV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    let totalAmount = 0;
    const linesData = dto.lines.map((line) => {
      const totalPrice = line.quantity * line.unitPrice;
      totalAmount += totalPrice;
      return {
        stockItemId: line.stockItemId || null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
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
    const quote = await this.prisma.extended.quote.findFirst({
      where: { id: quoteId },
      include: { lines: true },
    });

    if (!quote) throw new NotFoundException('Devis introuvable.');

    const year = new Date().getFullYear();
    const count = await this.prisma.extended.invoice.count();
    const number = `FAC-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = await this.prisma.extended.invoice.create({
      data: {
        number,
        quoteId: quote.id,
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
    const year = new Date().getFullYear();
    const count = await this.prisma.extended.invoice.count();
    const number = `FAC-${year}-${(count + 1).toString().padStart(4, '0')}`;

    let totalAmount = 0;
    const linesData = dto.lines.map((line) => {
      const totalPrice = line.quantity * line.unitPrice;
      totalAmount += totalPrice;
      return {
        stockItemId: line.stockItemId || null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice,
      };
    });

    return this.prisma.extended.invoice.create({
      data: {
        number,
        quoteId: dto.quoteId || null,
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
      include: { lines: true, quote: true },
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

