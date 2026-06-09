"""Auth: registration, login token rotation, and token expiry (TTL)."""
from datetime import timedelta

from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .factories import make_user


class RegistrationTests(APITestCase):
    def test_register_returns_token_and_user(self):
        resp = self.client.post(
            "/api/auth/register/",
            {
                "full_name": "New User",
                "email": "new@example.com",
                "phone": "+994501112233",
                "password": "Passw0rd123",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 201)
        self.assertIn("token", resp.data)
        self.assertEqual(resp.data["user"]["email"], "new@example.com")

    def test_duplicate_email_is_rejected(self):
        make_user(email="dupe@example.com")
        resp = self.client.post(
            "/api/auth/register/",
            {
                "full_name": "Dupe User",
                "email": "dupe@example.com",
                "phone": "+994501112233",
                "password": "Passw0rd123",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 400)


class LoginRotationTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="login@example.com")

    def test_login_rotates_token(self):
        r1 = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "Passw0rd123"},
            format="json",
        )
        r2 = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "Passw0rd123"},
            format="json",
        )
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r2.status_code, 200)
        self.assertNotEqual(r1.data["token"], r2.data["token"])

    def test_old_token_invalid_after_rotation(self):
        r1 = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "Passw0rd123"},
            format="json",
        )
        old = r1.data["token"]
        self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "Passw0rd123"},
            format="json",
        )
        resp = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + old)
        self.assertEqual(resp.status_code, 401)

    def test_bad_credentials_rejected(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"email": "login@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)


class TokenExpiryTests(APITestCase):
    def setUp(self):
        self.user = make_user(email="ttl@example.com")
        self.token = Token.objects.create(user=self.user)

    def test_fresh_token_authenticates(self):
        resp = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + self.token.key)
        self.assertEqual(resp.status_code, 200)

    def test_expired_token_rejected_and_deleted(self):
        Token.objects.filter(pk=self.token.pk).update(
            created=timezone.now() - timedelta(hours=10000)
        )
        resp = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION="Token " + self.token.key)
        self.assertEqual(resp.status_code, 401)
        self.assertFalse(Token.objects.filter(key=self.token.key).exists())
