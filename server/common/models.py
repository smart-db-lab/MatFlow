# from django.db import models


# class Citation(models.Model):
#     """Represents a bibliographic source (APA/MLA style)."""

#     class SourceType(models.TextChoices):
#         BOOK = "book", "Book"
#         JOURNAL = "journal", "Journal Article"
#         WEBSITE = "website", "Website"
#         REPORT = "report", "Report"
#         THESIS = "thesis", "Thesis / Dissertation"
#         OTHER = "other", "Other"

#     # Basic information
#     type_of_source = models.CharField(
#         max_length=20,
#         choices=SourceType.choices,
#         default=SourceType.BOOK,
#     )

#     # Authors
#     author = models.CharField(
#         max_length=255,
#         blank=True,
#         help_text="Name of individual author(s), e.g., 'Smith, J. D.'",
#     )
#     corporate_author = models.CharField(
#         max_length=255,
#         blank=True,
#         help_text="If corporate author, e.g., 'World Health Organization'",
#     )

#     # Bibliographic details
#     title = models.CharField(max_length=300)
#     year = models.CharField(max_length=10, blank=True)
#     publisher = models.CharField(max_length=200, blank=True)
#     city = models.CharField(max_length=100, blank=True)

#     # Journal/Article specific fields
#     journal_name = models.CharField(max_length=200, blank=True)
#     volume = models.CharField(max_length=20, blank=True)
#     issue = models.CharField(max_length=20, blank=True)
#     pages = models.CharField(max_length=50, blank=True)

#     # Online sources
#     url = models.URLField(blank=True)
#     access_date = models.DateField(blank=True, null=True)

#     # Metadata
#     tag_name = models.CharField(
#         max_length=100,
#         blank=True,
#         help_text="Optional short tag for reference management.",
#     )
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         ordering = ["-created_at"]
#         verbose_name = "Citation"
#         verbose_name_plural = "Citations"

#     def __str__(self):
#         """Readable display of the citation."""
#         author_display = (
#             self.corporate_author or self.author or "Unknown Author"
#         )
#         year_display = f" ({self.year})" if self.year else ""
#         return f"{author_display}{year_display}: {self.title}"

#     def formatted_apa(self):
#         """Return a human-readable APA-style string."""
#         author_part = self.corporate_author or self.author or ""
#         year_part = f"({self.year})." if self.year else ""
#         title_part = f"{self.title}."
#         publisher_part = f" {self.publisher}." if self.publisher else ""
#         url_part = f" Retrieved from {self.url}" if self.url else ""
#         return f"{author_part} {year_part} {title_part}{publisher_part}{url_part}".strip()




from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from core.models import SoftDeleteModel

date_validator = RegexValidator(
    regex=r'^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$',
    message="Enter date in YYYY or YYYY-MM or YYYY-MM-DD format."
)

def date_help():
    return "Format: YYYY or YYYY-MM or YYYY-MM-DD"


class Journal(SoftDeleteModel):
    title = models.CharField(max_length=255)
    authors = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.CharField(
        max_length=20,
        validators=[date_validator],
        help_text=date_help(),
        blank=True,
        null=True,
    )
    journal_name = models.CharField(max_length=255)
    volume = models.CharField(max_length=50, blank=True, null=True)
    issue = models.CharField(max_length=50, blank=True, null=True)
    pages = models.CharField(max_length=50, help_text="e.g., 10-18", blank=True, null=True)
    issn = models.CharField(max_length=30, blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    doi = models.CharField(max_length=255, blank=True, null=True, help_text="Digital Object Identifier (DOI)")
    formatting_metadata = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="JSON field to store rich text formatting (bold, italic, underline) for title, authors, journal_name, publisher, volume"
    )

    def __str__(self):
        return self.title


class Conference(SoftDeleteModel):
    title = models.CharField(max_length=255)
    authors = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.CharField(
        max_length=20,
        validators=[date_validator],
        help_text=date_help(),
        blank=True,
        null=True,
    )
    conference_name = models.CharField(max_length=255)
    venue = models.CharField(max_length=255, blank=True, null=True)
    isbn = models.CharField(max_length=50, blank=True, null=True)
    pages = models.CharField(max_length=50, help_text="e.g., 10-18", blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    doi = models.CharField(max_length=255, blank=True, null=True, help_text="Digital Object Identifier (DOI)")
    formatting_metadata = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="JSON field to store rich text formatting (bold, italic, underline) for title, authors, conference_name, publisher"
    )

    def __str__(self):
        return self.title


