const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rolesData = {
  'QNC-0001': [
    { name: 'CAISSIER', desc: 'Gestion des ventes et de la caisse', perms: ['sales:read', 'sales:write', 'stock:read'] },
    { name: 'MAGASINIER', desc: 'Gestion des stocks et inventaires', perms: ['stock:read', 'stock:write'] }
  ],
  'ITS-0001': [
    { name: 'TECHNICIEN', desc: 'Réparation et gestion des tickets techniques', perms: ['tickets:read', 'tickets:write'] },
    { name: 'RECEPTIONNISTE', desc: 'Accueil client et création de tickets', perms: ['tickets:read', 'tickets:write'] }
  ],
  'TLR-0001': [
    { name: 'COUTURIER', desc: 'Confection et suivi des commandes', perms: ['measurements:read', 'orders:read', 'orders:write'] },
    { name: 'COMMERCIAL', desc: 'Prise de mesures et relation client', perms: ['measurements:read', 'measurements:write', 'orders:read', 'orders:write'] }
  ]
};

async function seedRoles() {
  console.log("Démarrage de la création des rôles Collaborateurs...");

  for (const [tenantCode, roles] of Object.entries(rolesData)) {
    try {
      await prisma.$transaction(async (tx) => {
        // Bypass RLS
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '__SYSTEM_GLOBAL_SUPERADMIN__', true)`);

        const tenant = await tx.tenant.findUnique({ where: { code: tenantCode } });
        if (!tenant) throw new Error(`Tenant ${tenantCode} introuvable`);

        for (const roleDef of roles) {
          // 1. Vérifier si le rôle existe
          let role = await tx.role.findFirst({
            where: { tenantId: tenant.id, name: roleDef.name }
          });

          if (!role) {
            role = await tx.role.create({
              data: {
                tenantId: tenant.id,
                name: roleDef.name,
                description: roleDef.desc
              }
            });
            console.log(`✅ Rôle ${roleDef.name} créé pour le tenant ${tenantCode}`);
          } else {
             console.log(`ℹ️ Le Rôle ${roleDef.name} existe déjà pour ${tenantCode}`);
          }

          // 2. Récupérer les identifiants de permissions
          const perms = await tx.permission.findMany({
            where: { code: { in: roleDef.perms } }
          });

          // 3. Assigner les permissions
          for (const p of perms) {
            const rpExists = await tx.rolePermission.findFirst({
              where: { roleId: role.id, permissionId: p.id }
            });
            if (!rpExists) {
              await tx.rolePermission.create({
                data: { roleId: role.id, permissionId: p.id }
              });
            }
          }
        }
      });
    } catch (e) {
      console.log(`❌ Erreur pour ${tenantCode}:`, e.message);
    }
  }
}

seedRoles()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
