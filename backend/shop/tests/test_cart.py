"""Server-side cart endpoint: bulk replace, read-back, and quantity validation."""
from rest_framework.test import APITestCase

from .factories import make_product, make_user, make_variant


class CartEndpointTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="cart@example.com")
        self.product = make_product(stock=10)
        self.variant = make_variant(self.product, stock=10)
        self.client.force_authenticate(self.user)

    def test_bulk_post_then_get_roundtrips_items(self):
        resp = self.client.post(
            "/api/me/cart/",
            {"items": [{"product_id": self.product.id, "variant_id": self.variant.id, "quantity": 3}]},
            format="json",
        )
        self.assertEqual(resp.status_code, 201)

        get = self.client.get("/api/me/cart/")
        self.assertEqual(get.status_code, 200)
        self.assertEqual(len(get.data), 1)
        self.assertEqual(get.data[0]["quantity"], 3)
        self.assertEqual(get.data[0]["product"]["id"], self.product.id)

    def test_bulk_post_replaces_previous_contents(self):
        self.client.post(
            "/api/me/cart/",
            {"items": [{"product_id": self.product.id, "quantity": 1}]},
            format="json",
        )
        # second bulk POST with empty list clears the cart
        self.client.post("/api/me/cart/", {"items": []}, format="json")
        get = self.client.get("/api/me/cart/")
        self.assertEqual(len(get.data), 0)

    def test_single_item_zero_quantity_rejected(self):
        resp = self.client.post(
            "/api/me/cart/",
            {"product_id": self.product.id, "quantity": 0},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_cart_requires_authentication(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get("/api/me/cart/")
        self.assertIn(resp.status_code, (401, 403))
