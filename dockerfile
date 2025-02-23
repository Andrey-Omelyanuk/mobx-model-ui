FROM node:22.5-alpine3.19 AS base
RUN apk add --no-cache git
WORKDIR /app
COPY package.json .

FROM base AS release
RUN yarn install
COPY . .
RUN yarn build
