from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()


class Product(BaseModel):
    id: int
    name: str
    price: int


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/products", response_model=list[Product])
def get_products(max_price: int | None = None):

    products = [
        Product(
            id=1,
            name="Running Shoes",
            price=2799
        ),
        Product(
            id=2,
            name="Walking Shoes",
            price=1999
        ),
        Product(
            id=3,
            name="Training Shoes",
            price=2499
        )
    ]

    if max_price is not None:
        products = [
            product
            for product in products
            if product.price <= max_price
        ]

    return products


@app.get("/products/{product_id}")
def get_product(product_id: int):
    return {
        "id": product_id,
        "name": "Walking Shoes",
        "price": 1999
    }