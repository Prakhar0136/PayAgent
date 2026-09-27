from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()


class Product(BaseModel):
    id: int
    name: str
    price: int
    category: str

class Category(BaseModel):
    id: int
    name: str

PRODUCTS = [
    Product(
        id=1,
        name="Running Shoes",
        price=2799,
        category="shoes"
    ),
    Product(
        id=2,
        name="Walking Shoes",
        price=1999,
        category="shoes"
    ),
    Product(
        id=3,
        name="Training Shoes",
        price=2499,
        category="shoes"
    ),
    Product(
        id=4,
        name="T-Shirt",
        price=999,
        category="clothing"
    ),
]

CATEGORIES = [
    Category(
        id=1,
        name="Shoes"
    ),
    Category(
        id=2,
        name="Clothing"
    ),
]

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/products", response_model=list[Product])
def get_products(max_price: int | None = None):

    products = PRODUCTS 

    if max_price is not None:
        products = [
            product
            for product in products
            if product.price <= max_price
        ]

    return products


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    
    for product in PRODUCTS:
        if product.id == product_id:
            return product

    raise HTTPException(
        status_code=404,
        detail="Product not found"
    )


@app.get("/products/category/{category_name}")
def get_products_by_category(category_name: str):

    return [
        product
        for product in PRODUCTS
        if product.category.lower() == category_name.lower()
    ]

@app.get("/category/{category_id}", response_model=Category)
def get_category(category_id: int):

    for category in CATEGORIES:
        if category.id == category_id:
            return category

    raise HTTPException(
        status_code=404,
        detail="Category not found"
    )