# Déploiement automatique vers le VPS
$VPS_IP = "85.31.236.102"
$VPS_USER = "root"
$REMOTE_DIR = "/var/www/doorwaar" # Modifiez ce chemin selon l'emplacement exact de l'app sur le VPS

Write-Host "Déploiement en cours vers $VPS_IP..." -ForegroundColor Cyan

# 1. Copie des fichiers backend et frontend avec scp (en excluant node_modules)
# Note: Sur Windows, scp ne supporte pas toujours --exclude. On utilise tar ou rsync si disponible (wsl).
# Si wsl (Ubuntu) est installé :
Write-Host "Transfert des fichiers..."
wsl rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' ./ ${VPS_USER}@${VPS_IP}:${REMOTE_DIR}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du transfert. Assurez-vous d'avoir rsync installé via WSL." -ForegroundColor Red
    exit
}

# 2. Exécution des commandes sur le VPS pour reconstruire les conteneurs
Write-Host "Redémarrage des conteneurs sur le VPS..." -ForegroundColor Cyan
ssh ${VPS_USER}@${VPS_IP} "cd ${REMOTE_DIR} && docker-compose down && docker-compose up -d --build"

Write-Host "Déploiement terminé avec succès !" -ForegroundColor Green
