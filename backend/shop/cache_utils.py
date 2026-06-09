"""
Cache invalidation helpers for EtirX.
"""
import logging
from django.core.cache import cache

logger = logging.getLogger("shop.cache")


def invalidate_product_cache(product_id: int | None = None) -> None:
    """Invalidate product list and detail caches."""
    cache.delete_pattern("*products*")
    logger.debug("Product cache invalidated (product_id=%s)", product_id)


def invalidate_category_cache() -> None:
    """Invalidate category caches."""
    cache.delete_pattern("*categories*")
    logger.debug("Category cache invalidated")


def invalidate_testimonial_cache() -> None:
    cache.delete_pattern("*testimonials*")
    logger.debug("Testimonial cache invalidated")


def invalidate_site_settings_cache() -> None:
    cache.delete_pattern("*site_settings*")
    cache.delete_pattern("*site-settings*")
    logger.debug("Site settings cache invalidated")


def invalidate_delivery_methods_cache() -> None:
    cache.delete_pattern("*delivery*")
    logger.debug("Delivery methods cache invalidated")


def invalidate_promo_cache() -> None:
    cache.delete_pattern("*promo*")
    logger.debug("Promo cache invalidated")
