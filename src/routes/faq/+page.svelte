<script lang="ts">
  /**
   * Inspiration from: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
   */
  import { slide } from 'svelte/transition';
  import ChevronDown from '$components/icons/ChevronDown.svelte';

  // State
  let expanded: { [key: number]: boolean } = {};

  // Put content into variables, as it's easier to manage the JS/No-JS duplication stuff
  const faqs = [
    {
      question: 'Example question',
      answers: [
        'Intro to the FAQ. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta nam quidem rerum eaque cupiditate debitis! Iusto dolor dignissimos esse optio rerum. Nesciunt consequuntur a perspiciatis nemo et! Quasi, magni aliquam.'
      ]
    },
    {
      question: 'Example question',
      answers: [
        'Intro to the FAQ. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta nam quidem rerum eaque cupiditate debitis! Iusto dolor dignissimos esse optio rerum. Nesciunt consequuntur a perspiciatis nemo et! Quasi, magni aliquam.',
        'Intro to the FAQ. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta nam quidem rerum eaque cupiditate debitis! Iusto dolor dignissimos esse optio rerum. Nesciunt consequuntur a perspiciatis nemo et! Quasi, magni aliquam.'
      ]
    },
    {
      question: 'Example question',
      answers: [
        'Intro to the FAQ. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta nam quidem rerum eaque cupiditate debitis! Iusto dolor dignissimos esse optio rerum. Nesciunt consequuntur a perspiciatis nemo et! Quasi, magni aliquam.',
        'Intro to the FAQ. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit amet consectetur adipisicing elit. Soluta nam quidem rerum eaque cupiditate debitis! Iusto dolor dignissimos esse optio rerum. Nesciunt consequuntur a perspiciatis nemo et! Quasi, magni aliquam.'
      ]
    }
  ];

  // Derived
  $: faqs.forEach((f, fi) => {
    expanded[fi] = expanded[fi] || false;
  });

  // Toggle
  const toggleExpanded = (fi: number) => {
    expanded[fi] = !expanded[fi];
  };
</script>

<div class="page-container content-container">
  <h1>Frequently asked questions</h1>

  <p>
    Intro to the FAQ. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor sit
    amet consectetur adipisicing elit. Soluta nam quidem rerum eaque cupiditate debitis! Iusto dolor
    dignissimos esse optio rerum. Nesciunt consequuntur a perspiciatis nemo et! Quasi, magni
    aliquam.
  </p>

  <div class="text-container">
    <div class="has-js-only-block">
      <dl class="faqs">
        {#each faqs as faq, fi}
          <dt>
            <button
              type="button"
              class="like-text"
              aria-expanded={expanded[fi] ? 'true' : 'false'}
              aria-controls="faq-{fi}"
              on:click|preventDefault={() => toggleExpanded(fi)}
            >
              {faq.question} <span class="icon"><ChevronDown /></span></button
            >
          </dt>

          <dd id="faq-{fi}">
            {#if expanded[fi]}
              <div transition:slide class="inner-dd">
                {#each faq.answers as answer}
                  <p>{answer}</p>
                {/each}
              </div>
            {/if}
          </dd>
        {/each}
      </dl>
    </div>

    <div class="no-js-only-block">
      <dl class="faqs">
        {#each faqs as faq}
          <dt>{faq.question}</dt>

          <dd>
            {#each faq.answers as answer}
              <p>{answer}</p>
            {/each}
          </dd>
        {/each}
      </dl>
    </div>
  </div>
</div>

<style>
  .faqs {
    padding-top: var(--spacing);

    dt {
      font-size: var(--font-size-large);
      margin-bottom: var(--spacing-half);

      button {
        display: block;
        width: 100%;

        display: flex;
        justify-content: space-between;
      }
    }

    dd {
      margin-left: 0;
      border-bottom: var(--border-weight) solid var(--color-text);
      margin-bottom: var(--spacing-double);
    }
  }

  .icon {
    margin-left: var(--spacing);
    display: inline-block;
    width: 1em;
  }
</style>
