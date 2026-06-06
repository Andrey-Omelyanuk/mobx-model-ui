FROM node:22-alpine3.21 AS base
RUN apk add --no-cache git
WORKDIR /app
COPY package.json .
