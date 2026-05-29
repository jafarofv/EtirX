from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0003_order_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="address",
            field=models.TextField(blank=True),
        ),
    ]
