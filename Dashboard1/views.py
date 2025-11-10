# views.py
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.shortcuts import render

EXTERNAL_BASE_URL = "https://time-series.mopd.gov.et"
CACHE_TIMEOUT = 60 * 60
EXTERNAL_SESSION = requests.Session()


def index(request):
    return render(request, 'index.html')

class TopicListProxyView(APIView):
    """Endpoint: /local-api/topic-list/"""
    def get(self, request):
        cache_key = "topic_list"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-list/"
        try:
            resp = EXTERNAL_SESSION.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json().get("data", [])
            cache.set(cache_key, data, CACHE_TIMEOUT)
            return Response(data)
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class TopicDetailProxyView(APIView):
    """Endpoint: /local-api/topic-detail/<topic_id>/"""
    def get(self, request, topic_id):
        cache_key = f"topic_detail_{topic_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-detail/{topic_id}/"
        try:
            resp = EXTERNAL_SESSION.get(url, timeout=10)
            resp.raise_for_status()
            categories = resp.json().get("data", {}).get("categories", [])
            cache.set(cache_key, {"categories": categories}, CACHE_TIMEOUT)
            return Response({"categories": categories})
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class IndicatorDetailProxyView(APIView):
    """Endpoint: /local-api/indicator-detail/<indicator_id>/"""
    def get(self, request, indicator_id):
        cache_key = f"indicator_detail_{indicator_id}"
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        url = f"{EXTERNAL_BASE_URL}/api/mobile/indicator-detail/{indicator_id}/"
        try:
            resp = EXTERNAL_SESSION.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json().get("data", {})
            cache.set(cache_key, data, CACHE_TIMEOUT)
            return Response(data)
        except requests.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
