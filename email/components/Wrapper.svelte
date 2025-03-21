<script lang="ts">
  import { siteName, deployedBaseUrl } from '../../src/config/index';

  // TODO: How to handle images in email templates?

  export let title: string;
  export let subscriptionsUrl: string = `${deployedBaseUrl}/subscribe`;
  export let unsubscribable: boolean = true;
</script>

<div
  style="max-width: 800px; margin-left: auto; margin-right: auto; margin-top: 1rem; padding-left: 1rem; padding-right: 1rem;"
>
  <!-- In the site, we build with fonts, but can't in email.  Fonts support is not 100% great, but worth trying. -->
  <link
    href="https://fonts.googleapis.com/css2?family=Domine:wght@400..700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap"
    rel="stylesheet"
  />

  <div class="header">
    <table class="layout">
      <tbody>
        <tr>
          <td style="width: 75px;">
            <img
              src="{deployedBaseUrl}/static-assets/email/logo-192.png"
              style="width: 50px; height: 50px;"
              alt="OpenOMB logo"
            />
          </td>

          <td style="text-align: left;">
            <a
              class="h1"
              href={deployedBaseUrl}
              target="_blank"
              style="font-size: 2rem; text-decoration: none; color: var(--color-text); display: block;"
              >{siteName}</a
            >
          </td>
        </tr>
      </tbody>
    </table>

    <hr />
  </div>

  {#if title}
    <h2>{title}</h2>
  {/if}

  <slot />

  <div
    style="margin-top: 3rem; background-color: var(--color-blue-lightest); padding: 1.5rem 1.5rem;"
  >
    <p class="font-small">
      To {#if unsubscribable}unsubscribe from these emails and to
      {/if} manage your account, visit the
      <a href={subscriptionsUrl} target="_blank">Subscriptions Page</a>
      on {siteName}.
    </p>

    <p class="font-small muted" style="line-height: 1.3; margin-bottom: 0;">
      {siteName} is not affiliated with the Office of Management and Budget (OMB), the Executive Office
      of the President, the U.S. Congress, or any component of the U.S. government. OpenOMB is a searchable
      database maintained by Protect Democracy Project, a registered 501(c)(3) charitable organization
      and part of the Protect Democracy group.
    </p>
  </div>
</div>
