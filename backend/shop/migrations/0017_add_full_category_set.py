from django.db import migrations


FULL_CATEGORIES = [
    ("Yeni Gələnlər", "yeni-gelenler"),
    ("Qadın", "qadin"),
    ("Kişi", "kisiler"),
    ("Uniseks", "uniseks"),
    ("Endirim", "endirim"),
    ("Ən Çox Satanlar", "en-cox-satanlar"),
    ("Niş Ətirlər", "nis-etirler"),
    ("Gündəlik İstifadə", "gundelik-istifade"),
    ("Axşam və Tədbir", "axsam-ve-tedbir"),
    ("Yay Ətirləri", "yay-etirleri"),
    ("Qış Ətirləri", "qis-etirleri"),
    ("Uzunmüddətli Qalıcılıq", "uzunmuddetli-qaliciliq"),
    ("Hədiyyəlik Setlər", "hediyyelik-setler"),
    ("Premium Seçimlər", "premium-secimler"),
]


def forwards(apps, schema_editor):
    Category = apps.get_model("shop", "Category")
    for name, slug in FULL_CATEGORIES:
        Category.objects.update_or_create(slug=slug, defaults={"name": name})


def backwards(apps, schema_editor):
    # Keep categories on rollback to avoid accidental data loss.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0016_product_images"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
