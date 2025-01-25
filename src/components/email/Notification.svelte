<script>
  /** This file is not used yet!
   * In order to use this template, we need to integrate our svelte build process
   * into our notify script.
   */
  import { Link, Text, Heading } from '@sveltelaunch/svelte-5-email';
  import Wrapper from './Wrapper.svelte';
  import { formatFileTitle } from '$lib/formatters';

  export let baseUrl;
  export let subscriptions;
  export let manageSubscriptionsUrl;
</script>

<Wrapper {manageSubscriptionsUrl}>
  <Heading as="h2">OpenOMB Update - New Approved Files</Heading>
  <Text
    style={{
      fontSize: undefined,
      lineHeight: undefined,
      margin: undefined
    }}
    >New apportionment files have been approved within your subscriptions. These files are listed
    below.</Text
  >
  {#each subscriptions as sub}
    <dl>
      <dt>
        <Link
          href={`${baseUrl}${sub.itemLink}`}
          style={{
            color: undefined
          }}>{sub.description}</Link
        >: {sub.fileCount} approved apportionments
      </dt>
      {#each sub.files as file}
        <dd>
          <Link
            href={`${baseUrl}/file/${file.fileId}`}
            style={{
              color: undefined
            }}>{formatFileTitle(file)}</Link
          >
        </dd>
      {/each}
      }
    </dl>
  {/each}
</Wrapper>
