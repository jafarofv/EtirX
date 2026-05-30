from django.db import migrations


def seed_default_promocodes(apps, schema_editor):
    PromoCode = apps.get_model("shop", "PromoCode")
    PromoCode.objects.update_or_create(
        code="ETIRX10",
        defaults={
            "title": "EtirX 10%",
            "description": "İlk kampaniya promokodu",
            "discount_type": "percent",
            "discount_value": "10.00",
            "min_subtotal": "0.00",
            "active": True,
            "max_total_uses": None,
            "max_uses_per_user": 1,
        },
    )


def unseed_default_promocodes(apps, schema_editor):
    PromoCode = apps.get_model("shop", "PromoCode")
    PromoCode.objects.filter(code="ETIRX10").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0008_promocode_order_discount_amount_order_promo_code_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_default_promocodes, unseed_default_promocodes),
    ]
