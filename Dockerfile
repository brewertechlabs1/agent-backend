# Runs the clone anywhere containers run (Fly.io, Railway, a VPS).
# Mount a volume at /var/data so users, voice data, and media survive
# redeploys, and set the env vars from .env.example.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production CLONE_DATA_DIR=/var/data
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
