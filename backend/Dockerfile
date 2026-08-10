# Dockerfile - Backend NestJS
# node:18 (Debian) — OpenSSL inclus nativement
FROM node:18

WORKDIR /app

COPY package*.json ./
# --foreground-scripts autorise les postinstall de prisma/@prisma/engines (téléchargement des binaires)
RUN npm install --legacy-peer-deps --foreground-scripts

COPY . .
# Utiliser les binaires locaux (pas npx) pour éviter tout téléchargement réseau
RUN ./node_modules/.bin/prisma generate
RUN ./node_modules/.bin/nest build

EXPOSE 3003

RUN chmod +x ./entrypoint.sh

CMD ["./entrypoint.sh"]





