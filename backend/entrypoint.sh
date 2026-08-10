#!/bin/sh
set -e

echo "==> Application des migrations Prisma en production..."
./node_modules/.bin/prisma migrate deploy

echo "==> Démarrage du serveur NestJS..."
node dist/main
