# Code contributions

To contribute code to this project, the general process is the following:

- (optional) Fork this project if you don't have access to push to this repo directly.
- Make a branch that starts with `feature/`, `bugfix/`, or `maintenance/`.
- Do your development.
- Push your branch and make a Pull Request.

## Developing

### Setup and install

The following is how you setup your development environment to work on this project:

- Create a `.env` file in the root `notifications` directory
  - The local (default) values are listed below, within the Configuration section of this doc
- Install [Docker](https://www.docker.com/products/docker-desktop/).
- Run the project using docker-compose: `docker-compose -f ./docker-compose.dev.yaml up`

### Updates

When pulling new code, or when local changes are not reflected in the docker instance, you should do the following:

- Rebuild using docker-compose: `docker-compose -f ./docker-compose.dev.yaml build --no-cache`

### Configuration

Utilize the following environment variables, optionally using a `.env` file:

- `DOMAIN`: Domain of the main api application.
- `PORT`: Port of the main api application.
- `PREFIX`: Prefix for all urls of the main api application.
- `EMAIL_PROVIDER`: Email service to use in order to send emails.
  - Available providers are `aws`, `smtp`
- `SMTP_HOST`: If `smtp` is chosen, host for smtp server.
- `SMTP_PORT`: If `smtp` is chosen, port for smtp server.
- `REDIS_HOST`: Host for redis queue instance.

For local development, use the following `.env` values:
```
DOMAIN=localhost
PORT=8080
PREFIX=

EMAIL_PROVIDER=smtp
SMTP_HOST=mailcatcher
SMTP_PORT=1025

REDIS_HOST=redis
```

### Code styles and linting

See [docs/CODING_STYLES_LINTING.md](./CODING_STYLES_LINTING.md).

### Writing tests

When writing code, you will likely want to write some tests:

- (instructions here)

## Local development server

To start a development server:

```bash
docker-compose -f ./docker-compose.dev.yaml up
```

To send a test email:

```bash
curl -X POST -d '{"to":"some.email@gmail.com","body":"test body","title":"test title"}' \
    -H "Content-Type: application/json" \
    "http://localhost:8080/email/send" 
```

To view this email within Mailcatcher, visit http://localhost:1080

## Running tests

To run tests, you should do the following:

- (instructions here)
