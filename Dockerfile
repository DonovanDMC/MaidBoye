FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache --virtual build python3 build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev 
RUN apk add --no-cache lsof ffmpeg git cairo jpeg pango giflib
RUN apk del build
RUN echo -e "update-notifier=false\nloglevel=error" > ~/.npmrc
COPY package.json package-lock.json ./
RUN npm install --force
COPY . .
RUN npm run build
RUN npm prune --omit=dev
CMD ["node", "/app/dist/src/index.js"]
