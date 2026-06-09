# -*- coding: utf-8 -*-
from decimal import Decimal

from django.db import migrations

# The 100ml gram decant was seeded at rate 1.00 (== premium price), which makes
# the gram option pointless. Re-price it slightly below the premium full size.
GRAM_100_RATE = Decimal("0.90")


def fix_gram_100_price(apps, schema_editor):
    ProductVariant = apps.get_model("shop", "ProductVariant")
    for gram in ProductVariant.objects.filter(variant_type="gram", size_ml=100):
        premium = (
            ProductVariant.objects.filter(product=gram.product, variant_type="premium")
            .order_by("sort_order", "id")
            .first()
        )
        base = premium.price if premium is not None else gram.product.price
        new_price = (base * GRAM_100_RATE).quantize(Decimal("0.01"))
        if gram.price != new_price:
            gram.price = new_price
            gram.save(update_fields=["price"])


def backfill_default_variant(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductVariant = apps.get_model("shop", "ProductVariant")
    for product in Product.objects.all():
        if ProductVariant.objects.filter(product=product, is_default=True).exists():
            continue
        default = (
            ProductVariant.objects.filter(product=product, is_active=True)
            .order_by("sort_order", "id")
            .first()
        )
        if default is not None:
            default.is_default = True
            default.save(update_fields=["is_default"])


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0032_alter_promoredemption_unique_together_and_more"),
    ]

    operations = [
        migrations.RunPython(fix_gram_100_price, migrations.RunPython.noop),
        migrations.RunPython(backfill_default_variant, migrations.RunPython.noop),
    ]
