from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0012_product_categories_m2m"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_best_seller",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="product",
            name="is_new_arrival",
            field=models.BooleanField(default=False),
        ),
    ]

