FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache --virtual build python3 build-base g++ cairo-dev jpeg-dev pango-dev giflib-dev 
RUN apk add --no-cache lsof ffmpeg git cairo jpeg pango giflib
RUN apk del build
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --prod
CMD ["node", "--no-warnings", "--no-deprecation", "--experimental-specifier-resolution=node", "dist/src/index.js"]
