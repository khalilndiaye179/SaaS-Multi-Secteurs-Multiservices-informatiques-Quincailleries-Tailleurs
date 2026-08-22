import { Injectable, OnModuleInit, OnModuleDestroy, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../core/tenant/tenant-context.service';

const TENANT_SCOPED_MODELS = ['StockItem', 'RepairTicket', 'ClientMeasurement', 'User', 'Quote', 'Invoice', 'StockMovement', 'TailleurOrder', 'PurchaseOrder', 'InventorySession'];




@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public extended: ReturnType<typeof this.createExtendedClient>;

  constructor() {
    const isTest = process.env.NODE_ENV === 'test';
    const testUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    const dbUrl = isTest ? testUrl : process.env.DATABASE_URL;

    if (!dbUrl) {
      throw new Error("DATABASE_URL manquante — vérifiez votre fichier .env");
    }

    console.log('🔍 PRISMA: connexion a la base ' + (isTest ? 'TEST' : 'PRODUCTION/DEV'));

    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    this.extended = this.createExtendedClient();
  }



  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private createExtendedClient() {
    const self = this;
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const store = TenantContextService.getStore();
            const isTenantScoped = model && TENANT_SCOPED_MODELS.includes(model);

            if (isTenantScoped) {
              const isBypass = store?.isSuperAdmin || store?.isSystemContext;

              if (!isBypass && !store?.tenantId) {
                throw new ForbiddenException(
                  `SECURITY ERROR (FAIL-CLOSED): Attempted execution on tenant-scoped model '${model}' without tenantId in context.`,
                );
              }

              if (!isBypass && store?.tenantId) {
                const tenantId = store.tenantId;

                switch (operation) {
                  case 'findUnique':
                  case 'findUniqueOrThrow':
                  case 'findFirst':
                  case 'findFirstOrThrow':
                  case 'findMany':
                  case 'count':
                  case 'aggregate':
                  case 'groupBy':
                  case 'update':
                  case 'updateMany':
                  case 'delete':
                  case 'deleteMany': {
                    const opArgs = (args || {}) as { where?: Record<string, unknown> };
                    opArgs.where = { ...opArgs.where, tenantId };
                    break;
                  }
                  case 'create': {
                    const createArgs = (args || {}) as { data: Record<string, unknown> };
                    createArgs.data = { ...createArgs.data, tenantId };
                    break;
                  }
                  case 'createMany': {
                    const createManyArgs = (args || {}) as { data: Record<string, unknown> | Record<string, unknown>[] };
                    if (Array.isArray(createManyArgs.data)) {
                      createManyArgs.data = createManyArgs.data.map((item) => ({ ...item, tenantId }));
                    } else if (createManyArgs.data) {
                      createManyArgs.data = { ...createManyArgs.data, tenantId };
                    }
                    break;
                  }
                  default:
                    break;
                }

                // Exécution dans une transaction interactive locale pour lier la variable de session PostgreSQL et la requête de l'ORM sur la même connexion physique
                return self.$transaction(async (tx) => {
                  await tx.$executeRawUnsafe(
                    `SELECT set_config('app.current_tenant_id', '${tenantId}', true)`
                  );
                  const modelName = model ? model.charAt(0).toLowerCase() + model.slice(1) : null;
                  if (modelName && (tx as any)[modelName] && typeof (tx as any)[modelName][operation] === 'function') {
                    return (tx as any)[modelName][operation](args);
                  }
                  return query(args);
                }, process.env.NODE_ENV === 'test' ? { maxWait: 20000, timeout: 20000 } : undefined);
              }
            }

            return query(args);
          },
        },
      },
    });
  }




  // Wrapper explicite pour contourner le scope tenant (SUPER_ADMIN / CRON / SEED)
  async withoutTenantScope<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return TenantContextService.runWithSystemContext(async () => {
      return this.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_tenant_id', '__SYSTEM_GLOBAL_SUPERADMIN__', true)`
        );
        return callback(tx as unknown as PrismaClient);
      });
    });
  }
}

