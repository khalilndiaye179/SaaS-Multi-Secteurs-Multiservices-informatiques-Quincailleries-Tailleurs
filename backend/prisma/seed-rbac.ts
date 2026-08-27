const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding RBAC...');

  // 1. Définir les permissions transverses (système)
  const permissionsData = [
    // COMMUN
    { code: 'admin:about:read', description: 'Accéder aux informations système' },
    { code: 'admin:notifications:read', description: 'Lire les notifications globales' },
    // SUPPORT
    { code: 'admin:tenants:read', description: 'Lire la liste des tenants' },
    { code: 'admin:notifications:send', description: 'Envoyer des notifications globales' },
    { code: 'admin:tickets:read', description: 'Lire les tickets de support' },
    // FINANCE
    { code: 'admin:payments:read', description: 'Lire les paiements et preuves' },
    { code: 'admin:payments:approve', description: 'Approuver ou rejeter les paiements' },
    { code: 'admin:invoices:read', description: 'Lire les factures' },
    { code: 'admin:quotes:read', description: 'Lire les devis SaaS' },
    { code: 'admin:finance:export', description: 'Exporter les données financières' },
    // TECHNIQUE
    { code: 'admin:metrics:read', description: 'Lire les métriques et statistiques' },
    { code: 'admin:logs:read', description: 'Lire les journaux d\'audit' },
    { code: 'admin:integrations:manage', description: 'Gérer les intégrations système' },
    // SUPER_ADMIN (exclusif)
    { code: 'admin:team:manage', description: 'Gérer l\'équipe Super Admin' },
    { code: 'admin:collaborators:manage', description: 'Gérer les collaborateurs' },
  ];

  // 2. Insérer les permissions s'ils n'existent pas
  console.log('🔄 Upsert des permissions...');
  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: { code: p.code, description: p.description },
    });
  }

  // 3. Définir les rôles et leur mapping
  const rolesMapping = {
    'SUPPORT': [
      'admin:about:read',
      'admin:notifications:read',
      'admin:tenants:read',
      'admin:notifications:send',
      'admin:tickets:read'
    ],
    'FINANCE': [
      'admin:about:read',
      'admin:notifications:read',
      'admin:tenants:read',
      'admin:payments:read',
      'admin:payments:approve',
      'admin:invoices:read',
      'admin:quotes:read',
      'admin:finance:export'
    ],
    'TECHNIQUE': [
      'admin:about:read',
      'admin:notifications:read',
      'admin:metrics:read',
      'admin:logs:read',
      'admin:integrations:manage',
      'admin:tenants:read' // Technique a souvent besoin de lire les tenants aussi
    ],
    'SUPER_ADMIN': permissionsData.map(p => p.code) // Le SUPER_ADMIN reçoit tout
  };

  // 4. Insérer les Rôles globaux (findFirst + create)
  console.log('🔄 Mapping des Rôles Système...');
  for (const [roleName, perms] of Object.entries(rolesMapping)) {
    let role = await prisma.role.findFirst({
      where: { name: roleName, tenantId: null }
    });

    if (!role) {
      console.log(`Création du rôle: ${roleName}`);
      role = await prisma.role.create({
        data: {
          name: roleName,
          description: `Rôle système global: ${roleName}`,
          // tenantId est explicitement omis -> null (système global)
        }
      });
    }

    // Associer les permissions (findFirst + create pour RolePermission)
    for (const pCode of perms) {
      const permission = await prisma.permission.findUnique({ where: { code: pCode } });
      if (permission) {
        let rolePerm = await prisma.rolePermission.findFirst({
          where: { roleId: role.id, permissionId: permission.id }
        });

        if (!rolePerm) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }
    }
  }

  console.log('✅ Seeding RBAC terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding RBAC:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
