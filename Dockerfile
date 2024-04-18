FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=build /app /app
WORKDIR /app
ENV APPORTIONMENTS_DB_URI=postgres://localhost:5432/mydb
EXPOSE 3000
CMD ["build"]
