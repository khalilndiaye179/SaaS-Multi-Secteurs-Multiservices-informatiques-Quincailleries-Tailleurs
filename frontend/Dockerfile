# Dockerfile - Frontend React (Vite)
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Config Nginx avec proxy /api/ → backend:3003
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

