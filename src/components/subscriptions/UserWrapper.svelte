<script lang="ts">
  /**
   * Wrapper component that will fetch the user data on the client
   * side and render appropriate children.
   *
   * Usage
   *
   * <UserWrapper>
   *   <p>Content for logged in users</p>
   *   <p slot="no-user">Content for users not logged in</p>
   *   <p slot="before-check">Content while checking for user</p>
   * </UserWrapper>
   */
  import { onDestroy, onMount } from 'svelte';
  import type { User } from '$lib/users';

  // Props; allows the user to come from server if needed.
  export let user: User | undefined = undefined;

  // State
  let checked = false;
  // Guards against mutating state after this instance has been torn down,
  // since fetchUser's async continuation can resolve post-destroy.
  let destroyed = false;
  const controller = new AbortController();

  // Lifecycle
  onMount(() => {
    fetchUser();
    checked = true;
  });

  onDestroy(() => {
    destroyed = true;
    controller.abort();
  });

  // Methods
  async function fetchUser() {
    try {
      const res = await fetch('/api/v1/user', { signal: controller.signal });
      if (destroyed) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (destroyed) {
          return;
        }
        if (data?.results?.loggedIn && data?.results?.user) {
          user = data.results.user;
        } else {
          user = undefined;
        }
      } else {
        user = undefined;
      }
    } catch (error) {
      if (destroyed || (error instanceof Error && error.name === 'AbortError')) {
        return;
      }
      console.error('Error fetching user:', error);
      user = undefined;
    }
  }
</script>

{#if user}
  <slot></slot>
{:else if !user && checked}
  <slot name="no-user"></slot>
{:else}
  <slot name="before-check"></slot>
{/if}
