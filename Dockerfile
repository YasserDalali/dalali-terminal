# Portfolio cache API (Express + tsx + Redis client). IBKR credentials via env at runtime.
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts ./
COPY src ./src
COPY server ./server

ENV NODE_ENV=production
EXPOSE 8787

CMD ["npx", "tsx", "server/index.ts"]
