# Install dependencies and build
FROM node:24-bookworm-slim AS build
ARG SENTRY_RELEASE
WORKDIR /app

# sentry-cli needs system CA certs to upload source maps over HTTPS
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json .npmrc ./
RUN npm install
# Rebuild packages whose postinstall scripts are blocked by ignore-scripts
RUN npm rebuild esbuild @sentry/cli
COPY . .
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN) \
    npm run build

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
