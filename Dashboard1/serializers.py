# serializers.py
from rest_framework import serializers

class IndicatorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title_ENG = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    frequency = serializers.CharField(allow_blank=True, required=False)
    measurement_units = serializers.CharField(allow_blank=True, required=False)
    updated_at = serializers.DateTimeField()
    annual_data = serializers.ListField(child=serializers.DictField(), required=False)
    for_category = serializers.ListField(child=serializers.DictField(), required=False)
    children = serializers.ListField(child=serializers.DictField(), required=False)

class CategorySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name_ENG = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    updated_at = serializers.DateTimeField()
    indicators = IndicatorSerializer(many=True, required=False)

class TopicSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title_ENG = serializers.CharField()
    title_AMH = serializers.CharField(allow_blank=True, required=False)
    count_category = serializers.IntegerField()
    background_image = serializers.CharField(allow_blank=True, required=False)
    image_icons = serializers.CharField(allow_blank=True, required=False)
