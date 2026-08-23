const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const supportRole = await prisma.role.findFirst({
    where: { name: 'SUPPORT', tenantId: null },
    include: { rolePermissions: { include: { permission: true } } }
  });
  console.log("SUPPORT ROLE PERMISSIONS:");
  if (!supportRole) {
    console.log("No SUPPORT role found!");
  } else {
    supportRole.rolePermissions.forEach(rp => {
      console.log("-", rp.permission.code);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
