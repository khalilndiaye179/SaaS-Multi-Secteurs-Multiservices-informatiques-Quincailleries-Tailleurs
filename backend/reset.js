const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newPassword = 'Password123!';
const hash = bcrypt.hashSync(newPassword, 10);
const users = ['QNC-0001-01', 'ITS-0001-01', 'TLR-0001-01'];

async function updateUsers() {
  for (const username of users) {
    try {
      await prisma.user.update({
        where: { username },
        data: { 
          passwordHash: hash, 
          isActive: true, 
          mustChangePassword: false 
        }
      });
      console.log(`✅ Mot de passe mis à jour pour ${username}`);
    } catch (e) {
      console.log(`❌ Impossible de mettre à jour ${username} : ${e.message}`);
    }
  }
}

updateUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
