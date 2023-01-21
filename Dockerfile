FROM node:19-alpine

WORKDIR /app
COPY . .
RUN apk add --no-cache --virtual build python3 build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev 
RUN apk add --no-cache lsof ffmpeg git cairo jpeg pango giflib
RUN echo -e "update-notifier=false\nloglevel=error" > ~/.npmrc
RUN npm install --force
RUN apk del build
RUN npm run build
CMD ["node", "/app/dist/src/index.js"]
