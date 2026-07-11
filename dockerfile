FROM node:22-alpine3.21 AS base
RUN apk add --no-cache git
WORKDIR /app
# Install deps at build time so the image caches node_modules.
# Only the manifests are copied → this layer is rebuilt only when they change.
COPY package.json yarn.lock .
RUN yarn install --frozen-lockfile
