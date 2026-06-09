"""Locks in the secure-by-default permission flip (#28).

Public storefront endpoints must stay reachable without auth; user-scoped
endpoints must reject anonymous access with 401.
"""
from rest_framework.test import APITestCase

from .factories import make_product, make_user, make_variant


class PublicEndpointsStayOpen(APITestCase):
    def setUp(self):
        product = make_product()
        make_variant(product)

    def assertPublic(self, resp):
        # "public" == reachable without auth (anything but an auth rejection)
        self.assertNotIn(resp.status_code, (401, 403), msg=f"unexpected {resp.status_code}")

    def test_products_list_public(self):
        r = self.client.get("/api/products/")
        self.assertEqual(r.status_code, 200)

    def test_product_detail_public(self):
        r = self.client.get("/api/products/test-perfume/")
        self.assertEqual(r.status_code, 200)

    def test_categories_public(self):
        self.assertEqual(self.client.get("/api/categories/").status_code, 200)

    def test_delivery_methods_public(self):
        self.assertEqual(self.client.get("/api/delivery-methods/").status_code, 200)

    def test_testimonials_public(self):
        self.assertEqual(self.client.get("/api/testimonials/").status_code, 200)

    def test_site_settings_public(self):
        self.assertEqual(self.client.get("/api/site-settings/").status_code, 200)

    def test_public_promo_list_public(self):
        self.assertEqual(self.client.get("/api/promo-codes/").status_code, 200)

    def test_order_by_code_public(self):
        # Unknown code -> reachable (404/400), never an auth rejection.
        self.assertPublic(self.client.get("/api/orders/by-code/?code=NOPE"))

    def test_guest_checkout_create_public(self):
        # Empty payload -> 400 validation, but crucially NOT 401 (guest checkout).
        self.assertPublic(self.client.post("/api/orders/", {}, format="json"))

    def test_register_public(self):
        r = self.client.post(
            "/api/auth/register/",
            {"full_name": "Anon User", "email": "anon@example.com", "phone": "+994501112233", "password": "Passw0rd123"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)

    def test_contact_form_public(self):
        r = self.client.post(
            "/api/contact/",
            {"name": "Anon", "email": "anon@example.com", "message": "Salam!"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)


class ProtectedEndpointsRejectAnonymous(APITestCase):
    def test_me_requires_auth(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_cart_requires_auth(self):
        self.assertEqual(self.client.get("/api/me/cart/").status_code, 401)

    def test_favorites_requires_auth(self):
        self.assertEqual(self.client.get("/api/me/favorites/").status_code, 401)

    def test_my_orders_requires_auth(self):
        self.assertEqual(self.client.get("/api/orders/my-orders/").status_code, 401)

    def test_promo_validate_requires_auth(self):
        self.assertEqual(
            self.client.post("/api/promo-codes/validate/", {"code": "X"}, format="json").status_code,
            401,
        )

    def test_authenticated_user_can_reach_me(self):
        user = make_user()
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 200)
