FROM node:16

WORKDIR /app
COPY . .
RUN apt-get update && apt-get upgrade -y
RUN npm i -g npm typescript
RUN npm install --development --force
CMD npm start
