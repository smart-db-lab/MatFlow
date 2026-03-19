from rest_framework import serializers
from .models import *


# class CitationSerializer(serializers.ModelSerializer):
#     """Serializer for Citation model."""

#     formatted_apa = serializers.SerializerMethodField()

#     class Meta:
#         model = Citation
#         fields = [
#             "id",
#             "type_of_source",
#             "author",
#             "corporate_author",
#             "title",
#             "year",
#             "publisher",
#             "city",
#             "journal_name",
#             "volume",
#             "issue",
#             "pages",
#             "url",
#             "access_date",
#             "tag_name",
#             "created_at",
#             "formatted_apa",
#         ]
#         read_only_fields = ["id", "created_at", "formatted_apa"]
    
#     def validate(self, data):
#         """Validate citation data."""
#         # For CharField fields with blank=True but no null=True, keep empty strings
#         # Only convert to None for fields that support null (like DateField)
#         char_fields = ['author', 'corporate_author', 'year', 'publisher', 'city', 
#                       'journal_name', 'volume', 'issue', 'pages', 'url', 'tag_name']
        
#         for field in char_fields:
#             if field in data and data[field] is None:
#                 # Convert None back to empty string for CharField fields
#                 data[field] = ''
        
#         # For access_date (DateField), we can use None if it's empty
#         if 'access_date' in data and data['access_date'] == '':
#             data['access_date'] = None
            
#         return data

#     def get_formatted_apa(self, obj):
#         """Return APA-style formatted citation."""
#         return obj.formatted_apa()



# class FileInfoSerializer(serializers.ModelSerializer):
#     """Serializer for file metadata and uploads."""

#     file_url = serializers.SerializerMethodField()

#     class Meta:
#         model = FileInfo
#         fields = ["id", "file_name", "file", "file_url", "created_at"]
#         read_only_fields = ["id", "created_at", "file_url"]

#     def get_file_url(self, obj):
#         """Return full absolute URL for the uploaded file."""
#         request = self.context.get("request")
#         if obj.file and request:
#             return request.build_absolute_uri(obj.file.url)
#         return None
    



class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Journal
        fields = "__all__"
    
    def to_internal_value(self, data):
        # Handle formatting_metadata if it comes as a string (from FormData)
        if 'formatting_metadata' in data and isinstance(data['formatting_metadata'], str):
            try:
                import json
                data = data.copy()  # Make a mutable copy
                data['formatting_metadata'] = json.loads(data['formatting_metadata'])
            except (json.JSONDecodeError, TypeError):
                pass  # Keep as is if parsing fails
        return super().to_internal_value(data)


class ConferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conference
        fields = "__all__"
    
    def to_internal_value(self, data):
        # Handle formatting_metadata if it comes as a string (from FormData)
        if 'formatting_metadata' in data and isinstance(data['formatting_metadata'], str):
            try:
                import json
                data = data.copy()  # Make a mutable copy
                data['formatting_metadata'] = json.loads(data['formatting_metadata'])
            except (json.JSONDecodeError, TypeError):
                pass  # Keep as is if parsing fails
        return super().to_internal_value(data)


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = "__all__"
    
    def to_internal_value(self, data):
        # Handle formatting_metadata if it comes as a string (from FormData)
        if 'formatting_metadata' in data and isinstance(data['formatting_metadata'], str):
            try:
                import json
                data = data.copy()  # Make a mutable copy
                data['formatting_metadata'] = json.loads(data['formatting_metadata'])
            except (json.JSONDecodeError, TypeError):
                pass  # Keep as is if parsing fails
        return super().to_internal_value(data)


class PatentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patent
        fields = "__all__"
    
    def to_internal_value(self, data):
        # Handle formatting_metadata if it comes as a string (from FormData)
        if 'formatting_metadata' in data and isinstance(data['formatting_metadata'], str):
            try:
                import json
                data = data.copy()  # Make a mutable copy
                data['formatting_metadata'] = json.loads(data['formatting_metadata'])
            except (json.JSONDecodeError, TypeError):
                pass  # Keep as is if parsing fails
        return super().to_internal_value(data)


class DatasetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Dataset
        fields = "__all__"
        extra_kwargs = {
            'file': {'required': False, 'allow_null': True}
        }
    
    def get_file_url(self, obj):
        """Return full absolute URL for the uploaded file."""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            # Fallback if no request context
            return obj.file.url
        return None
    
    def validate_file(self, value):
        """Validate that the file field is actually a file."""
        if value is not None and not hasattr(value, 'read'):
            raise serializers.ValidationError("The submitted data was not a file. Check the encoding type on the form.")
        return value


class OurServieceSerializer(serializers.ModelSerializer):
    class Meta:
        model = OurServiece
        fields = "__all__"
        extra_kwargs = {
            "service_description": {"required": False, "allow_blank": True},
        }
    
    def validate(self, data):
        """Validate that logo is provided for new instances."""
        # If creating a new instance (no instance) and no logo provided
        if not self.instance and 'service_logo' not in data:
            raise serializers.ValidationError({"service_logo": "Service logo is required when creating a new service."})
        return data

class HeaderSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderSection
        fields = "__all__"

    def update(self, instance, validated_data):
        """
        Allow clearing the title_image from the admin UI.
        If 'remove_title_image' is present and truthy in the incoming data,
        explicitly set title_image to None via validated_data so it is saved.
        """
        raw = getattr(self, "initial_data", {}) or {}
        remove_flag = raw.get("remove_title_image")
        # Handle both boolean and string values
        if isinstance(remove_flag, str):
            remove_flag = remove_flag.lower() in ["1", "true", "yes", "on"]
        elif remove_flag is None:
            remove_flag = False
        # remove_flag is now a boolean (True/False)
        if remove_flag:
            # ensure DRF update() writes null for this field
            validated_data["title_image"] = None
        return super().update(instance, validated_data)

class SupportLogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportLogo
        fields = "__all__"

class HeroImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroImage
        fields = "__all__"


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = "__all__"


class SiteVisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteVisit
        fields = ["id", "visitor_id", "visitor_type", "visited_at"]
        read_only_fields = ["id", "visited_at"]
