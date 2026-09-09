from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products"
    )

    description = models.TextField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True
    )

    stock = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    is_recommended = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name