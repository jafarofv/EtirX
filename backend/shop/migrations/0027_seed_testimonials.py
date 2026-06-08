# -*- coding: utf-8 -*-
from django.db import migrations


# The three reviews that were previously hardcoded in the React Layout.
# Seeded here so the storefront looks identical out of the box; editable in admin.
SEED = [
    {
        "name": "Aysel M.",
        "handle": "@aysel_m",
        "time_label": "2 saat əvvəl",
        "rating": 5,
        "text": "Qoxu həqiqətən premium hiss verir. Qablaşdırma və çatdırılma da çox səliqəli idi.",
        "sort_order": 0,
    },
    {
        "name": "Rəşad K.",
        "handle": "@rashadk",
        "time_label": "Dünən",
        "rating": 5,
        "text": "Sifariş prosesi rahat oldu, WhatsApp-da tez cavab verdilər. Ətir seçimi də çox yaxşıdır.",
        "sort_order": 1,
    },
    {
        "name": "Lalə N.",
        "handle": "@lale_n",
        "time_label": "3 gün əvvəl",
        "rating": 5,
        "text": "Ətir təsviri ilə gələn məhsul tam uyğun idi. Xüsusi notlar da dəqiq yazılıb, çox faydalıdır.",
        "sort_order": 2,
    },
]


def seed_testimonials(apps, schema_editor):
    Testimonial = apps.get_model("shop", "Testimonial")
    for row in SEED:
        Testimonial.objects.get_or_create(
            name=row["name"],
            handle=row["handle"],
            defaults={
                "time_label": row["time_label"],
                "rating": row["rating"],
                "text": row["text"],
                "sort_order": row["sort_order"],
                "is_active": True,
            },
        )


def unseed_testimonials(apps, schema_editor):
    Testimonial = apps.get_model("shop", "Testimonial")
    handles = [row["handle"] for row in SEED]
    Testimonial.objects.filter(handle__in=handles).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0026_testimonial"),
    ]

    operations = [
        migrations.RunPython(seed_testimonials, unseed_testimonials),
    ]
