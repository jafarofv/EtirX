"""
Asynchronous email / WhatsApp notification helpers for orders.
Uses Django's email backend for email and Twilio for WhatsApp messages.
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger("shop.notifications")


def send_order_notification_async(order) -> None:
    """
    Send order confirmation email and optionally WhatsApp notification.
    Called inside transaction.on_commit() so it only fires after DB commit.
    """
    try:
        _send_order_email(order)
    except Exception:
        logger.exception("Failed to send order email for order %s", order.code)

    try:
        _send_order_whatsapp(order)
    except Exception:
        logger.exception("Failed to send WhatsApp notification for order %s", order.code)


def _send_order_email(order) -> None:
    subject = f"EtirX – Sifarişiniz qəbul edildi #{order.code}"
    html_message = render_to_string(
        "shop/emails/order_confirmation.html",
        {
            "order": order,
            "items": order.items.select_related("product", "variant").all(),
        },
    )
    plain_message = (
        f"Sifarişiniz #{order.code} qəbul edildi.\n"
        f"Ümumi məbləğ: {order.total} AZN\n"
        f"Status: {order.get_status_display()}\n"
        f"Tarix: {order.created_at.strftime('%d.%m.%Y %H:%M')}"
    )
    recipient = order.email or order.user.email if order.user else None
    if not recipient:
        logger.warning("No recipient email for order %s, skipping email.", order.code)
        return
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        html_message=html_message,
        fail_silently=not settings.DEBUG,
    )


def _send_order_whatsapp(order) -> None:
    """
    Send WhatsApp notification via Twilio.
    Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
    environment variables / settings.
    """
    twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
    twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
    twilio_from = getattr(settings, "TWILIO_WHATSAPP_FROM", None)

    if not all([twilio_sid, twilio_token, twilio_from]):
        logger.debug("Twilio WhatsApp not configured, skipping.")
        return

    phone = order.phone
    if not phone:
        logger.debug("No phone for order %s, skipping WhatsApp.", order.code)
        return

    # Normalize phone number to E.164
    phone = phone.strip()
    if phone.startswith("0"):
        phone = "+994" + phone[1:]
    elif not phone.startswith("+"):
        phone = "+994" + phone

    try:
        from twilio.rest import Client

        client = Client(twilio_sid, twilio_token)
        message_body = (
            f"🎉 *EtirX – Sifarişiniz qəbul edildi!*\n\n"
            f"Sifariş №: *{order.code}*\n"
            f"Ümumi məbləğ: *{order.total} AZN*\n"
            f"Status: {order.get_status_display()}\n"
            f"Tarix: {order.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
            f"🙏 Sifarişiniz üçün təşəkkür edirik!"
        )
        client.messages.create(
            body=message_body,
            from_=f"whatsapp:{twilio_from}",
            to=f"whatsapp:{phone}",
        )
        logger.info("WhatsApp notification sent for order %s to %s", order.code, phone)
    except ImportError:
        logger.warning("Twilio package not installed, cannot send WhatsApp.")
    except Exception:
        logger.exception("WhatsApp send failed for order %s", order.code)
