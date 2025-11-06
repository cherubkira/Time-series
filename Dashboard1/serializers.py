# C:\Users\OMEN\Desktop\time-series\Dashboard1\serializers.py

from rest_framework import serializers

class DataPointSerializer(serializers.Serializer):
    for_datapoint = serializers.CharField()
    performance = serializers.DecimalField(max_digits=15, decimal_places=5, allow_null=True)

class IndicatorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title_ENG = serializers.CharField(source='title_eng') 
    annual_data = DataPointSerializer(many=True, required=False)

class CategoryDetailSerializer(serializers.Serializer):
    name_ENG = serializers.CharField(source='name_eng')
    indicators = IndicatorSerializer(many=True)

class TopicDetailSerializer(serializers.Serializer):
    categories = CategoryDetailSerializer(many=True)

class TimeSeriesDataSerializer(serializers.Serializer):
    year = serializers.IntegerField() 
    value = serializers.CharField(max_length=50, allow_null=True, required=False)
    
class IndicatorDetailSerializer(serializers.Serializer):
    indicator_id = serializers.IntegerField(source='id')
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    unit = serializers.CharField(max_length=50, allow_blank=True, required=False)
    
    time_series_data = TimeSeriesDataSerializer(
        source='time_series_data', 
        many=True, 
        required=False,
        default=[]
    )