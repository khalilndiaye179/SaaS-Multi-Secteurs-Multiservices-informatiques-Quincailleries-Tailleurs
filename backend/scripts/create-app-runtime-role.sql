-- ==============================================================================
-- Script de création du rôle applicatif (kpsy_app_runtime)
-- 
-- À EXÉCUTER MANUELLEMENT après un "docker compose down -v" (réinitialisation).
-- Ce script est idempotent et sécurisé (pas de SUPERUSER ni BYPASSRLS).
-- 
-- IMPORTANT : Remplacer <VOTRE_MOT_DE_PASSE_SECURISE> par un vrai mot de passe fort
-- (celui-ci devra être le même que dans APP_RUNTIME_DATABASE_URL du .env).
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kpsy_app_runtime') THEN
    CREATE ROLE kpsy_app_runtime WITH LOGIN PASSWORD '<VOTRE_MOT_DE_PASSE_SECURISE>' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- Assigner les permissions de base sur le schéma public
GRANT USAGE ON SCHEMA public TO kpsy_app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kpsy_app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kpsy_app_runtime;

-- Assigner les permissions sur les séquences
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO kpsy_app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO kpsy_app_runtime;
