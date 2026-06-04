from django.db import migrations


SLUG_MAP = {
    "oriental": ("nis-etirler", "Niş Ətirlər"),
    "woody": ("premium-secimler", "Premium Seçimlər"),
    "floral": ("gundelik-istifade", "Gündəlik İstifadə"),
    "fresh": ("yay-etirleri", "Yay Ətirləri"),
    "citrus": ("ofis-ucun", "Ofis Üçün"),
    "amber": ("axsam-ve-tedbir", "Axşam və Tədbir"),
    "musk": ("uzunmuddetli-qaliciliq", "Uzunmüddətli Qalıcılıq"),
    "luxury": ("premium-secimler", "Premium Seçimlər"),
    "night": ("axsam-ve-tedbir", "Axşam və Tədbir"),
    "daily": ("gundelik-istifade", "Gündəlik İstifadə"),
    "office": ("ofis-ucun", "Ofis Üçün"),
    "gift": ("hediyyelik-setler", "Hədiyyəlik Setlər"),
    "niche-perfumes": ("nis-etirler", "Niş Ətirlər"),
    "daily-use": ("gundelik-istifade", "Gündəlik İstifadə"),
    "evening-events": ("axsam-ve-tedbir", "Axşam və Tədbir"),
    "summer-perfumes": ("yay-etirleri", "Yay Ətirləri"),
    "winter-perfumes": ("qis-etirleri", "Qış Ətirləri"),
    "long-lasting": ("uzunmuddetli-qaliciliq", "Uzunmüddətli Qalıcılıq"),
    "gift-sets": ("hediyyelik-setler", "Hədiyyəlik Setlər"),
    "travel-size": ("mini-travel-size", "Mini / Travel Size"),
    "premium-selections": ("premium-secimler", "Premium Seçimlər"),
}

FINAL_CATEGORIES = [
    ("nis-etirler", "Niş Ətirlər"),
    ("gundelik-istifade", "Gündəlik İstifadə"),
    ("axsam-ve-tedbir", "Axşam və Tədbir"),
    ("ofis-ucun", "Ofis Üçün"),
    ("yay-etirleri", "Yay Ətirləri"),
    ("qis-etirleri", "Qış Ətirləri"),
    ("uzunmuddetli-qaliciliq", "Uzunmüddətli Qalıcılıq"),
    ("hediyyelik-setler", "Hədiyyəlik Setlər"),
    ("mini-travel-size", "Mini / Travel Size"),
    ("premium-secimler", "Premium Seçimlər"),
]


def forwards(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    Product = apps.get_model("shop", "Product")

    # Ensure final categories exist first
    for new_slug, new_name in FINAL_CATEGORIES:
        Category.objects.update_or_create(slug=new_slug, defaults={"name": new_name})

    # Move products from legacy categories to new ones, then remove old categories
    for old_slug, (new_slug, new_name) in SLUG_MAP.items():
        old_category = Category.objects.filter(slug=old_slug).first()
        if not old_category:
            continue

        new_category, _ = Category.objects.get_or_create(slug=new_slug, defaults={"name": new_name})
        Product.objects.filter(category=old_category).update(category=new_category)

        if old_category.id != new_category.id:
            old_category.delete()
        else:
            old_category.name = new_name
            old_category.save(update_fields=["name"])

    # Final name normalization
    for slug, name in FINAL_CATEGORIES:
        Category.objects.filter(slug=slug).update(name=name)


def backwards(apps, schema_editor):
    # No reverse remap; keep localized category slugs/names.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0010_add_product_notes_and_seed_notes"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

