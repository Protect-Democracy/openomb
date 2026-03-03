/**
 * Email utility.  Not currently meant to be used in production.
 *
 * @see: https://orm.drizzle.team/docs/migrations
 */

// Dependencies
import { Command } from 'commander';
import packageJson from '../package.json' assert { type: 'json' };
import { environmentVariables } from '../src/lib/server/utilities';
import { getSubscriptionsWithFilesByUser } from '../src/lib/server/subscriptions';
import { renderTemplate } from '$email/render';
import { sendEmail } from '$email/send';

import AuthenticationEmail from '$email/templates/AuthenticationEmail.svelte';
import FileNotificationEmail from '$email/templates/FileNotificationEmail.svelte';
import SubscriptionEmail from '$email/templates/SubscriptionEmail.svelte';
/**
 * Main CLI handler.
 */
async function cli(): Promise<void> {
  const env = environmentVariables();

  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Send an email.')
    .option('-a, --address <email>', 'Email address to send to.')
    .option(
      '-t, --template <template>',
      'What template to send.  Defaults to FileNotificationEmail.',
      'FileNotificationEmail'
    )
    .option(
      '-u, --subscription-user <email>',
      'User to pull data from for subscription templates, otherwise will use test data.'
    )
    .option(
      '-l, --subscription-last-notified <data>',
      'for use with "user" option.  Last notified date to provide, i.e. 1970-01-01, otherwise uses what is in the database.'
    )
    .parse(process.argv);

  const options = program.opts();

  // Check arguments
  if (!options.address || !options.template) {
    console.error('You must provide an email address and template.');
    process.exit(1);
  }

  // Get the template
  const emailTemplates = {
    AuthenticationEmail,
    FileNotificationEmail,
    SubscriptionEmail
  };
  const emailTemplate = emailTemplates[options.template];
  if (!emailTemplate) {
    console.error(
      `Unknown template "${options.template}.  Please use one of the following: ${Object.keys(emailTemplates).join(', ')}`
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
  } else {
    // TODO: Maybe use test data in email/previews/ ?
    data = {};
  }

  // Render template
  const emailBody = renderTemplate(emailTemplate, data);

  // Double check from the user if they want to send an email from mailgun
  if (env.emailServiceType === 'mailgun') {
    const confirm = await new Promise((resolve) => {
      process.stdout.write(
        `You are about to send an email through Mailgun to "${options.address}" using the "${options.template}" template. Are you sure? (y/n): `
      );
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', (data) => {
        resolve(data.toString().trim().toLowerCase() === 'y');
      });
    });
  }

  // Send email
  await sendEmail(options.address, `Testing template: "${options.template}"`, emailBody);

  console.info('Email sent.');
}

await cli();
