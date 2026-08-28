const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const demos = [
  { code: 'QNC-0001', name: 'Quincaillerie Al-Baraka', sector: 'QUINCAILLERIE', email: 'gerant@quincaillerie.sn', username: 'QNC-0001-01' },
  { code: 'ITS-0001', name: 'Multiservices IT Dakar', sector: 'MULTISERVICES_IT', email: 'gerant@multiservices-it.sn', username: 'ITS-0001-01' },
  { code: 'TLR-0001', name: 'Atelier Couture Elegance', sector: 'TAILLEUR', email: 'gerant@couture.sn', username: 'TLR-0001-01' },
];

async function seed() {
  console.log("Démarrage du seeding forcé (Bypass RLS)...");
  const hash = bcrypt.hashSync('Password123!', 10);

  for (const d of demos) {
    try {
      await prisma.$transaction(async (tx) => {
        // Contournement de la sécurité RLS (Row-Level Security)
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '__SYSTEM_GLOBAL_SUPERADMIN__', true)`);

        // 1. Créer ou Mettre à jour le Tenant
        const tenant = await tx.tenant.upsert({
          where: { code: d.code },
          update: {
            name: d.name,
            sectorType: d.sector,
            billingStatus: 'ACTIVE',
            isDemo: true,
            isPermanentDemo: true,
          },
          create: {
            code: d.code,
            name: d.name,
            sectorType: d.sector,
            country: 'SN',
            billingStatus: 'ACTIVE',
            isDemo: true,
            isPermanentDemo: true,
          }
        });

        // 2. Créer ou récupérer le Rôle Admin
        let adminRole = await tx.role.findFirst({
          where: { tenantId: tenant.id, name: 'ADMIN_TENANT' }
        });

        if (!adminRole) {
          adminRole = await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: 'ADMIN_TENANT',
              description: `Administrateur ${d.name}`
            }
          });
        }

        // 3. Créer ou Mettre à jour l'Utilisateur
        const user = await tx.user.upsert({
          where: { username: d.username },
          update: {
            passwordHash: hash,
            isActive: true,
            mustChangePassword: false,
            tenantId: tenant.id
          },
          create: {
            tenantId: tenant.id,
            username: d.username,
            fullName: `Gérant ${d.name}`,
            email: d.email,
            phone: '+221 77 111 22 33',
            passwordHash: hash,
            userRoles: {
              create: { roleId: adminRole.id }
            }
          }
        });
      });

      console.log(`✅ Tenant ${d.code} et Utilisateur ${d.username} créés/mis à jour avec le mot de passe demandé.`);
    } catch (e) {
      console.log(`❌ Erreur pour ${d.username}:`, e.message);
    }
  }
}

seed()
  .catch(e => { console.error('Erreur globale:', e); })
  .finally(() => prisma.$disconnect());
