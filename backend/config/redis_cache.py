"""
Redis cache configuration for Django.
Uses django-redis with connection pooling.
"""
import os

_redis_url = os.getenv("REDIS_URL", "")
_use_redis = bool(_redis_url)  # Fallback to LocMemCache when Redis is not configured

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache" if _use_redis else "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": _redis_url if _use_redis else "etirx-local",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 50,
                "retry_on_timeout": True,
            },
        } if _use_redis else {},
        "KEY_PREFIX": "etirx",
        "TIMEOUT": 300,
    },
}

# Session cache
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Cache time-to-live values (in seconds)
CACHE_TTL = {
    "categories": 3600,       # 1 hour
    "products_list": 300,     # 5 minutes
    "product_detail": 600,    # 10 minutes
    "testimonials": 1800,     # 30 minutes
    "site_settings": 3600,    # 1 hour
    "delivery_methods": 3600, # 1 hour
    "promo_codes": 300,       # 5 minutes
}
