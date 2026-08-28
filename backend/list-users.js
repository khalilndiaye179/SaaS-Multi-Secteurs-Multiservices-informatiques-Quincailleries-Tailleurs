const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { username: true, tenant: { select: { code: true, name: true } } }
  });
  console.log("Utilisateurs existants en BDD :");
  console.table(users.map(u => ({ username: u.username, tenantCode: u.tenant.code, tenantName: u.tenant.name })));
}

listUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
