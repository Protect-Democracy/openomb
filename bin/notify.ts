/**
 * Runs through our subscriptions and notifies users of new files.
 */

// Dependencies
import { DateTime } from 'luxon';
import { map, reduce, filter } from 'lodash-es';
import { Command } from 'commander';
import {
  getSubscriptionsByUser,
  getUserSubscriptionDetails,
  setSubscriptionAsNotified
} from '../db/queries/subscriptions';
import { fileSearchFullCount, fileSearchPaged } from '../db/queries/search';
import { request } from '../server/request';
import { environmentVariables } from '../server/utilities';
import { setupCustomSentry, createTransaction } from '../server/sentry-custom';
import { deployedBaseUrl } from '../src/config';
import {
  maxFilesPerNotificationEntry,
  runWeeklyEmailsOn,
  notifierEmailName,
  notifierEmail,
  replyEmailName,
  replyEmail
} from '../src/config/subscriptions';
import { formatFileTitle, formatNumber } from '../src/lib/formatters';
import packageJson from '../package.json' assert { type: 'json' };
// import { compileTemplates } from '../email/templates';

// Make sure Sentry is setup if DSN is provided
setupCustomSentry();

// Constants
const env = environmentVariables();

// Main
createTransaction('apportionment-notifications', cli);

/**
 * Main CLI function
 */
async function cli(): Promise<void> {
  // Setup commander
  const program = new Command();
  program
    .version(packageJson.version)
    .description('Send any subscription notifications.')
    .parse(process.argv);

  console.info(`Started subscription notification - ${new Date()}`);

  // Render the email templates for use in the notifications
  // const emailTemplates = await compileTemplates();

  const userSubscriptions = await getSubscriptionsByUser();

  for (const email of Object.keys(userSubscriptions)) {
    // For a user, find any relevant new files, then send the notification
    const currentUserSubs = userSubscriptions[email];
    const notifySubs = [];
    for (const sub of currentUserSubs) {
      // Check if our subscription is weekly or daily and, based on that, if it needs to run again
      if (
        (sub.frequency === 'weekly' &&
          new Date().getDay() === runWeeklyEmailsOn &&
          Math.abs(DateTime.fromJSDate(sub.lastNotifiedAt).diffNow(['days'])) > 6) ||
        (sub.frequency === 'daily' &&
          Math.abs(DateTime.fromJSDate(sub.lastNotifiedAt).diffNow(['days'])) > 18)
      ) {
        const notification = await getSubscriptionWithFiles(email, sub);
        notification && notifySubs.push(notification);
      }
    }

    if (notifySubs.length) {
      // Send our notification email to the user
      await sendNotificationEmail(email, notifySubs);
      // Update our subscriptions to indicate notifications were sent
      await Promise.all(map(notifySubs, (sub) => setSubscriptionAsNotified(email, sub.id)));
    }
  }
  console.info('Finished notification');
}

async function getSubscriptionWithFiles(email: string, sub) {
  let criterion;
  if (sub.type === 'search') {
    criterion = sub.itemDetails.criterion;
  }
  else if (sub.type === 'agency' || sub.type === 'bureau' || sub.type === 'account') {
    criterion = {
      agency: sub.itemDetails.agencyId || '',
      bureau: sub.itemDetails.bureauId || '',
      account: sub.itemDetails.account || ''
    };
  }
  else if (sub.type === 'folder') {
    criterion = { folder: sub.itemId };
  }
  else if (sub.type === 'tafs') {
    const detailRecord = await getUserSubscriptionDetails(email, sub.type, sub.itemId);
    criterion = {
      tafs: detailRecord?.itemDetails.tafsId,
      year: `${detailRecord?.itemDetails.fiscalYear}`
    };
  }
  criterion['approvedStart'] = sub.lastNotifiedAt;
  const fileCount = await fileSearchFullCount(criterion);
  const files = await fileSearchPaged({
    ...criterion,
    limit: maxFilesPerNotificationEntry
  });
  if (files.length) {
    return {
      ...sub,
      criterion,
      fileCount,
      files
    };
  }
}

async function sendNotificationEmail(email, notifySubs) {
  const emailBody = buildTemplate(notifySubs);
  await request(
    `${env.notificationsServiceUri}/email/queue`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: notifierEmail,
        from_name: notifierEmailName,
        reply: replyEmail,
        reply_name: replyEmailName,
        to: email,
        title: `OpenOMB Subscriptions`,
        html: emailBody
      })
    },
    { expectedType: 'json', ttl: 1, retries: 5 }
  );
}

