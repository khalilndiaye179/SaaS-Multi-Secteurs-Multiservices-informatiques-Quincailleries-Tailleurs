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
import { TenantContextMiddleware } from './core/tenant/tenant-context.middleware';
import { TenantGuard } from './core/tenant/tenant.guard';
import { BillingStatusGuard } from './core/auth/billing-status.guard';
import { SubscriptionExpirationCron } from './core/billing/subscription-expiration.cron';

import { BusinessBillingModule } from './modules/billing/business-billing.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    QuincaillerieStockModule,
    ITMultiservicesTicketModule,
    TailleurMeasurementModule,
    SuperAdminDashboardModule,
    BusinessBillingModule,
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


