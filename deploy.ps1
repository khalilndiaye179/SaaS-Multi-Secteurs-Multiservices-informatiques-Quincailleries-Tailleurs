$password = Read-Host -Prompt "Entrez le mot de passe root pour le VPS (85.31.236.102)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Requires sshpass to be installed, or we can just run ssh and it will prompt.
# Actually, the simplest in powershell without third party tools is just to run the ssh command and let it prompt, 
# or use plink.exe if putty is installed.
# But since the user just wants a script:

Write-Host "Lancement du déploiement sur le VPS..."
ssh root@85.31.236.102 "cd /opt/doorwaar && git pull origin main && docker compose up -d --build"

Write-Host "Déploiement terminé."
