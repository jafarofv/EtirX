from django.db import migrations, models


def backfill_gram_size_images(apps, schema_editor):
    SiteSettings = apps.get_model("shop", "SiteSettings")
    for settings in SiteSettings.objects.all():
        legacy = settings.gram_image_url or ""
        updates = {}
        if legacy:
            if not settings.gram_image_15_url:
                updates["gram_image_15_url"] = legacy
            if not settings.gram_image_30_url:
                updates["gram_image_30_url"] = legacy
            if not settings.gram_image_50_url:
                updates["gram_image_50_url"] = legacy
            if not settings.gram_image_100_url:
                updates["gram_image_100_url"] = legacy
        if updates:
            SiteSettings.objects.filter(pk=settings.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0034_sitesettings_banner_text_sitesettings_gram_image_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="gram_image_15_url",
            field=models.URLField(blank=True, help_text="Shared image for 15ml gram variants."),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="gram_image_30_url",
            field=models.URLField(blank=True, help_text="Shared image for 30ml gram variants."),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="gram_image_50_url",
            field=models.URLField(blank=True, help_text="Shared image for 50ml gram variants."),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="gram_image_100_url",
            field=models.URLField(blank=True, help_text="Shared image for 100ml gram variants."),
        ),
        migrations.RunPython(backfill_gram_size_images, migrations.RunPython.noop),
    ]
