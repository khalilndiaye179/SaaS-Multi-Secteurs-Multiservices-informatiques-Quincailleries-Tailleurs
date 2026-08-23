#!/bin/sh
set -e

echo "==> Application des migrations Prisma en production..."
./node_modules/.bin/prisma migrate deploy

echo "==> Application des politiques RLS (Row Level Security)..."
./node_modules/.bin/prisma db execute --file prisma/rls-policies.sql --schema prisma/schema.prisma

echo "==> Démarrage du serveur NestJS..."
node dist/main
