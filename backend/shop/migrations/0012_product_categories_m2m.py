from django.db import migrations, models


def copy_primary_category_to_m2m(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    for product in Product.objects.select_related("category").all():
        if product.category_id:
            product.categories.add(product.category_id)


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0011_localize_category_slugs_az"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="categories",
            field=models.ManyToManyField(blank=True, related_name="products_multi", to="shop.category"),
        ),
        migrations.RunPython(copy_primary_category_to_m2m, migrations.RunPython.noop),
    ]

