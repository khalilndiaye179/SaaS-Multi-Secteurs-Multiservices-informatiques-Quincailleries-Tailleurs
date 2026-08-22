import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

export interface CreateNotificationDto {
  tenantId?: string | null;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await (this.prisma as any).notification.create({
      data: {
        tenantId: dto.tenantId ?? null,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link ?? null,
        metadata: dto.metadata ?? null,
      },
    });

    // Envoi d'email asynchrone (ne bloque pas l'exécution)
    this.sendEmailNotification(dto).catch(err => console.error('Email failed:', err));

    return notification;
  }

  private async sendEmailNotification(dto: CreateNotificationDto) {
    let toEmail = process.env.ADMIN_EMAIL || 'admin@saas-uemoa.com'; // Default to admin
    
    // S'il y a un tenant, on récupère son email
    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
      if (tenant && tenant.email) {
        toEmail = tenant.email;
      } else {
        // Le tenant n'a pas d'email, on ne peut pas envoyer à lui
        // Sauf si c'est une notif pour l'admin, ce qui se base sur le type
        if (dto.type !== 'PAYMENT_PENDING' && dto.type !== 'NEW_TENANT') {
           return; 
        }
      }
    }

    // Définir le contenu en fonction du type de notification
    if (['PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'PAYMENT_PENDING', 'SUBSCRIPTION_EXPIRING', 'NEW_TENANT'].includes(dto.type)) {
      await this.emailService.sendEmail(
        toEmail,
        dto.title,
        dto.message,
        `<div style="font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:5px;">
           <h2 style="color:#312E81;">${dto.title}</h2>
           <p>${dto.message}</p>
           ${dto.link ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}${dto.link}" style="background:#312E81;color:white;padding:10px 15px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:10px;">Voir les détails</a>` : ''}
         </div>`
      );
    }
  }

  async getForSuperAdmin(limit = 50) {
    return (this.prisma as any).notification.findMany({
      where: { tenantId: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getForTenant(tenantId: string, limit = 50) {
    return (this.prisma as any).notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCountSuperAdmin(): Promise<number> {
    return (this.prisma as any).notification.count({
      where: { tenantId: null, isRead: false },
    });
  }

  async getUnreadCountTenant(tenantId: string): Promise<number> {
    return (this.prisma as any).notification.count({
      where: { tenantId, isRead: false },
    });
  }

  async markAsRead(id: string) {
    return (this.prisma as any).notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsReadSuperAdmin() {
    return (this.prisma as any).notification.updateMany({
      where: { tenantId: null, isRead: false },
      data: { isRead: true },
    });
  }

  async markAllAsReadTenant(tenantId: string) {
    return (this.prisma as any).notification.updateMany({
      where: { tenantId, isRead: false },
      data: { isRead: true },
    });
  }
}
