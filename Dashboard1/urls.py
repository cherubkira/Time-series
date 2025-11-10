from django.urls import path
from . import views
from .views import TopicListProxyView, TopicDetailProxyView, IndicatorDetailProxyView

urlpatterns = [
    path('', views.index, name='index'),
    # path('topic-detail/<int:topic_id>/', views.topic_detail, name='topic_detail'),
    # path('local-api/topic-detail/<int:topic_id>/', views.topic_detail_proxy, name='topic_detail_proxy'),
    # 2. API Proxy for Topic/Category Detail (using the Class-Based View)
    path('local-api/topic-list/', TopicListProxyView.as_view(), name='topic-list'),
    path('local-api/topic-detail/<int:topic_id>/', TopicDetailProxyView.as_view(), name='topic-detail'),
    path('local-api/indicator-detail/<int:indicator_id>/', IndicatorDetailProxyView.as_view(), name='indicator-detail'),
    ]