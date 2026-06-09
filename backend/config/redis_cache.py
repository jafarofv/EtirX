"""
Redis cache configuration for Django.
Uses django-redis with connection pooling.
"""
import os

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 50,
                "retry_on_timeout": True,
            },
            "PARSER_CLASS": "redis.connection.HiredisParser",  # not required, but faster
        },
        "KEY_PREFIX": "etirx",
        "TIMEOUT": 300,  # 5 minutes default
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
