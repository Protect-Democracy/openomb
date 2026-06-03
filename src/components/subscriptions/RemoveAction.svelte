<script lang="ts">
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';

  export let subId: string;
  export let subDescription: string = '';
  export let title: string = 'Remove';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let formProps: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let buttonProps: Record<string, any> = { class: 'auth' };
</script>

<form method="POST" action={resolve('/subscribe?/remove')} {...formProps} use:enhance>
  <input type="hidden" name="subId" value={subId} />
  <label class="sr-only" for={`remove-${subId}`}
    >Remove Subscription{subDescription ? ` to ${subDescription}` : ''}</label
  >
  <button id={`remove-${subId}`} {...buttonProps}>{title}</button>
</form>
