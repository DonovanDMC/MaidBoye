FROM node:19-alpine

WORKDIR /app
COPY . .
RUN apk add --no-cache lsof ffmpeg git python make g++
RUN npm i --location=global npm typescript
RUN npm install --development --force
RUN npm run build
CMD ["node", "/app/build/src/index.js"]
