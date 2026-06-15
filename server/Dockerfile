# Immagine per il deploy del Server CitySync su Fly.io.
# Node 22 include il modulo nativo node:sqlite (nessuna dipendenza nativa da compilare).
FROM node:22-alpine

WORKDIR /app

# Installa solo le dipendenze di produzione.
COPY package*.json ./
RUN npm install --omit=dev

# Codice applicativo.
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
# Il DB SQLite vive sul volume persistente montato in /data (vedi fly.toml).
ENV CITYSYNC_DB=/data/citysync.db

EXPOSE 4000

CMD ["node", "--experimental-sqlite", "src/index.js"]
