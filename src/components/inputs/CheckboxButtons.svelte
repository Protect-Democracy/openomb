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

  export let options: string[] | Record<string, unknown>[];
  export let multi = false;
  export let id;
  export let name;
  let defaultValue;
  export { defaultValue as value };

  export let formatOptionLabel = (o) => o;
  export let formatOptionValue = (o) => o;

  const {
    elements: { root, item },
    states: { value },
    helpers: { isPressed }
  } = createToggleGroup({
    type: multi ? 'multiple' : 'single',
    defaultValue
  });

  // Our selected values do not properly clear on reset, so we need to
  //  add an event to our hidden input
  //  https://github.com/sveltejs/svelte/issues/2659#issuecomment-877758546
  function fixFormReset(el) {
    const form = el.form;
    if (!form) return;
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

<input
  id={id || name}
  {name}
  type="hidden"
  value={multi ? JSON.stringify($value) : $value}
  use:fixFormReset
/>
<div {...$root} use:root class="toggle-group" aria-label={name}>
  {#each options as option}
    <button
      class="compact toggle-item"
      {...$item(`${formatOptionValue(option)}`)}
      use:item
      aria-label={formatOptionLabel(option)}
      aria-pressed={$isPressed(`${formatOptionValue(option)}`)}
    >
      {formatOptionLabel(option)}
    </button>
  {/each}
</div>
