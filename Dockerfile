FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache --virtual build python3 build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev 
RUN apk add --no-cache lsof ffmpeg git cairo jpeg pango giflib
RUN apk del build
RUN echo -e "update-notifier=false\nloglevel=error\nnode-linker=hoisted" > ~/.npmrc
RUN npm install --no-save pnpm
COPY package.json pnpm-lock.yaml ./
RUN npx pnpm install
COPY . .
RUN npx pnpm run build
RUN npx pnpm prune --prod
CMD ["node", "--no-warnings", "--no-deprecation", "--experimental-specifier-resolution=node", "dist/src/index.js"]
