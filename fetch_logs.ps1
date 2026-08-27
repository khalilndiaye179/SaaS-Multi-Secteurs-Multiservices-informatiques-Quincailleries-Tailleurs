$VPS_IP = "85.31.236.102"
$VPS_USER = "root"

Write-Host "--- RECUPERATION DES JOURNAUX (LOGS) DU SERVEUR ---" -ForegroundColor Cyan
Write-Host "Veuillez entrer le mot de passe root de votre VPS pour récupérer l'erreur exacte :" -ForegroundColor Yellow

# On lance la commande SSH pour récupérer les 50 dernières lignes de log du backend
ssh -o PubkeyAuthentication=no ${VPS_USER}@${VPS_IP} "docker logs kpsy_multisector_backend --tail 50" > logs_backend.txt

Write-Host "`nLes logs ont été enregistrés dans le fichier 'logs_backend.txt'." -ForegroundColor Green
Write-Host "Veuillez me prévenir quand c'est fait pour que je puisse lire l'erreur exacte !" -ForegroundColor Cyan
Pause
