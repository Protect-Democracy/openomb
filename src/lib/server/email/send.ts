// Dependencies
import Mailgun from 'mailgun.js';
import type { Interfaces } from 'mailgun.js/definitions';
import { createTransport } from 'nodemailer';
import { environmentVariables } from '$server/utilities';
import {
  notifierEmailName,
  notifierEmail,
  replyEmailName,
  replyEmail
} from '$config/subscriptions';

// Instantiate mailgun library with native FormData
const mailgun = new Mailgun(FormData);

// Store mailgun client so process uses same connection
//  (only really relevant with notification job task)
let mailgunClient: undefined | Interfaces.IMailgunClient;

/**
 * Sends an email via our configured service.
 *
 * Abstracts a bit so that we can use different services, mostly for testing.
 *
 * @param to The recipient email address.
 * @param subject The email subject.
 * @param html The email body html (as string).
 * @param forceClientRefresh Whether to force creating a new email client instance.
 */
async function sendEmail(to: string, subject: string, html: string, forceClientRefresh = false) {
  const env = environmentVariables();

  // Constants regardless of service type
  const from: string = notifierEmailName
    ? `${notifierEmailName} <${notifierEmail}>`
    : notifierEmail;
  const replyTo: string = replyEmailName ? `${replyEmailName} <${replyEmail}>` : replyEmail;

  // Assume mailgun if not specified, but allow override for testing
  env.emailServiceType = env.emailServiceType || 'mailgun';

  // Mailgun
  if (env.emailServiceType === 'mailgun') {
    // Check that we have needed parts
    if (!env.mailgunDomain || !env.mailgunSendKey) {
      throw new Error('Missing Mailgun configuration in environment variables.');
    }

    // Make client if needed
    if (!mailgunClient || forceClientRefresh) {
      mailgunClient = mailgun.client({
        username: 'api',
        key: env.mailgunSendKey,
        useFetch: true
      });
    }

    await mailgunClient.messages.create(env.mailgunDomain, {
      to: to,
      from: from,
      subject: subject,
      html: html,
      'h:Reply-To': replyTo
    });
  }

  // SMTP or Gmail (which uses SMTP under the hood)
  else if (env.emailServiceType === 'gmail' || env.emailServiceType === 'smtp') {
    // NOTE: Ideally we would do this check, but the tests are built as production.
    // Check that this is not a production environment
    if (env.environment === 'production' && !process.env.NODE_TEST) {
      throw new Error('SMTP or Gmail email service should not be used in production environment.');
    }

    // Some specifics for Gmail
    const smtpHost = env.emailServiceType === 'gmail' ? 'smtp.gmail.com' : env.emailSmtpHost;
    const smtpPort = env.emailServiceType === 'gmail' ? 465 : env.emailSmtpPort;
    const smtpSecure = env.emailServiceType === 'gmail' ? true : env.emailSmtpSecure;

    // Check that we have the needed parts
    if (!smtpHost) {
      throw new Error('Missing SMTP email configuration in environment variables.');
    }

    // If Gmail, we need user name and password
    if (env.emailServiceType === 'gmail' && (!env.emailSmtpUser || !env.emailSmtpPassword)) {
      throw new Error('Missing Gmail email configuration in environment variables.');
    }

    // Create SMTP transporter
    const transport = createTransport({
      service: env.emailServiceType === 'gmail' ? 'gmail' : undefined,
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: env.emailSmtpUser,
        pass: env.emailSmtpPassword
      }
    });

    await transport.sendMail({
      from: from,
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo
    });
  }
  else {
    throw new Error('Unknown email service type in environment variables.');
  }
}

export { sendEmail };
