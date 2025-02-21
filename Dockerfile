FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# FROM gcr.io/distroless/nodejs20-debian12
FROM node:20-bullseye-slim
COPY --from=build /app/build-collect /app/build-collect
COPY --from=build /app/build-migrate /app/build-migrate
COPY --from=build /app/build-notify /app/build-notify
COPY --from=build /app/build-web /app/build-web
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package-lock.json /app/package.json /app/
WORKDIR /app
EXPOSE 3000
CMD ["build-web"]
