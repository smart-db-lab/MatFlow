from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from .models import Journal


class JournalAPITests(APITestCase):
    """
    Basic API test to create a Journal record via the DRF ViewSet.
    This mirrors what the frontend AddArticle page does for journal articles.
    """

    def setUp(self):
        self.client: APIClient = APIClient()
        User = get_user_model()
        # Create a superuser since JournalViewSet requires IsSuperUser for create
        self.admin = User.objects.create_superuser(
            email="admin_test@example.com",
            full_name="Admin Test",
            password="AdminPass123!",
            username="admin_test",
        )
        self.client.force_authenticate(user=self.admin)
        # Router basename is "journal" -> "journal-list" for list/create
        self.url = reverse("journal-list")

    def test_create_journal_article(self):
        """
        Post a minimal valid journal payload and ensure we get 201 and a Journal in DB.
        """
        payload = {
            "title": "Test Journal Article",
            "authors": "Doe, J.; Smith, A.",
            "publication_date": "2024-05-01",
            "journal_name": "International Journal of Testing",
            "publisher": "Test Publisher",
        }

        response = self.client.post(self.url, payload, format="json")

        # Surface details if something goes wrong
        if response.status_code != status.HTTP_201_CREATED:
            raise AssertionError(
                f"Expected 201, got {response.status_code}. "
                f"Response data: {response.data}"
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Journal.objects.filter(
                title=payload["title"], journal_name=payload["journal_name"]
            ).exists()
        )
