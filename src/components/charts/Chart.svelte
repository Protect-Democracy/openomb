<script lang="ts">
  // Component that wraps around chart js and handles updates
  import { onMount } from 'svelte';
  import { Chart, registerables, type ChartConfiguration } from 'chart.js';
  import 'chartjs-adapter-luxon';

  const verticalHoverLinePlugin = {
    id: 'verticalHoverLine',
    beforeDatasetDraw(chart) {
      const {
        ctx,
        chartArea: { top, bottom }
      } = chart;
      ctx.save();

      // Have to look through each dataset and find any active points
      chart.data.datasets.find((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        let found = meta.data.find((point) => {
          if (point.active) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.moveTo(point.x, top);
            ctx.lineTo(point.x, bottom);
            ctx.stroke();
            return true;
          }
        });
        return !!found;
      });
    }
  };

  // Register all Chart.js components
  Chart.register(...registerables);
  Chart.register(verticalHoverLinePlugin);

  // 1. Define typed component props
  let { options }: { options: ChartConfiguration } = $props();

  // 2. Add types for the canvas element and chart instance
  let canvasElement: HTMLCanvasElement | undefined;
  let chart: Chart | undefined;

  onMount(() => {
    if (canvasElement) {
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        chart = new Chart(ctx, options);
      }
    }

    // Cleanup
    return () => {
      chart?.destroy();
    };
  });

  $effect(() => {
    if (chart) {
      // The options object is now fully typed
      chart.options = options.options ?? {};
      chart.data = options.data;
      chart.update();
    }
  });
</script>

<div>
  <canvas bind:this={canvasElement}></canvas>
</div>

<style>
  div {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
  }
</style>
