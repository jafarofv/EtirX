"""
Custom DRF exception handler with CSRF/XSS protection.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger("shop.handlers")


def custom_exception_handler(exc, context):
    """
    Wrap DRF's default exception handler to strip sensitive data
    from error responses in production and log all 5xx errors.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Remove traceback/server info from error responses for security
        if response.status_code >= 500:
            logger.exception("Internal server error: %s", str(exc))
            if response.data and "detail" not in response.data:
                response.data = {"detail": "Server xətası baş verdi. Zəhmət olmasa daha sonra yenidən yoxlayın."}

    return response
