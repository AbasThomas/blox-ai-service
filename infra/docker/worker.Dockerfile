FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npx nx build worker

ENV NODE_ENV=production

CMD ["node", "dist/worker/main.js"]


