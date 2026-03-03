<!--
  Checkbox Button Group Element

  Params
    - options: array of strings or objects
    - formatOptionLabel?: function to get label from option
    - formatOptionValue?: function to get value from option
    - name: form input name
    - id?: form input id (if different from name)
    - value?: selected values
    - multi?: boolean, true if multiple values allowed
  Slots
    None
-->

<script lang="ts">
  import { createToggleGroup } from '@melt-ui/svelte';
import { createEventDispatcher } from 'svelte';

  export let options: string[];
  export let multi = false;
  export let id;
  export let name;

  let defaultValue;
  export { defaultValue as value };

  export let buttonClass = '';
  export let formatOptionLabel = (o: string) => o;
  export let formatOptionValue = (o: string) => o;

const dispatch = createEventDispatcher();
const {
  elements: { root, item },
  states: { value },
  helpers: { isPressed }
} = createToggleGroup({
  type: multi ? 'multiple' : 'single',
  defaultValue,
  onValueChange: ({ next }) => {
    dispatch('change', next);
    return next;
  }
});

  // Our selected values do not properly clear on reset, so we need to
  //  add an event to our form input(s)
  //  https://github.com/sveltejs/svelte/issues/2659#issuecomment-877758546
  function fixFormReset(el: HTMLInputElement) {
    const form = el.form;
    if (!form) {
      return;
    }

  const handleReset = () => {
    // Set timeout is needed since `el.value` is only updated on the next frame
    setTimeout(() => value.set(multi ? [] : ''));
  };
  form.addEventListener('reset', handleReset);

  return {
    destroy() {
      form.removeEventListener('reset', handleReset);
    }
  };
}
</script>

<div class="has-js-only-block">
  <div {...$root} use:root class="toggle-group" aria-label={name}>
    {#each options as option}
      <button
        class="compact toggle-item {buttonClass}"
        {...$item(`${formatOptionValue(option)}`)}
        use:item
        aria-label={formatOptionLabel(option)}
        aria-pressed={$isPressed(`${formatOptionValue(option)}`)}
      >
        {formatOptionLabel(option)}
      </button>
    {/each}
  </div>
</div>

<!-- No-js backup, but also used to track the value of our js form element -->
<div class="no-js-only-block checkboxes-inline">
  {#each options as option}
    <div class="checkbox">
      <input
        type="checkbox"
        {name}
        id={id || name}
        value={formatOptionValue(option)}
        checked={$value?.includes(`${formatOptionValue(option)}`)}
        use:fixFormReset
      />
      <label for={formatOptionValue(option)}>
        {formatOptionLabel(option)}
      </label>
    </div>
  {/each}
</div>

<style>
  button {
    margin-right: var(--spacing-smallish);
  }
</style>
