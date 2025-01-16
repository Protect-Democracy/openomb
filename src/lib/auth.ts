import { notifierEmailName, notifierEmail } from '$config/subscriptions';

// This code only runs on the server, so we want private env variables.
//  (this avoids setting the notifications uri in the client env)
import { environmentVariables } from '../../server/utilities';

const env = environmentVariables();

/**
 * Send the email that is used to verify and log in a user
 */
export async function sendVerificationRequest(params) {
  const { identifier: to, url, theme } = params;
  const { host } = new URL(url);
  const res = await fetch(`${env.notificationsServiceUri}/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: notifierEmail,
      from_name: notifierEmailName,
      to,
      title: `Sign in to ${host}`,
      html: html({ url, host, theme }),
      text: text({ url, host })
    })
  });

  if (!res.ok) throw new Error('Resend error: ' + JSON.stringify(await res.json()));
}

function text(params: { url: string; host: string }) {
  const { url } = params;

  return `Please click here to authenticate - ${url}`;
}

function html(params: { url: string; host: string; theme: Theme }) {
  const { url, host, theme } = params;

  const escapedHost = host.replace(/\./g, '&#8203;.');

  const brandColor = theme.brandColor || '#346df1';
  const color = {
    background: '#f9f9f9',
    text: '#444',
    mainBackground: '#fff',
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: theme.buttonText || '#fff'
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}
