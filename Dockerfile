# Dockerfile pour Recipe Server
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

# Créer le répertoire uploads
RUN mkdir -p uploads

EXPOSE 3002

CMD ["npm", "start"]
