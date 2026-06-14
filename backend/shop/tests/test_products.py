"""Tests for the 'Yeni' badge logic: 3-state admin override + auto date window."""
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from shop.models import Product, SiteSettings
from shop.serializers import ProductSerializer

from .factories import make_product


def _backdate(product, days):
    """created_at is auto_now_add, so push it into the past after creation."""
    Product.objects.filter(pk=product.pk).update(
        created_at=timezone.now() - timedelta(days=days)
    )
    product.refresh_from_db()


class ComputeIsNewTests(TestCase):
    def test_always_mode_is_new_regardless_of_age(self):
        p = make_product(slug="always-new")
        p.new_badge_mode = Product.NEW_BADGE_ALWAYS
        p.save()
        _backdate(p, 999)
        self.assertTrue(p.compute_is_new(7))

    def test_never_mode_not_new_even_when_fresh(self):
        p = make_product(slug="never-new")
        p.new_badge_mode = Product.NEW_BADGE_NEVER
        p.save()
        self.assertFalse(p.compute_is_new(7))

    def test_auto_mode_new_within_window(self):
        p = make_product(slug="auto-fresh")  # defaults to auto
        _backdate(p, 3)
        self.assertTrue(p.compute_is_new(7))

    def test_auto_mode_not_new_past_window(self):
        p = make_product(slug="auto-old")
        _backdate(p, 10)
        self.assertFalse(p.compute_is_new(7))

    def test_auto_mode_window_zero_disables(self):
        p = make_product(slug="auto-zero")
        self.assertFalse(p.compute_is_new(0))


class ProductSerializerIsNewTests(TestCase):
    def test_serializer_uses_site_settings_window(self):
        settings = SiteSettings.load()
        settings.new_badge_days = 5
        settings.save()

        fresh = make_product(slug="ser-fresh")
        _backdate(fresh, 2)
        old = make_product(slug="ser-old")
        _backdate(old, 8)

        self.assertTrue(ProductSerializer(fresh).data["is_new"])
        self.assertFalse(ProductSerializer(old).data["is_new"])

    def test_serializer_always_overrides_window(self):
        settings = SiteSettings.load()
        settings.new_badge_days = 1
        settings.save()

        p = make_product(slug="ser-always")
        p.new_badge_mode = Product.NEW_BADGE_ALWAYS
        p.save()
        _backdate(p, 365)
        self.assertTrue(ProductSerializer(p).data["is_new"])
