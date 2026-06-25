FROM node:18-alpine

WORKDIR /app

# Copiar el código fuente completo
COPY . .

# Instalar dependencias del monorepo
RUN npm install

# Generar cliente Prisma
RUN npx prisma generate --schema=./packages/database/schema.prisma

# Construir la aplicación admin
RUN npm run build -w @fim/admin

# Exponer el puerto 3002
EXPOSE 3002

# Iniciar la aplicación en modo producción
CMD ["npm", "run", "start", "-w", "@fim/admin"]
