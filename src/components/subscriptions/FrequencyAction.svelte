<script lang="ts">
  import { resolve } from '$app/paths';
  import { enhance } from '$app/forms';

  export let subId: string;
  export let frequency: 'daily' | 'weekly';
  export let title: string;
  export let subDescription: string = '';
  export let enabled: boolean | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let formProps: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let buttonProps: Record<string, any> = { class: 'auth' };
</script>

<form method="POST" action={resolve('/subscribe?/update')} {...formProps} use:enhance>
  <input type="hidden" name="subId" value={subId} />
  <input type="hidden" name="frequency" value={frequency} />
  <label class="sr-only" for={`frequency-${subId}-${frequency}`}
    >Update Frequency to {frequency}{subDescription ? ` for ${subDescription}` : ''}</label
  >
  <button
    id={`frequency-${subId}-${frequency}`}
    class:outline={!enabled}
    aria-pressed={enabled}
    {...buttonProps}>{title}</button
  >
</form>
