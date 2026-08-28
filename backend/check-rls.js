const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRls() {
  const result = await prisma.$queryRaw`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') 
      AND relkind = 'r';
  `;
  console.log(result);
}

checkRls().finally(() => prisma.$disconnect());
