<script lang="ts">
  import type { PageData } from './$types';
import { derived } from 'svelte/store';
import { page } from '$app/stores';
import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
import SearchSubscribe from '$components/subscriptions/SearchSubscribe.svelte';

export let data: PageData;
let emailTemplates = [];
let emailTemplate = '';

// Stores
const url = derived(page, ($page) => $page.url);
$: emailTemplates = Object.keys(data.emailExamples);
$: emailTemplate = emailTemplate || emailTemplates[0];
</script>

<svelte:head>
  <meta name="robots" content="noindex,follow" />
</svelte:head>

<div class="page-container content-container">
  <h2>Emails previews</h2>

  <div>
    {#each emailTemplates as template}
      <button
        class="small compact"
        class:secondary={emailTemplate != template}
        on:click={() => (emailTemplate = template)}>{template}</button
      >
    {/each}
  </div>

  <iframe class="email-example" srcdoc={data.emailExamples[emailTemplate]} title="Email previews"
  ></iframe>
</div>

<style>
  .email-example {
    border: 3px solid var(--color-text);
    margin: 1rem 0;
    width: 100%;
    height: 800px;
    max-height: 90vh;
  }
</style>
