console.log('🔍 SETUP-E2E EXECUTED, NODE_ENV=' + process.env.NODE_ENV);
process.env.NODE_ENV = 'test';
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquante — vérifiez votre fichier .env");
}
console.log('🔍 SETUP-E2E COMPLETED, NODE_ENV=' + process.env.NODE_ENV + ', DATABASE_URL=' + process.env.DATABASE_URL);
