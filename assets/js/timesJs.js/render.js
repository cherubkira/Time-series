// renderer.js - Handles rendering topics and categories
import { Charts } from "./charts.js";

export const Render = {
  renderTopics: (topicsList, baseUrl) => {
    const cards = topicsList.map((item) => {
      const imageBack = item.background_image
        ? baseUrl + item.background_image
        : "https://via.placeholder.com/600x300?text=No+Image";
      const iconImg = item.image_icons
        ? baseUrl + item.image_icons
        : "https://via.placeholder.com/48?text=Icon";

      return `
        <div class="col-lg-4 col-md-6 mb-4 topic-card" data-id="${item.id}">
          <div class="card shadow-lg border-0 position-relative overflow-hidden w-100" style="border-radius:1.5rem; background:url('${imageBack}') center/cover no-repeat; min-height:220px;">
            <div class="position-absolute start-0 bottom-0 m-3 d-flex align-items-center">
              <div class="bg-white d-flex align-items-center justify-content-center rounded-circle shadow" style="width:56px; height:56px;">
                <img src="${iconImg}" alt="icon" style="width:32px; height:32px;">
              </div>
              <div class="ms-3 text-white">
                <div class="fw-bold fs-5 lh-1">${
                  item.title_ENG || "No title"
                }</div>
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

    document.getElementById("topic-list").innerHTML =
      '<div class="row gx-3 gy-4">' + cards.join("") + "</div>";
  },

  renderCategoryCards: (categoriesList) => {
    const html = categoriesList
      .map((c) => {
        const mainIndicator = c.indicators?.[0];
        const latestPerf = mainIndicator?.annual_data?.[0]?.performance ?? 0;
        return `
        <div class="col-md-6 col-xl-3 mb-4">
          <div class="card border-${
            c.color
          } shadow-sm h-100 category-card" data-index="${
          c.index
        }" data-color="${
          c.color
        }" style="cursor:pointer; border-radius:1.25rem; overflow:hidden;">
            <div class="card-body d-flex flex-column">
              <h5 class="text-${c.color} mb-2">${c.name_ENG}</h5>
              <p class="text-muted small mb-2">${c.description || ""}</p>
              <p class="text-muted small mb-2">Indicators: ${
                c.indicators.length
              }</p>
              <div id="radial-${c.id}" style="width:80px; height:80px;"></div>
              <p class="text-muted small mt-2">Latest: ${latestPerf}</p>
              <p class="text-muted small mt-auto mb-0">Last updated: ${
                c.updated_at
                  ? new Date(c.updated_at).toLocaleDateString()
                  : "N/A"
              }</p>
            </div>
          </div>
        </div>`;
      })
      .join("");

    document.getElementById("topic-list").innerHTML = `
      <button id="back-btn" class="btn btn-outline-primary mb-3">← Back to Topics</button>
      <div class="row gx-3 gy-4" id="category_list">${html}</div>
      <div id="annualTable" class="mt-5"></div>`;
  },
};
