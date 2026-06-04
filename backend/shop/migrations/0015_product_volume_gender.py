from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0014_fragrance_note"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="gender",
            field=models.CharField(default="uniseks", max_length=20),
        ),
        migrations.AddField(
            model_name="product",
            name="volume_ml",
            field=models.PositiveIntegerField(default=100),
        ),
    ]

