"""Admin-managed static pages API (#7)."""
from rest_framework.test import APITestCase

from shop.models import StaticPage


class StaticPageAPITests(APITestCase):
    def setUp(self):
        StaticPage.objects.create(
            slug="about", language="az", title="Haqqımızda", body="Birinci.\n\nİkinci.",
        )

    def test_get_published_page_public(self):
        r = self.client.get("/api/pages/about/?lang=az")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["title"], "Haqqımızda")
        self.assertIn("İkinci.", r.data["body"])

    def test_missing_language_falls_back_to_az(self):
        r = self.client.get("/api/pages/about/?lang=ru")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["language"], "az")

    def test_unknown_slug_returns_404(self):
        self.assertEqual(self.client.get("/api/pages/faq/?lang=az").status_code, 404)

    def test_unpublished_page_returns_404(self):
        StaticPage.objects.create(slug="terms", language="az", title="T", body="x", is_published=False)
        self.assertEqual(self.client.get("/api/pages/terms/?lang=az").status_code, 404)

    def test_endpoint_is_public(self):
        # default permission is IsAuthenticated; this must explicitly allow anon.
        self.assertNotIn(self.client.get("/api/pages/about/?lang=az").status_code, (401, 403))
