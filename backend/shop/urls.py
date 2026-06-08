from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ProductViewSet,
    DeliveryMethodViewSet,
    OrderViewSet,
    ContactMessageViewSet,
    UserFavoriteView,
    UserCartView,
    PromoCodeValidateView,
    RegisterView,
    LoginView,
    MeView,
    LogoutView,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("delivery-methods", DeliveryMethodViewSet, basename="delivery-method")
router.register("orders", OrderViewSet, basename="order")
router.register("contact", ContactMessageViewSet, basename="contact")

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("me/favorites/", UserFavoriteView.as_view()),
    path("me/cart/", UserCartView.as_view()),
    path("promo-codes/validate/", PromoCodeValidateView.as_view()),
    path("", include(router.urls)),
]
