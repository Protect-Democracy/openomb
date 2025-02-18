// Valid types of items to subscribe to.  Order matters here as this
// is used for soting.
export const subscriptionTypes = ['folder', 'agency', 'bureau', 'account', 'tafs', 'search'];
export const subscriptionTypeTitles = {
  folder: 'Folders',
  agency: 'Agencies',
  bureau: 'Bureaus',
  account: 'Accounts',
  tafs: 'TAFS',
  search: 'Searches'
};

// Feature flag for testing subscriptions
export const subscribeFeatureEnabled = true;

// Used in server script, max files that can be listed for a single notification item
// (Rest are cut off, but full count is shown)
export const maxFilesPerNotificationEntry = 20;

// Day that weekly emails are run
export const runWeeklyEmailsOn = 1; //Monday

// Email addresses for notifications
export const notifierEmailName = 'OpenOMB Notifications';
export const notifierEmail = 'notifier@openomb.org';
export const replyEmailName = 'OpenOMB Support';
export const replyEmail = 'support@openomb.org';
