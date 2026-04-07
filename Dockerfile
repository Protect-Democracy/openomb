# Install dependencies and build
FROM node:24-bookworm-slim AS build
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_RELEASE
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Copy build artifacts to a minimal image
# FROM gcr.io/distroless/nodejs20-debian12
FROM node:24-bookworm-slim

# Builds
COPY --from=build /app/build-collect /app/build-collect
COPY --from=build /app/build-migrate /app/build-migrate
COPY --from=build /app/build-notify /app/build-notify
COPY --from=build /app/build-web /app/build-web

# Dependencies
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package-lock.json /app/package.json /app/

# Static assets
COPY --from=build /app/static /app/static

# For migrations we need the source code
COPY --from=build /app/src /app/src


WORKDIR /app
EXPOSE 3000
CMD ["build-web"]
