$(document).ready(function () {
  const apiUrl = "https://time-series.mopd.gov.et/api/mobile/topic-list/";
  const baseUrl = "http://time-series.mopd.gov.et";

  let cachedTopicHtml = "";
  let cachedCategoryData = null;
  let cachedIndicatorDetails = {};

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

  // --- Utility to prepare chart data ---
  const getChartData = (annualData) => {
    return annualData
      ? [...annualData]
          .reverse()
          .map((d) => ({ x: d.for_datapoint, y: d.performance }))
      : [];
  };

  // --- Render sparklines ---
  const initializeAllSparklines = (indicators, color) => {
    const hexColor = colorHex(color);
    indicators.forEach((indicator) => {
      const chartEl = document.getElementById(`chart_${indicator.id}`);
      if (chartEl && indicator.annual_data?.length) {
        const chartData = getChartData(indicator.annual_data);
        new ApexCharts(chartEl, {
          series: [{ name: "Performance", data: chartData }],
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
  };

  // --- Render indicators for category ---
  const renderIndicatorsForCategory = (category, color) => {
    let htmlContent = "";
    if (category.indicators?.length > 0) {
      category.indicators.forEach((indicator) => {
        if (indicator.annual_data?.length) {
          const latestData = indicator.annual_data[0];
          htmlContent += `
<div class="col-md-4 col-xxl-4 col-12">
  <div class="card border-${color} shadow-sm">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between">
        <span class="indicator-title text-${color}" style="cursor:pointer;" data-id="${indicator.id}">${indicator.title_ENG} (Annual)</span>
        <i class="fa fa-eye text-${color}" aria-hidden="true"></i>
      </div>
      <div class="bg-body mt-3 rounded">
        <div class="row align-items-center bg-light p-3">
          <div class="col-7 col-md-8">
            <div id="chart_${indicator.id}" role="img" aria-label="Performance sparkline for ${indicator.title_ENG}, latest year ${latestData.for_datapoint}, performance ${latestData.performance}" tabindex="0"></div>
          </div>
          <div class="col-3 text-center">
            <h4>
              <span class="badge bg-${color}">
                ${latestData.for_datapoint}
                <hr style="margin:3px 0; border-top:1px solid rgba(255,255,255,0.5);">
                ${latestData.performance}
              </span>
            </h4>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;
        }
      });
    } else
      htmlContent = `<h5 class="text-danger text-center">No data found</h5>`;

    return `
<h4 class="fw-bold text-${color} text-center mb-4">${category.name_ENG}</h4>
<div class="row m-3">${htmlContent}</div>`;
  };

  const displayCategoryIndicators = (category, color) => {
    $("#annualTable").html(`
      <button id="back-to-categories-btn" class="btn btn-outline-secondary mb-3">← Back to Top</button>
      ${renderIndicatorsForCategory(category, color)}
    `);

    if (category.indicators?.length > 0)
      initializeAllSparklines(category.indicators, color);

    $("html, body").animate(
      { scrollTop: $("#annualTable").offset().top - 80 },
      500
    );
  };

  // --- Load Topics ---
  $.ajax({
    url: apiUrl,
    method: "GET",
    success: function (response) {
      const topicsList = response.data;
      if (Array.isArray(topicsList)) {
        const cards = topicsList.map((item) => {
          const image_back = item.background_image
            ? baseUrl + item.background_image
            : "https://via.placeholder.com/600x300?text=No+Image";
          const iconImg = item.image_icons
            ? baseUrl + item.image_icons
            : "https://via.placeholder.com/48?text=Icon";
          return `
<div class="col-lg-4 col-md-6 mb-4 topic-card" data-id="${item.id}">
  <div class="card shadow-lg border-0 position-relative overflow-hidden w-100" style="border-radius:1.5rem; background:url('${image_back}') center/cover no-repeat; min-height:220px;">
    <div class="position-absolute start-0 bottom-0 m-3 d-flex align-items-center">
      <div class="bg-white d-flex align-items-center justify-content-center rounded-circle shadow" style="width:56px; height:56px;">
        <img src="${iconImg}" alt="icon" style="width:32px; height:32px;">
      </div>
      <div class="ms-3 text-white">
        <div class="fw-bold fs-5 lh-1">${item.title_ENG || "No title"}</div>
        <div class="small lh-1">${item.title_AMH || ""}</div>
      </div>
    </div>
    <div class="position-absolute end-0 top-0 m-3">
      <span class="display-1 fw-bold text-white-50" style="font-size:10rem; line-height:1; opacity:0.4;">${
        item.count_category || ""
      }</span>
    </div>
  </div>
</div>`;
        });
        $("#topic-list").html(
          '<div class="row gx-3 gy-4">' + cards.join("") + "</div>"
        );
        cachedTopicHtml = $("#topic-list").html();
      } else
        $("#topic-list").html("<p class='text-warning'>No topics found.</p>");
    },
    error: function () {
      $("#topic-list").html("<p class='text-danger'>Error loading topics.</p>");
    },
  });

  // --- Topic click handler with hover effect ---
  $(document).on("click", ".topic-card", function () {
    const topicId = $(this).data("id");
    $("#topic-list").html(
      "<p class='text-center mt-3'>Loading categories...</p>"
    );

    $.ajax({
      url: `/local-api/topic-detail/${topicId}/`,
      method: "GET",
      success: function (data) {
        cachedCategoryData = data;
        const categoriesList = data.categories || [];

        categoriesList.forEach((c, i) => {
          c.index = i;
          c.color = categoryColor[i % categoryColor.length];
        });

        const html = categoriesList
          .map((c) => {
            // Prepare API-driven extra info
            const extraInfo = [];
            if (c.description) extraInfo.push(c.description);
            if (c.manager_name) extraInfo.push(`Manager: ${c.manager_name}`);
            if (c.department) extraInfo.push(`Dept: ${c.department}`);
            const extraHtml = extraInfo.length
              ? `<p class="text-muted small mt-2">${extraInfo.join(" | ")}</p>`
              : "";

            // Check for annual data for sparkline
            const mainIndicator = c.indicators?.[0];
            const hasAnnualData = mainIndicator?.annual_data?.length > 0;

            return `
<div class="col-md-6 col-xl-3 mb-4">
  <div class="card shadow-sm h-100 category-card hover-card" 
       data-index="${c.index}" data-color="${c.color}" 
       style="cursor:pointer; border-radius:1.25rem; overflow:hidden; position:relative; padding:1rem; transition: transform 0.3s, box-shadow 0.3s;">
    
    <!-- Top color border -->
    <div style="position:absolute; top:0; left:0; width:100%; height:4px; background-color:${colorHex(
      c.color
    )};"></div>
    
    <h5 class="text-${c.color} mb-2 mt-1">${c.name_ENG}</h5>

    ${
      hasAnnualData
        ? `<div id="sparkline-${c.id}" style="height:50px;"></div>`
        : ""
    }

    ${extraHtml}

    <small class="text-muted mt-auto d-block">Last updated: ${
      c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "N/A"
    }</small>
  </div>
</div>`;
          })
          .join("");

        $("#topic-list").html(`
        <button id="back-btn" class="btn btn-outline-primary mb-3">← Back to Topics</button>
        <div class="row gx-3 gy-4" id="category_list">${html}</div>
        <div id="annualTable" class="mt-5"></div>
      `);

        // --- Initialize Sparklines ---
        categoriesList.forEach((c) => {
          const mainIndicator = c.indicators?.[0];
          if (mainIndicator?.annual_data?.length) {
            const chartData = mainIndicator.annual_data.map(
              (d) => d.performance ?? 0
            );
            const years = mainIndicator.annual_data.map((d) => d.for_datapoint);

            new ApexCharts(document.querySelector(`#sparkline-${c.id}`), {
              series: [{ name: "Performance", data: chartData }],
              chart: { type: "bar", height: 50, sparkline: { enabled: true } },
              plotOptions: { bar: { columnWidth: "70%", borderRadius: 4 } },
              colors: [colorHex(c.color)],
              tooltip: {
                y: {
                  formatter: function (val, { dataPointIndex }) {
                    return `${val} (${years[dataPointIndex]})`;
                  },
                },
                theme: "dark",
              },
            }).render();
          }
        });

        // --- Hover effect ---
        $(".hover-card").hover(
          function () {
            $(this).css({
              transform: "translateY(-6px)",
              "box-shadow": "0 12px 24px rgba(0,0,0,0.15)",
            });
          },
          function () {
            $(this).css({
              transform: "translateY(0)",
              "box-shadow": "0 4px 8px rgba(0,0,0,0.1)",
            });
          }
        );
      },
      error: function (jqXHR) {
        const errorText =
          jqXHR.responseJSON?.error || "Error loading categories.";
        $("#topic-list").html(`<p class='text-danger'>${errorText}</p>`);
      },
    });
  });

  // --- Category click handler ---
  $(document).on("click", ".category-card", function () {
    const index = $(this).data("index");
    const color = $(this).data("color");
    const categoriesList = cachedCategoryData?.categories;
    if (categoriesList && categoriesList[index])
      displayCategoryIndicators(categoriesList[index], color);
  });

  // --- Indicator Offcanvas handler ---
  $(document).on("click", ".indicator-title", function () {
    const indicatorId = $(this).data("id");
    const offcanvasEl = document.getElementById("indicatorOffcanvas");
    const offcanvas = new bootstrap.Offcanvas(offcanvasEl);
    const sidebar = document.querySelector(".pc-sidebar");
    if (sidebar) {
      const sidebarWidth = sidebar.offsetWidth;
      offcanvasEl.style.left = sidebarWidth + "px";
      offcanvasEl.style.width = `calc(100% - ${sidebarWidth}px)`;
    } else {
      offcanvasEl.style.left = "0";
      offcanvasEl.style.width = "100%";
    }
    offcanvas.show();
    $("#indicatorOffcanvas .offcanvas-body").html(
      `<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Loading indicator details...</p></div>`
    );

    if (cachedIndicatorDetails[indicatorId]) {
      renderIndicatorDetailsOptimized(
        cachedIndicatorDetails[indicatorId],
        indicatorId
      );
      return;
    }

    $.ajax({
      url: `/local-api/indicator-detail/${indicatorId}/`,
      method: "GET",
      success: function (data) {
        cachedIndicatorDetails[indicatorId] = data;
        renderIndicatorDetailsOptimized(data, indicatorId);
      },
      error: function () {
        $("#indicatorOffcanvas .offcanvas-body").html(
          `<p class="text-danger text-center mt-5">Error loading indicator details.</p>`
        );
      },
    });
  });

  // --- Back Buttons ---
  $(document).on("click", "#back-btn", function () {
    if (cachedTopicHtml) $("#topic-list").html(cachedTopicHtml);
    else location.reload();
    $("#annualTable").empty();
  });

  $(document).on("click", "#back-to-categories-btn", function () {
    $("#annualTable").empty();
    $("html, body").animate(
      { scrollTop: $("#category_list").offset().top - 80 },
      500
    );
  });

  // --- Optimized Indicator Detail Renderer ---
  function renderIndicatorDetailsOptimized(indicator, indicatorId) {
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
    <div id="indicator-detail-chart-${indicatorId}" style="min-height:240px;"></div>
  </div>`;
    if (indicator.children?.length) {
      indicator.children.forEach((child) => {
        html += `
<div class="border-top pt-3 mt-3">
  <h6 class="fw-bold">${child.title_ENG}</h6>
  <p class="text-muted">${child.description || "No description available."}</p>
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
    }
    html += `</div>`;
    $("#indicatorOffcanvas .offcanvas-body").html(html);

    // Render main chart
    if (indicator.annual_data?.length) {
      setTimeout(() => {
        new ApexCharts(
          document.querySelector(`#indicator-detail-chart-${indicatorId}`),
          {
            series: [
              {
                name: "Performance",
                data: getChartData(indicator.annual_data),
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
      }, 50);
    }

    // Render child charts asynchronously
    indicator.children?.forEach((child, idx) => {
      setTimeout(() => {
        if (child.annual_data?.length) {
          new ApexCharts(document.querySelector(`#child-chart-${child.id}`), {
            series: [
              { name: "Performance", data: getChartData(child.annual_data) },
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
      }, 100 + idx * 30);
    });
  }
});
