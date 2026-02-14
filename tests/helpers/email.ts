import { MailpitClient } from 'mailpit-api';

export async function emailClient() {
  const mailpitPort = process.env.TEST_MAILPIT_UI_PORT;

  if (!mailpitPort) {
    throw new Error('TEST_MAILPIT_SMTP_PORT not set. Did Mailpit container start correctly?');
  }

  const client = new MailpitClient(`http://localhost:${mailpitPort}`);

  return {
    client,
    teardown: async () => {
      await client.deleteMessages();
      await client.disconnect();
    }
  };
}
