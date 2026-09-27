from fastapi import FastAPI, Depends,HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.models import Product as ProductModel
from sqlalchemy.orm import Session

app = FastAPI()


class Product(BaseModel):
    id: int
    name: str
    price: int
    category: str

class Category(BaseModel):
    id: int
    name: str


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/products", response_model=list[Product])
def get_products(max_price: int | None = None,db: Session = Depends(get_db)):

   products = db.query(ProductModel)

   if max_price is not None:
      products = products.filter(
         ProductModel.price <= max_price
      )

   products = products.all()

   return products


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int,db: Session = Depends(get_db)):
    
    products = db.query(ProductModel).filter(
        ProductModel.id == product_id       
    ).all()

    if len(products) == 0:
        raise HTTPException(
            status_code=404,
        detail="Product not found"
    )

    return products[0]


@app.get("/products/category/{category_name}")
def get_products_by_category(category_name: str,db: Session = Depends(get_db)):

    products = db.query(ProductModel).filter(
        ProductModel.category == category_name
    ).all()

    if products is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return [
        product
        for product in products
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