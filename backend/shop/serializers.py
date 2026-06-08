from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Category, Product, ProductImage, ProductVariant, Order, OrderItem, ContactMessage, UserProfile, UserFavorite, UserCartItem, PromoCode, DeliveryMethod


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    variants = serializers.SerializerMethodField()
    default_variant = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    def get_images(self, obj: Product):
        request = self.context.get("request")
        urls: list[str] = []
        for img in obj.images.all():
            value = None
            if getattr(img, "image_file", None):
                try:
                    value = img.image_file.url
                except Exception:
                    value = None
            if not value and img.image_url:
                value = img.image_url
            if value:
                if request is not None and value.startswith("/"):
                    value = request.build_absolute_uri(value)
                urls.append(value)
        return urls

    def get_variants(self, obj: Product):
        request = self.context.get("request")
        variants = []
        for variant in obj.variants.filter(is_active=True).order_by("sort_order", "id"):
            image_url = variant.image_url or obj.image_url
            if request is not None and image_url.startswith("/"):
                image_url = request.build_absolute_uri(image_url)
            variants.append(
                {
                    "id": variant.id,
                    "variant_type": variant.variant_type,
                    "label": variant.label,
                    "size_ml": variant.size_ml,
                    "price": str(variant.price),
                    "stock": variant.stock,
                    "image_url": image_url,
                    "is_active": variant.is_active,
                    "sort_order": variant.sort_order,
                }
            )
        return variants

    def get_default_variant(self, obj: Product):
        variant = obj.variants.filter(is_active=True).order_by("sort_order", "id").first()
        if variant is None:
            return {
                "id": None,
                "variant_type": "premium",
                "label": "Premium",
                "size_ml": obj.volume_ml,
                "price": str(obj.price),
                "stock": obj.stock,
                "image_url": obj.image_url,
                "is_active": True,
                "sort_order": 0,
            }
        image_url = variant.image_url or obj.image_url
        request = self.context.get("request")
        if request is not None and image_url.startswith("/"):
            image_url = request.build_absolute_uri(image_url)
        return {
            "id": variant.id,
            "variant_type": variant.variant_type,
            "label": variant.label,
            "size_ml": variant.size_ml,
            "price": str(variant.price),
            "stock": variant.stock,
            "image_url": image_url,
            "is_active": variant.is_active,
            "sort_order": variant.sort_order,
        }

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "brand", "description", "top_notes", "heart_notes", "base_notes", "price", "old_price",
            "volume_ml", "gender", "stock", "rating", "review_count", "image_url", "images", "variants", "default_variant", "is_active", "is_new_arrival", "is_best_seller", "category", "categories"
        ]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "variant_type", "label", "size_ml", "price", "stock", "image_url", "is_active", "sort_order"]


class UserFavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = UserFavorite
        fields = ["id", "product", "created_at"]


class UserCartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)

    class Meta:
        model = UserCartItem
        fields = ["id", "product", "variant", "quantity", "created_at", "updated_at"]


class DeliveryMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryMethod
        fields = ["code", "label", "eta", "fee", "fee_label", "requires_address", "sort_order"]


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_slug = serializers.SlugField(required=False, allow_blank=True)
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    promo_code = serializers.CharField(required=False, allow_blank=True)
    delivery_method = serializers.SlugField(required=False, allow_blank=True)
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one order item is required.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.SerializerMethodField()
    variant_label = serializers.SerializerMethodField()
    variant_type = serializers.SerializerMethodField()

    def get_product_image(self, obj: OrderItem):
        request = self.context.get("request")
        variant = getattr(obj, "variant", None)
        value = ""
        if variant and variant.image_url:
            value = variant.image_url
        elif obj.product and obj.product.image_url:
            value = obj.product.image_url
        if request is not None and value.startswith("/"):
            value = request.build_absolute_uri(value)
        return value

    def get_variant_label(self, obj: OrderItem):
        return obj.variant.label if obj.variant else ""

    def get_variant_type(self, obj: OrderItem):
        return obj.variant.variant_type if obj.variant else ""

    class Meta:
        model = OrderItem
        fields = ["product", "product_name", "product_image", "variant_label", "variant_type", "quantity", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "code", "full_name", "phone", "address", "notes", "promo_code", "discount_amount",
            "payment_method", "delivery_method", "status", "subtotal", "shipping_fee", "total", "created_at", "items"
        ]


class PromoCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            "id", "code", "title", "description", "discount_type", "discount_value", "min_subtotal",
            "active", "max_total_uses", "max_uses_per_user", "starts_at", "ends_at", "created_at",
        ]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "created_at"]
        read_only_fields = ["id", "created_at"]


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return email

    def validate_password(self, value):
        validate_password(value)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class MeSerializer(serializers.Serializer):
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(allow_blank=True)
    address = serializers.CharField(allow_blank=True)

    @staticmethod
    def from_user(user: User):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        return {
            "full_name": full_name,
            "email": user.email or user.username,
            "phone": profile.phone,
            "address": profile.address,
        }


class UpdateMeSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField(required=False, allow_blank=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_new_password(self, value):
        validate_password(value)
        return value
