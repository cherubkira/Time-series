
from django.urls import path
from . import views
from .views import CategoryDetailProxyView

urlpatterns = [
    path('', views.index, name='index'),
    # path('topic-detail/<int:topic_id>/', views.topic_detail, name='topic_detail'),
    # path('local-api/topic-detail/<int:topic_id>/', views.topic_detail_proxy, name='topic_detail_proxy'),
    # 2. API Proxy for Topic/Category Detail (using the Class-Based View)
    path('local-api/topic-detail/<int:topic_id>/', views.CategoryDetailProxyView.as_view(), name='category-detail-proxy'),
    
    # 3. API Proxy for Indicator Detail
    path('local-api/indicator-detail/<int:indicator_id>/', views.IndicatorDetailProxyView.as_view(), name='indicator-detail-proxy'),
]
