from decimal import Decimal

from django.db import migrations


DELIVERY_METHODS = [
    {
        "code": "city_courier",
        "label": "Şəhər daxili çatdırılma",
        "eta": "Yango, Bolt və s.",
        "fee": Decimal("0.00"),
        "fee_label": "Ödənişi siz edirsiniz",
        "requires_address": True,
        "sort_order": 1,
    },
    {
        "code": "metro_drop",
        "label": "N.Nərimanov / Gənclik metrosuna çatdırılma",
        "eta": "1-2 saat",
        "fee": Decimal("2.00"),
        "fee_label": "",
        "requires_address": False,
        "sort_order": 2,
    },
    {
        "code": "azerpost",
        "label": "AzərPoçt ilə göndəriş",
        "eta": "2-4 iş günü",
        "fee": Decimal("3.00"),
        "fee_label": "",
        "requires_address": False,
        "sort_order": 3,
    },
    {
        "code": "pickup",
        "label": "Depodan təhvil alma",
        "eta": "Dərhal",
        "fee": Decimal("0.00"),
        "fee_label": "Pulsuz",
        "requires_address": False,
        "sort_order": 4,
    },
]


def seed_delivery_methods(apps, schema_editor):
    DeliveryMethod = apps.get_model("shop", "DeliveryMethod")
    for item in DELIVERY_METHODS:
        DeliveryMethod.objects.update_or_create(
            code=item["code"],
            defaults={k: v for k, v in item.items() if k != "code"},
        )


def unseed_delivery_methods(apps, schema_editor):
    DeliveryMethod = apps.get_model("shop", "DeliveryMethod")
    DeliveryMethod.objects.filter(code__in=[m["code"] for m in DELIVERY_METHODS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0023_deliverymethod_order_delivery_method"),
    ]

    operations = [
        migrations.RunPython(seed_delivery_methods, unseed_delivery_methods),
    ]
