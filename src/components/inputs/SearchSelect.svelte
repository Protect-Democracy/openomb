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
  import { groupBy } from 'lodash-es';
  import ChevronDown from '$components/icons/ChevronDown.svelte';

  export let options: string[];
  export let multi = false;
  export let id;
  export let name;
  export let value;

  export let formatOptionLabel = (o) => o;
  export let formatOptionValue = (o) => o;
  export let formatGroupLabel;
  export let formatGroupValue;

  // Get our option(s) that correspond to the provided value
  function getDefaultSelection() {
    if (!multi && !value) {
      return { value, label: '' };
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

  const dispatch = createEventDispatcher();
  const {
    elements: { menu, input, option, hiddenInput, group, groupLabel },
    states: { open, inputValue, touchedInput, selected },
    helpers: { isSelected, isHighlighted }
  } = createCombobox({
    forceVisible: true,
    multiple: multi,
    defaultSelected: getDefaultSelection(),
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

  const groupedOptions = formatGroupLabel
    ? groupBy(options, formatGroupLabel)
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
    if (formatGroupValue) {
      return `${formatGroupValue(option)},${formatOptionValue(option)}`;
    }
    return formatOptionValue(option);
  }
</script>

<div class="search-select">
  <div class="input-wrapper">
    <input id={id || name} {...$input} use:input placeholder={placeholderText($selected)} />
    <div class="icon">
      <ChevronDown />
    </div>
  </div>
  <input {name} {...$hiddenInput} use:hiddenInput />
  {#if $open}
    <ul {...$menu} use:menu transition:fly={{ duration: 150, y: -5 }}>
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
            class:selected={$isSelected('')}
            class:highlighted={$isHighlighted('')}
            {...$option({
              value: '',
              label: ''
            })}
            use:option
          >
            {''}
          </li>
        {/if}
        {#each Object.keys(filteredGroupOptions) as groupName}
          <div class="group" {...$group(groupName)} use:group>
            <div class="group-label" {...$groupLabel(groupName)} use:groupLabel>
              {groupName}
            </div>
            {#each filteredGroupOptions[groupName] as opt, index (index)}
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
          <li>No results found</li>
        {/each}
      </div>
    </ul>
  {/if}
</div>

<style>
  .input-wrapper {
    position: relative;
  }
  .input-wrapper input {
    width: 100%;
  }
  .input-wrapper .icon {
    position: absolute;
    top: 50%;
    right: var(--spacing-half);
    translate: 0 calc(-50% + 1px);
  }

  ul {
    list-style: none;
    max-height: calc(var(--spacing) * 10);
    background-color: var(--color-background);
    overflow-y: scroll;
    margin: 0;
    padding: 0;
  }

  .group {
    margin: var(--spacing-half) 0;
  }

  .group-label {
    font-weight: 700;
    opacity: 0.75;
    font-size: var(--font-size-small);
    border-top: 2px solid var(--color-gray-medium);
    padding: var(--spacing-half) 0 0;
    text-align: center;
  }

  li {
    cursor: pointer;
    padding: var(--spacing-half);
  }
  li.selected {
    background-color: var(--color-gray-light);
  }
  li.highlighted {
    background-color: var(--color-gray-light);
  }
</style>
