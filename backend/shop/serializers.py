from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Category, Product, Order, OrderItem, ContactMessage, UserProfile, UserFavorite, UserCartItem, PromoCode


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "brand", "description", "top_notes", "heart_notes", "base_notes", "price", "old_price",
            "stock", "image_url", "is_active", "category"
        ]


class UserFavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = UserFavorite
        fields = ["id", "product", "created_at"]


class UserCartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = UserCartItem
        fields = ["id", "product", "quantity", "created_at", "updated_at"]


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_slug = serializers.SlugField(required=False, allow_blank=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=30)
    address = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)
    promo_code = serializers.CharField(required=False, allow_blank=True)
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one order item is required.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.CharField(source="product.image_url", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["product", "product_name", "product_image", "quantity", "unit_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "code", "full_name", "phone", "address", "notes", "promo_code", "discount_amount",
            "payment_method", "status", "subtotal", "shipping_fee", "total", "created_at", "items"
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
