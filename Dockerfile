# Install dependencies and build
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Copy build artifacts to a minimal image
# FROM gcr.io/distroless/nodejs20-debian12
FROM node:20-bullseye-slim

# Builds
COPY --from=build /app/build-collect /app/build-collect
COPY --from=build /app/build-migrate /app/build-migrate
COPY --from=build /app/build-notify /app/build-notify
COPY --from=build /app/build-export-footnotes /app/build-export-footnotes
COPY --from=build /app/build-web /app/build-web

# Dependencies
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package-lock.json /app/package.json /app/

# Static assets
COPY --from=build /app/static /app/static

# TODO: This is probably not needed anymore.
#
# Email templates are weird and try to read from the filesystem.
# Ideally we can have the email templates be fully built or handled
# appropriately in the build step, so that we wouldn't need to copy
# all of this over.
COPY --from=build /app/email /app/email
COPY --from=build /app/src /app/src

#Database migration scripts requires us to copy all of our migration files
COPY --from=build /app/db /app/db

WORKDIR /app
EXPOSE 3000
CMD ["build-web"]
