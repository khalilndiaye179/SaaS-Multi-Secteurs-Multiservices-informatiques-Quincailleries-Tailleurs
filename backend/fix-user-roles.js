const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const demos = [
  { username: 'QNC-0001-01', tenantCode: 'QNC-0001' },
  { username: 'ITS-0001-01', tenantCode: 'ITS-0001' },
  { username: 'TLR-0001-01', tenantCode: 'TLR-0001' },
];

async function fixUserRoles() {
  console.log("Démarrage de la vérification et réparation des Rôles Utilisateurs...");

  for (const d of demos) {
    try {
      await prisma.$transaction(async (tx) => {
        // Bypass RLS
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '__SYSTEM_GLOBAL_SUPERADMIN__', true)`);

        const tenant = await tx.tenant.findUnique({ where: { code: d.tenantCode } });
        const user = await tx.user.findUnique({ where: { username: d.username } });
        const adminRole = await tx.role.findFirst({ where: { tenantId: tenant.id, name: 'ADMIN_TENANT' } });

        if (!user || !adminRole) {
          throw new Error(`Utilisateur ou rôle manquant pour ${d.username}`);
        }

        // Vérifier si l'utilisateur possède bien le rôle ADMIN_TENANT
        const userRole = await tx.userRole.findFirst({
          where: { userId: user.id, roleId: adminRole.id }
        });

        if (!userRole) {
          await tx.userRole.create({
            data: { userId: user.id, roleId: adminRole.id }
          });
          console.log(`✅ Rôle ADMIN_TENANT explicitement assigné à ${d.username}`);
        } else {
          console.log(`ℹ️ L'utilisateur ${d.username} avait déjà son rôle assigné.`);
        }
      });
    } catch (e) {
      console.log(`❌ Erreur pour ${d.username}:`, e.message);
    }
  }
}

fixUserRoles()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
