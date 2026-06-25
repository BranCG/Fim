FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar todo el código fuente del monorepo
COPY . .

# Instalar dependencias
RUN npm install

# Generar cliente de Prisma (si es requerido por paquetes compartidos)
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
