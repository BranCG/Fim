# BUILD STAGE
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

# Instalar dependencias
RUN npm ci

# Copiar base de datos y generar Prisma client
COPY packages/database ./packages/database
RUN npm run db:generate

# Copiar código fuente de la API y compilar
COPY apps/api ./apps/api
RUN npm run build --prefix apps/api

# PRODUCTION STAGE
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos de dependencias
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/

# Instalar solo dependencias de producción
RUN npm ci --omit=dev

# Copiar Prisma client y archivos necesarios del compilador
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Crear carpeta de uploads
RUN mkdir -p apps/api/uploads

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
