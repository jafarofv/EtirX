from django.db import migrations


DEFAULT_CATEGORIES = [
    ("oriental", "Oriental"),
    ("woody", "Woody"),
    ("floral", "Floral"),
    ("fresh", "Fresh"),
    ("citrus", "Citrus"),
    ("amber", "Amber"),
    ("musk", "Musk"),
    ("luxury", "Luxury"),
    ("night", "Night"),
    ("daily", "Daily"),
    ("office", "Office"),
    ("gift", "Gift"),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    for slug, name in DEFAULT_CATEGORIES:
        Category.objects.update_or_create(slug=slug, defaults={"name": name})


def unseed_categories(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    Category.objects.filter(slug__in=[slug for slug, _ in DEFAULT_CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0004_userprofile_address"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
