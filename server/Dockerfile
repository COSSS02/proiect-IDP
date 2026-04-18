FROM node:20-alpine AS dev
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --no-audit --no-fund
COPY server/ ./
EXPOSE 3000
CMD ["npm", "run", "dev"]
