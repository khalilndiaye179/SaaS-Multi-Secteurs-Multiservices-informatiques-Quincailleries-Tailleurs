const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  console.log("Checking DB for QNC-0001-01...");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '__SYSTEM_GLOBAL_SUPERADMIN__', true)`);

      const user = await tx.user.findUnique({
        where: { username: 'QNC-0001-01' },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      });
      
      console.log(JSON.stringify(user, null, 2));
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
