from django.core.management.base import BaseCommand
from django.utils.text import slugify

from shop.models import FragranceNote, Product


NOTE_AZ_MAP = {
    "oud": "Ud",
    "rose": "Qızılgül",
    "vanilla": "Vanil",
    "amber": "Ənbər",
    "musk": "Müşk",
    "bergamot": "Berqamot",
    "lemon": "Limon",
    "orange": "Portağal",
    "jasmine": "Yasəmən",
    "lily": "Zanbaq",
    "sandalwood": "Səndəl ağacı",
    "cedar": "Sidr",
    "patchouli": "Paçuli",
    "tonka": "Tonka",
    "pepper": "İstiot",
    "cardamom": "Hil",
    "lavender": "Lavanda",
    "mint": "Nanə",
}

FAMILY_KEYWORDS = [
    ("wood", ["oud", "wood", "cedar", "sandal", "patchouli"]),
    ("citrus", ["citrus", "bergamot", "lemon", "orange", "grapefruit"]),
    ("floral", ["rose", "jasmine", "lily", "floral", "violet", "iris"]),
    ("amber", ["amber", "vanilla", "tonka", "resin"]),
    ("musk", ["musk", "clean", "aldehyd"]),
    ("spicy", ["pepper", "cardamom", "spice", "cinnamon", "clove"]),
    ("fresh", ["mint", "apple", "pear", "pineapple", "marine"]),
]


def to_az_name(raw: str) -> str:
    key = raw.strip().lower()
    if key in NOTE_AZ_MAP:
        return NOTE_AZ_MAP[key]
    return key.capitalize()


def to_family(raw: str) -> str:
    key = raw.strip().lower()
    for family, words in FAMILY_KEYWORDS:
        if any(w in key for w in words):
            return family
    return "default"


class Command(BaseCommand):
    help = "Extract fragrance notes from products and sync to FragranceNote table"

    def handle(self, *args, **options):
        raw_notes: set[str] = set()
        for p in Product.objects.all():
            for field in (p.top_notes, p.heart_notes, p.base_notes):
                for part in (field or "").split(","):
                    value = part.strip()
                    if value:
                        raw_notes.add(value)

        created = 0
        updated = 0
        for raw in sorted(raw_notes):
            key = slugify(raw) or raw.lower().replace(" ", "-")
            name_az = to_az_name(raw)
            family = to_family(raw)
            obj, was_created = FragranceNote.objects.update_or_create(
                key=key,
                defaults={"name_az": name_az, "family": family},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Fragrance notes synced. created={created}, updated={updated}, total={len(raw_notes)}"))

