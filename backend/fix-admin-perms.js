const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const demos = [
  { code: 'QNC-0001', sector: 'QUINCAILLERIE' },
  { code: 'ITS-0001', sector: 'MULTISERVICES_IT' },
  { code: 'TLR-0001', sector: 'TAILLEUR' },
];

async function fixAdminPerms() {
  console.log("Démarrage de la réparation des permissions ADMIN_TENANT...");

  for (const d of demos) {
    try {
      await prisma.$transaction(async (tx) => {
        // Bypass RLS
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '__SYSTEM_GLOBAL_SUPERADMIN__', true)`);

        const tenant = await tx.tenant.findUnique({ where: { code: d.code } });
        if (!tenant) throw new Error(`Tenant ${d.code} introuvable`);

        const adminRole = await tx.role.findFirst({
          where: { tenantId: tenant.id, name: 'ADMIN_TENANT' }
        });

        if (!adminRole) throw new Error(`Rôle ADMIN_TENANT introuvable pour ${d.code}`);

        // Récupérer toutes les permissions (Globales + celles du Secteur)
        const perms = await tx.permission.findMany({
          where: {
            OR: [
              { sectorType: null },
              { sectorType: d.sector }
            ]
          }
        });

        console.log(`Attribution de ${perms.length} permissions au rôle ADMIN_TENANT de ${d.code}...`);

        for (const p of perms) {
          const rpExists = await tx.rolePermission.findFirst({
            where: { roleId: adminRole.id, permissionId: p.id }
          });
          if (!rpExists) {
            await tx.rolePermission.create({
              data: { roleId: adminRole.id, permissionId: p.id }
            });
          }
        }
      });
      console.log(`✅ Permissions réparées pour le tenant ${d.code}`);
    } catch (e) {
      console.log(`❌ Erreur pour ${d.code}:`, e.message);
    }
  }
}

fixAdminPerms()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
