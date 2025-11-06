// charts.js - Handles charts rendering

export const Charts = {
  colorHex: (colorName) => {
    switch (colorName) {
      case "primary":
        return "#0d6efd";
      case "success":
        return "#198754";
      case "danger":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      case "info":
        return "#0dcaf0";
      default:
        return "#6c757d";
    }
  },

  getChartData: (annualData) =>
    annualData
      ? [...annualData]
          .reverse()
          .map((d) => ({ x: d.for_datapoint, y: d.performance }))
      : [],

  renderSparklines: (indicators, color) => {
    const hexColor = Charts.colorHex(color);
    indicators.forEach((indicator) => {
      const el = document.getElementById(`chart_${indicator.id}`);
      if (el && indicator.annual_data?.length) {
        new ApexCharts(el, {
          series: [
            {
              name: "Performance",
              data: Charts.getChartData(indicator.annual_data),
            },
          ],
          chart: {
            type: "area",
            height: 90,
            sparkline: { enabled: true },
            animations: { enabled: true, speed: 700 },
          },
          colors: [hexColor],
          stroke: { curve: "smooth", width: 3 },
          fill: {
            type: "gradient",
            gradient: { shadeIntensity: 0.6, opacityFrom: 0.6, opacityTo: 0.1 },
          },
          tooltip: { theme: "dark" },
        }).render();
      }
    });
  },

  renderRadial: (eleSelector, value, color) => {
    new ApexCharts(document.querySelector(eleSelector), {
      series: [value],
      chart: { type: "radialBar", height: 80 },
      plotOptions: {
        radialBar: {
          hollow: { size: "50%" },
          dataLabels: {
            show: true,
            name: { show: false },
            value: { fontSize: "14px", formatter: (val) => val + "%" },
          },
        },
      },
      colors: [Charts.colorHex(color)],
    }).render();
  },
};
