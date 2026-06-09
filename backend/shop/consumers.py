"""
WebSocket consumer for real-time order tracking.

Clients connect to ws://host/ws/orders/<order_code>/
and receive status updates pushed by the staff/admin via Django Channels group.
"""
import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger("shop.consumers")

ORDER_GROUP_PREFIX = "order_"


class OrderTrackingConsumer(AsyncJsonWebsocketConsumer):
    """
    Handles WebSocket connections for order tracking.

    On connect, joins a group named 'order_<order_code>'.
    On disconnect, leaves the group.
    """

    async def connect(self):
        self.order_code = self.scope["url_route"]["kwargs"]["order_code"]
        self.group_name = f"{ORDER_GROUP_PREFIX}{self.order_code}"

        # Join the order-specific group
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

        logger.info("WebSocket connected for order %s (channel %s)", self.order_code, self.channel_name)

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info("WebSocket disconnected for order %s (code %s)", self.order_code, close_code)

    async def receive_json(self, content, **kwargs):
        """
        Client messages are echoed back if needed, but primarily
        we just listen for server-pushed updates.
        """
        pass  # Clients are read-only listeners

    async def order_update(self, event):
        """
        Handler for 'order.update' events sent to the group.
        Pushes the update payload to the WebSocket client.
        """
        await self.send_json(event["data"])
