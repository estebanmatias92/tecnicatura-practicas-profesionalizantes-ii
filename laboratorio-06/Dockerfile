FROM node:22-bookworm

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm install

COPY . .

EXPOSE 3000

WORKDIR /app/backend

CMD ["node", "server.js"]
