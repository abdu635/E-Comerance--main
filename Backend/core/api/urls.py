from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    SignupAPIView,
    LoginAPIView,
    CategoryViewSet,
    ProductViewSet
)


router = DefaultRouter()

router.register(
    "categories",
    CategoryViewSet,
    basename="category"
)

router.register(
    "products",
    ProductViewSet,
    basename="product"
)


urlpatterns = [
    path(
        "signup/",
        SignupAPIView.as_view(),
        name="signup"
    ),

    path(
        "login/",
        LoginAPIView.as_view(),
        name="login"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh"
    ),

    path(
        "",
        include(router.urls)
    ),
]