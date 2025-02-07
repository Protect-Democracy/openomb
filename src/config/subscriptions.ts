// Valid types of items to subscribe to
export const subscriptionTypes = ['search', 'folder', 'agency', 'bureau', 'account', 'tafs'];

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
