FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx build ai-service

ENV NODE_ENV=production
ENV AI_SERVICE_PORT=3334

EXPOSE 3334
CMD ["node", "dist/ai-service/main.js"]


