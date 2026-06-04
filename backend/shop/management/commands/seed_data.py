from decimal import Decimal
from django.core.management.base import BaseCommand
from shop.models import Category, Product


CATEGORIES = [
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

PRODUCTS = [
    {
        "name": "Midnight Essence",
        "slug": "midnight-essence",
        "brand": "AuraX",
        "category": "axsam-ve-tedbir",
        "price": Decimal("129.99"),
        "old_price": Decimal("159.99"),
        "stock": 30,
        "volume_ml": 100,
        "gender": "uniseks",
        "image_url": "https://images.unsplash.com/photo-1643797519086-cc9a821fbcfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        "description": "A captivating blend of dark mysteries and elegant sophistication.",
    },
    {
        "name": "Noir Royale",
        "slug": "noir-royale",
        "brand": "AuraX",
        "category": "premium-secimler",
        "price": Decimal("149.99"),
        "old_price": None,
        "stock": 25,
        "volume_ml": 100,
        "gender": "kisi",
        "image_url": "https://images.unsplash.com/photo-1778058505620-6911582e5a9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        "description": "Regal fragrance featuring rare woods and precious spices.",
    },
    {
        "name": "Velvet Aura",
        "slug": "velvet-aura",
        "brand": "AuraX",
        "category": "gundelik-istifade",
        "price": Decimal("119.99"),
        "old_price": None,
        "stock": 20,
        "volume_ml": 100,
        "gender": "qadin",
        "image_url": "https://images.unsplash.com/photo-1643797517590-c44cb552ddcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        "description": "Soft and sensual floral composition with warm vanilla base.",
    },
    {
        "name": "Carbon Elite",
        "slug": "carbon-elite",
        "brand": "AuraX",
        "category": "gundelik-istifade",
        "price": Decimal("169.99"),
        "old_price": Decimal("199.99"),
        "stock": 15,
        "volume_ml": 100,
        "gender": "kisi",
        "image_url": "https://images.unsplash.com/photo-1771762013405-ad64577dfc55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        "description": "Modern masterpiece combining citrus freshness with smoky undertones.",
    },
    {
        "name": "Silk Oud",
        "slug": "silk-oud",
        "brand": "AuraX",
        "category": "nis-etirler",
        "price": Decimal("189.99"),
        "old_price": None,
        "stock": 18,
        "volume_ml": 100,
        "gender": "uniseks",
        "image_url": "https://images.unsplash.com/photo-1643797517714-a273548abc3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        "description": "Exquisite oud composition draped in silk notes.",
    },
    {
        "name": "Obsidian",
        "slug": "obsidian",
        "brand": "AuraX",
        "category": "uzunmuddetli-qaliciliq",
        "price": Decimal("139.99"),
        "old_price": None,
        "stock": 22,
        "volume_ml": 100,
        "gender": "kisi",
        "image_url": "https://images.unsplash.com/photo-1700473209752-395910c89003?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        "description": "Dark and irresistible signature scent for modern connoisseurs.",
    },
]


class Command(BaseCommand):
    help = "Seed categories and products"

    def handle(self, *args, **options):
        valid_slugs = {slug for _, slug in CATEGORIES}
        category_map = {}
        for name, slug in CATEGORIES:
            obj, _ = Category.objects.update_or_create(slug=slug, defaults={"name": name})
            category_map[slug] = obj

        count = 0
        for item in PRODUCTS:
            category = category_map[item["category"]]
            Product.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "brand": item["brand"],
                    "category": category,
                    "description": item["description"],
                    "price": item["price"],
                    "old_price": item["old_price"],
                    "stock": item["stock"],
                    "volume_ml": item.get("volume_ml", 100),
                    "gender": item.get("gender", "uniseks"),
                    "image_url": item["image_url"],
                    "is_active": True,
                },
            )
            count += 1

        Category.objects.exclude(slug__in=valid_slugs).delete()

        self.stdout.write(self.style.SUCCESS(f"Seed completed: {len(CATEGORIES)} categories, {count} products."))
