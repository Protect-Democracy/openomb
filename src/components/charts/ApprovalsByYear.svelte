<script lang="ts">
  import { sortBy, uniq, range } from 'lodash-es';
  import Chart from './Chart.svelte';

  const colors = [
    '#059260',
    '#ff482a',
    '#00baff',
    '#eab626',
    '#852c7e',
    '#002a12',
    '#300000',
    '#004c68',
    '#002b2d'
  ];

  let { data } = $props<{ data: { year: number; month: number; fileCount: number }[] }>();
  let years = $derived(sortBy(uniq(data.map((d) => d.year)), 'year'));
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
      return {
        label: year,
        data: yearData,
        pointHitRadius: 15,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderColor: colors[yi],
        backgroundColor: colors[yi]
      };
    })
  );

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

<Chart
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
            text: 'Number of Approvals'
          },
          ticks: {
            callback: (value) => {
              return value !== 0 ? value.toLocaleString() : '';
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
