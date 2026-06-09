from decimal import Decimal

from django.contrib import admin
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import (
    Category,
    Product,
    ProductVariant,
    Order,
    OrderItem,
    ContactMessage,
    UserProfile,
    UserFavorite,
    UserCartItem,
    PromoCode,
    PromoRedemption,
    FragranceNote,
    ProductImage,
    DeliveryMethod,
    Testimonial,
    SiteSettings,
    StaticPage,
)
from .cache_utils import (
    invalidate_product_cache,
    invalidate_category_cache,
    invalidate_testimonial_cache,
    invalidate_site_settings_cache,
    invalidate_delivery_methods_cache,
    invalidate_promo_cache,
)

GRAM_VARIANT_DEFAULTS = [
    (15, "0.35"),
    (30, "0.55"),
    (50, "0.75"),
    (100, "1.00"),
]


def _push_order_ws_update(order):
    """Push real-time order status update via Channels WebSocket."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        group_name = f"order_{order.code}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "order.update",
                "data": {
                    "code": order.code,
                    "status": order.status,
                    "status_display": order.get_status_display(),
                    "total": str(order.total),
                    "created_at": order.created_at.isoformat(),
                },
            },
        )
    except Exception:
        pass

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("sort_order", "image_file", "image_url")


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 4
    fields = ("variant_type", "label", "size_ml", "price", "stock", "image_url", "is_default", "sort_order", "is_active")


class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "category", "gender", "volume_ml", "is_new_arrival", "is_best_seller", "price", "stock", "rating", "review_count", "is_active", "created_at")
    list_filter = ("is_active", "is_new_arrival", "is_best_seller", "category", "brand")
    search_fields = ("name", "slug", "brand", "description", "top_notes", "heart_notes", "base_notes")
    ordering = ("-created_at",)
    list_editable = ("price", "stock", "rating", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    fieldsets = (
        (None, {
            "fields": (
                "name", "slug", "brand", "categories",
                "gender", "volume_ml",
                "is_new_arrival", "is_best_seller",
                "price", "old_price", "stock", "rating", "review_count", "is_active"
            )
        }),
        ("Description", {
            "fields": ("description",)
        }),
        ("Fragrance Notes", {
            "fields": ("top_notes", "heart_notes", "base_notes"),
        }),
    )
    filter_horizontal = ("categories",)
    inlines = [ProductImageInline, ProductVariantInline]
    exclude = ("category", "image_url")

    def save_model(self, request, obj, form, change):
        # Keep legacy required FK in sync while hiding it from admin form.
        if not obj.category_id:
            fallback = Category.objects.order_by("id").first()
            if fallback:
                obj.category = fallback
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        obj = form.instance
        premium = (
            obj.variants.filter(variant_type=ProductVariant.VARIANT_TYPE_PREMIUM, is_active=True)
            .order_by("-is_default", "sort_order", "id")
            .first()
        )
        if premium is None:
            existing_premium = obj.variants.filter(variant_type=ProductVariant.VARIANT_TYPE_PREMIUM).first()
            if existing_premium is None:
                premium, _ = ProductVariant.objects.get_or_create(
                    product=obj,
                    variant_type=ProductVariant.VARIANT_TYPE_PREMIUM,
                    defaults={
                        "label": "Premium orijinal qablaşdırma",
                        "size_ml": obj.volume_ml,
                        "price": obj.price,
                        "stock": obj.stock,
                        "image_url": obj.image_url,
                        "is_default": True,
                        "is_active": True,
                        "sort_order": 0,
                    },
                )
        if premium is not None and premium.is_active and not premium.is_default:
            ProductVariant.objects.filter(product=obj, is_default=True).exclude(pk=premium.pk).update(is_default=False)
            premium.is_default = True
            premium.save(update_fields=["is_default"])

        for idx, (size_ml, rate) in enumerate(GRAM_VARIANT_DEFAULTS, start=1):
            ProductVariant.objects.get_or_create(
                product=obj,
                variant_type=ProductVariant.VARIANT_TYPE_GRAM,
                size_ml=size_ml,
                defaults={
                    "label": f"{size_ml}ml",
                    "price": (obj.price * Decimal(rate)).quantize(Decimal("0.01")),
                    "stock": obj.stock,
                    "image_url": "",
                    "is_default": False,
                    "is_active": True,
                    "sort_order": idx,
                },
            )
        first_multi = obj.categories.order_by("id").first()
        if first_multi and obj.category_id != first_multi.id:
            obj.category = first_multi
            obj.save(update_fields=["category"])


class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "variant", "quantity", "unit_price")
    can_delete = False


class OrderAdmin(admin.ModelAdmin):
    list_display = ("code", "full_name", "phone", "status", "payment_method", "delivery_method", "promo_code", "discount_amount", "total", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("code", "full_name", "phone", "address")
    ordering = ("-created_at",)
    readonly_fields = ("code", "subtotal", "shipping_fee", "discount_amount", "total", "created_at", "delivery_method")
    inlines = [OrderItemInline]
    actions = ["bulk_delete_orders"]

    @admin.action(description="Delete selected orders")
    def bulk_delete_orders(self, request, queryset):
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} order(s) deleted successfully.")


class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created_at")
    search_fields = ("name", "email", "message")
    ordering = ("-created_at",)


class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone")
    search_fields = ("user__username", "user__email", "phone", "address")
    ordering = ("user__username",)


class UserFavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "created_at")
    search_fields = ("user__username", "user__email", "product__name", "product__slug")
    list_filter = ("created_at",)
    ordering = ("-created_at",)


class UserCartItemAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "variant", "quantity", "updated_at")
    search_fields = ("user__username", "user__email", "product__name", "product__slug", "variant__label")
    list_filter = ("updated_at",)
    ordering = ("-updated_at",)


class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "discount_value", "active", "min_subtotal", "max_total_uses", "max_uses_per_user", "starts_at", "ends_at", "created_at")
    list_filter = ("active", "discount_type", "created_at")
    search_fields = ("code", "title", "description")
    ordering = ("-created_at",)
    list_editable = ("discount_value", "active", "min_subtotal", "max_total_uses", "max_uses_per_user", "starts_at", "ends_at")
    prepopulated_fields = {"code": ("title",)}


class PromoRedemptionAdmin(admin.ModelAdmin):
    list_display = ("promo_code", "user", "order", "created_at")
    search_fields = ("promo_code__code", "user__username", "user__email", "order__code")
    list_filter = ("created_at", "promo_code")
    ordering = ("-created_at",)


class FragranceNoteAdmin(admin.ModelAdmin):
    list_display = ("name_az", "key", "family", "created_at")
    search_fields = ("name_az", "key", "family")
    list_filter = ("family",)
    ordering = ("name_az",)

class DeliveryMethodAdmin(admin.ModelAdmin):
    list_display = ("label", "code", "fee", "fee_label", "requires_address", "sort_order", "is_active")
    list_editable = ("fee", "requires_address", "sort_order", "is_active")
    search_fields = ("code", "label")
    ordering = ("sort_order", "id")
    prepopulated_fields = {"code": ("label",)}


class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "handle", "rating", "time_label", "sort_order", "is_active", "created_at")
    list_editable = ("rating", "sort_order", "is_active")
    list_filter = ("is_active", "rating")
    search_fields = ("name", "handle", "text")
    ordering = ("sort_order", "-created_at")


class SiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("WhatsApp", {"fields": ("whatsapp_number",)}),
        ("Social", {"fields": ("instagram_url", "instagram_handle", "tiktok_url", "tiktok_handle")}),
        ("Store", {"fields": ("store_address",)}),
        (
            "Announcement and images",
            {
                "fields": (
                    "banner_text",
                    "gram_image_url",
                    "gram_image_15_url",
                    "gram_image_30_url",
                    "gram_image_50_url",
                    "gram_image_100_url",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        # Singleton: only allow adding the first row.
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(DeliveryMethod, DeliveryMethodAdmin)
admin.site.register(Testimonial, TestimonialAdmin)
admin.site.register(SiteSettings, SiteSettingsAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(ProductVariant)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderItem)
admin.site.register(ContactMessage, ContactMessageAdmin)
admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(UserFavorite, UserFavoriteAdmin)
admin.site.register(UserCartItem, UserCartItemAdmin)
admin.site.register(PromoCode, PromoCodeAdmin)
admin.site.register(PromoRedemption, PromoRedemptionAdmin)
admin.site.register(FragranceNote, FragranceNoteAdmin)


class StaticPageAdmin(admin.ModelAdmin):
    list_display = ("slug", "language", "title", "is_published", "updated_at")
    list_filter = ("slug", "language", "is_published")
    search_fields = ("title", "subtitle", "body")
    list_editable = ("is_published",)


admin.site.register(StaticPage, StaticPageAdmin)
