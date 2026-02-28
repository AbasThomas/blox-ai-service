FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx build realtime

ENV NODE_ENV=production
ENV REALTIME_PORT=3335

EXPOSE 3335
CMD ["node", "dist/realtime/main.js"]


