<script lang="ts">
  import { Html, Head, Body, Container, Text } from '@sveltelaunch/svelte-5-email';
</script>

<Html lang="en">
  <Head></Head>
  <Body>
    <Container
      style={{
        maxWidth: 'calc(60 * var(--spacing))',
        margin: 'var(--spacing) auto'
      }}
    >
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
