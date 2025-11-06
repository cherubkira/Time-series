import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import render
from django.core.cache import cache
import threading

# --- Configuration ---
EXTERNAL_BASE_URL = "https://time-series.mopd.gov.et"
CACHE_TIMEOUT = 60 * 60  # 1 hour

# Persistent session for keep-alive connections
EXTERNAL_SESSION = requests.Session()


# --- Warm-up Function ---
def warmup_external_connection():
    """Force DNS/SSL handshake for faster first request."""
    warmup_url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-list/"
    try:
        resp = EXTERNAL_SESSION.get(warmup_url, timeout=5)
        resp.raise_for_status()
        print("External connection warmed up successfully.")
    except Exception as e:
        print(f"Warning: Failed to warm up external connection: {e}")


# --- Cache Warmup Function ---
def warmup_cache():
    """Preload topics, categories, and some indicator details into cache."""
    try:
        topics_url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-list/"
        resp = EXTERNAL_SESSION.get(topics_url, timeout=5)
        resp.raise_for_status()
        topics_data = resp.json().get('data', [])

        for topic in topics_data:
            topic_id = topic.get('id')
            if not topic_id:
                continue

            # Cache topic detail
            category_url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-detail/{topic_id}/"
            try:
                cat_resp = EXTERNAL_SESSION.get(category_url, timeout=5)
                cat_resp.raise_for_status()
                categories_list = cat_resp.json().get('data', {}).get('categories', [])
                cache.set(f"topic_detail_{topic_id}", {"categories": categories_list}, CACHE_TIMEOUT)

                # Optional: Pre-cache first indicator of each category
                for category in categories_list:
                    for indicator in category.get('indicators', [])[:1]:  # first indicator only
                        indicator_id = indicator.get('id')
                        if indicator_id:
                            indicator_url = f"{EXTERNAL_BASE_URL}/api/mobile/indicator-detail/{indicator_id}/"
                            try:
                                ind_resp = EXTERNAL_SESSION.get(indicator_url, timeout=5)
                                ind_resp.raise_for_status()
                                cache.set(f"indicator_detail_{indicator_id}", ind_resp.json().get('data', {}), CACHE_TIMEOUT)
                            except:
                                continue
            except:
                continue

        print("Cache preloaded successfully.")

    except Exception as e:
        print(f"Warning: Failed to preload cache: {e}")


# --- Standard Django View ---
def index(request):
    return render(request, 'index.html')


# ---------------------------------------------------------------------
# --- Proxy View 1: Category/Topic Detail ---
# ---------------------------------------------------------------------
class CategoryDetailProxyView(APIView):
    def get(self, request, topic_id):
        cache_key = f"topic_detail_{topic_id}"

        # Check cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # Miss: fetch from external API
        external_url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-detail/{topic_id}/"
        try:
            resp = EXTERNAL_SESSION.get(external_url, timeout=10)
            resp.raise_for_status()
            raw_data = resp.json()

            categories_list = raw_data.get('data', {}).get('categories', [])
            response_payload = {"categories": categories_list}

            cache.set(cache_key, response_payload, CACHE_TIMEOUT)
            return Response(response_payload, status=status.HTTP_200_OK)

        except requests.RequestException as e:
            return Response({
                "error": "External API failure (Topic Detail)",
                "details": str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                "error": "Internal server error (Topic Detail)",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------------------
# --- Proxy View 2: Indicator Detail ---
# ---------------------------------------------------------------------
class IndicatorDetailProxyView(APIView):
    def get(self, request, indicator_id):
        cache_key = f"indicator_detail_{indicator_id}"

        # Check cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data, status=status.HTTP_200_OK)

        # Miss: fetch from external API
        external_url = f"{EXTERNAL_BASE_URL}/api/mobile/indicator-detail/{indicator_id}/"
        try:
            resp = EXTERNAL_SESSION.get(external_url, timeout=10)
            resp.raise_for_status()
            raw_data = resp.json()
            final_data = raw_data.get('data', {})

            cache.set(cache_key, final_data, CACHE_TIMEOUT)
            return Response(final_data, status=status.HTTP_200_OK)

        except requests.RequestException as e:
            return Response({
                "error": "External API failure (Indicator Detail)",
                "details": str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({
                "error": "Internal server error (Indicator Detail)",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
