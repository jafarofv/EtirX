"""Small fixture helpers shared across the test modules."""
from decimal import Decimal

from django.contrib.auth.models import User

from shop.models import Category, Order, OrderItem, Product, ProductVariant


def make_user(email="buyer@example.com", password="Passw0rd123"):
    return User.objects.create_user(username=email, email=email, password=password)


def make_product(slug="test-perfume", name="Test Perfume", price="100.00", stock=10):
    category, _ = Category.objects.get_or_create(slug="cat", defaults={"name": "Cat"})
    return Product.objects.create(
        category=category,
        name=name,
        slug=slug,
        price=Decimal(price),
        stock=stock,
    )


def make_variant(product, label="Premium", price="100.00", stock=10, is_default=True):
    return ProductVariant.objects.create(
        product=product,
        variant_type="premium",
        label=label,
        price=Decimal(price),
        stock=stock,
        is_default=is_default,
    )


def make_order(user, code="ETX-TEST01", status="new"):
    return Order.objects.create(
        code=code,
        user=user,
        full_name="Test Buyer",
        email="buyer@example.com",
        phone="+994501112233",
        address="Baku, Test st. 1",
        subtotal=Decimal("100.00"),
        total=Decimal("100.00"),
        status=status,
    )


def make_order_item(order, product, variant=None, quantity=2, unit_price="50.00"):
    return OrderItem.objects.create(
        order=order,
        product=product,
        variant=variant,
        quantity=quantity,
        unit_price=Decimal(unit_price),
    )
