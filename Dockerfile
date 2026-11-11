# Dockerfile de Producción para Submigueleños (Railway / Render / Fly.io)
FROM node:22-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente y APK precompilada
COPY . .

# Compilar interfaz web de producción (dist/)
RUN npm run build

# Crear carpeta de datos persistentes
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]

