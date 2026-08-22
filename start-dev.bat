@echo off
title Launcher SaaS Multi-Secteurs
echo Démarrage du SaaS Multi-Secteurs (Backend 3003 + Frontend 5173)...

start "Backend NestJS (3003)" /D "%~dp0backend" node dist/main.js
start "Frontend Vite (5173)" /D "%~dp0frontend" node node_modules\vite\bin\vite.js --port 5173

echo 🚀 Les serveurs Backend (3003) et Frontend (5173) ont été lancés !
