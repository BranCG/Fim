FROM node:20-slim AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Instalar OpenSSL para Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copiar todo el código fuente del monorepo
COPY . .

# Instalar dependencias
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate --schema=./packages/database/schema.prisma

# Construir la aplicación web (genera la carpeta 'out' con los archivos estáticos)
RUN npm run build -w @fim/web

# Etapa de producción: Nginx
FROM nginx:alpine

# Copiar la salida estática al directorio de Nginx
COPY --from=builder /app/apps/web/out /usr/share/nginx/html

# Exponer el puerto 80 (interno del contenedor)
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]

