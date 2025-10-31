$(document).ready(function () {
  const apiUrl = "https://time-series.mopd.gov.et/api/mobile/topic-list/";
  const baseUrl = "http://time-series.mopd.gov.et";

  let cachedTopicHtml = "";
  let cachedCategoryData = null;

  const categoryColor = [
    "primary",
    "success",
    "danger",
    "warning",
    "info",
    "secondary",
  ];

  const colorHex = (colorName) => {
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
  };

  // --- Render indicators for a category ---
  const renderIndicatorsForCategory = (category, color) => {
    let htmlContent = "";

    if (category.indicators.length > 0) {
      category.indicators.forEach((indicator) => {
        if (indicator.annual_data && indicator.annual_data.length > 0) {
          const latestDataPoint = indicator.annual_data[0];
          const latestYear = latestDataPoint.for_datapoint;
          const latestPerformance = latestDataPoint.performance ?? "N/A";

          const reversedData = [...indicator.annual_data].reverse();
          const hexColor = colorHex(color);
          const bsColorClass = color;

          const indicatorChartId = `chart_${indicator.id}`;
          const ariaLabelText = `Performance sparkline for ${indicator.title_ENG}, latest year ${latestYear}, performance ${latestPerformance}.`;

          htmlContent += `
<div class="col-md-4 col-xxl-4 col-12">
  <div class="card border-${bsColorClass} shadow-sm">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between">
        <span class="indicator-title text-${bsColorClass}" style="cursor:pointer;" data-id="${
            indicator.id
          }">
          ${indicator.title_ENG} (Annual)
        </span>
        <i class="fa fa-eye text-${bsColorClass}" aria-hidden="true"></i>
      </div>

      <div class="bg-body mt-3 rounded">
        <div class="row align-items-center bg-light p-3">
          <div class="col-7 col-md-8">
            <div id="${indicatorChartId}" role="img" aria-label="${ariaLabelText}" tabindex="0"></div>
          </div>
          <div class="col-3 text-center">
            <h4>
              <span class="badge bg-${bsColorClass}">
                ${latestYear}
                <hr style="margin:3px 0; border-top:1px solid rgba(255,255,255,0.5);">
                ${latestPerformance}
              </span>
            </h4>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  (function() {
    const options = {
      series: [{ name: "Performance", data: ${JSON.stringify(
        reversedData.map((d) => ({ x: d.for_datapoint, y: d.performance }))
      )} }],
      chart: { type: "area", height: 90, sparkline: { enabled: true }, animations: { enabled: true, speed: 700 } },
      colors: ["${hexColor}"],
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { shadeIntensity: 0.6, opacityFrom: 0.6, opacityTo: 0.1 } },
      tooltip: { theme: "dark" },
    };
    if (document.getElementById("${indicatorChartId}")) {
      const chart = new ApexCharts(document.getElementById("${indicatorChartId}"), options);
      chart.render();
    }
  })();
</script>`;
        }
      });
    } else {
      htmlContent = `<h5 class="text-danger text-center">No data found</h5>`;
    }

    return `
<h4 class="fw-bold text-${color} text-center mb-4">${category.name_ENG}</h4>
<div class="row m-3">
  ${htmlContent}
</div>`;
  };

  const displayCategoryIndicators = (category, color) => {
    const indicatorHtml = renderIndicatorsForCategory(category, color);
    $("#annualTable").html(`
      <button id="back-to-categories-btn" class="btn btn-outline-secondary mb-3">← Back to Top</button>
      ${indicatorHtml}
    `);
  };

  // --- Load Topics ---
  $.ajax({
    url: apiUrl,
    method: "GET",
    success: function (response) {
      const topicsList = response.data;
      if (Array.isArray(topicsList)) {
        const cards = topicsList.map((item) => {
          const topicId = item.id;
          const topic = item.title_ENG || "No title";
          const desc = item.title_AMH || "";
          const image_back = item.background_image
            ? baseUrl + item.background_image
            : "https://via.placeholder.com/600x300?text=No+Image";
          const iconImg = item.image_icons
            ? baseUrl + item.image_icons
            : "https://via.placeholder.com/48?text=Icon";
          const count = item.count_category || "";

          return `
<div class="col-lg-4 col-md-6 mb-4 topic-card" data-id="${topicId}">
  <div class="card shadow-lg border-0 position-relative overflow-hidden w-100"
       style="border-radius:1.5rem; background:url('${image_back}') center/cover no-repeat; min-height:220px;">
    <div class="position-absolute start-0 bottom-0 m-3 d-flex align-items-center">
      <div class="bg-white d-flex align-items-center justify-content-center rounded-circle shadow" style="width:56px; height:56px;">
        <img src="${iconImg}" alt="icon" style="width:32px; height:32px;">
      </div>
      <div class="ms-3 text-white">
        <div class="fw-bold fs-5 lh-1">${topic}</div>
        <div class="small lh-1">${desc}</div>
      </div>
    </div>
    <div class="position-absolute end-0 top-0 m-3">
      <span class="display-1 fw-bold text-white-50" style="font-size:10rem; line-height:1; opacity:0.4;">${count}</span>
    </div>
  </div>
</div>`;
        });

        $("#topic-list").html(
          '<div class="row gx-3 gy-4">' + cards.join("") + "</div>"
        );
        cachedTopicHtml = $("#topic-list").html();
      } else {
        $("#topic-list").html("<p class='text-warning'>No topics found.</p>");
      }
    },
    error: function () {
      $("#topic-list").html("<p class='text-danger'>Error loading topics.</p>");
    },
  });

  // --- Topic click handler ---
  $(document).on("click", ".topic-card", function () {
    const topicId = $(this).data("id");
    const categoryUrl = `/local-api/topic-detail/${topicId}/`;

    $("#topic-list").html(
      "<p class='text-center mt-3'>Loading categories...</p>"
    );

    $.ajax({
      url: categoryUrl,
      method: "GET",
      success: function (data) {
        cachedCategoryData = data;
        const categoriesList = data.data?.categories;

        if (Array.isArray(categoriesList)) {
          categoriesList.forEach((c, i) => {
            c.index = i;
            c.color = categoryColor[i % categoryColor.length];
          });

          const categoriesHtml = categoriesList.map(
            (category) => `
<div class="col-lg-4 col-md-6 mb-4">
  <div class="card shadow-sm border-2 border-${category.color} category-card" data-index="${category.index}" data-color="${category.color}" style="cursor:pointer;">
    <div class="card-body text-center">
      <h5 class="text-${category.color}">${category.name_ENG}</h5>
      <p class="text-muted">${category.indicators.length} Indicators</p>
    </div>
  </div>
</div>`
          );

          $("#topic-list").html(`
<button id="back-btn" class="btn btn-outline-primary mb-3">← Back to Topics</button>
<div class="row" id="category_list">${categoriesHtml.join("")}</div>
<div id="annualTable" class="mt-5"></div>`);
        } else {
          $("#topic-list").html(
            "<p class='text-warning'>No categories found for this topic.</p>"
          );
        }
      },
      error: function () {
        $("#topic-list").html(
          "<p class='text-danger'>Error loading categories.</p>"
        );
      },
    });
  });

  // --- Category click handler ---
  $(document).on("click", ".category-card", function () {
    const index = $(this).data("index");
    const color = $(this).data("color");
    const categoriesList = cachedCategoryData?.data?.categories;

    if (categoriesList && categoriesList[index]) {
      displayCategoryIndicators(categoriesList[index], color);
      $("html, body").animate(
        { scrollTop: $("#annualTable").offset().top - 80 },
        500
      );
    }
  });

  // --- Indicator Offcanvas handler (bottom slide) ---
  $(document).on("click", ".indicator-title", function () {
    const indicatorId = $(this).data("id");
    const detailUrl = `https://time-series.mopd.gov.et/api/mobile/indicator-detail/${indicatorId}/`;

    const offcanvasEl = document.getElementById("indicatorOffcanvas");
    const offcanvas = new bootstrap.Offcanvas(offcanvasEl);

    // Adjust left & width to match sidebar/main container
    const sidebar = document.querySelector(".pc-sidebar");
    if (sidebar) {
      const sidebarWidth = sidebar.offsetWidth;
      offcanvasEl.style.left = sidebarWidth + "px";
      offcanvasEl.style.width = `calc(100% - ${sidebarWidth}px)`;
    } else {
      offcanvasEl.style.left = "0";
      offcanvasEl.style.width = "100%";
    }

    // Show loading spinner
    $("#indicatorOffcanvas .offcanvas-body").html(`
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3">Loading indicator details...</p>
    </div>
  `);

    offcanvas.show();

    // Fetch indicator details
    $.ajax({
      url: detailUrl,
      method: "GET",
      success: function (data) {
        const indicator = data.data;

        // Main Indicator HTML
        let html = `
        <div class="container-fluid">
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
            <div id="indicator-detail-chart"></div>
          </div>
      `;

        // Children Indicators
        if (indicator.children?.length) {
          indicator.children.forEach((child) => {
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
            </div>
          `;
          });
        }

        html += `</div>`; // container-fluid end
        $("#indicatorOffcanvas .offcanvas-body").html(html);

        // Main Indicator Bar Chart
        if (indicator.annual_data?.length) {
          const seriesMain = indicator.annual_data.map((d) => ({
            x: d.for_datapoint,
            y: d.performance,
          }));
          new ApexCharts(document.querySelector("#indicator-detail-chart"), {
            series: [{ name: "Performance", data: seriesMain }],
            chart: { type: "bar", height: 250, toolbar: { show: false } },
            colors: ["#0d6efd"],
            plotOptions: { bar: { borderRadius: 4 } },
            dataLabels: { enabled: false },
            xaxis: { type: "category" },
            yaxis: { title: { text: indicator.measurement_units } },
            tooltip: { theme: "dark" },
          }).render();
        }

        // Children Bar Charts
        indicator.children.forEach((child) => {
          if (child.annual_data?.length) {
            const seriesChild = child.annual_data.map((d) => ({
              x: d.for_datapoint,
              y: d.performance,
            }));
            new ApexCharts(document.querySelector(`#child-chart-${child.id}`), {
              series: [{ name: "Performance", data: seriesChild }],
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
      error: function () {
        $("#indicatorOffcanvas .offcanvas-body").html(`
        <p class="text-danger text-center mt-5">Error loading indicator details.</p>
      `);
      },
    });
  });

  // --- Back Buttons ---
  $(document).on("click", "#back-btn", function () {
    if (cachedTopicHtml) $("#topic-list").html(cachedTopicHtml);
    else location.reload();
  });

  $(document).on("click", "#back-to-categories-btn", function () {
    $("#annualTable").empty();
    $("html, body").animate(
      { scrollTop: $("#category_list").offset().top - 80 },
      500
    );
  });
});
