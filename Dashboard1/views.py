# Dashboard1/views.py (Corrected)

from django.http import JsonResponse
from django.views.decorators.http import require_GET
import requests # <-- MUST be imported
import json 
from django.shortcuts import render

# External API URL that you cannot change
EXTERNAL_BASE_URL = "http://time-series.mopd.gov.et"

@require_GET
def topic_detail_proxy(request, topic_id):
    
    external_url = f"{EXTERNAL_BASE_URL}/api/mobile/topic-detail/{topic_id}/"
    
    print(f"--- PROXY LOG: Forwarding request to: {external_url}")
    
    try:
       
        response = requests.get(external_url) 
        response.raise_for_status() 
        return JsonResponse(response.json(), safe=False)

   
    except requests.exceptions.RequestException as e: 
        print(f"PROXY ERROR: Connection failure or timeout: {e}")
        return JsonResponse({"error": "Failed to connect to the external API or connection timed out."}, status=500)
    
   
    except json.JSONDecodeError:
        print("PROXY ERROR: External API response was not valid JSON.")
        return JsonResponse({"error": "External API sent unreadable data."}, status=500)
    
    
    except Exception as e:
        print(f"PROXY ERROR: Unexpected error: {e}")
        return JsonResponse({"error": f"An unexpected server error occurred: {e}"}, status=500)
    
def index(request):
    return render(request, 'index.html')

def topic_detail(request, topic_id):
    return render(request, 'topic_detail.html', {'topic_id': topic_id})