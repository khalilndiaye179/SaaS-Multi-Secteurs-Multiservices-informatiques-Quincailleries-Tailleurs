$VPS_IP = "85.31.236.102"
$VPS_USER = "root"
$REMOTE_DIR = "/opt/doorwaar"

Write-Host "--- DEPLOIEMENT COMPLET DU PATCH ET BASE DE DONNEES ---" -ForegroundColor Cyan

if (Test-Path "patch.tar.gz") { Remove-Item "patch.tar.gz" }

# On archive les fichiers TS + TOUT le dossier prisma pour appliquer les migrations sur le serveur
tar -czvf patch.tar.gz `
    "backend/prisma" `
    "backend/src/modules/super-admin/super-admin-team.service.ts" `
    "backend/src/modules/super-admin/super-admin-team.controller.ts" `
    "backend/src/modules/super-admin/dto/super-admin-team.dto.ts" `
    "frontend/src/components/super-admin/TeamManagerView.tsx" `
    "frontend/src/components/super-admin/SuperAdminTenantsList.tsx" `
    "frontend/src/components/shared/ForceSecuritySetupModal.tsx" `
    "frontend/src/services/super-admin-api.service.ts" `
    "frontend/src/services/auth-api.service.ts" `
    "frontend/src/components/layout/Sidebar.tsx" `
    "frontend/src/components/SuperAdminDashboard.tsx" `
    "frontend/src/App.tsx"

Write-Host "`n1. Envoi de l'archive vers le VPS (1ère demande de mot de passe)" -ForegroundColor Cyan
scp -o PubkeyAuthentication=no patch.tar.gz "${VPS_USER}@${VPS_IP}:/root/"

Write-Host "`n2. Décompression et redémarrage (2ème demande de mot de passe)" -ForegroundColor Cyan
$remoteCommands = "cd $REMOTE_DIR && tar -xzvf /root/patch.tar.gz -C $REMOTE_DIR && docker-compose down && docker-compose up -d --build && sleep 10 && docker-compose exec -T backend sh -c 'npx ts-node prisma/seed-rbac.ts'"
ssh -o PubkeyAuthentication=no ${VPS_USER}@${VPS_IP} $remoteCommands

Write-Host "`nPatch déployé avec succès !" -ForegroundColor Green
Pause
