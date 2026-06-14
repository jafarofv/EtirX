import csv
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from shop.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = "Import or update products from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", help="Path to the CSV file.")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate the file without saving changes.",
        )

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        dry_run = options["dry_run"]

        required_columns = {"name", "price", "stock"}

        try:
            with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
                reader = csv.DictReader(fh)
                headers = set(reader.fieldnames or [])
                missing = required_columns - headers
                if missing:
                    raise CommandError(f"Missing required columns: {', '.join(sorted(missing))}")

                rows = list(reader)
        except FileNotFoundError as exc:
            raise CommandError(f"File not found: {csv_path}") from exc

        created = 0
        updated = 0

        def parse_decimal(raw):
            value = (raw or "").strip()
            if not value:
                return None
            try:
                return Decimal(value)
            except InvalidOperation as exc:
                raise CommandError(f"Invalid decimal value: {value}") from exc

        def parse_bool(raw):
            return str(raw).strip().lower() in {"1", "true", "yes", "y", "on"}

        def parse_int(raw):
            value = (raw or "").strip()
            if not value:
                return 0
            try:
                return int(value)
            except ValueError as exc:
                raise CommandError(f"Invalid integer value: {value}") from exc

        def parse_gender(raw):
            value = (raw or "").strip().lower()
            if value in {"qadin", "qadın", "female", "women", "woman"}:
                return "qadin"
            if value in {"kisi", "kişi", "male", "men", "man"}:
                return "kisi"
            return "uniseks"

        with transaction.atomic():
            for row in rows:
                category_names_raw = (row.get("category_names") or "").strip()
                category_name_single = (row.get("category_name") or "").strip()
                category_slug_single = (row.get("category_slug") or "").strip()

                category_names = [x.strip() for x in category_names_raw.split(",") if x.strip()]
                if not category_names and category_name_single:
                    category_names = [category_name_single]

                categories = []
                for name in category_names:
                    slug = slugify(name) or name.lower().replace(" ", "-")
                    cat, _ = Category.objects.update_or_create(slug=slug, defaults={"name": name})
                    categories.append(cat)

                if not categories:
                    # Legacy fallback if only slug provided; otherwise default category.
                    if category_slug_single:
                        fallback_name = category_name_single or category_slug_single.replace("-", " ").title()
                        cat, _ = Category.objects.update_or_create(slug=category_slug_single, defaults={"name": fallback_name})
                        categories = [cat]
                    else:
                        cat, _ = Category.objects.update_or_create(
                            slug="gundelik-istifade",
                            defaults={"name": "Gündəlik İstifadə"},
                        )
                        categories = [cat]

                raw_slug = (row.get("slug") or "").strip()
                base_slug = raw_slug or (row.get("name") or "").strip().lower().replace(" ", "-")
                product_slug = base_slug
                if not product_slug:
                    raise CommandError("Slug yaradıla bilmədi. 'name' və ya 'slug' olmalıdır.")

                product_defaults = {
                    "name": (row.get("name") or "").strip(),
                    "brand": (row.get("brand") or "").strip(),
                    "category": categories[0],
                    "description": (row.get("description") or "").strip(),
                    "top_notes": (row.get("top_notes") or "").strip(),
                    "heart_notes": (row.get("heart_notes") or "").strip(),
                    "base_notes": (row.get("base_notes") or "").strip(),
                    "price": parse_decimal(row["price"]) or Decimal("0"),
                    "old_price": parse_decimal(row.get("old_price")),
                    "volume_ml": parse_int(row.get("volume_ml")) or 100,
                    "gender": parse_gender(row.get("gender")),
                    "stock": parse_int(row["stock"]),
                    "image_url": (row.get("image_url") or "").strip(),
                    "new_badge_mode": (
                        Product.NEW_BADGE_ALWAYS
                        if parse_bool(row.get("is_new_arrival"))
                        else Product.NEW_BADGE_AUTO
                    ),
                    "is_best_seller": parse_bool(row.get("is_best_seller")),
                    "is_active": parse_bool(row.get("is_active", "true")),
                }

                product, is_created = Product.objects.update_or_create(
                    slug=product_slug,
                    defaults=product_defaults,
                )
                product.categories.set(categories)

                image_urls_raw = (row.get("image_urls") or "").strip()
                image_files_raw = (row.get("image_files") or "").strip()
                if image_urls_raw:
                    urls = [u.strip() for u in image_urls_raw.split(",") if u.strip()]
                    if urls:
                        ProductImage.objects.filter(product=product).delete()
                        ProductImage.objects.bulk_create(
                            [ProductImage(product=product, image_url=url, sort_order=i) for i, url in enumerate(urls)]
                        )
                elif image_files_raw:
                    files = [f.strip().lstrip("/\\") for f in image_files_raw.split(",") if f.strip()]
                    if files:
                        ProductImage.objects.filter(product=product).delete()
                        ProductImage.objects.bulk_create(
                            [
                                ProductImage(
                                    product=product,
                                    image_url=f"/media/product-images/{fname}",
                                    sort_order=i,
                                )
                                for i, fname in enumerate(files)
                            ]
                        )

                if is_created:
                    created += 1
                else:
                    updated += 1

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(
            self.style.SUCCESS(
                f"Import completed. Created: {created}, Updated: {updated}, Dry run: {dry_run}"
            )
        )
