// details.js - Indicator detail & offcanvas
import { ApiService } from "./api.js";
import { Cache } from "./cache.js";
import { Charts } from "./charts.js";

export const Details = {
  initIndicatorClick: () => {
    document.addEventListener("click", async (e) => {
      if (!e.target.closest(".indicator-title")) return;
      const indicatorId = e.target.closest(".indicator-title").dataset.id;
      const offcanvasEl = document.getElementById("indicatorOffcanvas");
      const offcanvas = new bootstrap.Offcanvas(offcanvasEl);

      // Adjust width for sidebar
      const sidebar = document.querySelector(".pc-sidebar");
      offcanvasEl.style.left = sidebar ? sidebar.offsetWidth + "px" : "0";
      offcanvasEl.style.width = sidebar
        ? `calc(100% - ${sidebar.offsetWidth}px)`
        : "100%";
      offcanvas.show();

      document.querySelector(
        "#indicatorOffcanvas .offcanvas-body"
      ).innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3">Loading indicator details...</p>
        </div>`;

      // Use cache if available
      if (Cache.indicatorDetails[indicatorId]) {
        Details.render(Cache.indicatorDetails[indicatorId], indicatorId);
        return;
      }

      try {
        const data = await ApiService.fetchIndicatorDetails(indicatorId);
        Cache.indicatorDetails[indicatorId] = data;
        Details.render(data, indicatorId);
      } catch (err) {
        document.querySelector(
          "#indicatorOffcanvas .offcanvas-body"
        ).innerHTML = `<p class="text-danger text-center mt-5">Error loading indicator details.</p>`;
        console.error(err);
      }
    });
  },

  render: (indicator, indicatorId) => {
    let html = `<div class="container-fluid">
      <h5 class="fw-bold mb-3 text-primary">${indicator.title_ENG}</h5>
      <p class="text-muted">${
        indicator.description || "No description available."
      }</p>
      <ul class="list-group list-group-flush mt-3 mb-3">
        <li class="list-group-item"><strong>Category:</strong> ${indicator.for_category
          .map((c) => (typeof c === "object" ? c.name_ENG : c))
          .join(", ")}</li>
        <li class="list-group-item"><strong>Frequency:</strong> ${
          indicator.frequency
        }</li>
        <li class="list-group-item"><strong>Units:</strong> ${
          indicator.measurement_units
        }</li>
        <li class="list-group-item"><strong>Last Updated:</strong> ${
          indicator.updated_at || "N/A"
        }</li>
      </ul>
      <div class="mb-4">
        <h6 class="fw-semibold">Trend Overview (National)</h6>
        <div id="indicator-detail-chart-${indicatorId}" style="min-height:240px;"></div>
      </div>`;

    indicator.children?.forEach((child) => {
      html += `
      <div class="border-top pt-3 mt-3">
        <h6 class="fw-bold">${child.title_ENG}</h6>
        <p class="text-muted">${
          child.description || "No description available."
        }</p>
        <ul class="list-group list-group-flush mb-2">
          <li class="list-group-item"><strong>Frequency:</strong> ${
            child.frequency
          }</li>
          <li class="list-group-item"><strong>Units:</strong> ${
            child.measurement_units
          }</li>
          <li class="list-group-item"><strong>Last Updated:</strong> ${
            child.updated_at || "N/A"
          }</li>
        </ul>
        <div id="child-chart-${child.id}" style="height:200px;"></div>
      </div>`;
    });

    html += `</div>`;
    document.querySelector("#indicatorOffcanvas .offcanvas-body").innerHTML =
      html;

    // Render charts
    if (indicator.annual_data?.length) {
      new ApexCharts(
        document.querySelector(`#indicator-detail-chart-${indicatorId}`),
        {
          series: [
            {
              name: "Performance",
              data: Charts.getChartData(indicator.annual_data),
            },
          ],
          chart: { type: "bar", height: 250, toolbar: { show: false } },
          colors: ["#0d6efd"],
          plotOptions: { bar: { borderRadius: 4 } },
          dataLabels: { enabled: false },
          xaxis: { type: "category" },
          yaxis: { title: { text: indicator.measurement_units } },
          tooltip: { theme: "dark" },
        }
      ).render();
    }

    indicator.children?.forEach((child, idx) => {
      if (child.annual_data?.length) {
        new ApexCharts(document.querySelector(`#child-chart-${child.id}`), {
          series: [
            {
              name: "Performance",
              data: Charts.getChartData(child.annual_data),
            },
          ],
          chart: { type: "bar", height: 200, toolbar: { show: false } },
          colors: ["#198754"],
          plotOptions: { bar: { borderRadius: 4 } },
          dataLabels: { enabled: false },
          xaxis: { type: "category" },
          yaxis: { title: { text: child.measurement_units } },
          tooltip: { theme: "dark" },
        }).render();
      }
    });
  },
};
