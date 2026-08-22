-- ==============================================================================
-- Migration SQL Initial pour PostgreSQL RLS (Row Level Security)
-- 
-- IMPORTANT : Ce script doit être exécuté MANUELLEMENT après chaque 
-- "docker compose down -v" (réinitialisation complète de la base de données) 
-- ou lors du tout premier démarrage, une fois que les migrations Prisma sont passées.
-- Il permet de sécuriser le rôle applicatif et d'activer RLS.
-- ==============================================================================

-- 0. Sécurisation stricte du rôle applicatif (Retrait des privilèges admin)
-- NOTE : Si le nom d'utilisateur de la base de données (POSTGRES_USER) est différent,
-- remplacez "kpsy_user" par le bon nom ci-dessous.
ALTER ROLE kpsy_user NOSUPERUSER NOBYPASSRLS;
