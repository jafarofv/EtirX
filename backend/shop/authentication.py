"""
Token authentication with a configurable time-to-live (TTL).

DRF's stock ``TokenAuthentication`` issues tokens that never expire, so a leaked
key is valid forever. ``ExpiringTokenAuthentication`` rejects any token whose
``created`` timestamp is older than ``settings.AUTH_TOKEN_TTL`` and deletes it,
forcing the client to log in again. Tokens are rotated on every login /
registration (see ``LoginView`` / ``RegisterView``), so the TTL window resets
for each active session and the previous key is invalidated.
"""
from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        ttl = getattr(settings, "AUTH_TOKEN_TTL", None)
        if ttl is not None and (timezone.now() - token.created) > ttl:
            # Stale token: delete it so the same key can't be retried, then
            # signal the client to re-authenticate.
            token.delete()
            raise AuthenticationFailed("Token expired. Please log in again.")
        return user, token
