import json
import logging
import os
import ssl
import socket
import time
import threading
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)
HTTP_TIMEOUT_SECONDS = int(os.getenv("NOTIFICATION_HTTP_TIMEOUT", "20"))
HTTP_RETRY_COUNT = int(os.getenv("NOTIFICATION_HTTP_RETRIES", "2"))


def _post_json(url: str, payload: dict, headers: dict | None = None) -> None:
    data = json.dumps(payload).encode("utf-8")
    insecure_context = ssl._create_unverified_context()
    last_exc: Exception | None = None

    for attempt in range(HTTP_RETRY_COUNT + 1):
        request = Request(url, data=data, method="POST")
        request.add_header("Content-Type", "application/json")
        for key, value in (headers or {}).items():
            request.add_header(key, value)

        for context in (None, insecure_context):
            try:
                kwargs = {"timeout": HTTP_TIMEOUT_SECONDS}
                if context is not None:
                    kwargs["context"] = context
                with urlopen(request, **kwargs) as response:
                    response.read()
                return
            except ssl.SSLCertVerificationError as exc:
                last_exc = exc
                continue
            except URLError as exc:
                last_exc = exc
                reason = getattr(exc, "reason", None)
                if isinstance(reason, ssl.SSLCertVerificationError) or (
                    isinstance(reason, OSError)
                    and "CERTIFICATE_VERIFY_FAILED" in str(reason)
                ):
                    continue
                if isinstance(reason, socket.timeout) or "timed out" in str(reason).lower():
                    break
                raise
            except socket.timeout as exc:
                last_exc = exc
                break

        if attempt < HTTP_RETRY_COUNT:
            time.sleep(1.0)

    if last_exc:
        raise last_exc


def build_order_message(order) -> str:
    items = "\n".join(
        f"- {item.product.name} x{item.quantity} ({item.unit_price} \u20BC)"
        for item in order.items.all()
    )
    return (
        "New order received\n"
        f"Code: {order.code}\n"
        f"Customer: {order.full_name}\n"
        f"Phone: {order.phone}\n"
        f"Address: {order.address}\n"
        f"Shipping: {order.shipping_fee} \u20BC\n"
        f"Total: {order.total} \u20BC\n"
        f"Status: {order.status}\n"
        f"Items:\n{items}"
    )


def send_telegram_notification(message: str) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    raw_chat_ids = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    chat_ids = [chat_id.strip() for chat_id in raw_chat_ids.split(",") if chat_id.strip()]
    if not token or not chat_ids:
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    for chat_id in chat_ids:
        try:
            _post_json(url, {"chat_id": chat_id, "text": message})
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            logger.warning("Telegram notification failed for %s: %s", chat_id, exc)


def send_whatsapp_notification(message: str) -> None:
    token = os.getenv("WHATSAPP_CLOUD_TOKEN", "").strip()
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    to_number = os.getenv("WHATSAPP_TO_NUMBER", "").strip()
    if not token or not phone_number_id or not to_number:
        return

    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message},
    }
    try:
        _post_json(url, payload, headers=headers)
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        logger.warning("WhatsApp notification failed: %s", exc)


def send_order_notification(order) -> None:
    message = build_order_message(order)
    send_telegram_notification(message)
    send_whatsapp_notification(message)


def send_order_notification_async(order) -> None:
    thread = threading.Thread(target=send_order_notification, args=(order,), daemon=True)
    thread.start()
