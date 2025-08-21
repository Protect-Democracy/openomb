<script lang="ts">
  import { sortBy, uniq, range } from 'lodash-es';
  import Chart from './Chart.svelte';

  const colors = ['#ffca7c', '#fba62b', '#d98307', '#aa6500', '#059260'].reverse();

  let { data, align } = $props<{
    data: { year: number; month: number; fileCount: number }[];
    align: 'left' | 'center' | 'right';
  }>();
  let years = $derived(sortBy(uniq(data.map((d) => d.year)), 'year').reverse());
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
        pointRadius: 1,
        pointHoverRadius: 5,
        borderWidth: 3,
        borderColor: colors[yi],
        backgroundColor: colors[yi]
      };
    })
  );
  let maximum = $derived(Math.max(...data.map((d) => d.fileCount)) || 0);

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
