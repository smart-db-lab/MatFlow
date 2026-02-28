from rest_framework import serializers

from .models import Project


class FeatureSelectionSerializer(serializers.Serializer):
    dataset = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    target_var = serializers.CharField(required=True)
    problem_type = serializers.ChoiceField(choices=['regression', 'classification'])
    estimator_name = serializers.ChoiceField(choices=[
        'ExtraTreesRegressor', 'RandomForestRegressor', 'GradientBoostingRegressor', 'XGBRegressor',
        'ExtraTreesClassifier', 'RandomForestClassifier', 'GradientBoostingClassifier', 'XGBClassifier',
    ])
    kfold = serializers.IntegerField(default=2)
    display_opt = serializers.ChoiceField(choices=['All', 'Custom', 'None'], default='None')
    features_to_display = serializers.ListField(
        child=serializers.CharField(), required=False, allow_null=True, allow_empty=True
    )


class ProjectSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "is_favorite", "owner", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]
