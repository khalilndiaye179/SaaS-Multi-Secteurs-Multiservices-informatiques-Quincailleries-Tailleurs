# 🛡️ KPSyDesk Suite - Door Waar — SaaS Multi-Secteurs UEMOA — Documentation de Production & Sauvegarde


Application SaaS multi-tenants complète développée pour les marchés UEMOA (Sénégal, Côte d'Ivoire, Mali) couvrant 3 secteurs clés :
1. 🔩 **Quincaillerie & Matériaux de Construction**
2. 💻 **Multiservices IT & SAV Informatique**
3. ✂️ **Atelier de Couture & Haute Confection (Tailleur)**

---

## 🚀 1. Déploiement Production & Migrations Prisma

Le backend de l'application utilise un conteneur sécurisé qui applique automatiquement les migrations de schéma sans altération de données grâce à `prisma migrate deploy`.

### Lancer la suite de conteneurs Docker :
```bash
docker compose build --no-cache backend frontend
docker compose up -d --force-recreate backend frontend
```

---

## 💾 2. Procédure Officielle de Sauvegarde & Restauration (Dump PostgreSQL)

### 🔹 Créer une Sauvegarde Totale (Structure & Données Réelles)
Pour exporter l'ensemble de la base de données vers un fichier SQL horodaté :

**Sous Linux / Bash :**
```bash
docker exec -t kpsy_multisector_postgres pg_dump -U kpsy_user -d kpsy_multisector_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Sous Windows (CMD) :**
```cmd
docker exec -t kpsy_multisector_postgres pg_dump -U kpsy_user -d kpsy_multisector_db > backup_kpsy_production.sql
```

### 🔹 Restaurer une Sauvegarde
Pour réimporter le fichier de sauvegarde dans une nouvelle instance ou réinitialiser la base de données :

```bash
docker exec -i kpsy_multisector_postgres psql -U kpsy_user -d kpsy_multisector_db < backup_kpsy_production.sql
```

---

## 🔑 3. Identifiants de Démonstration Officiels

- 🔩 **Quincaillerie** : `QNC-0001-01` / `Password123!`
- 💻 **Multiservices IT** : `ITS-0001-01` / `Password123!`
- ✂️ **Tailleur / Couture** : `TLR-0001-01` / `Password123!`
- 👑 **Super Admin SaaS** : `ADMIN-0001` / `Password123!`
