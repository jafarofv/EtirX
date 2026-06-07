from decimal import Decimal

from django.db import migrations, models
import django.db.models.deletion


GRAM_VARIANTS = [
    (15, Decimal("0.35")),
    (30, Decimal("0.55")),
    (50, Decimal("0.75")),
    (100, Decimal("1.00")),
]


def seed_product_variants(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductVariant = apps.get_model("shop", "ProductVariant")
    OrderItem = apps.get_model("shop", "OrderItem")
    UserCartItem = apps.get_model("shop", "UserCartItem")

    for product in Product.objects.all():
        premium_price = Decimal(product.price).quantize(Decimal("0.01"))
        premium_variant, _ = ProductVariant.objects.update_or_create(
            product=product,
            variant_type="premium",
            size_ml=product.volume_ml,
            defaults={
                "label": "Premium orijinal qablaşdırma",
                "price": premium_price,
                "stock": product.stock,
                "image_url": product.image_url or "",
                "is_active": True,
                "sort_order": 0,
            },
        )

        for sort_order, (size_ml, rate) in enumerate(GRAM_VARIANTS, start=1):
            ProductVariant.objects.update_or_create(
                product=product,
                variant_type="gram",
                size_ml=size_ml,
                defaults={
                    "label": f"{size_ml}ml",
                    "price": (premium_price * rate).quantize(Decimal("0.01")),
                    "stock": product.stock,
                    "image_url": "",
                    "is_active": True,
                    "sort_order": sort_order,
                },
            )

        default_variant = premium_variant
        if default_variant is None:
            default_variant = ProductVariant.objects.filter(product=product, is_active=True).order_by("sort_order", "id").first()
        if default_variant is None:
            continue

        for cart_item in UserCartItem.objects.filter(product=product, variant__isnull=True):
            cart_item.variant = default_variant
            cart_item.save(update_fields=["variant"])

        for order_item in OrderItem.objects.filter(product=product, variant__isnull=True):
            order_item.variant = default_variant
            order_item.save(update_fields=["variant"])


def unseed_product_variants(apps, schema_editor):
    ProductVariant = apps.get_model("shop", "ProductVariant")
    ProductVariant.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0019_productimage_file_upload"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductVariant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("variant_type", models.CharField(choices=[("premium", "Premium"), ("gram", "Gram")], default="premium", max_length=20)),
                ("label", models.CharField(max_length=120)),
                ("size_ml", models.PositiveIntegerField(blank=True, null=True)),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("stock", models.PositiveIntegerField(default=0)),
                ("image_url", models.URLField(blank=True)),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="variants", to="shop.product")),
            ],
            options={
                "ordering": ("sort_order", "id"),
            },
        ),
        migrations.AddField(
            model_name="orderitem",
            name="variant",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="order_items", to="shop.productvariant"),
        ),
        migrations.AddField(
            model_name="usercartitem",
            name="variant",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="user_cart_items", to="shop.productvariant"),
        ),
        migrations.AlterUniqueTogether(
            name="usercartitem",
            unique_together={("user", "variant")},
        ),
        migrations.RunPython(seed_product_variants, unseed_product_variants),
    ]
