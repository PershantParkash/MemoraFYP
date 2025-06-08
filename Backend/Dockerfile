FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Ensure uploads copied
COPY uploads ./uploads

EXPOSE 5000

CMD ["node", "index.js"]
