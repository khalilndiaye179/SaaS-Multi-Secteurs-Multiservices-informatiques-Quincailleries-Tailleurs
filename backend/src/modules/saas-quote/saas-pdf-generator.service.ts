import { Injectable, NotFoundException } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SaaSPdfGeneratorService {
  constructor(private prisma: PrismaService) {}

  private buildSaaSQuoteDocument(
    doc: PDFKit.PDFDocument,
    quote: {
      quoteNumber: string;
      clientName: string;
      clientPhone?: string | null;
      clientEmail?: string | null;
      planName: string;
      durationMonths: number;
      subtotal: any;
      discount: any;
      tax: any;
      total: any;
      currency: string;
      createdAt: Date;
      validUntil: Date;
    },
  ) {
    // En-tête de l'entreprise KPSyDesk (Super Admin)
    doc.fontSize(18).fillColor('#312E81').text('KPSyDesk Suite - Door Waar', { continued: false });
    doc.fontSize(10).fillColor('gray');
    doc.text('Avenue Cheikh Anta Diop, Dakar - Sénégal');
    doc.text('Tél: +221 77 123 45 67 | Email: contact@kpsydesk.sn');
    doc.moveDown(2);

    // Titre du Document
    doc.fillColor('black').fontSize(16).text(`DEVIS COMMERCIAL SAAS : ${quote.quoteNumber}`, { underline: true });
    doc.fontSize(10).text(`Date d'émission : ${quote.createdAt.toLocaleDateString('fr-FR')}`);
    doc.text(`Valable jusqu'au : ${quote.validUntil.toLocaleDateString('fr-FR')}`);
    doc.moveDown(1.5);

    // Informations Client
    doc.fontSize(12).fillColor('#0F172A').text(`Client : ${quote.clientName}`, { underline: true });
    doc.fontSize(10).fillColor('black');
    if (quote.clientPhone) doc.text(`Tél : ${quote.clientPhone}`);
    if (quote.clientEmail) doc.text(`Email : ${quote.clientEmail}`);
    doc.moveDown(2);

    // Tableau des prestations
    const startY = doc.y;
    doc.fontSize(10).fillColor('black').text('Désignation de l\'abonnement', 50, startY, { width: 250 });
    doc.text('Durée', 300, startY, { width: 60 });
    doc.text('Sous-Total', 380, startY, { width: 100 });
    
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(1);

    const lineY = doc.y;
    doc.text(`Licence SaaS : ${quote.planName}`, 50, lineY, { width: 250 });
    doc.text(`${quote.durationMonths} Mois`, 300, lineY, { width: 60 });
    doc.text(`${Number(quote.subtotal).toLocaleString('fr-FR')} ${quote.currency}`, 380, lineY, { width: 100 });
    doc.moveDown(2);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').stroke();
    doc.moveDown(1);

    // Totaux
    doc.fontSize(11);
    const subtotalY = doc.y;
    doc.text('Sous-Total :', 300, subtotalY, { width: 100, align: 'right' });
    doc.text(`${Number(quote.subtotal).toLocaleString('fr-FR')} ${quote.currency}`, 420, subtotalY, { width: 100, align: 'right' });
    
    if (Number(quote.discount) > 0) {
      doc.moveDown(0.5);
      const discountY = doc.y;
      doc.fillColor('#166534').text('Remise Commerciale :', 300, discountY, { width: 100, align: 'right' });
      doc.text(`- ${Number(quote.discount).toLocaleString('fr-FR')} ${quote.currency}`, 420, discountY, { width: 100, align: 'right' });
    }

    doc.moveDown(1);
    doc.rect(300, doc.y, 245, 30).fill('#F8FAFC');
    
    doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold');
    doc.text('Total Net à Payer :', 310, doc.y - 20, { width: 110, align: 'right' });
    doc.text(`${Number(quote.total).toLocaleString('fr-FR')} ${quote.currency}`, 420, doc.y - 20, { width: 100, align: 'right' });

    doc.font('Helvetica');
    doc.moveDown(3);
    
    // Conditions et Signature
    doc.fontSize(9).fillColor('gray').text('Conditions de règlement : Le paiement confirme l\'activation immédiate de l\'espace locataire et l\'acceptation de nos Conditions Générales de Service.', 50, doc.y, { align: 'center', width: 495 });
  }

  async generateSaaSQuotePdf(quoteId: string): Promise<Buffer> {
    const quote = await this.prisma.withoutTenantScope(async (c) =>
      c.saaSQuote.findUnique({
        where: { id: quoteId },
      })
    );
    if (!quote) throw new NotFoundException('Devis SaaS introuvable.');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.buildSaaSQuoteDocument(doc, quote);
      doc.end();
    });
  }
}
