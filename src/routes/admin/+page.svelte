<script lang="ts">
  import type { PageData } from './$types';
  import { formatDate, formatNumber } from '$lib/formatters';
  import UrlPagination from '$components/pagination/UrlPagination.svelte';

  export let data: PageData;
  $: ({ users, userCount, pageSize } = data);
</script>

<div class="page-container content-container">
  <h1>Admin: Users</h1>

  <table>
    <thead>
      <tr>
        <td>Email</td>
        <td>Created</td>
        <td>Email Verified</td>
        <td>Subscriptions</td>
      </tr>
    </thead>

    {#if !users || users.length === 0}
      <tbody>
        <tr>
          <td colspan="4">No users found.</td>
        </tr>
      </tbody>
    {:else}
      <tbody>
        {#each users as user (user.id)}
          <tr>
            <td><a href="/admin/user/{user.id}">{user.email}</a></td>
            <td>{formatDate(user.createdAt, 'medium')}</td>
            <td>{user.emailVerified ? 'Yes' : 'No'}</td>
            <td>{formatNumber(user.subscriptionCount)}</td>
          </tr>
        {/each}
      </tbody>
    {/if}
  </table>

  <UrlPagination perPage={pageSize} total={userCount} />
</div>

<style>
  .page-container {
    min-height: 60vh;
  }
</style>
