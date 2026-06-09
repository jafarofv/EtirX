"""The order-confirmation email template must render (it was previously missing)."""
from django.template.loader import render_to_string
from rest_framework.test import APITestCase

from .factories import make_order, make_order_item, make_product, make_user, make_variant


class OrderEmailTemplateTests(APITestCase):
    def test_order_confirmation_template_renders_all_fields(self):
        user = make_user()
        product = make_product(name="Midnight Essence")
        variant = make_variant(product, label="Premium")
        order = make_order(user, code="ETX-MAIL01")
        make_order_item(order, product, variant=variant, quantity=2, unit_price="50.00")

        html = render_to_string(
            "shop/emails/order_confirmation.html",
            {"order": order, "items": order.items.select_related("product", "variant").all()},
        )
        self.assertIn("ETX-MAIL01", html)
        self.assertIn("Midnight Essence", html)
        self.assertIn("Premium", html)
        self.assertIn("100.00", html)  # line_total 50.00 * 2
