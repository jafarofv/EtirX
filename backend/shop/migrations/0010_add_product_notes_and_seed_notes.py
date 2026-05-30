from django.db import migrations, models


PRODUCT_NOTES = {
    "midnight-essence": {
        "top_notes": "bergamot, black pepper, saffron",
        "heart_notes": "rose, incense, leather",
        "base_notes": "oud, amber, patchouli",
    },
    "noir-royale": {
        "top_notes": "grapefruit, cardamom, violet",
        "heart_notes": "cedarwood, iris, lavender",
        "base_notes": "vetiver, sandalwood, musk",
    },
    "velvet-aura": {
        "top_notes": "pear, pink pepper, bergamot",
        "heart_notes": "jasmine, peony, rose",
        "base_notes": "vanilla, white musk, cashmere wood",
    },
    "carbon-elite": {
        "top_notes": "lemon, mint, grapefruit",
        "heart_notes": "geranium, lavender, nutmeg",
        "base_notes": "ambergris, cedarwood, tonka bean",
    },
    "silk-oud": {
        "top_notes": "mandarin, cardamom, saffron",
        "heart_notes": "oud, rose, plum",
        "base_notes": "benzoin, amber, musk",
    },
    "obsidian": {
        "top_notes": "black pepper, bergamot, elemi",
        "heart_notes": "vetiver, iris, smoked woods",
        "base_notes": "patchouli, leather, amber",
    },
}


def seed_product_notes(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    for slug, note_map in PRODUCT_NOTES.items():
        Product.objects.filter(slug=slug).update(**note_map)


def unseed_product_notes(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    Product.objects.filter(slug__in=PRODUCT_NOTES.keys()).update(
        top_notes="",
        heart_notes="",
        base_notes="",
    )


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0009_seed_default_promocodes"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="top_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="heart_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="product",
            name="base_notes",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.RunPython(seed_product_notes, unseed_product_notes),
    ]
