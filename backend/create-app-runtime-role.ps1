# create-app-runtime-role.ps1
# Automatise la creation du role Postgres restreint kpsy_app_runtime.
# A executer depuis le dossier backend/ du projet.

$ErrorActionPreference = "Stop"

# 1. Generer un mot de passe fort
$charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$runtimePassword = -join ($bytes | ForEach-Object { $charset[$_ % $charset.Length] })

Write-Host "Mot de passe kpsy_app_runtime genere." -ForegroundColor Cyan

# 2. Générer le script SQL avec le mot de passe injecté
$sqlContent = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'kpsy_app_runtime') THEN
    CREATE ROLE kpsy_app_runtime WITH
      LOGIN
      PASSWORD '$runtimePassword'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS
      NOREPLICATION;
  ELSE
    ALTER ROLE kpsy_app_runtime WITH
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS
      NOREPLICATION
      PASSWORD '$runtimePassword';
  END IF;
END
`$`$;

GRANT CONNECT ON DATABASE kpsy_multisector_db TO kpsy_app_runtime;
GRANT USAGE ON SCHEMA public TO kpsy_app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kpsy_app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kpsy_app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE kpsy_user IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kpsy_app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE kpsy_user IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO kpsy_app_runtime;

SELECT rolname, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
FROM pg_roles
WHERE rolname IN ('kpsy_user', 'kpsy_app_runtime');
"@

$sqlContent | docker exec -i kpsy_multisector_postgres psql -U kpsy_user -d kpsy_multisector_db

# 3. Ajouter APP_RUNTIME_DATABASE_URL au .env (NE TOUCHE PAS a DATABASE_URL,
#    qui doit rester sur kpsy_user pour que les migrations Prisma fonctionnent)
$runtimeUrl = "postgresql://kpsy_app_runtime:$runtimePassword@localhost:5434/kpsy_multisector_db?schema=public&connection_limit=20&pool_timeout=20"

$envContent = Get-Content .env -Raw
if ($envContent -match "APP_RUNTIME_DATABASE_URL=") {
    $envContent = $envContent -replace '(?m)^APP_RUNTIME_DATABASE_URL=.*$', "APP_RUNTIME_DATABASE_URL=`"$runtimeUrl`""
} else {
    $envContent += "`nAPP_RUNTIME_DATABASE_URL=`"$runtimeUrl`"`n"
}
Set-Content .env $envContent -NoNewline

Write-Host "`n=== TERMINE ===" -ForegroundColor Green
Write-Host "APP_RUNTIME_DATABASE_URL ajoute au .env (DATABASE_URL inchange, reste kpsy_user pour les migrations)." -ForegroundColor Yellow
Write-Host "Prochaine etape : demander a Antigravity de faire lire APP_RUNTIME_DATABASE_URL par PrismaService" -ForegroundColor Yellow
Write-Host "au lieu de DATABASE_URL, pour que le backend runtime utilise le role restreint." -ForegroundColor Yellow
