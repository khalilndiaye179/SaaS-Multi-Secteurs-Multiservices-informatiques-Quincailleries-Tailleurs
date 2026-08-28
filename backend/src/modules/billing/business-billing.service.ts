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

    let validUntil: Date | null = null;
    if (dto.validityDuration) {
      const days = parseInt(dto.validityDuration as any, 10);
      if (!isNaN(days) && days > 0) {
        validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + days);
      }
    }

    return this.prisma.extended.quote.create({
      data: {
        number,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        clientEmail: dto.clientEmail,
        notes: dto.notes,
        totalAmount,
        status: 'DRAFT',
        validUntil,
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

  async updateInvoiceStatus(id: string, status: string) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    const invoice = await this.prisma.extended.invoice.findFirst({
      where: { id },
      include: { lines: true },
    });

    if (!invoice) throw new NotFoundException('Facture introuvable.');

    if (status === 'PAID' && invoice.status !== 'PAID') {
      return this.prisma.extended.$transaction(async (tx) => {
        // 1. Mettre à jour le statut de la facture
        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: { status },
        });

        // 2. Déduire le stock pour chaque ligne associée à un article
        for (const line of invoice.lines) {
          if (line.stockItemId) {
            await tx.stockItem.update({
              where: { id: line.stockItemId },
              data: {
                quantity: {
                  decrement: line.quantity,
                },
              },
            });

            // 3. Tracer le mouvement
            await tx.stockMovement.create({
              data: {
                stockItemId: line.stockItemId,
                type: 'OUT',
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                reason: `Facture payée ${invoice.number}`,
              } as any,
            });
          }
        }

        return updatedInvoice;
      });
    }

    // Mise à jour classique (ex: CANCELLED)
    return this.prisma.extended.invoice.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async registerPayment(id: string, amount: number, method: string = 'CASH', reference?: string, notes?: string) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    const invoice = await this.prisma.extended.invoice.findFirst({
      where: { id },
      include: { lines: true },
    });

    if (!invoice) throw new NotFoundException('Facture introuvable.');

    const newPaidAmount = (invoice.paidAmount || 0) + amount;
    const isFullyPaid = newPaidAmount >= invoice.totalAmount;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    return this.prisma.extended.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus as any,
        },
      });

      // 1. Enregistrer l'historique du paiement
      await tx.paymentInstallment.create({
        data: {
          tenantId,
          invoiceId: id,
          amount,
          method,
          reference,
          notes,
        },
      });

      // 2. Si la facture devient totalement payée pour la première fois, on déduit les stocks
      if (isFullyPaid && invoice.status !== 'PAID') {
        for (const line of invoice.lines) {
          if (line.stockItemId) {
            await tx.stockItem.update({
              where: { id: line.stockItemId },
              data: {
                quantity: {
                  decrement: line.quantity,
                },
              },
            });

            await tx.stockMovement.create({
              data: {
                stockItemId: line.stockItemId,
                type: 'OUT',
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                reason: `Facture payée ${invoice.number}`,
              } as any,
            });
          }
        }
      }

      return updatedInvoice;
    });
  }

  async getInvoicePayments(invoiceId: string) {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) throw new ForbiddenException('Contexte tenant manquant');

    return this.prisma.extended.paymentInstallment.findMany({
      where: { tenantId, invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }
}

