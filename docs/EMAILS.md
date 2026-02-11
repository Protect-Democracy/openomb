# Emails

## Limited HTML and CSS

Writing HTML and CSS for emails is a bit different than writing for the web. Most email clients have limited support for modern CSS and HTML features. For example, most email clients do not support CSS Grid, Flexbox, or even media queries. This means that emails need to be designed with these limitations in mind.

The current processing for templates helps with the following:

- Inlines CSS styles to elements.
  - Global styles will get inlined automatically.
  - **Local styles should be manually inlined.**
    - TODO: This is due to using email components in SvelteKit which configures CSS to be external, so when rendering a component we can't get the CSS out for it. Maybe there will be a way around it at some point.
- Other processing via [juice](https://github.com/Automattic/juice) such as:
  - Converting CSS variables to values.
  - Removes unused CSS.
- Includes a few of the global styles from the main application.
  - Though note that things like media queries don't translate given current tooling.

It is still up to you to make sure that that you use HTML and CSS that is going to be supported across most email clients. Some resources for this are the following:

- [Campaign Monitor's CSS Support Guide](https://www.campaignmonitor.com/css/)
- [Can I email...](https://www.caniemail.com/)

## Templates

Email templates are managed in Svelte components in `email/templates/`.

To use the templates in some server-side service, you can do something like the following:

```typescript
import SubscriptionEmail from 'email/templates/SubscriptionEmail.svelte';
import { renderTemplate } from 'email/render';

const output = renderTemplate(SubscriptionEmail, { subscriptions: [] });
```

### Adding templates

- Add actual templates to `email/templates/`.
- (suggested) Update previews in `src/routes/examples/+page.server.ts`.

## Previewing

Email template previews can be seen in the browser when running the web application locally with `npm run dev`, the going to:

```
http://localhost:3000/examples
```

This will preview the email in the browser which is good for faster development, but is limited as most email clients have a limited ability to render HTML and CSS.

### Send email

To send an example email to a real email address, run the following:

```bash
# This will try to use some test data
npm run dev:test-email -- --address test@example.com --template FileNotificationEmail
# This will pull data from a user in the system and fake a last notified date
npm run dev:test-email -- --address test@example.com --template FileNotificationEmail --user example.user@example.com --subscription-last-notified 1970-01-01
```

### Testing with Mailpit

This is setup for the automated testing, but for manual testing and development, you can set up a Mailpit server locally with something like the following. Where `1025` is the SMTP port and `8025` is the UI port:

```bash
docker run -d \
--name=mailpit \
--restart unless-stopped \
-e MP_SMTP_AUTH_ACCEPT_ANY=1 \
-e MP_SMTP_AUTH_ALLOW_INSECURE=1 \
-p 8025:8025 \
-p 1025:1025 \
axllent/mailpit
```

Then use the following environment variables to configure the application to send emails to Mailpit:

```bash
APPORTIONMENTS_EMAIL_SERVICE_TYPE=smtp
APPORTIONMENTS_EMAIL_SMTP_HOST=localhost
APPORTIONMENTS_EMAIL_SMTP_PORT=1025
APPORTIONMENTS_EMAIL_SMTP_USER=test
APPORTIONMENTS_EMAIL_SMTP_PASSWORD=test
```

## Mailgun

To use the Mailgun email service, set the following environment variables:

```bash
APPORTIONMENTS_EMAIL_SERVICE_TYPE=mailgun
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_API_KEY=your-mailgun-api-key
```
