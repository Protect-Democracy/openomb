<!--
  Searchable Select Element

  Params
    - options: array of strings or objects
    - formatOptionLabel?: function to get label from option
    - formatOptionValue?: function to get value from option
    - formatGroupLabel?: function to get group label from option
    - formatGroupValue?: function to get group value from option (if group is desired in value)
    - name: form input name
    - id?: form input id (if different from name)
    - value?: selected values
    - multi?: boolean, true if multiple values allowed
  Slots
    None
-->

<script lang="ts">
  import { createCombobox } from '@melt-ui/svelte';
import { fly } from 'svelte/transition';
import { createEventDispatcher } from 'svelte';
import { groupBy, uniqBy } from 'lodash-es';
import ChevronDown from '$components/icons/ChevronDown.svelte';

export let options: string[] | Record<string, unknown>[];
export let multi = false;
export let id: string;
export let name: string;
export let value: string | string[];

export let formatOptionLabel: (option: any) => string = (o) => o;
export let formatOptionValue: (option: any) => string = (o) => o;
export let formatGroupLabel: ((option: any) => string) | undefined = undefined;
export let formatGroupValue: ((option: any) => string) | undefined = undefined;
// Used to combine the group and option value together separated by comma.  This
// has been the default, so default to true.  If false, then just the
// formatOptionValue will determine the value regardless if a formatGroupValue
// is set.
export let combineGroupValue = true;

// Constants
const emptyOption = { value: '', label: 'None' };

// Get our option(s) that correspond to the provided value
function getDefaultSelection() {
  if (!multi && !value) {
    return emptyOption;
  }

  const defaultSelected = options
    .filter((o) =>
      Array.isArray(value)
        ? value.includes(formatGroupOptionValue(o))
        : formatGroupOptionValue(o) === value
    )
    .map((o) => ({
      value: formatGroupOptionValue(o),
      label: formatOptionLabel(o)
    }));
  return multi ? defaultSelected : defaultSelected?.[0];
}

// Melt combobox
const dispatch = createEventDispatcher();
const {
  elements: { menu, input, option, group, groupLabel },
  states: { open, inputValue, touchedInput, selected },
  helpers: { isSelected, isHighlighted }
} = createCombobox({
  forceVisible: true,
  multiple: multi,
  defaultSelected: getDefaultSelection(),
  ids: { label: id },
  onSelectedChange: ({ next }) => {
    dispatch('change', next);
    return next;
  },
  onOpenChange: ({ next }) => {
    if (!next) {
      inputValue.set(''); //Clear input when options are chosen & dialog is closed
    }
    return next;
  }
});

// Derived
// For some reason the store, $open, causes issues with sveltekit rendering,
// specifically it claims the $open store is undefined.
$: openProxy = typeof $open !== 'undefined' ? $open : false;
$: groupedOptions = formatGroupLabel
  ? groupBy(uniqBy(options, formatGroupOptionValue), formatGroupLabel)
  : {
      Options: options
    };

$: filteredGroupOptions = $touchedInput
  ? Object.keys(groupedOptions).reduce((filteredGroupObject, groupName) => {
      const normalizedInput = $inputValue.toLowerCase();
      const filteredOptions = groupName.toLowerCase().includes(normalizedInput)
        ? groupedOptions[groupName]
        : groupedOptions[groupName].filter((o) =>
            formatOptionLabel(o).toLowerCase().includes(normalizedInput)
          );
      if (filteredOptions.length) {
        filteredGroupObject[groupName] = filteredOptions;
      }
      return filteredGroupObject;
    }, {})
  : groupedOptions;

function placeholderText(selectedOptions) {
  // Option is empty (undefined or empty array)
  if (
    !selectedOptions ||
    (!Array.isArray(selectedOptions) && !selectedOptions.value) ||
    (Array.isArray(selectedOptions) && !selectedOptions.length)
  ) {
    return 'Type here to filter options';
  }
  // Single option is selected
  if (!Array.isArray(selectedOptions)) {
    return selectedOptions.label;
  }
  // Array of options is selected
  return `${selectedOptions.length} value(s) selected`;
}

function formatGroupOptionValue(option) {
  // If we want our group value returned as well, return both
  if (formatGroupValue && combineGroupValue) {
    return `${formatGroupValue(option)},${formatOptionValue(option)}`;
  }

  // Otherwise just return the option value
  return formatOptionValue(option);
}

