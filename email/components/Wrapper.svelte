<script lang="ts">
  import { Container, Text, Img, Hr, Heading } from '@sveltelaunch/svelte-5-email';
  // Note that most email clients don't support Base64 images
  // https://www.caniemail.com/features/image-base64/
  import logoImage from '../../src/assets/favicon/android-chrome-192x192.png?inline&width=50&height=50';
  import { siteName, deployedBaseUrl } from '../../src/config/index.ts';

  export let title: string;
  export let subscriptionsUrl: string = `${deployedBaseUrl}/subscribe`;
  export let unsubscribable: boolean = true;
</script>

<Container
  style={{
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '1rem',
    paddingLeft: '1rem',
    paddingRight: '1rem'
  }}
>
  <!-- In the site, we build with fonts.  Fonts support is not 100% great, but worth trying. -->
  <link
    href="https://fonts.googleapis.com/css2?family=Domine:wght@400..700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap"
    rel="stylesheet"
  />

  <div class="header">
    <Img
      src={logoImage}
      alt="OpenOMB logo"
      align="left"
      style={{
        width: '50px',
        height: '50px',
        marginBottom: '1rem',
        marginRight: '1rem'
      }}
    />

    <a href={deployedBaseUrl} target="_blank"
      ><Heading as="h1" style={{ fontSize: '2rem' }}>{siteName}</Heading></a
    >

    <Hr style={{ marginTop: '1rem' }} />
  </div>

  {#if title}
    <Heading as="h2" style={{ fontSize: '1.5rem' }}>{title}</Heading>
  {/if}

  <slot />

  <div class="footer">
    <Text>
      To {#if unsubscribable}unsubscribe from these emails and to
      {/if} manage your account, visit the
      <a href={subscriptionsUrl} target="_blank">Subscriptions Page</a>
      on {siteName}.
    </Text>

    <Text className="font-small muted">
      <span class="small-text"
        >{siteName} is not affiliated with the Office of Management and Budget (OMB), the Executive Office
        of the President, the U.S. Congress, or any component of the U.S. government. OpenOMB is a searchable
        database maintained by Protect Democracy Project, a registered 501(c)(3) charitable organization
        and part of the Protect Democracy group.
      </span>
    </Text>
  </div>
</Container>

<style>
  .header {
    margin-bottom: 1rem;
  }

  .header a {
    text-decoration: none;
    color: var(--color-text);
    display: block;
  }

  .footer {
    margin-top: 3rem;
    background-color: var(--color-blue-lightest);
    padding: 1rem 2rem;
  }

  .small-text {
    line-height: 1.3;
  }
</style>
