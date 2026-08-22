import { execSync } from 'child_process';

export default async function globalSetup() {
  const testDbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    throw new Error("DATABASE_URL manquante — vérifiez votre fichier .env");
  }
  console.log('\n🔄 [Jest Global Setup] Synchronisation automatique du schéma Prisma sur kpsy_multisector_test_db...');
  
  try {
    execSync(`npx prisma db push --skip-generate`, {
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
      },
      stdio: 'inherit',
    });
    console.log('✅ [Jest Global Setup] Base de données kpsy_multisector_test_db prête et synchronisée !\n');
  } catch (error) {
    console.error('❌ [Jest Global Setup] Erreur lors de la synchronisation de la base de test:', error);
    throw error;
  }
}
