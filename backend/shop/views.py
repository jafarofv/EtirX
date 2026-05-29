import random
import string
from decimal import Decimal
from django.db import transaction
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product, Order, OrderItem, ContactMessage
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ContactMessageSerializer,
)


def generate_order_code() -> str:
    return "AX-" + "".join(random.choices(string.digits, k=8))


class CategoryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category").order_by("-id")
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        category_slug = self.request.query_params.get("category")
        q = self.request.query_params.get("q")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        if q:
            qs = qs.filter(name__icontains=q)
        return qs


class OrderViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Order.objects.all().prefetch_related("items__product")
    serializer_class = OrderSerializer
    lookup_field = "code"

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        shipping_fee = payload.get("shipping_fee", Decimal("0.00"))

        with transaction.atomic():
            order = Order.objects.create(
                code=generate_order_code(),
                full_name=payload["full_name"],
                phone=payload["phone"],
                address=payload["address"],
                notes=payload.get("notes", ""),
                shipping_fee=shipping_fee,
                payment_method="cash_on_delivery",
            )

            subtotal = Decimal("0.00")
            for item in payload["items"]:
                product = Product.objects.get(id=item["product_id"], is_active=True)
                quantity = item["quantity"]
                unit_price = product.price
                subtotal += unit_price * quantity
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                )

            order.subtotal = subtotal
            order.total = subtotal + shipping_fee
            order.save(update_fields=["subtotal", "total"])

        response_serializer = OrderSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="tracking")
    def tracking(self, request, code=None):
        order = self.get_object()
        return Response({"code": order.code, "status": order.status, "created_at": order.created_at})


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
