# Usa Node.js 18 come immagine base
FROM node:18-slim

# Crea directory dell'app
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file
COPY . .

# Esponi la porta 8080
EXPOSE 8080

# Avvia l'app
CMD ["npm", "start"]
