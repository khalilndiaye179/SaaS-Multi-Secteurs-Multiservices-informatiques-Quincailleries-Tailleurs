// Configuration dynamique de l'environnement de test Jest
process.env.NODE_ENV = 'test';
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquante — vérifiez votre fichier .env");
}
