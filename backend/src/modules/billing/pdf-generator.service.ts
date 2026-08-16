import { Injectable, NotFoundException } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';

@Injectable()
export class PdfGeneratorService {
  constructor(private prisma: PrismaService) {}

  private async getTenantHeader() {
    const tenantId = TenantContextService.getTenantId();
    if (!tenantId) return null;
    return this.prisma.withoutTenantScope((client) =>
      client.tenant.findUnique({ where: { id: tenantId } }),
    );
  }

  private buildDocument(
    doc: PDFKit.PDFDocument,
    tenant: { name: string; code: string; phone?: string | null; email?: string | null } | null,
    title: string,
    document: {
      number: string;
      clientName: string;
      clientPhone?: string | null;
      clientEmail?: string | null;
      totalAmount: number;
      paidAmount?: number;
      createdAt: Date;
      lines: { description: string; quantity: number; unitPrice: number; vatRate?: number | null; totalPrice: number }[];
    },
  ) {
    doc.fontSize(16).text(tenant?.name ?? 'Entreprise', { continued: false });
    doc.fontSize(9).fillColor('gray');
    if (tenant?.code) doc.text(`Code: ${tenant.code}`);
    if (tenant?.phone) doc.text(`Tél: ${tenant.phone}`);
    if (tenant?.email) doc.text(`Email: ${tenant.email}`);
    doc.moveDown();

    doc.fillColor('black').fontSize(14).text(`${title} ${document.number}`, { underline: true });
    doc.fontSize(10).text(`Date: ${document.createdAt.toLocaleDateString('fr-FR')}`);
    doc.moveDown(0.5);

    doc.fontSize(11).text(`Client: ${document.clientName}`);
    if (document.clientPhone) doc.fontSize(9).text(`Tél: ${document.clientPhone}`);
    if (document.clientEmail) doc.fontSize(9).text(`Email: ${document.clientEmail}`);
    doc.moveDown();

    doc.fontSize(9).fillColor('black');
    const startY = doc.y;
    doc.text('Description', 50, startY, { width: 200 });
    doc.text('Qté', 250, startY, { width: 50 });
    doc.text('Prix unit.', 300, startY, { width: 80 });
    doc.text('TVA', 380, startY, { width: 50 });
    doc.text('Total', 430, startY, { width: 100 });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    for (const line of document.lines) {
      const y = doc.y;
      doc.text(line.description, 50, y, { width: 200 });
      doc.text(String(line.quantity), 250, y, { width: 50 });
      doc.text(`${line.unitPrice.toLocaleString('fr-FR')} XOF`, 300, y, { width: 80 });
      doc.text(`${line.vatRate ?? 18}%`, 380, y, { width: 50 });
      doc.text(`${line.totalPrice.toLocaleString('fr-FR')} XOF`, 430, y, { width: 100 });
      doc.moveDown();
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total: ${document.totalAmount.toLocaleString('fr-FR')} XOF`, { align: 'right' });
    if (document.paidAmount && document.paidAmount > 0) {
      const solde = document.totalAmount - document.paidAmount;
      doc.fontSize(10).fillColor('#059669').text(`Payé: ${document.paidAmount.toLocaleString('fr-FR')} XOF`, { align: 'right' });
      doc.fillColor(solde > 0 ? '#DC2626' : '#059669').text(`Solde restant: ${solde.toLocaleString('fr-FR')} XOF`, { align: 'right' });
      doc.fillColor('black');
    }
  }

  async generateQuotePdf(quoteId: string): Promise<Buffer> {
    const quote = await this.prisma.extended.quote.findFirst({
      where: { id: quoteId },
      include: { lines: true },
    });
    if (!quote) throw new NotFoundException('Devis introuvable.');

    const tenant = await this.getTenantHeader();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.buildDocument(doc, tenant, 'DEVIS', quote as any);
      doc.end();
    });
  }

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.extended.invoice.findFirst({
      where: { id: invoiceId },
      include: { lines: true },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable.');

    const tenant = await this.getTenantHeader();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.buildDocument(doc, tenant, 'FACTURE', { ...invoice, paidAmount: invoice.paidAmount } as any);
      doc.end();
    });
  }
}