function buildTemplate(notifySubs) {
  // Separate into categories
  const folderSubs = filter(notifySubs, (sub) => sub.type === 'folder');
  const tafsSubs = filter(notifySubs, (sub) => sub.type === 'tafs');
  const agencySubs = filter(notifySubs, (sub) => sub.type === 'agency');
  const bureauSubs = filter(notifySubs, (sub) => sub.type === 'bureau');
  const accountSubs = filter(notifySubs, (sub) => sub.type === 'account');
  const searchSubs = filter(notifySubs, (sub) => sub.type === 'search');

  // Email values for easier update
  const title = 'New Apportionment Approvals';
  const text =
    'New apportionment files have been approved within your subscriptions.  These files are listed below.';
  const subscriptionLink = `${deployedBaseUrl}/subscribe`;
  const subscriptionText = 'Manage Subscriptions';
  const disclaimer =
    'This website is not affiliated with the Office of Management and Budget (OMB), the Executive Office of the President, the U.S. Congress, or any component of the U.S. government. OpenOMB is a searchable database maintained by Protect Democracy Project, a registered 501(c)(3) charitable organization and part of the Protect Democracy group.';

  // Temporary template until we can get svelte to work
  return `
    <!--[--><!--[--><head><meta httpequiv="Content-Type" content="text/html; charset=UTF-8"> <!--[--><!--[--><style>
      *,::after,::before{-moz-box-sizing:border-box;box-sizing:border-box}html{font-family:system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';line-height:1.15;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0}hr{height:0;color:inherit}abbr[title]{-webkit-text-decoration:underline dotted;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-0.25em}sup{top:-0.5em}table{text-indent:0;border-color:inherit}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,select{text-transform:none}[type='button'],[type='reset'],[type='submit'],button{-webkit-appearance:button}::-moz-focus-inner{border-style:none;padding:0}:-moz-focusring{outline:1px dotted ButtonText}:-moz-ui-invalid{box-shadow:none}legend{padding:0}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type='search']{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}:root{--color-white:#ffffff;--color-black:#000000;--color-gray-lightest:#f1eeea;--color-gray-lighter:#dbd4cb;--color-gray-light:#c2bcb3;--color-gray-medium:#787878;--color-gray-dark:#565656;--color-gray-darker:#333333;--color-green:#1da876;--color-green-light:#26c690;--color-green-dark:#059260;--color-green-darker:#00724a;--color-yellow:#fba62b;--color-yellow-light:#ffca7c;--color-yellow-dark:#d98307;--color-yellow-darker:#aa6500;--color-orange:#fb6e2b;--color-orange-light:#ff8b53;--color-orange-dark:#d94b07;--color-orange-darker:#aa3700;--color-blue:#2666a3;--color-blue-lightest:#f0faff;--color-blue-lighter:#b3ddf4;--color-blue-light:#699ac9;--color-blue-dark:#0f4f8d;--color-blue-darker:#083c6f;--color-off-white:#f9f1e6;--color-background:var(--color-white);--color-text:var(--color-gray-darker);--color-text-muted:var(--color-gray-medium);--color-background-inverse:var(--color-gray-darker);--color-text-inverse:var(--color-white);--color-background-alt:var(--color-off-white);--color-text-alt:var(--color-gray-darker);--color-primary:var(--color-green-light);--color-primary-text:var(--color-text-inverse);--color-primary-hover:var(--color-green);--color-primary-hover-text:var(--color-text-inverse);--color-secondary:var(--color-background);--color-secondary-text:var(--color-primary);--color-secondary-border:var(--color-primary);--color-secondary-hover:var(--color-primary);--color-secondary-hover-text:var(--color-text-inverse);--color-secondary-hover-border:transparent;--color-previous:var(--color-yellow-darker);--color-previous-text:var(--color-text-inverse);--color-previous-hover:var(--color-yellow-light);--color-previous-hover-text:var(--color-text);--color-previous-checked:var(--color-yellow-darker);--color-previous-unchecked:var(--color-yellow-light);--color-alt:var(--color-gray-dark);--color-alt-text:var(--color-text-inverse);--color-alt-hover:var(--color-gray-medium);--color-alt-hover-text:var(--color-text-inverse);--color-toggle-on:var(--color-gray-dark);--color-toggle-on-text:var(--color-text-inverse);--color-toggle-off:var(--color-blue-lighter);--color-toggle-off-text:var(--color-text);--color-toggle-hover:var(--color-gray-medium);--color-toggle-hover-text:var(--color-text-inverse);--color-highlight:var(--color-yellow-light);--color-error:var(--color-orange-darker);--color-disabled:var(--color-gray-lighter);--color-link:var(--color-green);--color-link-inverse:var(--color-green-light);--font-family-copy:'IBM Plex Sans', system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';--font-copy-weight-normal:400;--font-copy-weight-bold:600;--font-copy-weight-bolder:700;--font-family-heading:'Domine', serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';--font-heading-weight-normal:normal;--font-heading-weight-bold:600;--font-family-monospace:'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;--font-family-heading-alt:var(--font-family-copy);--font-heading-alt-letter-spacing:-0.2px;--font-family-heading-alt-weight-normal:var(--font-copy-weight-normal);--font-family-heading-alt-weight-bold:var(--font-copy-weight-bold);--line-height:1.5;--line-height-small:1.2;--base-font-size:16px;--font-size-tiny:0.5rem;--font-size-small:0.8rem;--font-size-regular:1rem;--font-size-slight:1.15rem;--font-size-medium:1.25rem;--font-size-large:1.5rem;--font-size-xlarge:2rem;--font-size-xxlarge:2.875rem;--border-radius:-moz-calc(var(--spacing) * 2 / 3);--border-radius:calc(var(--spacing) * 2 / 3);--border-radius-small:-moz-calc(var(--spacing) * 1 / 3);--border-radius-small:calc(var(--spacing) * 1 / 3);--border-radius-full:9999px;--border-weight:var(--spacing-thin);--border-weight-thin:-moz-calc(var(--spacing-thin) / 2);--border-weight-thin:calc(var(--spacing-thin) / 2);--drop-shadow:0 6px 12px var(--color-gray-medium);--transition:0.3s;--transition-fast:0.1s;--spacing:1rem;--spacing-half:-moz-calc(var(--spacing) / 2);--spacing-half:calc(var(--spacing) / 2);--spacing-tiny:-moz-calc(var(--spacing) / 6);--spacing-tiny:calc(var(--spacing) / 6);--spacing-small:-moz-calc(var(--spacing) / 4);--spacing-small:calc(var(--spacing) / 4);--spacing-smallish:-moz-calc(var(--spacing) * 2 / 3);--spacing-smallish:calc(var(--spacing) * 2 / 3);--spacing-line-height:-moz-calc(1rem * var(--line-height));--spacing-line-height:calc(1rem * var(--line-height));--spacing-thin:-moz-calc(var(--spacing) * 2 / 16);--spacing-thin:calc(var(--spacing) * 2 / 16);--spacing-double:-moz-calc(var(--spacing) * 2);--spacing-double:calc(var(--spacing) * 2);--spacing-triple:-moz-calc(var(--spacing) * 3);--spacing-triple:calc(var(--spacing) * 3);--spacing-large:-moz-calc(var(--spacing) * 4);--spacing-large:calc(var(--spacing) * 4);--spacing-xlarge:-moz-calc(var(--spacing) * 5);--spacing-xlarge:calc(var(--spacing) * 5);--icon-size-inline:1.1em;--copy-width-limit:50em;--page-width:75rem;--page-width-small:62rem}@media (max-width: 768px){:root{--base-font-size:14px;--spacing-large:-moz-calc(var(--spacing) * 2);--spacing-large:calc(var(--spacing) * 2);--spacing-xlarge:-moz-calc(var(--spacing) * 3);--spacing-xlarge:calc(var(--spacing) * 3)}}@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto !important}*{-webkit-animation-delay:0 !important;-moz-animation-delay:0 !important;animation-delay:0 !important;-webkit-animation-duration:1ms !important;-moz-animation-duration:1ms !important;animation-duration:1ms !important;-moz-transition-duration:0 !important;transition-duration:0 !important;-webkit-animation:none !important;-moz-animation:none !important;animation:none !important;-moz-transition:none !important;transition:none !important;scroll-behavior:auto !important}}html{scroll-behavior:smooth}body{font-family:var(--font-family-copy);font-weight:var(--font-copy-weight-normal);background-color:var(--color-background);color:var(--color-text);line-height:var(--line-height);font-size:var(--base-font-size)}::-moz-selection{background-color:var(--color-highlight);color:var(--color-text)}::selection{background-color:var(--color-highlight);color:var(--color-text)}::-webkit-input-placeholder{color:var(--color-text-muted)}::-moz-placeholder{color:var(--color-text-muted)}::-ms-input-placeholder{color:var(--color-text-muted)}::placeholder{color:var(--color-text-muted)}:focus{outline:none;box-shadow:0 0 0 var(--spacing-small) var(--color-highlight)}a{color:var(--color-link);text-decoration:none;-moz-transition-property:color, background-color;transition-property:color, background-color;-moz-transition-duration:var(--transition);transition-duration:var(--transition)}a:hover{text-decoration:underline}p{margin-top:0;margin-bottom:var(--spacing);max-width:var(--copy-width-limit)}small{display:inline-block;font-size:var(--font-size-small);line-height:var(--line-height)}caption,figcaption{font-size:var(--font-size-small);line-height:var(--line-height);margin-bottom:var(--spacing-half);text-align:left}.h1,.h2,.h3,.h4,.h5,.h6,h1,h2,h3,h4,h5,h6{font-family:var(--font-family-heading);font-weight:var(--font-heading-weight-bold);line-height:var(--line-height-small);padding-top:var(--spacing);margin-top:0;margin-bottom:var(--spacing);word-break:break-word}.h1,h1{font-size:var(--font-size-xxlarge)}.h2,h2{font-size:var(--font-size-xlarge)}.h3,h3{font-size:var(--font-size-large)}.h4,h4{font-size:1.1rem;font-weight:bold}.h5,h5{font-size:1rem;font-weight:bold}.h6,h6{font-size:1rem;font-weight:normal}blockquote{margin-left:var(--spacing);padding:var(--spacing);border-left:var(--spacing-small) solid var(--color-primary)}blockquote > *{margin-top:0}table{border-collapse:collapse;width:100%;margin-bottom:var(--spacing);text-align:left}td,th{padding:var(--spacing-half)}tbody tr{border-bottom:var(--border-weight-thin) solid var(--color-text)}thead{border-bottom:var(--border-weight) solid var(--color-text);font-weight:var(--font-copy-weight-bold)}tfoot{border-top:var(--border-weight) solid var(--color-text);font-weight:var(--font-copy-weight-bold)}code,kbd,pre,samp{background-color:var(--color-gray-lighter);border:var(--border-weight-thin) solid var(--color-gray-medium);border-radius:var(--border-radius-small);padding:var(--spacing-small);font-size:var(--font-size-small);line-height:var(--line-height);font-family:var(--font-family-monospace)}pre{padding:var(--spacing)}mark{background-color:var(--color-highlight);color:var(--color-text)}abbr,acronym{cursor:help;-webkit-text-decoration:underline dotted;text-decoration:underline dotted;-webkit-text-decoration-color:var(--color-gray-medium);-moz-text-decoration-color:var(--color-gray-medium);text-decoration-color:var(--color-gray-medium)}img{max-width:100%;height:auto}figure{padding:0;margin:0 0 var(--spacing)}iframe{border:none;margin-bottom:var(--spacing)}fieldset{border:var(--border-weight-thin) solid var(--color-gray-light);border-radius:var(--border-radius);padding:var(--spacing);margin-bottom:var(--spacing)}fieldset legend{padding-inline:var(--spacing-half);font-weight:var(--font-weight-bold)}label{display:block;margin-bottom:var(--spacing-small);font-weight:var(--font-copy-weight-bold)}input,select,textarea{font-family:var(--font-family-copy);border:var(--border-weight-thin) solid var(--color-black);border-radius:var(--border-radius);padding:var(--spacing-smallish) var(--spacing);min-width:15rem;line-height:var(--line-height-small)}input[type='checkbox'],input[type='radio']{display:inline-block;margin-right:var(--spacing-half);min-width:auto;line-height:var(--line-height-small)}input::-webkit-input-placeholder,select::-webkit-input-placeholder,textarea::-webkit-input-placeholder{color:var(--color-text-muted)}input::-moz-placeholder,select::-moz-placeholder,textarea::-moz-placeholder{color:var(--color-text-muted)}input::-ms-input-placeholder,select::-ms-input-placeholder,textarea::-ms-input-placeholder{color:var(--color-text-muted)}input::placeholder,select::placeholder,textarea::placeholder{color:var(--color-text-muted)}input[disabled],select[disabled],textarea[disabled]{background-color:var(--color-disabled);color:var(--color-gray-medium);border-color:var(--color-gray-medium);cursor:not-allowed}input[aria-invalid='true']{border-color:var(--color-error)}button,input[type='submit'],input[type='button'],input[type='reset'],[role='button'],a.button{display:inline-block;line-height:var(--line-height-small);background-color:var(--color-primary);border:var(--border-weight) solid transparent;border-radius:var(--border-radius);color:var(--color-primary-text);cursor:pointer;text-align:center;font-weight:var(--font-copy-weight-bold);padding:calc(var(--spacing) - var(--border-weight)) var(--spacing-double);min-width:-moz-calc(17rem);min-width:calc(17rem);margin:0 var(--spacing-small) var(--spacing-small) 0;-moz-transition-property:color, background-color, border-color;transition-property:color, background-color, border-color;-moz-transition-duration:var(--transition);transition-duration:var(--transition)}button:hover,input[type='submit']:hover,input[type='button']:hover,input[type='reset']:hover,[role='button']:hover,a.button:hover{background-color:var(--color-primary-hover);color:var(--color-primary-hover-text);text-decoration:none}button[disabled],input[type='submit'][disabled],input[type='button'][disabled],input[type='reset'][disabled],[role='button'][disabled],button[disabled]:hover,input[type='submit'][disabled]:hover,input[type='button'][disabled]:hover,input[type='reset'][disabled]:hover,[role='button'][disabled]:hover{background-color:var(--color-gray-lighter);color:var(--color-text);cursor:not-allowed}button[aria-pressed='true'],input[type='submit'][aria-pressed='true'],input[type='button'][aria-pressed='true'],input[type='reset'][aria-pressed='true'],[role='button'][aria-pressed='true'],a[aria-pressed='true'].button{background-color:var(--color-toggle-on);color:var(--color-toggle-on-text)}button[aria-pressed='false'],input[type='submit'][aria-pressed='false'],input[type='button'][aria-pressed='false'],input[type='reset'][aria-pressed='false'],[role='button'][aria-pressed='false'],a[aria-pressed='false'].button{background-color:var(--color-toggle-off);color:var(--color-toggle-off-text)}button[aria-pressed='false']:hover,input[type='submit'][aria-pressed='false']:hover,input[type='button'][aria-pressed='false']:hover,input[type='reset'][aria-pressed='false']:hover,[role='button'][aria-pressed='false']:hover,a[aria-pressed='false'].button:hover{background-color:var(--color-toggle-hover);color:var(--color-toggle-hover-text)}.page-container{margin-left:auto;margin-right:auto;max-width:var(--page-width);padding-left:var(--spacing);padding-right:var(--spacing)}.page-container-small{margin-left:auto;margin-right:auto;max-width:var(--page-width-small);padding-left:var(--spacing);padding-right:var(--spacing)}.full-container{margin-left:auto;margin-right:auto;padding-left:var(--spacing);padding-right:var(--spacing)}.page-section{margin-bottom:var(--spacing-double)}.content-container{padding-top:var(--spacing-large);margin-bottom:var(--spacing-xlarge)}.center-container{margin-left:auto;margin-right:auto}.text-container{max-width:var(--copy-width-limit)}.h2-alt{font-family:var(--font-family-heading-alt);font-weight:var(--font-family-heading-alt-weight-normal);letter-spacing:var(--font-heading-alt-letter-spacing);font-size:var(--font-size-xlarge)}.h3-alt{font-family:var(--font-family-heading-alt);font-weight:var(--font-family-heading-alt-weight-normal);letter-spacing:var(--font-heading-alt-letter-spacing);font-size:var(--font-size-large)}a.like-text{color:var(--color-text)}.font-small{font-size:var(--font-size-small)}h1 > small,h2 > small,h3 > small,h4 > small{font-size:0.85rem;font-weight:var(--font-copy-weight-normal);font-family:var(--font-family-copy);display:block}.muted{color:var(--color-text-muted)}ul.inline-list{display:inline-block;padding:0;margin:0;list-style-type:none}ul.inline-list li{display:inline-block;padding:0;margin:0}ul.inline-list li + li::before{content:' · ';font-weight:bold;margin-right:var(--spacing-half);margin-left:var(--spacing-half)}ul.no-list{display:inline-block;padding:0;margin:0;list-style-type:none}ul.no-list li{display:inline-block;padding:0;margin:0}button.secondary,input[type='submit'].secondary,input[type='button'].secondary,input[type='reset'].secondary,[role='button'].secondary,a.button.secondary{background-color:var(--color-secondary);color:var(--color-secondary-text);border-color:var(--color-secondary-border)}button.secondary:hover,input[type='submit'].secondary:hover,input[type='button'].secondary:hover,input[type='reset'].secondary:hover,[role='button'].secondary:hover,a.button.secondary:hover{background-color:var(--color-secondary-hover);color:var(--color-secondary-hover-text);border-color:var(--color-secondary-hover-border)}button.alt,input[type='submit'].alt,input[type='button'].alt,input[type='reset'].alt,[role='button'].alt,a.button.alt{background-color:var(--color-alt);color:var(--color-alt-text)}button.alt:hover,input[type='submit'].alt:hover,input[type='button'].alt:hover,input[type='reset'].alt:hover,[role='button'].alt:hover,a.button.alt:hover{background-color:var(--color-alt-hover);color:var(--color-alt-hover-text)}button[aria-pressed='false'].alt,input[type='submit'][aria-pressed='false'].alt,input[type='button'][aria-pressed='false'].alt,input[type='reset'][aria-pressed='false'].alt,[role='button'][aria-pressed='false'].alt,a[aria-pressed='false'].button.alt{background-color:var(--color-blue-light);color:var(--color-text-inverse)}button[aria-pressed='false'].alt:hover,input[type='submit'][aria-pressed='false'].alt:hover,input[type='button'][aria-pressed='false'].alt:hover,input[type='reset'][aria-pressed='false'].alt:hover,[role='button'][aria-pressed='false'].alt:hover,a[aria-pressed='false'].button.alt:hover{background-color:var(--color-blue);color:var(--color-text-inverse)}button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch{--local-padding:-moz-calc(1em / 6);--local-padding:calc(1em / 6);--local-width:4rem;--local-height:2rem;background-color:var(--color-gray-lighter);color:var(--color-text);width:var(--local-width);min-width:0;height:var(--local-height);padding:var(--local-padding);border-radius:var(--border-radius-full);position:relative}:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch) .button-switch-slider{display:block;background-color:var(--color-white);width:-moz-calc(var(--local-height) - (var(--local-padding) * 4));width:calc(var(--local-height) - (var(--local-padding) * 4));height:-moz-calc(var(--local-height) - (var(--local-padding) * 4));height:calc(var(--local-height) - (var(--local-padding) * 4));border-radius:var(--border-radius-full);-webkit-transform:translate(var(--local-padding));-moz-transform:translate(var(--local-padding));transform:translate(var(--local-padding));transition:-webkit-transform 0.2s ease-out;-moz-transition:transform 0.2s ease-out, -moz-transform 0.2s ease-out;transition:transform 0.2s ease-out;transition:transform 0.2s ease-out, -webkit-transform 0.2s ease-out, -moz-transform 0.2s ease-out;border:var(--border-weight) solid var(--color-primary)}[aria-checked='true']:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch){background-color:var(--color-primary)}[aria-checked='true']:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch) .button-switch-slider{-webkit-transform:translate(calc(var(--local-width) - var(--local-height)));-moz-transform:translate(-moz-calc(var(--local-width) - var(--local-height)));transform:translate(calc(var(--local-width) - var(--local-height)))}.small:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch){--local-padding:-moz-calc(1em / 10);--local-padding:calc(1em / 10);--local-width:3rem;--local-height:1.5rem;padding:var(--local-padding);border-radius:var(--border-radius-full)}.alt:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch) .button-switch-slider{border-color:var(--color-blue)}.alt[aria-checked='false']:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch){background-color:var(--color-blue-light)}.alt[aria-checked='true']:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch){background-color:var(--color-blue)}.previous:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch) .button-switch-slider{border-color:var(--color-previous-checked)}.previous[aria-checked='false']:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch){background-color:var(--color-previous-unchecked)}.previous[aria-checked='true']:is(button.button-switch,input[type='submit'].button-switch,input[type='button'].button-switch,input[type='reset'].button-switch,[role='button'].button-switch,a.button.button-switch){background-color:var(--color-previous-checked)}button.like-text,input[type='submit'].like-text,input[type='button'].like-text,input[type='reset'].like-text,[role='button'].like-text,a.button.like-text{display:inline;background-color:inherit;border:none;border-radius:0;color:inherit;cursor:pointer;padding:0;-moz-transition:none;transition:none;display:inline;text-align:left;line-height:var(--line-height);min-width:auto}button.like-link,input[type='submit'].like-link,input[type='button'].like-link,input[type='reset'].like-link,[role='button'].like-link,a.button.like-link{display:inline-block;background-color:inherit;color:var(--color-link)}button.like-link:hover,input[type='submit'].like-link:hover,input[type='button'].like-link:hover,input[type='reset'].like-link:hover,[role='button'].like-link:hover,a.button.like-link:hover{text-decoration:underline}button.compact,input[type='submit'].compact,input[type='button'].compact,input[type='reset'].compact,[role='button'].compact,a.button.compact{font-weight:var(--font-copy-weight-normal);min-width:auto;padding:calc(var(--spacing-smallish) - var(--border-weight)) var(--spacing)}button.small,input[type='submit'].small,input[type='button'].small,input[type='reset'].small,[role='button'].small,a.button.small{font-weight:var(--font-copy-weight-normal);font-size:var(--font-size-small);padding:calc(var(--spacing-half) - var(--border-weight)) var(--spacing-half);border-radius:var(--border-radius-small)}.button-icon{display:inline-block;height:1.1em;width:1.1em;margin-left:-1.5em;margin-right:var(--spacing-half);vertical-align:text-top}.compact .button-icon{display:inline-block;height:1.1em;width:1.1em;margin:0;vertical-align:sub}.form-item{margin-bottom:var(--spacing)}.form-item label{display:block;margin-bottom:var(--spacing-small)}.input-help{font-size:var(--font-size-small);color:var(--color-text-muted);margin:0 var(--spacing-small) 0 0}.form-item:has(.input-help) label{margin-bottom:0}.form-item-inline{display:inline-block;margin-bottom:var(--spacing);margin-right:var(--spacing)}.form-item-inline label{display:inline-block;margin-right:var(--spacing-half)}.checkbox input,.radio input{display:inline-block;margin-right:var(--spacing-half)}.checkbox label,.radio label{display:inline-block}fieldset.checkboxes,fieldset.radios{margin-bottom:var(--spacing-half);padding:0;border:none}fieldset.checkboxes legend,fieldset.radios legend{padding-left:0;display:block;font-weight:var(--font-weight-normal);margin-bottom:var(--spacing-half)}.checkboxes-inline,.radios-inline{margin-bottom:var(--spacing-half);padding:0;border:none}.checkboxes-inline > label,.checkboxes-inline legend,.radios-inline > label,.radios-inline legend{padding-left:0;display:inline-block;font-weight:var(--font-weight-normal);margin-bottom:var(--spacing-half);margin-right:var(--spacing-half)}.checkboxes-inline .checkbox,.radios-inline .radio{display:inline-block;margin-right:var(--spacing)}.tag{display:inline-block;background-color:var(--color-gray-lighter);color:var(--color-text);border-radius:var(--border-radius-small);font-size:var(--font-size-small);font-weight:var(--font-weight-normal);padding:var(--spacing-tiny) var(--spacing-small);margin:0 var(--spacing-small) var(--spacing-small) 0;line-height:var(--line-height)}.tag.alt{background-color:var(--color-alt);color:var(--color-alt-text)}.responsive-table{display:block;overflow-x:auto}@media (max-width: 768px){.responsive-table{overflow-x:scroll}.responsive-table table{width:758px}}.inline-icon{display:inline-block;width:var(--icon-size-inline);margin-right:var(--spacing-half);vertical-align:middle}.inline-icon-square{display:inline-block;width:var(--icon-size-inline);height:var(--icon-size-inline);margin-right:var(--spacing-half);vertical-align:middle}table{margin-bottom:0}tbody tr{border-bottom:none}
    </style><!--]--><!--]--></head><!--]--> <!--[--><body style=""><!--[--><!--[--><div><!--[--><!--[if mso | IE]>
          <table role="presentation" width="100%" align="center" style="max-width:calc(60 * var(--spacing));margin:var(--spacing) auto;" class=""><tr><td></td><td style="width:37.5em;background:#ffffff">
        <![endif]--><!--]--></div> <div style="max-width:calc(60 * var(--spacing));margin:var(--spacing) auto;"><!--[--><!--[--><img alt="" src="https://openomb.org/favicon.ico" width="0" height="0" style="display:block;outline:none;border:none;text-decoration:none;height:var(--spacing-double);width:auto;margin-right:var(--spacing);" align="left"><!--]--> <!--[--><a href="https://openomb.org" target="_blank" style="color:undefined;text-decoration:undefined;line-height:var(--spacing-double);"><!--[-->OpenOMB<!--]--></a><!--]--> <!--[--><hr style="width:100%;border:none;border-top:1px solid #eaeaea;margin-top:var(--spacing);"><!--]--><!--]--></div> <div><!--[--><!--[if mso | IE]>
          </td><td></td></tr></table>
          <![endif]--><!--]--></div><!--]--> <!--[--><div><!--[--><!--[if mso | IE]>
          <table role="presentation" width="100%" align="center" style="max-width:calc(40 * var(--spacing));margin:auto;" class=""><tr><td></td><td style="width:37.5em;background:#ffffff">
        <![endif]--><!--]--></div> <div style="max-width:calc(40 * var(--spacing));margin:auto;"><!--[--><!--[--><!--[--><!--[-->
        <h2 style="">${title}</h2>
        <p style="font-size:undefined;line-height:undefined;margin:undefined;">${text}</p>
        ${buildTemplateSection('Folder', folderSubs)}
        ${buildTemplateSection('TAFS', tafsSubs)}
        ${buildTemplateSection('Agencies', agencySubs)}
        ${buildTemplateSection('Bureaus', bureauSubs)}
        ${buildTemplateSection('Accounts', accountSubs)}
        ${buildTemplateSection('Searches', searchSubs)}
        </div> <div><!--[-->
        <!--[if mso | IE]>
          </td><td></td></tr></table>
          <![endif]--><!--]--></div><!--]--> <!--[--><div><!--[--><!--[if mso | IE]>
          <table role="presentation" width="100%" align="center" style="max-width:calc(60 * var(--spacing));margin:auto;" class=""><tr><td></td><td style="width:37.5em;background:#ffffff">
        <![endif]--><!--]--></div> <div style="max-width:calc(60 * var(--spacing));margin:auto;"><!--[--><!--[-->
        <hr style="width:100%;border:none;border-top:1px solid #eaeaea;"><!--]--> <!--[--><!--[-->
        <p style="font-size:undefined;line-height:undefined;margin:undefined;text-align:center;margin-left:auto;margin-right:auto;" class="font-small muted"><a href="${subscriptionLink}" target="_blank" style="color:undefined;text-decoration:none;">${subscriptionText}</a></p>
        <p style="font-size:undefined;line-height:undefined;margin:undefined;text-align:center;margin-left:auto;margin-right:auto;" class="font-small muted">${disclaimer}</p>
        <!--]--><!--]--></div> <div><!--[--><!--[if mso | IE]>
          </td><td></td></tr></table>
          <![endif]--><!--]--></div><!--]--><!--]--></body><!--]--><!--]-->
  `;
}

function buildTemplateSection(sectionTitle: string, sectionSubs) {
  if (!sectionSubs.length) {
    return '';
  }
  return `
    <h3 style="">${sectionTitle}</h3>
    <dl>
      ${reduce(
        sectionSubs,
        (curr, sub) => `
        ${curr}
        <dt><a href="${deployedBaseUrl}${sub.itemLink}" target="_blank" style="color:undefined;text-decoration:none;">${sub.description}</a>: ${formatNumber(sub.fileCount)} new files</dt>
        ${reduce(
          sub.files,
          (curr, file) => `
          ${curr}
          <dd><a href="${deployedBaseUrl}/file/${file.fileId}" target="_blank" style="color:undefined;text-decoration:none;">${formatFileTitle(file)}</a></dd>
          `,
          ''
        )}
        ${sub.fileCount > maxFilesPerNotificationEntry ? `<dd>... and ${formatNumber(sub.fileCount - maxFilesPerNotificationEntry)} more (<a href="${deployedBaseUrl}/search?${new URLSearchParams({ ...sub.criterion, approvedStart: DateTime.fromJSDate(sub.criterion.approvedStart).toISODate() }).toString()}">View All</a>)</dd>` : ''}
        `,
        ''
      )}
    </dl>
  `;
}
