from django.db import migrations


REMOVE_SLUGS = ["hamisi", "ofis-ucun", "mini-travel-size"]
FALLBACK_SLUG = "gundelik-istifade"


def forwards(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    Product = apps.get_model("shop", "Product")

    fallback = Category.objects.filter(slug=FALLBACK_SLUG).first()
    if fallback is None:
        fallback = Category.objects.create(slug=FALLBACK_SLUG, name="Gündəlik İstifadə")

    for slug in REMOVE_SLUGS:
        cat = Category.objects.filter(slug=slug).first()
        if not cat:
            continue
        Product.objects.filter(category=cat).update(category=fallback)
        for p in Product.objects.filter(categories=cat):
            p.categories.remove(cat)
            if not p.categories.exists():
                p.categories.add(fallback)
        cat.delete()


def backwards(apps, schema_editor):
    # No reverse data restore.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0017_add_full_category_set"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

