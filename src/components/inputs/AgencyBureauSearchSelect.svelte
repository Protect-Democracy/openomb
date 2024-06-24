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

  export let bureaus: Array<{
    budgetAgencyTitle: string;
    budgetAgencyTitleId: string;
    budgetBureauTitle: string;
    budgetBureauTitleId: string;
  }>;
  export let id: string;
  export let name: string;
  export let value: string;

  // Constants
  const emptyOption = { value: '', label: 'None' };

  function createOptions(bureauArray) {
    const agencies = groupBy(bureauArray, 'budgetAgencyTitleId');
    const options = Object.keys(agencies).reduce((opts, key) => {
      if (agencies[key].length < 2) {
        return [
          ...opts,
          {
            label: agencies[key][0].budgetAgencyTitle,
            value: agencies[key][0].budgetAgencyTitleId,
            agency: null
          }
        ];
      }

      return [
        ...opts,
        {
          label: agencies[key][0].budgetAgencyTitle,
          value: agencies[key][0].budgetAgencyTitleId,
          agency: null
        },
        ...agencies[key].map((bureau) => ({
          label: bureau.budgetBureauTitle,
          value: bureau.budgetAgencyTitleId + ',' + bureau.budgetBureauTitleId,
          agency: bureau.budgetAgencyTitle
        }))
      ];
    }, []);

    return uniqBy(options, 'value');
  }

  $: options = createOptions(bureaus);

  // Get our option(s) that correspond to the provided value
  function getDefaultSelection() {
    if (!value) {
      return emptyOption;
    }

    const selectedBureau = bureaus.find(
      (bureau) =>
        value == bureau.budgetAgencyTitleId ||
        value == bureau.budgetAgencyTitleId + ',' + bureau.budgetBureauTitleId
    );
    return selectedBureau
      ? {
          label:
            value == selectedBureau.budgetAgencyTitleId
              ? selectedBureau.budgetAgencyTitle
              : selectedBureau.budgetBureauTitle,
          value:
            value == selectedBureau.budgetAgencyTitleId
              ? selectedBureau.budgetAgencyTitleId
              : selectedBureau.budgetAgencyTitleId + ',' + selectedBureau.budgetBureauTitleId,
          agency:
            value == selectedBureau.budgetAgencyTitleId
              ? undefined
              : selectedBureau.budgetAgencyTitle
        }
      : emptyOption;
  }

  // Melt combobox
  const dispatch = createEventDispatcher();
  const {
    elements: { menu, input, option },
    states: { open, inputValue, touchedInput, selected },
    helpers: { isSelected, isHighlighted }
  } = createCombobox({
    forceVisible: true,
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

  $: filteredOptions = $touchedInput
    ? options.filter((o) => {
        const normalizedInput = $inputValue.toLowerCase();
        return (
          o.label.toLowerCase().includes(normalizedInput) ||
          o.agency?.toLowerCase().includes(normalizedInput)
        );
      })
    : options;

  function placeholderText(selectedOptions) {
    // Option is empty
    if (!selectedOptions || !selectedOptions.value) {
      return 'Type here to filter options';
    }
    return selectedOptions.label;
  }

  // Our selected values do not properly clear on reset, so we need to
  //  add an event to our form input(s)
  //  https://github.com/sveltejs/svelte/issues/2659#issuecomment-877758546
  function fixFormReset(el) {
    const form = el.form;
    if (!form) return;
    const handleReset = () => {
      // Set timeout is needed since `el.value` is only updated on the next frame
      setTimeout(() => selected.set(emptyOption));
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
          <li
            class="empty-option"
            class:selected={$isSelected(emptyOption.value)}
            class:highlighted={$isHighlighted(emptyOption.value)}
            {...$option(emptyOption)}
            use:option
          >
            {emptyOption.label}
          </li>

          {#each filteredOptions as opt (opt.value)}
            <li
              class:budget-option={!!opt.agency}
              class:agency-option={!opt.agency}
              class:selected={$isSelected(opt.value)}
              class:highlighted={$isHighlighted(opt.value)}
              {...$option(opt)}
              use:option
            >
              {opt.label}
            </li>
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
  <select {name} id={id || name} use:fixFormReset>
    <option value={emptyOption.value} selected={$isSelected(emptyOption.value)}>
      {emptyOption.label}
    </option>
    {#each filteredOptions as opt (opt.value)}
      <option selected={$isSelected(opt.value)} value={opt.value}>
        {opt.agency ? `--- ${opt.label}` : opt.label}
      </option>
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

  .search-select-menu {
    list-style: none;
    max-height: min(90vh, calc(var(--spacing) * 15));
    background-color: var(--color-background);
    overflow-y: scroll;
    margin: 0;
    padding: 0 0 var(--spacing) 0;
    border-left: var(--border-weight) solid var(--color-text);
    border-bottom: var(--border-weight) solid var(--color-text);
    border-right: var(--border-weight) solid var(--color-text);
    border-bottom-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    font-size: var(--font-size-small);

    &[data-side='top'] {
      border-bottom: none;
      border-top: var(--border-weight) solid var(--color-text);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
    }

    li {
      cursor: pointer;
      padding: var(--spacing-thin) var(--spacing-half);
      display: block;
    }

    .selected {
      background-color: var(--color-highlight);
    }

    .highlighted {
      background-color: var(--color-highlight);
    }

    .empty-option {
      font-style: italic;
    }

    .agency-option {
      font-weight: var(--font-copy-weight-bold);
    }

    .budget-option {
      padding-left: var(--spacing-double);
    }
  }

  /* The ul gets taken out of the flow when the menu is open. */
  :global(body:has(ul.search-select-menu[data-side='top'])) .is-open .input-wrapper input {
    border-bottom-left-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .no-results {
    padding: var(--spacing);
  }
</style>
