from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0018_remove_unused_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="image_file",
            field=models.FileField(blank=True, upload_to="product-images/"),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="image_url",
            field=models.URLField(blank=True),
        ),
    ]

