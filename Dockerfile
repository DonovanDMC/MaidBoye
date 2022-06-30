FROM node:16

WORKDIR /app
COPY . .
RUN apt-get update && apt-get upgrade -y && apt-get install -y lsof
RUN npm i -g npm typescript
RUN npm install --development --force
RUN npm run build
CMD npm start
