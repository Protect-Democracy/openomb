# Emails

### Templates

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
