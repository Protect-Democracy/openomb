<script lang="ts">
  import { sortBy, uniq, range } from 'lodash-es';
  import chroma from 'chroma-js';
  import Chart from './Chart.svelte';

  chroma.scale(['#ffca7c', '#aa6500']).mode('lch').colors(6);

  // TODO: Find a good way to use the CSS variables here instead of manual values
  const currentYearColor = '#059260';
  const startPreviousYearColor = '#ffca7c';
  const endPreviousYearColor = '#aa6500';
  const currentYear = new Date().getFullYear();

  // Props
  let { data, align, height } = $props<{
    data: { year: number; month: number; fileCount: number }[];
    align: 'left' | 'center' | 'right';
    height: string;
  }>();

  // Derived
  let years = $derived(sortBy(uniq(data.map((d) => d.year)), 'year').reverse());
  let previousColorScale = $derived(
    chroma
      .scale([startPreviousYearColor, endPreviousYearColor])
      .mode('lch')
      .colors(years.length - 1)
      .reverse()
  );
  let datasets = $derived(
    years.map((year, yi) => {
      // Fill in nulls for months with no data, make into format { x: month, y: fileCount }
      let yearData = range(1, 13).map((month) => {
        let monthData = data.find((d) => d.year === year && d.month === month);
        return {
          x: month,
          y: monthData ? monthData.fileCount : null
        };
      });
      let color = year == currentYear ? currentYearColor : previousColorScale[yi - 1];

      return {
        label: year,
        data: yearData,
        pointHitRadius: 15,
        pointRadius: 1,
        pointHoverRadius: 5,
        borderWidth: 3,
        borderColor: color,
        backgroundColor: color
      };
    })
  );
  let maximum = $derived(Math.max(...data.map((d) => d.fileCount)) || 0);

  // Turn month number into month name
  function getMonthName(month: number): string {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return monthNames[month - 1];
  }
</script>

<figure>
  <Chart
    {height}
    {align}
    options={{
      type: 'line',
      data: {
        labels: range(1, 13),
        datasets: datasets
      },
      options: {
        scales: {
          x: {
            ticks: {
              callback: (value) => {
                // Value is just the index of the ticks
                return getMonthName(value + 1);
              }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Approvals each month'
            },
            ticks: {
              callback: (value) => {
                return value !== 0 ? value.toLocaleString() : '';
              }
            },
            max: maximum && maximum < 10 ? 10 : undefined
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#222222',
            bodyColor: '#222222',
            callbacks: {
              title: function (tooltipItems) {
                return `${getMonthName(tooltipItems[0].label)}`;
              },
              label: function (tooltipItem) {
                return `  ${tooltipItem.formattedValue} approvals in ${tooltipItem.dataset.label}`;
              }
            }
          }
        }
      }
    }}
  />

  <figcaption class="align-{align}">
    Note: Approvals for current or most recent month may not be complete due to how data gets
    updated.
  </figcaption>
</figure>

<style>
  figcaption {
    text-align: center;
    display: block;
    margin-top: var(--spacing);
    margin-left: auto;
    margin-right: auto;
    width: auto;
    max-width: var(--copy-width-limit);
    font-size: var(--font-size-small);
    color: var(--color-text-muted);

    &.align-left {
      text-align: left;
      margin-left: 0;
    }
  }
</style>
