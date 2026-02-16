<script lang="ts">
</script>

<div class="test-template-inline">
  <style>
    /* This is dumb; the svelte styles don't get rendered in our current setup */
    .test-template-inline p {
      --color-primary: blue;
      color: var(--color-primary);
      font-weight: bold;
    }
  </style>

  <p>This paragraph should have styles attached.</p>
</div>
