FROM node:19-alpine

WORKDIR /app
COPY . .
RUN apk add --no-cache --virtual build python3 build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev 
RUN apk add --no-cache lsof ffmpeg git cairo jpeg pango giflib
RUN npm install --development --force
RUN apk del build
RUN npm run build
CMD ["node", "/app/build/src/index.js"]
