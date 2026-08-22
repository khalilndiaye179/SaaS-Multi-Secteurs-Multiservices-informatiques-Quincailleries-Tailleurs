import { Controller, Post, Get, Body, Query, Res, Req, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { PublicDocumentsService } from './public-documents.service';
import { Public } from '../../core/auth/public.decorator';

export class CreateShareTokenDto {
  documentType: 'DEVIS' | 'FACTURE' | 'TICKET_SAV' | 'BON_COMMANDE' | 'FICHE_ESSAYAGE';
  documentId: string;
}

@Controller('public/documents')
export class PublicDocumentsController {
  constructor(private readonly publicDocumentsService: PublicDocumentsService) {}

  /**
   * Route authentifiée : Génère un lien de partage sécurisé pour un document
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('share-token')
  async createShareToken(@Req() req: any, @Body() dto: CreateShareTokenDto) {
    const tenantId = req.user?.tenantId;
    return this.publicDocumentsService.generateShareToken(dto.documentType, dto.documentId, tenantId);
  }

  /**
   * Route publique non-authentifiée : Télécharge le PDF sécurisé par jeton JWT (7 jours)
   */
  @Public()
  @Get('view/pdf')
  async viewPublicPdf(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    const { buffer, filename } = await this.publicDocumentsService.generatePublicPdf(token);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });

    return res.send(buffer);
  }
}
