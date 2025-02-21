# Notifications

## Development

The most direct way to get a working version is to use `docker compose`:

```bash
docker compose --file notifications/docker-compose.dev.yml up
```

This will start the following services:

- The notification API at `http://localhost:8080`
- An [`rq` worker](https://python-rq.org/) to process notifications.
- Redis instance availabe on at `redis://localhost:8081`
- Mail catcher instance running:
  - SMTP server at `smtp://127.0.0.1:1025`
  - UI at `http://localhost:1080`

Then the relevant envirionment variables can be set for the main web application.
