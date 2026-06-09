"""Order cancellation (owner-only, restock, state guard) and OrderItem.line_total."""
from decimal import Decimal

from rest_framework.test import APITestCase

from shop.models import Product, ProductVariant
from .factories import (
    make_order,
    make_order_item,
    make_product,
    make_user,
    make_variant,
)


class OrderItemModelTests(APITestCase):
    def test_line_total_is_unit_price_times_quantity(self):
        user = make_user()
        product = make_product()
        order = make_order(user)
        item = make_order_item(order, product, quantity=3, unit_price="40.00")
        self.assertEqual(item.line_total, Decimal("120.00"))


class OrderCancelTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="owner@example.com")
        self.other = make_user(email="intruder@example.com")
        self.product = make_product(stock=5)
        self.variant = make_variant(self.product, stock=5)
        self.order = make_order(self.user, status="new")
        make_order_item(self.order, self.product, variant=self.variant, quantity=2)

    def test_owner_can_cancel_and_stock_is_restored(self):
        self.client.force_authenticate(self.user)
        resp = self.client.post(f"/api/orders/{self.order.code}/cancel/")
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "cancelled")
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 7)  # 5 + 2 restocked

    def test_non_owner_cannot_cancel(self):
        self.client.force_authenticate(self.other)
        resp = self.client.post(f"/api/orders/{self.order.code}/cancel/")
        self.assertEqual(resp.status_code, 404)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, "new")

    def test_unauthenticated_cannot_cancel(self):
        resp = self.client.post(f"/api/orders/{self.order.code}/cancel/")
        self.assertIn(resp.status_code, (401, 403))

    def test_shipped_order_cannot_be_cancelled(self):
        self.order.status = "shipped"
        self.order.save(update_fields=["status"])
        self.client.force_authenticate(self.user)
        resp = self.client.post(f"/api/orders/{self.order.code}/cancel/")
        self.assertEqual(resp.status_code, 400)

    def test_double_cancel_does_not_double_restock(self):
        self.client.force_authenticate(self.user)
        self.client.post(f"/api/orders/{self.order.code}/cancel/")
        # second cancel is rejected (already cancelled, not in CANCELLABLE)
        resp = self.client.post(f"/api/orders/{self.order.code}/cancel/")
        self.assertEqual(resp.status_code, 400)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock, 7)  # not restocked twice
