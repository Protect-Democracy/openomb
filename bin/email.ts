/**
 * Email utility.  Not currently meant to be used in production.
 *
 * @see: https://orm.drizzle.team/docs/migrations
 */

// Dependencies
import { Command } from 'commander';
import { createTransport } from 'nodemailer';
import { compileTemplates } from '../email/templates';
import { getSubscriptionsWithFilesByUser } from '../server/subscriptions';
import packageJson from '../package.json' assert { type: 'json' };

/**
 * Main CLI handler.
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Send an email.')
    .option('-a, --address <email>', 'Email address to send to.')
    .option('-t, --template <template>', 'What template to send, such as FileNotificationEmail.')
    .option(
      '-u, --subscription-user <email>',
      'User to pull data from for subscription templates, otherwise will use test data.'
    )
    .option(
      '-l, --subscription-last-notified <data>',
      'for use with "user" option.  Last notified date to provide, i.e. 1970-01-01, otherwise uses what is in the database.'
    )
    .option('-s, --use-notifications-service', 'TODO.  Otherwise, will send email directly.')
    .parse(process.argv);

  const options = program.opts();

  // Check arguments
  if (!options.address || !options.template) {
    console.error('You must provide an email address and template.');
    process.exit(1);
  }

  // Get templates
  console.info('Compiling templates...');
  const emailTemplates = await compileTemplates();

  // Check template exists
  const emailTemplate = emailTemplates[options.template];
  if (!emailTemplate) {
    console.error(
      `Template "${options.template}" not found.  Available templates: ${Object.keys(emailTemplates).join(', ')}`
    );
    process.exit(1);
  }

  // Get the data for the template if user provided
  let data;
  if (options.subscriptionUser) {
    data = await getSubscriptionsWithFilesByUser(
      options.subscriptionUser,
      new Date(options.subscriptionLastNotified)
    );
    data = { subscriptions: data };
  }
  else {
    // TODO: Maybe use test data in email/previews/ ?
    data = {};
  }

  // Render template
  const emailBody = await emailTemplate.render(data);

  // Send email
  if (options.useNotificationsService) {
    // TODO: Probably want to re-use things from notify.ts or
    // abstract some functions into another file
    console.info('NOT IMPLEMENTED');
  }
  else {
    await sendEmail(options.address, `Testing template: "${options.template}"`, emailBody);
  }

  console.info('Email sent.');
}

/**
 * Send email directly.
 *
 * This is only for testing.  In production, we should use the notifications service and queue.
 */
async function sendEmail(email: string, subject: string, body: string) {
  // Configure based on environment
  let transport;
  if (
    process.env.DEV_EMAIL_SERVICE === 'Gmail' &&
    process.env.DEV_EMAIL_USER &&
    process.env.DEV_EMAIL_PASS
  ) {
    transport = createTransport({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.DEV_EMAIL_USER,
        pass: process.env.DEV_EMAIL_PASS
      }
    });
  }
  else {
    console.error('Unkown email service or configuration in environment.');
    process.exit(1);
  }

  await transport.sendMail({
    from: process.env.DEV_EMAIL_USER,
    to: email,
    subject,
    html: body
  });
}

cli();
