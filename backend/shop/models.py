from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    categories = models.ManyToManyField(Category, blank=True, related_name="products_multi")
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    brand = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    top_notes = models.TextField(blank=True)
    heart_notes = models.TextField(blank=True)
    base_notes = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_new_arrival = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    volume_ml = models.PositiveIntegerField(default=100)
    gender = models.CharField(max_length=20, default="uniseks")
    stock = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField(blank=True)
    image_file = models.FileField(upload_to="product-images/", blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "id")

    def __str__(self):
        return f"{self.product.name} image {self.id}"


class ProductVariant(models.Model):
    VARIANT_TYPE_PREMIUM = "premium"
    VARIANT_TYPE_GRAM = "gram"
    VARIANT_TYPE_CHOICES = [
        (VARIANT_TYPE_PREMIUM, "Premium"),
        (VARIANT_TYPE_GRAM, "Gram"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    variant_type = models.CharField(max_length=20, choices=VARIANT_TYPE_CHOICES, default=VARIANT_TYPE_PREMIUM)
    label = models.CharField(max_length=120)
    size_ml = models.PositiveIntegerField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("sort_order", "id")

    def __str__(self):
        return f"{self.product.name} - {self.label}"


class FragranceNote(models.Model):
    FAMILY_CHOICES = [
        ("wood", "Wood"),
        ("citrus", "Citrus"),
        ("floral", "Floral"),
        ("amber", "Amber"),
        ("musk", "Musk"),
        ("spicy", "Spicy"),
        ("fresh", "Fresh"),
        ("default", "Default"),
    ]

    key = models.SlugField(unique=True)
    name_az = models.CharField(max_length=120)
    family = models.CharField(max_length=20, choices=FAMILY_CHOICES, default="default")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name_az",)

    def __str__(self):
        return self.name_az


class DeliveryMethod(models.Model):
    code = models.SlugField(unique=True)
    label = models.CharField(max_length=120)
    eta = models.CharField(max_length=120, blank=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fee_label = models.CharField(max_length=120, blank=True)
    requires_address = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order", "id")

    def __str__(self):
        return self.label


class Testimonial(models.Model):
    name = models.CharField(max_length=120)
    handle = models.CharField(max_length=120, blank=True)
    time_label = models.CharField(max_length=120, blank=True)
    rating = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    text = models.TextField()
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ("sort_order", "-created_at", "id")

    def __str__(self):
        return f"{self.name} ({self.rating}★)"


class SiteSettings(models.Model):
    """Single-row store for contact / social details that used to be hardcoded
    in the React app. Always loaded as pk=1 via load()."""

    whatsapp_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Digits only, e.g. 994501112233. Used to build the wa.me link.",
    )
    instagram_url = models.URLField(blank=True)
    instagram_handle = models.CharField(max_length=80, blank=True)
    tiktok_url = models.URLField(blank=True)
    tiktok_handle = models.CharField(max_length=80, blank=True)
    store_address = models.CharField(max_length=255, blank=True)
    banner_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Promo strip headline. Leave blank to use the default translated line.",
    )
    gram_image_url = models.URLField(
        blank=True,
        help_text="Shared packaging image used for gram variants that have no image of their own.",
    )

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def __str__(self):
        return "Site settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Order(models.Model):
    STATUS_CHOICES = [
        ("new", "New"),
        ("confirmed", "Confirmed"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    code = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    full_name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30)
    address = models.TextField()
    notes = models.TextField(blank=True)
    promo_code = models.CharField(max_length=50, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=30, default="cash_on_delivery")
    delivery_method = models.CharField(max_length=40, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.code


class PromoCode(models.Model):
    DISCOUNT_TYPE_PERCENT = "percent"
    DISCOUNT_TYPE_FIXED = "fixed"
    DISCOUNT_TYPE_CHOICES = [
        (DISCOUNT_TYPE_PERCENT, "Percent"),
        (DISCOUNT_TYPE_FIXED, "Fixed"),
    ]

    code = models.CharField(max_length=40, unique=True)
    title = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default=DISCOUNT_TYPE_PERCENT)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    max_total_uses = models.PositiveIntegerField(null=True, blank=True)
    max_uses_per_user = models.PositiveIntegerField(default=1)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def save(self, *args, **kwargs):
        self.code = (self.code or "").strip().upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.code

    def is_active_now(self) -> bool:
        now = timezone.now()
        if not self.active:
            return False
        if self.starts_at and now < self.starts_at:
            return False
        if self.ends_at and now > self.ends_at:
            return False
        return True

    def calculate_discount(self, subtotal: Decimal) -> Decimal:
        subtotal = Decimal(subtotal)
        if subtotal <= 0:
            return Decimal("0.00")
        if subtotal < self.min_subtotal:
            return Decimal("0.00")
        if self.discount_type == self.DISCOUNT_TYPE_FIXED:
            return min(Decimal(self.discount_value), subtotal).quantize(Decimal("0.01"))
        percent = max(Decimal("0"), min(Decimal(self.discount_value), Decimal("100")))
        return ((subtotal * percent) / Decimal("100")).quantize(Decimal("0.01"))


class PromoRedemption(models.Model):
    promo_code = models.ForeignKey(PromoCode, on_delete=models.CASCADE, related_name="redemptions")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="promo_redemptions")
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="promo_redemption")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # No unique_together on (promo_code, user): the per-user cap is enforced
        # by validate_promo_for_user counting existing redemptions against
        # max_uses_per_user. A DB-unique pair would raise IntegrityError 500
        # whenever max_uses_per_user > 1 allowed a legitimate second redemption.
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.username} -> {self.promo_code.code}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    # PROTECT is intentional: a Product referenced by a sold OrderItem must not be
    # deletable, so historical orders always retain an intact product reference.
    # Deactivate (is_active=False) products instead of deleting them.
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey("ProductVariant", on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)


class ContactMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username


class UserFavorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="user_favorites")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "product")
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.username} -> {self.product.name}"


class UserCartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="user_cart_items")
    variant = models.ForeignKey("ProductVariant", on_delete=models.CASCADE, null=True, blank=True, related_name="user_cart_items")
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "variant")
        ordering = ("-updated_at",)
        constraints = [
            # unique_together("user","variant") does NOT cover the default
            # (null-variant) line because SQL treats NULLs as distinct. This
            # partial unique constraint guarantees one default line per product.
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=models.Q(variant__isnull=True),
                name="uniq_default_cart_item_per_user_product",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.product.name} ({self.variant.label if self.variant else 'default'}) x{self.quantity}"
