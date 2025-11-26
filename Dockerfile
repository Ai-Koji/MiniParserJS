FROM node:18-alpine

WORKDIR /app

COPY src/package*.json ./

RUN npm install

COPY src/ .

CMD ["node", "main.js"]
