import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  const newPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const targetUsers = ['QNC-0001-01', 'ITS-0001-01', 'TLR-0001-01'];

  for (const username of targetUsers) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      await prisma.user.update({
        where: { username },
        data: { passwordHash, isActive: true, mustChangePassword: false },
      });
      console.log(`✅ Mot de passe mis à jour pour ${username}`);
    } else {
      console.log(`❌ Utilisateur ${username} introuvable dans la base de données.`);
    }
  }
}

resetPasswords()
  .catch((e) => {
    console.error('Erreur lors de la réinitialisation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
