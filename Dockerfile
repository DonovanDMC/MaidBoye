FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache --virtual build python3 build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev 
RUN apk add --no-cache lsof ffmpeg git cairo jpeg pango giflib
RUN apk del build
RUN echo -e "update-notifier=false\nloglevel=error\nnode-linker=hoisted" > ~/.npmrc
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm run build
RUN pnpm prune --prod
CMD ["node", "/app/dist/src/index.js"]
