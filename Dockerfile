# syntax=docker/dockerfile:1.7-labs

FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --exclude=.svelte-kit --exclude=build-* --exclude=docs --exclude=*.md . .
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=build --exclude=.* --exclude=bin --exclude=server --exclude=tests --exclude=*.ts --exclude=tests /app /app
WORKDIR /app
EXPOSE 3000
CMD ["build-web"]
