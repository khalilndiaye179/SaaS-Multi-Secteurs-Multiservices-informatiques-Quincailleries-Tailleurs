-- CreateTable
CREATE TABLE "payment_provider_configs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL DEFAULT 'TEST',
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "publicKey" TEXT,
    "encryptedSecret" TEXT,
    "encryptedWebhookSecret" TEXT,
    "callbackUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_provider_configs" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "environment" TEXT NOT NULL DEFAULT 'TEST',
    "senderId" TEXT NOT NULL DEFAULT 'KPSyDesk',
    "apiUrl" TEXT,
    "encryptedSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "tenantId" TEXT,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT,
    "planName" TEXT NOT NULL DEFAULT 'Tarif Pro UEMOA',
    "durationMonths" INTEGER NOT NULL DEFAULT 12,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "tenantId" TEXT,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_analytics" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "deviceType" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "countryCode" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admin_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admin_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_configs_provider_key" ON "payment_provider_configs"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "sms_provider_configs_provider_key" ON "sms_provider_configs"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "saas_quotes_quoteNumber_key" ON "saas_quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "saas_quotes_tenantId_idx" ON "saas_quotes"("tenantId");

-- CreateIndex
CREATE INDEX "saas_quotes_status_idx" ON "saas_quotes"("status");

-- CreateIndex
CREATE INDEX "saas_quotes_createdAt_idx" ON "saas_quotes"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "platform_analytics_createdAt_idx" ON "platform_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "platform_analytics_eventType_idx" ON "platform_analytics"("eventType");

-- CreateIndex
CREATE INDEX "platform_analytics_sessionId_idx" ON "platform_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "platform_analytics_tenantId_idx" ON "platform_analytics"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "super_admin_invitations_tokenHash_key" ON "super_admin_invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "super_admin_invitations_email_idx" ON "super_admin_invitations"("email");

-- CreateIndex
CREATE INDEX "super_admin_invitations_status_idx" ON "super_admin_invitations"("status");

-- AddForeignKey
ALTER TABLE "saas_quotes" ADD CONSTRAINT "saas_quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
