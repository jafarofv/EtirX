import random
import string
from decimal import Decimal
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import permissions
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import Category, Product, Order, OrderItem, ContactMessage, UserProfile
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ContactMessageSerializer,
    RegisterSerializer,
    LoginSerializer,
    MeSerializer,
    UpdateMeSerializer,
    ChangePasswordSerializer,
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
                user=request.user if request.user.is_authenticated else None,
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

    @action(detail=False, methods=["get"], url_path="my-orders", permission_classes=[permissions.IsAuthenticated])
    def my_orders(self, request):
        orders = (
            Order.objects.filter(user=request.user)
            .prefetch_related("items__product")
            .order_by("-created_at")
        )
        return Response(OrderSerializer(orders, many=True).data)


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        full_name = payload["full_name"].strip()
        first_name, *rest = full_name.split(" ")
        last_name = " ".join(rest).strip()
        user = User.objects.create_user(
            username=payload["email"],
            email=payload["email"],
            password=payload["password"],
            first_name=first_name,
            last_name=last_name,
        )
        UserProfile.objects.create(user=user, phone=payload["phone"], address=payload.get("address", ""))
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": MeSerializer.from_user(user)}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        user = authenticate(username=payload["email"].strip().lower(), password=payload["password"])
        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": MeSerializer.from_user(user)})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer.from_user(request.user))

    def patch(self, request):
        serializer = UpdateMeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        user = request.user
        full_name = payload["full_name"].strip()
        first_name, *rest = full_name.split(" ")
        user.first_name = first_name
        user.last_name = " ".join(rest).strip()
        user.save(update_fields=["first_name", "last_name"])
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = payload["phone"].strip()
        profile.address = payload.get("address", "").strip()
        profile.save(update_fields=["phone", "address"])
        return Response(MeSerializer.from_user(user))

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        user = request.user
        if not user.check_password(payload["current_password"]):
            return Response({"detail": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(payload["new_password"])
        user.save(update_fields=["password"])
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        return Response({"token": token.key})


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
