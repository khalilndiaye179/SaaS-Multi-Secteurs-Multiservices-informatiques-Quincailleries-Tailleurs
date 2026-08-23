# rotate-postgres-password.ps1
# Rotation automatique du mot de passe PostgreSQL local (KPSyDesk Multisector)
# A executer depuis le dossier backend/ du projet.

$ErrorActionPreference = "Stop"

# 1. Verification qu'on est au bon endroit
if (-not (Test-Path ".env")) {
    Write-Host "ERREUR : fichier .env introuvable dans ce dossier." -ForegroundColor Red
    Write-Host "Lance ce script depuis le dossier backend/ du projet." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "docker-compose.yml") -and -not (Test-Path "../docker-compose.yml")) {
    Write-Host "ATTENTION : docker-compose.yml non trouve ici ni au niveau parent." -ForegroundColor Yellow
    Write-Host "Le script va quand meme modifier .env, mais verifie le chemin avant de continuer." -ForegroundColor Yellow
}

# 2. Backup du .env actuel
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = ".env.bak_$timestamp"
Copy-Item ".env" $backupPath
Write-Host "Backup cree : $backupPath" -ForegroundColor Cyan

# 3. Generation d'un nouveau mot de passe fort (alphanumerique uniquement,
#    pour eviter tout probleme d'encodage dans une connection string PostgreSQL/URL)
$charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$newPassword = -join ($bytes | ForEach-Object { $charset[$_ % $charset.Length] })

Write-Host "Nouveau mot de passe genere (32 caracteres)." -ForegroundColor Cyan

# 4. Lecture et modification du contenu du .env
$content = Get-Content ".env" -Raw

# Remplace la ligne POSTGRES_PASSWORD=...
$content = $content -replace '(?m)^POSTGRES_PASSWORD=.*$', "POSTGRES_PASSWORD=$newPassword"

# Remplace le mot de passe dans DATABASE_URL, qu'il soit en clair ou sous forme
# de placeholder ${POSTGRES_PASSWORD}, en ciblant tout ce qui se trouve entre
# "kpsy_user:" et le "@" suivant dans l'URL de connexion.
$content = $content -replace '(kpsy_user:)([^@]*)(@)', "`${1}$newPassword`${3}"

Set-Content ".env" $content -NoNewline

Write-Host "Fichier .env mis a jour (POSTGRES_PASSWORD + DATABASE_URL)." -ForegroundColor Green

# 5. Redemarrage propre des conteneurs (perte du volume postgres_data local, sans risque en dev)
Write-Host "`nArret des conteneurs et suppression de l'ancien volume..." -ForegroundColor Cyan
docker compose down -v

Write-Host "`nRedemarrage avec le nouveau mot de passe..." -ForegroundColor Cyan
docker compose up -d --force-recreate

# 6. Verification
Start-Sleep -Seconds 5
Write-Host "`nEtat des conteneurs :" -ForegroundColor Cyan
docker ps --filter "name=kpsy_multisector"

Write-Host "`n=== TERMINE ===" -ForegroundColor Green
Write-Host "Nouveau mot de passe (garde-le en lieu sur, ex. gestionnaire de mots de passe) :" -ForegroundColor Yellow
Write-Host $newPassword -ForegroundColor Yellow
Write-Host "`nSi un conteneur n'est pas 'Up', lance : docker logs kpsy_multisector_backend" -ForegroundColor Gray
