// handlers.js - Event listeners
import { Cache } from "./cache.js";
import { Render } from "./renderer.js";
import { Charts } from "./charts.js";

export const Handlers = {
  topicClick: () => {
    document.addEventListener("click", async (e) => {
      if (!e.target.closest(".topic-card")) return;
      const card = e.target.closest(".topic-card");
      const topicId = card.dataset.id;

      const topicListEl = document.getElementById("topic-list");
      topicListEl.innerHTML =
        "<p class='text-center mt-3'>Loading categories...</p>";

      try {
        const res = await fetch(`/local-api/topic-detail/${topicId}/`);
        const data = await res.json();
        Cache.categoryData = data;

        const categories = data.categories || [];
        categories.forEach((c, i) => {
          c.index = i;
          c.color = [
            "primary",
            "success",
            "danger",
            "warning",
            "info",
            "secondary",
          ][i % 6];
        });

        Render.renderCategoryCards(categories);

        categories.forEach((c) => {
          const mainIndicator = c.indicators?.[0];
          const latest = mainIndicator?.annual_data?.[0]?.performance ?? 0;
          if (mainIndicator?.annual_data?.length) {
            Charts.renderRadial(`#radial-${c.id}`, latest, c.color);
          }
        });
      } catch (err) {
        topicListEl.innerHTML =
          "<p class='text-danger'>Error loading categories.</p>";
        console.error(err);
      }
    });
  },

  backBtnClick: () => {
    document.addEventListener("click", (e) => {
      if (e.target.id === "back-btn") {
        document.getElementById("topic-list").innerHTML = Cache.topicHtml || "";
        document.getElementById("annualTable").innerHTML = "";
      }
    });
  },
};