class Book(SoftDeleteModel):
    title = models.CharField(max_length=255)
    authors = models.CharField(max_length=500)
    publication_date = models.CharField(
        max_length=20,
        validators=[date_validator],
        help_text=date_help(),
        blank=True,
        null=True,
    )
    pages = models.CharField(max_length=50, help_text="e.g., 10-18", blank=True, null=True)
    isbn = models.CharField(max_length=50, blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    doi = models.CharField(max_length=255, blank=True, null=True, help_text="Digital Object Identifier (DOI)")
    formatting_metadata = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="JSON field to store rich text formatting (bold, italic, underline) for title, authors, publisher"
    )

    def __str__(self):
        return self.title


class Patent(SoftDeleteModel):
    title = models.CharField(max_length=255)
    inventors = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.CharField(
        max_length=20,
        validators=[date_validator],
        help_text=date_help(),
        blank=True,
        null=True,
    )
    patent_office = models.CharField(max_length=255, blank=True, null=True)
    patent_number = models.CharField(max_length=100, blank=True, null=True)
    application_number = models.CharField(max_length=100, blank=True, null=True)
    patent_link = models.URLField(blank=True, null=True, help_text="Link to patent (e.g., Google Patents or USPTO)")
    formatting_metadata = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="JSON field to store rich text formatting (bold, italic, underline) for title, inventors"
    )

    def __str__(self):
        return self.title


class Dataset(SoftDeleteModel):
    title = models.CharField(max_length=255)
    originators = models.CharField(max_length=500, blank=True, null=True)
    publication_date = models.CharField(
        max_length=20,
        validators=[date_validator],
        help_text=date_help(),
        blank=True,
        null=True,
    )
    under_publication = models.CharField(max_length=255, blank=True, null=True)
    keywords = models.CharField(max_length=500, help_text="Separate with commas", blank=True, null=True)
    file = models.FileField(upload_to="datasets/" , null=True, blank=True)
    formatting_metadata = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text="JSON field to store rich text formatting (bold, italic, underline) for title, originators"
    )

    def __str__(self):
        return self.title



class OurServiece(SoftDeleteModel):
    service_key = models.CharField(
        max_length=50,
        default="mlflow",
        help_text="Logical service identifier, e.g. 'mlflow', 'matflow', 'eda'"
    )
    service_logo = models.ImageField(upload_to="service_logos/", blank=True, default="")
    service_name = models.CharField(max_length=255)
    service_description = models.TextField()
    service_url = models.URLField()

    def __str__(self):
        return self.service_name
    
class HeaderSection(SoftDeleteModel):
    service_key = models.CharField(
        max_length=50,
        default="mlflow",
        help_text="Logical service identifier, e.g. 'mlflow', 'matflow', 'eda'"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    # Use FileField instead of ImageField so we can support SVG and other image formats
    # Validation of allowed file types (e.g., restricting to image/*, image/svg+xml)
    # is handled at the serializer or form level.
    title_image = models.FileField(upload_to="header_images/", null=True, blank=True)
    def __str__(self):
        return self.title
    
class SupportLogo(SoftDeleteModel):
    service_key = models.CharField(
        max_length=50,
        default="mlflow",
        help_text="Logical service identifier, e.g. 'mlflow', 'matflow', 'eda'"
    )
    support_logo = models.ImageField(upload_to="support_logos/")
    order = models.IntegerField(default=0, help_text="Display order (lower numbers shown first)")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        ordering = ['order', '-id']

    def __str__(self):
        return str(self.support_logo) if self.support_logo else "Support Logo"
    
class HeroImage(SoftDeleteModel):
    service_key = models.CharField(
        max_length=50,
        default="mlflow",
        help_text="Logical service identifier, e.g. 'mlflow', 'matflow', 'eda'"
    )
    hero_image = models.ImageField(upload_to="header_images/")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return str(self.hero_image) if self.hero_image else "Hero Image"


class SiteVisit(models.Model):
    """Tracks unique site visits for the visitor counter."""
    visitor_id = models.CharField(
        max_length=64,
        help_text="Cookie/localStorage-based unique visitor ID",
    )
    visitor_type = models.CharField(
        max_length=10,
        choices=[("guest", "Guest"), ("user", "User")],
        default="guest",
    )
    visited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["visited_at"])]

    def __str__(self):
        return f"{self.visitor_type} - {self.visitor_id[:8]}... @ {self.visited_at}"


class FAQ(SoftDeleteModel):
    service_key = models.CharField(
        max_length=50,
        default="mlflow",
        help_text="Logical service identifier, e.g. 'mlflow', 'matflow', 'eda'"
    )
    question = models.CharField(max_length=500)
    answer = models.TextField()
    order = models.IntegerField(default=0, help_text="Display order (lower numbers shown first)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    class Meta:
        ordering = ['order', '-id']

    def __str__(self):
        return self.question