<script>
  import { Link, Text, Heading } from '@sveltelaunch/svelte-5-email';
  import Wrapper from './Wrapper.svelte';

  export let authUrl;
  export let manageSubscriptionsUrl;
</script>

<Wrapper {manageSubscriptionsUrl}>
  <Heading as="h2">Subscribe to OpenOMB</Heading>
  <Text
    style={{
      fontSize: undefined,
      lineHeight: undefined,
      margin: undefined
    }}>Use the link below to subscribe to notifications with this email address.</Text
  >
  <Link
    className="button compact"
    href={authUrl}
    style={{
      color: undefined
    }}>Subscribe</Link
  >

  <Text
    className="font-small muted"
    style={{
      marginTop: 'var(--spacing-double)',
      fontSize: undefined,
      lineHeight: undefined,
      margin: undefined
    }}>If you did not request this email, you can safely ignore it.</Text
  >
</Wrapper>
