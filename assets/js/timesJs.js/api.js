// api.js - Handles all API requests
export const ApiService = {
  fetchTopics: () =>
    fetch("https://time-series.mopd.gov.et/api/mobile/topic-list/").then(
      (res) => res.json()
    ),
  fetchCategoryDetail: (topicId) =>
    fetch(`/local-api/topic-detail/${topicId}/`).then((res) => res.json()),
  fetchIndicatorDetails: (indicatorId) =>
    fetch(`/local-api/indicator-detail/${indicatorId}/`).then((res) =>
      res.json()
    ),
};
