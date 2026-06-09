import secrets
from decimal import Decimal
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction, IntegrityError
from django.db.models import F, Q
from rest_framework import permissions
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.utils import timezone
from .models import Category, Product, ProductVariant, Order, OrderItem, ContactMessage, UserProfile, PromoCode, PromoRedemption, DeliveryMethod, Testimonial, SiteSettings
from .email_notifications import send_order_notification_async
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    DeliveryMethodSerializer,
    TestimonialSerializer,
    SiteSettingsSerializer,
    UserFavoriteSerializer,
    UserCartItemSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    PromoCodeValidateSerializer,
    PromoCodeSerializer,
    PublicPromoCodeSerializer,
    ContactMessageSerializer,
    RegisterSerializer,
    LoginSerializer,
    MeSerializer,
    UpdateMeSerializer,
    ChangePasswordSerializer,
)


ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_order_code() -> str:
    # High-entropy, unambiguous code so order lookup-by-code cannot be enumerated.
    return "AX-" + "".join(secrets.choice(ORDER_CODE_ALPHABET) for _ in range(10))


def resolve_product_from_payload(payload):
    product = None
    product_id = payload.get("product_id")
    product_slug = (payload.get("product_slug") or "").strip()
    if product_id is not None:
        product = Product.objects.filter(id=product_id, is_active=True).first()
    if product is None and product_slug:
        product = Product.objects.filter(slug=product_slug, is_active=True).first()
    return product


def resolve_variant_from_payload(payload):
    variant_id = payload.get("variant_id")
    if variant_id is not None:
        variant = (
            ProductVariant.objects.select_related("product")
            .filter(id=variant_id, is_active=True, product__is_active=True)
            .first()
        )
        if variant is not None:
            return variant

    product = resolve_product_from_payload(payload)
    if product is None:
        return None
    return product.variants.filter(is_active=True).order_by("sort_order", "id").first()


MAX_CART_QUANTITY = 99


def parse_quantity(raw, default=None):
    """Coerce a client-supplied quantity to an int in [1, MAX_CART_QUANTITY].
    Returns ``default`` when the value is missing or not a positive integer,
    so callers can reject (single item) or skip (bulk) it instead of crashing
    on int() or persisting a zero/negative/absurd quantity."""
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return default
    if value < 1:
        return default
    return min(value, MAX_CART_QUANTITY)


def normalize_promo_code(value: str) -> str:
    return (value or "").strip().upper()


def validate_promo_for_user(promo: PromoCode, user, subtotal: Decimal) -> str | None:
    if user is None or not user.is_authenticated:
        return "Promokoddan istifadə etmək üçün daxil olun."
    if not promo.is_active_now():
        return "Promokod aktiv deyil və ya müddəti bitib."
    if subtotal < promo.min_subtotal:
        return f"Bu promokod üçün minimum sifariş məbləği {promo.min_subtotal} ₼-dir."
    if promo.max_total_uses is not None and promo.redemptions.count() >= promo.max_total_uses:
        return "Bu promokodun istifadə limiti bitib."
    if promo.max_uses_per_user and promo.redemptions.filter(user=user).count() >= promo.max_uses_per_user:
        return "Bu promokod bu hesabda artıq istifadə olunub."
    return None


class CategoryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("categories", "images", "variants").order_by("-id")
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        category_slug = self.request.query_params.get("category")
        q = self.request.query_params.get("q")
        if category_slug:
            qs = qs.filter(Q(category__slug=category_slug) | Q(categories__slug=category_slug))
        if q:
            q = q.strip()
            if q:
                qs = qs.filter(
                    Q(name__icontains=q)
                    | Q(brand__icontains=q)
                    | Q(description__icontains=q)
                    | Q(top_notes__icontains=q)
                    | Q(heart_notes__icontains=q)
                    | Q(base_notes__icontains=q)
                    | Q(category__name__icontains=q)
                    | Q(categories__name__icontains=q)
                )
        return qs.distinct()


class DeliveryMethodViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = DeliveryMethod.objects.filter(is_active=True).order_by("sort_order", "id")
    serializer_class = DeliveryMethodSerializer


class TestimonialViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Testimonial.objects.filter(is_active=True).order_by("sort_order", "-created_at", "id")
    serializer_class = TestimonialSerializer


class OrderViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Order.objects.all().prefetch_related("items__product", "items__variant")
    serializer_class = OrderSerializer
    lookup_field = "code"

    def get_permissions(self):
        # Full order detail (name/phone/address/items) is owner-only.
        # tracking (status/date only) and create (guest checkout) stay public.
        if self.action == "retrieve":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_throttles(self):
        # Tighter limit on order creation (guest checkout spam guard); other
        # actions keep the default anon/user baseline.
        if self.action == "create":
            self.throttle_scope = "order"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve" and self.request.user.is_authenticated:
            return qs.filter(user=self.request.user)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        delivery_code = (payload.get("delivery_method") or "").strip()
        delivery = DeliveryMethod.objects.filter(code=delivery_code, is_active=True).first() if delivery_code else None
        shipping_fee = delivery.fee if delivery is not None else Decimal("0.00")
        promo_code_value = normalize_promo_code(payload.get("promo_code", ""))
        resolved_items = []
        subtotal = Decimal("0.00")

        for item in payload["items"]:
            variant = resolve_variant_from_payload(item)
            product = variant.product if variant is not None else resolve_product_from_payload(item)
            if product is None:
                product_id = item.get("product_id")
                product_slug = (item.get("product_slug") or "").strip()
                identifier = product_slug or product_id or "unknown"
                return Response(
                    {"detail": f"Product not found for item: {identifier}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            quantity = item["quantity"]
            unit_price = variant.price if variant is not None else product.price
            subtotal += unit_price * quantity
            resolved_items.append((product, variant, quantity, unit_price))

        with transaction.atomic():
            # Aggregate the requested quantity per distinct stock row so that
            # duplicate line items for the same product/variant cannot slip past
            # the availability check and oversell stock.
            required = {}
            for product, variant, quantity, unit_price in resolved_items:
                key = ("variant", variant.pk) if variant is not None else ("product", product.pk)
                entry = required.setdefault(key, {"qty": 0, "product": product, "variant": variant})
                entry["qty"] += quantity

            # Lock each distinct stock row once and verify the total is available.
            for entry in required.values():
                variant = entry["variant"]
                product = entry["product"]
                if variant is not None:
                    locked = ProductVariant.objects.select_for_update().get(pk=variant.pk)
                    available, label = locked.stock, f"{product.name} ({variant.label})"
                else:
                    locked = Product.objects.select_for_update().get(pk=product.pk)
                    available, label = locked.stock, product.name
                if available < entry["qty"]:
                    return Response(
                        {"detail": f"Stokda kifayət qədər məhsul yoxdur: {label} (qalıq: {available})."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            promo = None
            discount_amount = Decimal("0.00")
            if promo_code_value:
                if not request.user.is_authenticated:
                    return Response(
                        {"detail": "Promokoddan istifadə etmək üçün daxil olun."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                promo = PromoCode.objects.select_for_update().filter(code=promo_code_value).first()
                if promo is None:
                    return Response({"detail": "Promokod tapılmadı."}, status=status.HTTP_400_BAD_REQUEST)
                promo_error = validate_promo_for_user(promo, request.user, subtotal)
                if promo_error:
                    return Response({"detail": promo_error}, status=status.HTTP_400_BAD_REQUEST)
                discount_amount = promo.calculate_discount(subtotal)

            order = Order.objects.create(
                code=generate_order_code(),
                user=request.user if request.user.is_authenticated else None,
                full_name=payload["full_name"],
                phone=payload["phone"],
                address=payload["address"],
                notes=payload.get("notes", ""),
                promo_code=promo.code if promo else "",
                discount_amount=discount_amount,
                shipping_fee=shipping_fee,
                payment_method="cash_on_delivery",
                delivery_method=delivery.code if delivery else "",
            )
            for product, variant, quantity, unit_price in resolved_items:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=variant,
                    quantity=quantity,
                    unit_price=unit_price,
                )
                if variant is not None:
                    ProductVariant.objects.filter(pk=variant.pk).update(stock=F("stock") - quantity)
                else:
                    Product.objects.filter(pk=product.pk).update(stock=F("stock") - quantity)

            order.subtotal = subtotal
            order.total = subtotal + shipping_fee - discount_amount
            if order.total < 0:
                order.total = Decimal("0.00")
            order.save(update_fields=["subtotal", "total"])
            if promo:
                PromoRedemption.objects.create(promo_code=promo, user=request.user, order=order)
            transaction.on_commit(lambda: send_order_notification_async(order))

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
            .prefetch_related("items__product", "items__variant")
            .order_by("-created_at")
        )
        return Response(OrderSerializer(orders, many=True).data)

    @action(detail=False, methods=["get"], url_path="by-code", permission_classes=[permissions.AllowAny])
    def by_code(self, request):
        """Public order-lookup endpoint for the tracking page.
        Returns minimal info: code, status, total, created_at.
        """
        code = (request.query_params.get("code") or "").strip()
        if not code:
            return Response({"detail": "Sifariş kodu tələb olunur."}, status=status.HTTP_400_BAD_REQUEST)
        order = Order.objects.filter(code__iexact=code).first()
        if order is None:
            return Response({"detail": "Sifariş tapılmadı."}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "code": order.code,
            "status": order.status,
            "status_display": order.get_status_display(),
            "total": str(order.total),
            "created_at": order.created_at.isoformat(),
        })


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer


class UserFavoriteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorites = request.user.favorites.select_related("product", "product__category").all()
        return Response(
            UserFavoriteSerializer(favorites, many=True).data
        )

    def post(self, request):
        bulk_items = request.data.get("items")
        if isinstance(bulk_items, list):
            request.user.favorites.all().delete()
            created_items = []
            for raw_item in bulk_items:
                product = resolve_product_from_payload(raw_item if isinstance(raw_item, dict) else {})
                if product is None:
                    continue
                favorite = request.user.favorites.create(product=product)
                created_items.append(favorite)
            return Response(UserFavoriteSerializer(created_items, many=True).data, status=status.HTTP_201_CREATED)

        product = resolve_product_from_payload(request.data)
        if product is None:
            return Response({"detail": "Product not found."}, status=status.HTTP_400_BAD_REQUEST)
        favorite, _ = request.user.favorites.get_or_create(product=product)
        return Response(UserFavoriteSerializer(favorite).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        product = resolve_product_from_payload(request.data)
        if product is None:
            request.user.favorites.all().delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        request.user.favorites.filter(product=product).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserCartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart_items = request.user.cart_items.select_related("product", "product__category", "variant").all()
        return Response(UserCartItemSerializer(cart_items, many=True).data)

    def post(self, request):
        bulk_items = request.data.get("items")
        if isinstance(bulk_items, list):
            request.user.cart_items.all().delete()
            created_items = []
            for raw_item in bulk_items:
                if not isinstance(raw_item, dict):
                    continue
                variant = resolve_variant_from_payload(raw_item)
                product = variant.product if variant is not None else resolve_product_from_payload(raw_item)
                if product is None:
                    continue
                quantity = parse_quantity(raw_item.get("quantity"))
                if quantity is None:
                    continue
                item = request.user.cart_items.create(product=product, variant=variant, quantity=quantity)
                created_items.append(item)
            return Response(UserCartItemSerializer(created_items, many=True).data, status=status.HTTP_201_CREATED)

        variant = resolve_variant_from_payload(request.data)
        product = variant.product if variant is not None else resolve_product_from_payload(request.data)
        if product is None:
            return Response({"detail": "Product not found."}, status=status.HTTP_400_BAD_REQUEST)
        quantity = parse_quantity(request.data.get("quantity"))
        if quantity is None:
            return Response(
                {"detail": "Quantity must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if variant is None:
            item = request.user.cart_items.filter(product=product, variant__isnull=True).first()
            if item is None:
                item = request.user.cart_items.create(product=product, quantity=quantity)
                return Response(UserCartItemSerializer(item).data, status=status.HTTP_201_CREATED)
            item.quantity = quantity
            item.save(update_fields=["quantity", "updated_at"])
            return Response(UserCartItemSerializer(item).data, status=status.HTTP_201_CREATED)

        item, created = request.user.cart_items.get_or_create(
            variant=variant,
            defaults={"product": product, "quantity": quantity},
        )
        if not created:
            item.quantity = quantity
            item.save(update_fields=["quantity", "updated_at"])
        return Response(UserCartItemSerializer(item).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        variant = resolve_variant_from_payload(request.data)
        if variant is None:
            product = resolve_product_from_payload(request.data)
            if product is None:
                request.user.cart_items.all().delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
            request.user.cart_items.filter(product=product, variant__isnull=True).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        request.user.cart_items.filter(variant=variant).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PromoCodeValidateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PromoCodeValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        code = normalize_promo_code(payload["code"])
        subtotal = payload.get("subtotal", Decimal("0.00"))
        promo = PromoCode.objects.filter(code=code).first()
        if promo is None:
            return Response({"detail": "Promokod tapılmadı."}, status=status.HTTP_400_BAD_REQUEST)
        promo_error = validate_promo_for_user(promo, request.user, subtotal)
        if promo_error:
            return Response({"detail": promo_error}, status=status.HTTP_400_BAD_REQUEST)

        discount_amount = promo.calculate_discount(subtotal)
        return Response(
            {
                "valid": True,
                "promo": PromoCodeSerializer(promo).data,
                "discount_amount": str(discount_amount),
                "message": "Promokod aktivdir.",
            }
        )


class PublicPromoCodeListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.now()
        promos = (
            PromoCode.objects.filter(active=True)
            .filter(Q(starts_at__isnull=True) | Q(starts_at__lte=now))
            .filter(Q(ends_at__isnull=True) | Q(ends_at__gte=now))
            .order_by("-created_at")
        )
        return Response(PublicPromoCodeSerializer(promos, many=True).data)


class SiteSettingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.load()).data)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        full_name = payload["full_name"].strip()
        first_name, *rest = full_name.split(" ")
        last_name = " ".join(rest).strip()
        # The serializer already rejects an existing email, but two concurrent
        # signups can both pass that check; the DB unique constraint on username
        # is the real guard. Catch the IntegrityError so the loser of the race
        # gets a clean 400 instead of an unhandled 500.
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=payload["email"],
                    email=payload["email"],
                    password=payload["password"],
                    first_name=first_name,
                    last_name=last_name,
                )
                UserProfile.objects.create(user=user, phone=payload["phone"], address=payload.get("address", ""))
        except IntegrityError:
            return Response(
                {"email": ["User with this email already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": MeSerializer.from_user(user)}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

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
