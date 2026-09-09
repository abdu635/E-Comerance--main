from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import SignupSerializer, LoginSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.exceptions import PermissionDenied
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer
)


class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Account created successfully",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": "buyer"
                    }
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "message": "Signup failed",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            if user.is_staff or user.is_superuser:
                role = "admin"
            else:
                role = "buyer"

            return Response(
                {
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": role
                    },
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh)
                    }
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message": "Login failed",
                "errors": serializer.errors
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("id")
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admin can create categories."
            )

        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admin can update categories."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admin can delete categories."
            )

        instance.delete()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related(
        "category"
    ).order_by("-created_at")

    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.select_related(
            "category"
        ).order_by("-created_at")

        category_id = self.request.query_params.get("category")
        recommended = self.request.query_params.get("is_recommended")

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if recommended is not None:
            queryset = queryset.filter(
                is_recommended=recommended.lower() == "true"
            )

        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admin can create products."
            )

        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admin can update products."
            )

        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionDenied(
                "Only admin can delete products."
            )

        instance.delete()