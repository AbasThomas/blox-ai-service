FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx nx build web

ENV NODE_ENV=production
ENV PORT=4200

EXPOSE 4200
CMD ["npx", "next", "start", "web", "-H", "0.0.0.0", "-p", "4200"]


