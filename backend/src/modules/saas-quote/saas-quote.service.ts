import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingCalculatorService } from '../billing/pricing-calculator.service';
import { AuditLogService } from '../super-admin/audit-log.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import { CreateSaaSQuoteDto, UpdateSaaSQuoteDto } from './dto/saas-quote.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SaaSQuoteService {
  constructor(
    private prisma: PrismaService,
    private pricingCalculator: PricingCalculatorService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Génère un numéro de devis unique et séquentiel de manière transactionnelle
   */
  private async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.withoutTenantScope(async (c) => c.saaSQuote.count());
    return `SQ-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Création d'un devis commercial SaaS Super Admin avec recalcul serveur strict
   */
  async create(dto: CreateSaaSQuoteDto) {
    // Si tenantId fourni, vérification de l'existence réelle du tenant
    if (dto.tenantId) {
      const tenantExists = await this.prisma.withoutTenantScope(async (c) =>
        c.tenant.findUnique({ where: { id: dto.tenantId } }),
      );
      if (!tenantExists) {
        throw new NotFoundException(`Tenant avec l'ID '${dto.tenantId}' introuvable.`);
      }
    }

    const number = await this.generateQuoteNumber();
    const pricing = await this.pricingCalculator.calculatePrice(dto.durationMonths);

    const subtotal = new Prisma.Decimal(pricing.grossAmount);
    const calculatedDiscount = new Prisma.Decimal(pricing.savingsAmount);
    const customDiscount = dto.customDiscount ? new Prisma.Decimal(dto.customDiscount) : new Prisma.Decimal(0);
    const discount = calculatedDiscount.add(customDiscount);

    const tax = dto.customTax ? new Prisma.Decimal(dto.customTax) : new Prisma.Decimal(0);
    const total = subtotal.sub(discount).add(tax);

    if (total.lessThan(0)) {
      throw new BadRequestException('Le montant total du devis ne peut pas être négatif.');
    }

    const validityDays = dto.validityDays || 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const quote = await this.prisma.withoutTenantScope(async (c) =>
      c.saaSQuote.create({
        data: {
          quoteNumber: number,
          tenantId: dto.tenantId || null,
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          clientPhone: dto.clientPhone || null,
          planName: dto.planName || 'Tarif Pro UEMOA',
          durationMonths: dto.durationMonths,
          subtotal,
          discount,
          tax,
          total,
          currency: pricing.currency || 'XOF',
          status: 'DRAFT',
          validUntil,
          notes: dto.notes || null,
        },
      }),
    );

    await this.auditLogService.record({
      action: 'SAAS_QUOTE_CREATED',
      resourceType: 'SAAS_QUOTE',
      resourceId: quote.id,
      tenantId: quote.tenantId || undefined,
      result: 'SUCCESS',
      metadata: { quoteNumber: quote.quoteNumber, total: quote.total.toNumber() },
    });

    return quote;
  }

  /**
   * Recherche paginée et filtrée avec isolation Fail-Closed
   */
  async findAll(query: {
    page?: number;
    limit?: number;
    tenantId?: string;
    status?: string;
    search?: string;
  }) {
    const store = TenantContextService.getStore();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 🔒 ISOLATION TENANT STRICTE
    if (!store?.isSuperAdmin) {
      if (!store?.tenantId) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      where.tenantId = store.tenantId; // Le tenant ne voit QUE ses devis
    } else if (query.tenantId) {
      where.tenantId = query.tenantId;
    }

    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { quoteNumber: { contains: query.search, mode: 'insensitive' } },
        { clientName: { contains: query.search, mode: 'insensitive' } },
        { clientEmail: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.withoutTenantScope(async (c) =>
      Promise.all([
        c.saaSQuote.findMany({
          where,
          include: { tenant: { select: { id: true, code: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        c.saaSQuote.count({ where }),
      ]),
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const store = TenantContextService.getStore();
    const quote = await this.prisma.withoutTenantScope(async (c) =>
      c.saaSQuote.findUnique({
        where: { id },
        include: { tenant: { select: { id: true, code: true, name: true } } },
      }),
    );

    if (!quote) throw new NotFoundException(`Devis SaaS '${id}' introuvable.`);

    // 🔒 SÉCURITÉ FAIL-CLOSED : Un tenant ne peut pas lire le devis d'un autre tenant
    if (!store?.isSuperAdmin && quote.tenantId !== store?.tenantId) {
      throw new ForbiddenException('Accès refusé à ce devis commercial.');
    }

    return quote;
  }

  /**
   * Transition de statut avec contrôle strict du cycle de vie
   */
  async updateStatus(id: string, newStatus: string) {
    const quote = await this.findOne(id);

    // Transitions interdites
    if (quote.status === 'CONVERTED') {
      throw new BadRequestException('Un devis déjà converti est immuable et ne peut pas être modifié.');
    }
    if (quote.status === 'ACCEPTED' && newStatus === 'DRAFT') {
      throw new BadRequestException('Un devis accepté ne peut pas être repassé en brouillon.');
    }

    // Détection automatique d'expiration lors de l'acceptation
    if (newStatus === 'ACCEPTED' && new Date() > new Date(quote.validUntil)) {
      await this.prisma.withoutTenantScope(async (c) =>
        c.saaSQuote.update({ where: { id }, data: { status: 'EXPIRED' } }),
      );
      throw new BadRequestException('Ce devis a expiré et ne peut plus être accepté.');
    }

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.saaSQuote.update({
        where: { id },
        data: { status: newStatus },
      }),
    );

    await this.auditLogService.record({
      action: `SAAS_QUOTE_${newStatus}`,
      resourceType: 'SAAS_QUOTE',
      resourceId: updated.id,
      tenantId: updated.tenantId || undefined,
      result: 'SUCCESS',
      metadata: { previousStatus: quote.status, newStatus },
    });

    return updated;
  }

  /**
   * Conversion idempotente d'un devis accepté en abonnement et activation du Tenant
   */
  async convertToSubscription(id: string) {
    const quote = await this.findOne(id);

    if (quote.status === 'CONVERTED') {
      throw new ConflictException('Ce devis a déjà été converti en abonnement.');
    }

    if (quote.status !== 'ACCEPTED' && quote.status !== 'SENT' && quote.status !== 'DRAFT') {
      throw new BadRequestException(`Impossible de convertir un devis au statut '${quote.status}'.`);
    }

    const now = new Date();
    const subscriptionEndsAt = new Date(now);
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + quote.durationMonths);

    return this.prisma.$transaction(async (tx) => {
      let targetTenantId = quote.tenantId;

      // Si prospect sans tenantId, on vérifie si un tenant existe par code ou email
      if (!targetTenantId) {
        const existingTenant = await tx.tenant.findFirst({ where: { email: quote.clientEmail } });
        if (existingTenant) {
          targetTenantId = existingTenant.id;
        }
      }

      // Mise à jour du statut du devis à CONVERTED (Verrouillage immuable)
      const updatedQuote = await tx.saaSQuote.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          tenantId: targetTenantId || quote.tenantId,
        },
      });

      // Activation / Prolongation de l'abonnement du tenant si présent
      if (targetTenantId) {
        await tx.tenant.update({
          where: { id: targetTenantId },
          data: {
            billingStatus: 'ACTIVE',
            subscriptionEndsAt,
          },
        });
      }

      await this.auditLogService.record({
        action: 'SAAS_QUOTE_CONVERTED',
        resourceType: 'SAAS_QUOTE',
        resourceId: id,
        tenantId: targetTenantId || undefined,
        result: 'SUCCESS',
        metadata: { durationMonths: quote.durationMonths, subscriptionEndsAt },
      });

      return {
        success: true,
        message: 'Devis SaaS converti en abonnement avec succès !',
        quote: updatedQuote,
        subscriptionEndsAt,
      };
    });
  }

  /**
   * Mise à jour d'un devis
   */
  async update(id: string, dto: UpdateSaaSQuoteDto) {
    const quote = await this.findOne(id);
    if (quote.status === 'CONVERTED') {
      throw new BadRequestException('Un devis déjà converti est immuable et ne peut pas être modifié.');
    }

    const pricing = await this.pricingCalculator.calculatePrice(dto.durationMonths || quote.durationMonths);

    const subtotal = new Prisma.Decimal(pricing.grossAmount);
    const calculatedDiscount = new Prisma.Decimal(pricing.savingsAmount);
    const customDiscount = dto.customDiscount !== undefined ? new Prisma.Decimal(dto.customDiscount) : quote.discount;
    const discount = customDiscount; // Simplify for now based on UI which sends raw discount
    
    // In UI we just calculate total = subtotal - discount
    // Just reuse the DTO values if present, otherwise recalculate
    const finalSubtotal = dto.durationMonths ? subtotal : quote.subtotal;
    const finalDiscount = dto.customDiscount !== undefined ? customDiscount : quote.discount;
    const finalTotal = finalSubtotal.sub(finalDiscount);

    if (finalTotal.lessThan(0)) {
      throw new BadRequestException('Le montant total du devis ne peut pas être négatif.');
    }

    const updated = await this.prisma.withoutTenantScope(async (c) =>
      c.saaSQuote.update({
        where: { id },
        data: {
          clientName: dto.clientName !== undefined ? dto.clientName : quote.clientName,
          clientEmail: dto.clientEmail !== undefined ? dto.clientEmail : quote.clientEmail,
          clientPhone: dto.clientPhone !== undefined ? dto.clientPhone : quote.clientPhone,
          planName: dto.planName !== undefined ? dto.planName : quote.planName,
          durationMonths: dto.durationMonths !== undefined ? dto.durationMonths : quote.durationMonths,
          subtotal: finalSubtotal,
          discount: finalDiscount,
          total: finalTotal,
          notes: dto.notes !== undefined ? dto.notes : quote.notes,
        },
      })
    );

    return updated;
  }

  /**
   * Suppression d'un devis
   */
  async remove(id: string) {
    const quote = await this.findOne(id);
    if (quote.status === 'CONVERTED') {
      throw new BadRequestException('Impossible de supprimer un devis converti en abonnement.');
    }
    
    await this.prisma.withoutTenantScope(async (c) =>
      c.saaSQuote.delete({ where: { id } })
    );

    return { success: true, message: 'Devis supprimé avec succès' };
  }
}
