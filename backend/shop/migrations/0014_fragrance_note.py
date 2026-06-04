from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0013_product_badge_flags"),
    ]

    operations = [
        migrations.CreateModel(
            name="FragranceNote",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(unique=True)),
                ("name_az", models.CharField(max_length=120)),
                ("family", models.CharField(choices=[("wood", "Wood"), ("citrus", "Citrus"), ("floral", "Floral"), ("amber", "Amber"), ("musk", "Musk"), ("spicy", "Spicy"), ("fresh", "Fresh"), ("default", "Default")], default="default", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ("name_az",)},
        ),
    ]