// Our selected values do not properly clear on reset, so we need to
//  add an event to our form input(s)
//  https://github.com/sveltejs/svelte/issues/2659#issuecomment-877758546
function fixFormReset(el) {
  const form = el.form;
  if (!form) return;
  const handleReset = () => {
    // Set timeout is needed since `el.value` is only updated on the next frame
    setTimeout(() => selected.set(multi ? [] : emptyOption));
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
  <div
    class="search-select"
    class:is-open={openProxy}
    class:has-selected={$selected && $selected.value}
  >
    <div class="input-wrapper">
      <!-- TODO: Having the value as the placeholder doesn't seem right. -->
      <input
        {...$input}
        use:input
        placeholder={placeholderText($selected)}
        id={`${id || name}-input`}
      />

      <div class="icon">
        <ChevronDown />
      </div>
    </div>

    {#if openProxy}
      <ul class="search-select-menu" {...$menu} use:menu transition:fly={{ duration: 150, y: -5 }}>
        <!-- TODO: It's not valid HTML to use div's inside ul like this, but Melt UI uses this in example. -->

        <!-- eslint-disable -->

        <!-- This still gives an eslint issue -->
        <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
        <div tabindex="0">
          {#if multi && $selected && $selected.length}
            <div class="group" {...$group('selected')} use:group>
              <div class="group-label" {...$groupLabel('selected')} use:groupLabel>Selected</div>
              {#each $selected as selectedValue}
                <li
                  class:selected
                  class:highlighted={$isHighlighted(formatGroupOptionValue(selectedValue.value))}
                  {...$option({
                    value: selectedValue.value,
                    label: selectedValue.label
                  })}
                  use:option
                >
                  {selectedValue.label}
                </li>
              {/each}
            </div>
          {/if}

          {#if !multi}
            <li
              class:selected={$isSelected(emptyOption.value)}
              class:highlighted={$isHighlighted(emptyOption.value)}
              {...$option(emptyOption)}
              use:option
            >
              {emptyOption.label}
            </li>
          {/if}

          {#each Object.keys(filteredGroupOptions) as groupName}
            <div class="group" {...$group(groupName)} use:group>
              <div class="group-label" {...$groupLabel(groupName)} use:groupLabel>
                {groupName}
              </div>

              {#each filteredGroupOptions[groupName] as opt (formatGroupOptionValue(opt))}
                <li
                  class:selected={$isSelected(formatGroupOptionValue(opt))}
                  class:highlighted={$isHighlighted(formatGroupOptionValue(opt))}
                  {...$option({
                    value: formatGroupOptionValue(opt),
                    label: formatOptionLabel(opt)
                  })}
                  use:option
                >
                  {formatOptionLabel(opt)}
                </li>
              {/each}
            </div>
          {:else}
            <li class="no-results"><em>No results found</em></li>
          {/each}
        </div>

        <!-- eslint-enable -->
      </ul>
    {/if}
  </div>
</div>

<!-- No-js backup, but also used to track the value of our js form element -->
<div class="no-js-only-block">
  <select {name} id={id || name} multiple={multi} use:fixFormReset>
    <option value={emptyOption.value} selected={$isSelected(emptyOption.value)}>
      {emptyOption.label}
    </option>
    {#each Object.keys(filteredGroupOptions) as groupName}
      <optgroup label={groupName}>
        {#each filteredGroupOptions[groupName] as opt (formatGroupOptionValue(opt))}
          <option
            selected={$isSelected(formatGroupOptionValue(opt))}
            value={formatGroupOptionValue(opt)}
          >
            {formatOptionLabel(opt)}
          </option>
        {/each}
      </optgroup>
    {/each}
  </select>
</div>

<style>
  .input-wrapper {
    position: relative;
  }

  .input-wrapper input {
    width: 100%;
    padding-right: var(--spacing-double);
  }

  .has-selected .input-wrapper input::placeholder {
    color: var(--color-text);
  }

  .input-wrapper .icon {
    position: absolute;
    top: 50%;
    right: var(--spacing);
    translate: 0 calc(-50% + 1px);
    width: var(--spacing);
    transition: var(--transition);
  }

  .is-open .input-wrapper .icon {
    transform: rotate(180deg);
  }

  .is-open .input-wrapper input {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  ul {
    list-style: none;
    max-height: min(90vh, calc(var(--spacing) * 15));
    background-color: var(--color-background);
    overflow-y: scroll;
    margin: 0;
    padding: 0;
    border-left: var(--border-weight) solid var(--color-text);
    border-bottom: var(--border-weight) solid var(--color-text);
    border-right: var(--border-weight) solid var(--color-text);
    border-bottom-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    font-size: var(--font-size-small);
  }

  ul[data-side='top'] {
    border-bottom: none;
    border-top: var(--border-weight) solid var(--color-text);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-top-left-radius: var(--border-radius);
    border-top-right-radius: var(--border-radius);
  }

  /* The ul gets taken out of the flow when the menu is open. */
  :global(ul.search-select-menu) {
    z-index: 9999;
  }
  :global(body:has(ul.search-select-menu[data-side='top'])) .is-open .input-wrapper input {
    border-bottom-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .group {
    padding: var(--spacing-thin) var(--spacing-half);
  }

  li {
    cursor: pointer;
    padding: var(--spacing-thin) var(--spacing-half);
  }

  li.selected {
    background-color: var(--color-highlight);
  }

  li.highlighted {
    background-color: var(--color-highlight);
  }

  .group {
    margin: var(--spacing-half) 0;
  }

  .group-label {
    font-weight: var(--font-copy-weight-bold);
  }

  .no-results {
    padding: var(--spacing);
  }
</style>
