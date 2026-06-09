"""
WebSocket URL routing for real-time order tracking.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/orders/(?P<order_code>[a-zA-Z0-9]+)/$", consumers.OrderTrackingConsumer.as_asgi()),
]
