FROM node:12

WORKDIR /usr/app/quotidiom

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-dep && npm cache clean --force

COPY . .

EXPOSE 3002
CMD ["node", "app.js"]
