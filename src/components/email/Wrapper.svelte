<script lang="ts">
  import { Html, Head, Body, Hr, Link, Container, Img, Text } from '@sveltelaunch/svelte-5-email';
  import { siteName, deployedBaseUrl } from '$config/index.ts';

  import * as globalCss from '../../styles/email.css';

  export let manageSubscriptionsUrl;
</script>

<Html lang="en">
  <Head>
    <!-- We have to split the style tags up for the preprocessor -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html `<` +
      `style>
      ${globalCss?.default}
    </style` +
      `>`}
  </Head>
  <Body>
    <Container
      style={{
        maxWidth: 'calc(60 * var(--spacing))',
        margin: 'var(--spacing) auto'
      }}
    >
      <Img
        src={`${deployedBaseUrl}/favicon.ico`}
        align="left"
        style={{
          height: 'var(--spacing-double)',
          width: 'auto',
          marginRight: 'var(--spacing)'
        }}
      />
      <Link
        href={deployedBaseUrl}
        style={{
          lineHeight: 'var(--spacing-double)',
          textDecoration: undefined,
          color: undefined
        }}>{siteName}</Link
      >
      <Hr
        style={{
          marginTop: 'var(--spacing)'
        }}
      />
    </Container>

    <Container
      style={{
        maxWidth: 'calc(40 * var(--spacing))',
        margin: 'auto'
      }}
    >
      <slot />
    </Container>

    <Container
      style={{
        maxWidth: 'calc(60 * var(--spacing))',
        margin: 'auto'
      }}
    >
      <Hr />
      {#if manageSubscriptionsUrl}
        <Text
          className="font-small muted"
          style={{
            textAlign: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: undefined,
            lineHeight: undefined,
            margin: undefined
          }}
        >
          <Link
            href={manageSubscriptionsUrl}
            style={{
              color: undefined
            }}>Manage Subscriptions</Link
          >
        </Text>
      {/if}
      <Text
        className="font-small muted"
        style={{
          textAlign: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
          fontSize: undefined,
          lineHeight: undefined,
          margin: undefined
        }}
      >
        This website is not affiliated with the Office of Management and Budget (OMB), the Executive
        Office of the President, the U.S. Congress, or any component of the U.S. government. OpenOMB
        is a searchable database maintained by Protect Democracy Project, a registered 501(c)(3)
        charitable organization and part of the Protect Democracy group.
      </Text>
    </Container>
  </Body>
</Html>
