# Emails

## Limited HTML and CSS

Writing HTML and CSS for emails is a bit different than writing for the web. Most email clients have limited support for modern CSS and HTML features. For example, most email clients do not support CSS Grid, Flexbox, or even media queries. This means that emails need to be designed with these limitations in mind.

The current processing for templates helps with the following:

- Uses [svelte-email](https://github.com/carstenlebek/svelte-email) library to make it more straightforward to use specific HTML tags and CSS properties.
  - Note that this is an forked version of an unmaintained library, but is also not very maintained, so may not be a good solution in the long run.
- Inlines CSS styles to elements.
- Other processing via [juice](https://github.com/Automattic/juice) such as:
  - Converting CSS variables to values.
  - Removes unused CSS.
- Includes a few of the global styles from the main application.
  - Though note that things like media queries don't translate given current tooling.
  - Which files are included is managed in `email/templates.ts`

It is still up to you to make sure that that you use HTML and CSS that is going to be supported across most email clients. Some resources for this are the following:

- [Campaign Monitor's CSS Support Guide](https://www.campaignmonitor.com/css/)
- [Can I email...](https://www.caniemail.com/)

## Templates

Email templates are managed in Svelte components in `email/templates/`.

To use the templates in some server-side service, you can do something like the following:

```typescript
import { compileTemplates } from 'email/templates';

const templates = await compileTemplates();
const templateData = {
  name: 'John Doe',
  ...
};

// Generally the HTML output should have everything in it, but there is
// also a `head` and `css` property
const { html } = templates['FileNotification'].render(templateData);
```

## Previewing

To run a local development server on port `5175` to preview the email templates, run the following:

```bash
npm run dev:email
```

This will preview the email in the browser which is good for faster development, but is limited as most email clients have a limited ability to render HTML and CSS. To send an example email to a real email address, run the following:

```bash
npm run email -- --address test@example.com --template FileNotificationEmail
```

To send this directly, you can set the following environment variables:

```bash
# Only Gmail is supported at moment
process.env.DEV_EMAIL_SERVICE=Gmail
process.env.DEV_EMAIL_USER
# Make sure to generate an app password for this
process.env.DEV_EMAIL_PASS
```

**TODO** To use the notification service instead of directly sending an email, use the following flag: `--use-notification-service`.
