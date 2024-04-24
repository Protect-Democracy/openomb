# syntax=docker/dockerfile:1.7-labs

FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY --exclude=.svelte-kit --exclude=build-* --exclude=docs --exclude=*.md . .
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=build --exclude=.* --exclude=bin --exclude=server --exclude=tests --exclude=*.ts --exclude=db --exclude=tests /app /app
#COPY --from=build /app/build-collect /app/build-collect/
#COPY --from=build /app/build-migrate /app/build-migrate/
#COPY --from=build /app/node_modules /app/node_modules/
#COPY --from=build /app/static /app/static/
WORKDIR /app
EXPOSE 3000
CMD ["build-web"]
