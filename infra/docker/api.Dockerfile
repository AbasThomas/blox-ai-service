FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npx nx build api

ENV NODE_ENV=production
ENV PORT=3333

EXPOSE 3333
CMD ["node", "dist/api/main.js"]


