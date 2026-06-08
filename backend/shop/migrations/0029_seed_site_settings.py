# -*- coding: utf-8 -*-
from django.db import migrations


# The contact / social details that were previously hardcoded in the React app
# (Layout, ContactPage, ShippingReturnsPage). Seeded into the singleton row so
# the storefront looks identical out of the box; editable in admin afterwards.
SEED = {
    "whatsapp_number": "994000000000",
    "instagram_url": "https://instagram.com/etirx.az",
    "instagram_handle": "@etirx.az",
    "tiktok_url": "https://www.tiktok.com/@etirx.az",
    "tiktok_handle": "@etirx.az",
    "store_address": "Fəxrəddin Musayev küçəsi, Adore Plaza",
}


def seed_site_settings(apps, schema_editor):
    SiteSettings = apps.get_model("shop", "SiteSettings")
    SiteSettings.objects.update_or_create(pk=1, defaults=SEED)


def unseed_site_settings(apps, schema_editor):
    SiteSettings = apps.get_model("shop", "SiteSettings")
    SiteSettings.objects.filter(pk=1).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0028_sitesettings"),
    ]

    operations = [
        migrations.RunPython(seed_site_settings, unseed_site_settings),
    ]
