import csv
from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from shop.models import Category, Product


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

        required_columns = {
            "category_name",
            "category_slug",
            "name",
            "slug",
            "brand",
            "description",
            "price",
            "old_price",
            "stock",
            "image_url",
            "is_active",
        }

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

        with transaction.atomic():
            for row in rows:
                category, _ = Category.objects.update_or_create(
                    slug=row["category_slug"].strip(),
                    defaults={"name": row["category_name"].strip()},
                )

                product_defaults = {
                    "name": row["name"].strip(),
                    "brand": row["brand"].strip(),
                    "category": category,
                    "description": row["description"].strip(),
                    "price": parse_decimal(row["price"]) or Decimal("0"),
                    "old_price": parse_decimal(row["old_price"]),
                    "stock": parse_int(row["stock"]),
                    "image_url": row["image_url"].strip(),
                    "is_active": parse_bool(row["is_active"]),
                }

                _, is_created = Product.objects.update_or_create(
                    slug=row["slug"].strip(),
                    defaults=product_defaults,
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
