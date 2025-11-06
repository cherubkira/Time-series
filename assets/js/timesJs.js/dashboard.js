// main.js - Entry point
import { ApiService } from "./api.js";
import { Cache } from "./cache.js";
import { Render } from "./render.js";
import { Handlers } from "./handlers.js";
import { Details } from "./details.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await ApiService.fetchTopics();
    const topics = response.data || [];
    if (topics.length) {
      Render.renderTopics(topics, "http://time-series.mopd.gov.et");
      Cache.topicHtml = document.getElementById("topic-list").innerHTML;
    } else {
      document.getElementById("topic-list").innerHTML =
        "<p class='text-warning'>No topics found.</p>";
    }
  } catch (err) {
    document.getElementById("topic-list").innerHTML =
      "<p class='text-danger'>Error loading topics.</p>";
    console.error(err);
  }

  Details.initIndicatorClick();
  Handlers.topicClick();
  Handlers.backBtnClick();
});
