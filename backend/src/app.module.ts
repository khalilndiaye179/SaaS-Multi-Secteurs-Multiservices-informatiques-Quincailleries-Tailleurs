import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './core/auth/auth.module';
import { SeedService } from './core/seed.service';
import { QuincaillerieStockModule } from './modules/quincaillerie/quincaillerie-stock.module';
import { ITMultiservicesTicketModule } from './modules/multiservices-it/it-ticket.module';
import { TailleurMeasurementModule } from './modules/tailleur/tailleur-measurement.module';
import { SuperAdminDashboardModule } from './modules/super-admin/super-admin.module';
import { SuperAdminAuditModule } from './modules/super-admin/super-admin-audit.module';
import { PaymentProviderModule } from './modules/payment-provider/payment-provider.module';
import { SmsProviderModule } from './modules/sms-provider/sms-provider.module';
import { SaaSQuoteModule } from './modules/saas-quote/saas-quote.module';
import { SuperAdminBillingModule } from './modules/super-admin/super-admin-billing.module';
import { SuperAdminAnalyticsModule } from './modules/super-admin/super-admin-analytics.module';
import { SuperAdminTeamModule } from './modules/super-admin/super-admin-team.module';
import { SecurityCenterModule } from './modules/super-admin/security-center.module';
import { AboutModule } from './modules/super-admin/about.module';
import { TenantContextMiddleware } from './core/tenant/tenant-context.middleware';
import { TenantGuard } from './core/tenant/tenant.guard';
import { BillingStatusGuard } from './core/auth/billing-status.guard';
import { SubscriptionExpirationCron } from './core/billing/subscription-expiration.cron';

import { BusinessBillingModule } from './modules/billing/business-billing.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { PublicDocumentsModule } from './modules/public-documents/public-documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TenantRbacModule } from './modules/tenant-rbac/tenant-rbac.module';
import { CrmModule } from './modules/crm/crm.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    QuincaillerieStockModule,
    ITMultiservicesTicketModule,
    TailleurMeasurementModule,
    SuperAdminDashboardModule,
    SuperAdminAuditModule,
    PaymentProviderModule,
    SmsProviderModule,
    SaaSQuoteModule,
    SuperAdminBillingModule,
    SuperAdminAnalyticsModule,
    SuperAdminTeamModule,
    SecurityCenterModule,
    AboutModule,
    BusinessBillingModule,
    AiAssistantModule,
    PublicDocumentsModule,
    NotificationsModule,
    TenantRbacModule,
  ],









  providers: [
    SeedService,
    SubscriptionExpirationCron,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BillingStatusGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}


