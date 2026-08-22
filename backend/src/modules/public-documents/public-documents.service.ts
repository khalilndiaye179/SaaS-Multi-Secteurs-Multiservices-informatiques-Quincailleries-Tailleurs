import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfGeneratorService } from '../billing/pdf-generator.service';

export interface DocumentSharePayload {
  documentType: 'DEVIS' | 'FACTURE' | 'TICKET_SAV' | 'BON_COMMANDE' | 'FICHE_ESSAYAGE';
  documentId: string;
  tenantId: string;
  purpose: 'DOCUMENT_SHARE';
}

@Injectable()
export class PublicDocumentsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  /**
   * Génère un jeton JWT d'accès public signé expirant dans 7 jours
   */
  async generateShareToken(
    documentType: 'DEVIS' | 'FACTURE' | 'TICKET_SAV' | 'BON_COMMANDE' | 'FICHE_ESSAYAGE',
    documentId: string,
    tenantId: string,
  ): Promise<{ token: string; shareUrl: string }> {
    const payload: DocumentSharePayload = {
      documentType,
      documentId,
      tenantId,
      purpose: 'DOCUMENT_SHARE',
    };

    const token = this.jwtService.sign(payload, { expiresIn: '7d' });
    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/api/public/documents/view/pdf?token=${token}`;

    return { token, shareUrl };
  }

  /**
   * Valide le jeton et génère le flux binaire PDF correspondant
   */
  async generatePublicPdf(token: string): Promise<{ buffer: Buffer; filename: string }> {
    let payload: DocumentSharePayload;
    try {
      payload = this.jwtService.verify<DocumentSharePayload>(token);
    } catch {
      throw new UnauthorizedException('Lien de partage invalide ou expiré (limité à 7 jours).');
    }

    if (payload.purpose !== 'DOCUMENT_SHARE') {
      throw new UnauthorizedException('Jeton de partage non autorisé.');
    }

    const { documentType, documentId, tenantId } = payload;

    if (documentType === 'DEVIS') {
      const quote = await this.prisma.withoutTenantScope((client) =>
        client.quote.findFirst({ where: { id: documentId, tenantId } }),
      );
      if (!quote) throw new NotFoundException('Devis introuvable.');
      const buffer = await this.pdfGenerator.generateQuotePdf(documentId);
      return { buffer, filename: `devis-${quote.number}.pdf` };
    } else if (documentType === 'FACTURE') {
      const invoice = await this.prisma.withoutTenantScope((client) =>
        client.invoice.findFirst({ where: { id: documentId, tenantId } }),
      );
      if (!invoice) throw new NotFoundException('Facture introuvable.');
      const buffer = await this.pdfGenerator.generateInvoicePdf(documentId);
      return { buffer, filename: `facture-${invoice.number}.pdf` };
    } else if (documentType === 'BON_COMMANDE') {
      const order = await this.prisma.withoutTenantScope((client) =>
        client.tailleurOrder.findFirst({ where: { id: documentId, tenantId } }),
      );
      if (!order) throw new NotFoundException('Commande couture introuvable.');
      if (order.invoiceId) {
        const buffer = await this.pdfGenerator.generateInvoicePdf(order.invoiceId);
        return { buffer, filename: `bon-commande-${order.orderNumber}.pdf` };
      }
    } else if (documentType === 'TICKET_SAV') {
      const ticket = await this.prisma.withoutTenantScope((client) =>
        client.repairTicket.findFirst({ where: { id: documentId, tenantId } }),
      );
      if (!ticket) throw new NotFoundException('Ticket SAV introuvable.');
    }

    // Fallback invoice pdf generator
    try {
      const buffer = await this.pdfGenerator.generateInvoicePdf(documentId);
      return { buffer, filename: `document-${documentId}.pdf` };
    } catch {
      throw new NotFoundException('Document PDF non trouvé ou indisponible.');
    }
  }
}
