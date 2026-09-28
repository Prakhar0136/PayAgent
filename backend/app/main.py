from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db, engine

from app.models import (
    Base,
    Product as ProductModel,
    Category as CategoryModel,
    User as UserModel,
    Inventory as InventoryModel,
    Cart as CartModel,
    CartItem as CartItemModel,
    Order as OrderModel,
    OrderItem as OrderItemModel,
)

from app.schemas import (
    CategoryCreate,
    CategoryResponse,
    ProductCreate,
    ProductResponse,
    UserCreate,
    UserResponse,
    InventoryCreate,
    InventoryResponse,
    CartCreate,
    CartResponse,
    CartItemUpdate,
    CartItemCreate,
    CartItemResponse,
    OrderItemResponse,
    OrderResponse,
)


app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# CATEGORY ENDPOINTS

@app.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=201
)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    # Check duplicate category name
    existing_category = db.query(CategoryModel).filter(
        CategoryModel.name == category.name
    ).first()

    if existing_category:
        raise HTTPException(
            status_code=409,
            detail="Category already exists"
        )

    new_category = CategoryModel(
        name=category.name
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@app.get(
    "/categories",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db)
):
    return db.query(CategoryModel).all()


@app.get(
    "/categories/{category_id}",
    response_model=CategoryResponse
)
def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category

# PRODUCT ENDPOINTS

@app.post(
    "/products",
    response_model=ProductResponse,
    status_code=201
)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    # Check that category exists
    category = db.query(CategoryModel).filter(
        CategoryModel.id == product.category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    new_product = ProductModel(
        name=product.name,
        price=product.price,
        category_id=product.category_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@app.get(
    "/products",
    response_model=list[ProductResponse]
)
def get_products(
    max_price: int | None = None,
    db: Session = Depends(get_db)
):
    products = db.query(ProductModel)

    if max_price is not None:
        products = products.filter(
            ProductModel.price <= max_price
        )

    return products.all()


@app.get(
    "/products/category/{category_name}",
    response_model=list[ProductResponse]
)
def get_products_by_category_name(
    category_name: str,
    db: Session = Depends(get_db)
):
    # First check that category exists
    # NOTE: This route MUST be registered before /products/{product_id}
    # so FastAPI does not try to coerce "category" as an integer.
    category = db.query(CategoryModel).filter(
        CategoryModel.name == category_name
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return db.query(ProductModel).filter(
        ProductModel.category_id == category.id
    ).all()


@app.get(
    "/products/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(ProductModel).filter(
        ProductModel.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


@app.get(
    "/categories/{category_id}/products",
    response_model=list[ProductResponse]
)
def get_products_by_category_id(
    category_id: int,
    db: Session = Depends(get_db)
):
    # First check that category exists
    category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Category exists but may have zero products.
    # In that case return [].
    return db.query(ProductModel).filter(
        ProductModel.category_id == category_id
    ).all()

# USER ENDPOINTS

@app.post(
    "/users",
    response_model=UserResponse,
    status_code=201
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check duplicate email
    existing_user = db.query(UserModel).filter(
        UserModel.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    new_user = UserModel(
        name=user.name,
        email=user.email
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# INVENTORY ENDPOINTS

@app.post(
    "/inventory",
    response_model=InventoryResponse,
    status_code=201
)
def create_inventory(
    inv: InventoryCreate,
    db: Session = Depends(get_db)
):
    # Check product exists
    product = db.query(ProductModel).filter(
        ProductModel.id == inv.product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check inventory does not already exist
    existing_inventory = db.query(InventoryModel).filter(
        InventoryModel.product_id == inv.product_id
    ).first()

    if existing_inventory:
        raise HTTPException(
            status_code=409,
            detail="Inventory already exists for this product"
        )

    new_inventory = InventoryModel(
        product_id=inv.product_id,
        quantity=inv.quantity
    )

    db.add(new_inventory)
    db.commit()
    db.refresh(new_inventory)

    return new_inventory


@app.get(
    "/inventory/{product_id}",
    response_model=InventoryResponse
)
def get_inventory(
    product_id: int,
    db: Session = Depends(get_db)
):
    inventory = db.query(InventoryModel).filter(
        InventoryModel.product_id == product_id
    ).first()

    if inventory is None:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found for this product"
        )

    return inventory

# CART ENDPOINTS

@app.post(
    "/carts",
    response_model=CartResponse,
    status_code=201
)
def create_cart(
    cart: CartCreate,
    db: Session = Depends(get_db)
):
    # Check user exists
    user = db.query(UserModel).filter(
        UserModel.id == cart.user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_cart = CartModel(
        user_id=cart.user_id
    )

    db.add(new_cart)
    db.commit()
    db.refresh(new_cart)

    return new_cart


@app.post(
    "/carts/{cart_id}/items",
    response_model=CartItemResponse,
    status_code=201
)
def add_item_to_cart(
    cart_id: int,
    item: CartItemCreate,
    db: Session = Depends(get_db)
):
    # Check cart exists
    cart = db.query(CartModel).filter(
        CartModel.id == cart_id
    ).first()

    if cart is None:
        raise HTTPException(
            status_code=404,
            detail="Cart not found"
        )

    # Check product exists
    product = db.query(ProductModel).filter(
        ProductModel.id == item.product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check if product is already in cart
    existing_item = db.query(CartItemModel).filter(
        CartItemModel.cart_id == cart_id,
        CartItemModel.product_id == item.product_id
    ).first()

    if existing_item:
        # Increase existing quantity instead of
        # creating duplicate cart rows.
        existing_item.quantity += item.quantity

        db.commit()
        db.refresh(existing_item)

        return existing_item

    # Otherwise create a new cart item
    try:
        new_item = CartItemModel(
            cart_id=cart_id,
            product_id=item.product_id,
            quantity=item.quantity
        )

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return new_item
    except IntegrityError:
        db.rollback()
        existing_item = db.query(CartItemModel).filter(
            CartItemModel.cart_id == cart_id,
            CartItemModel.product_id == item.product_id
        ).first()

        if existing_item:
            existing_item.quantity += item.quantity
            db.commit()
            db.refresh(existing_item)
            return existing_item

        raise HTTPException(
            status_code=400,
            detail="Error adding item to cart"
        )


@app.patch(
    "/carts/{cart_id}/items/{item_id}",
    response_model=CartItemResponse
)
def update_cart_item(
    cart_id: int,
    item_id: int,
    item: CartItemUpdate,
    db: Session = Depends(get_db)
):
    cart_item = db.query(CartItemModel).filter(
        CartItemModel.id == item_id,
        CartItemModel.cart_id == cart_id
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    cart_item.quantity = item.quantity

    db.commit()
    db.refresh(cart_item)

    return cart_item


@app.delete(
    "/carts/{cart_id}/items/{item_id}"
)
def remove_cart_item(
    cart_id: int,
    item_id: int,
    db: Session = Depends(get_db)
):
    cart_item = db.query(CartItemModel).filter(
        CartItemModel.id == item_id,
        CartItemModel.cart_id == cart_id
    ).first()

    if cart_item is None:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    db.delete(cart_item)
    db.commit()

    return {
        "message": "Cart item removed successfully"
    }


@app.get(
    "/carts/{cart_id}",
    response_model=CartResponse
)
def get_cart(
    cart_id: int,
    db: Session = Depends(get_db)
):
    cart = db.query(CartModel).filter(
        CartModel.id == cart_id
    ).first()

    if cart is None:
        raise HTTPException(
            status_code=404,
            detail="Cart not found"
        )

    total = 0

    for item in cart.items:
        total += item.product.price * item.quantity

    return {
        "id": cart.id,
        "user_id": cart.user_id,
        "items": cart.items,
        "total": total
    }

# CHECKOUT

@app.post(
    "/carts/{cart_id}/checkout",
    response_model=OrderResponse,
    status_code=201
)
def checkout_cart(
    cart_id: int,
    idempotency_key: str | None = Header(None, alias="Idempotency-Key"),
    db: Session = Depends(get_db)
):
    # Check for existing order with idempotency key prior to starting transaction
    if idempotency_key:
        existing_order = db.query(OrderModel).filter(
            OrderModel.idempotency_key == idempotency_key
        ).first()

        if existing_order:
            return existing_order

    try:
        # -----------------------------------------------------
        # 1. Find cart with row-level lock
        # -----------------------------------------------------
        cart = db.query(CartModel).filter(
            CartModel.id == cart_id
        ).with_for_update().first()

        if cart is None:
            raise HTTPException(
                status_code=404,
                detail="Cart not found"
            )

        # -----------------------------------------------------
        # 2. Make sure cart isn't empty
        # -----------------------------------------------------
        if not cart.items:
            raise HTTPException(
                status_code=400,
                detail="Cart is empty"
            )

        # Sort items by product_id to ensure consistent locking order across transactions and avoid deadlocks
        sorted_cart_items = sorted(cart.items, key=lambda item: item.product_id)

        # -----------------------------------------------------
        # 3. Validate and lock inventory for each product
        # -----------------------------------------------------
        validated_items = []
        for cart_item in sorted_cart_items:
            product = db.query(ProductModel).filter(
                ProductModel.id == cart_item.product_id
            ).first()

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {cart_item.product_id} not found"
                )

            # Row-level lock on inventory record to handle concurrent checkout requests safely
            inventory = db.query(InventoryModel).filter(
                InventoryModel.product_id == product.id
            ).with_for_update().first()

            if inventory is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"No inventory found for product {product.id}"
                )

            if inventory.quantity < cart_item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Insufficient inventory for product "
                        f"{product.id}. "
                        f"Available: {inventory.quantity}, "
                        f"Requested: {cart_item.quantity}"
                    )
                )

            validated_items.append((cart_item, product, inventory))

        # -----------------------------------------------------
        # 4. Create order
        # -----------------------------------------------------
        new_order = OrderModel(
            user_id=cart.user_id,
            status="completed",
            idempotency_key=idempotency_key
        )

        db.add(new_order)
        db.flush()

        # -----------------------------------------------------
        # 5. Convert cart items into order items & update inventory
        # -----------------------------------------------------
        for cart_item, product, inventory in validated_items:
            # Create order item
            order_item = OrderItemModel(
                order_id=new_order.id,
                product_id=product.id,
                quantity=cart_item.quantity,
                unit_price=product.price
            )

            db.add(order_item)

            # Deduct locked inventory
            inventory.quantity -= cart_item.quantity

            # Remove item from cart
            db.delete(cart_item)

        # -----------------------------------------------------
        # 6. Commit transaction atomically
        # -----------------------------------------------------
        db.commit()

        # -----------------------------------------------------
        # 7. Refresh order and return
        # -----------------------------------------------------
        db.refresh(new_order)
        return new_order

    except HTTPException:
        db.rollback()
        raise
    except IntegrityError:
        db.rollback()
        if idempotency_key:
            existing_order = db.query(OrderModel).filter(
                OrderModel.idempotency_key == idempotency_key
            ).first()
            if existing_order:
                return existing_order
        raise HTTPException(
            status_code=400,
            detail="Conflict or duplicate request encountered during checkout."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during checkout: {str(e)}"
        )


@app.get(
    "/orders/{order_id}",
    response_model=OrderResponse
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    order = db.query(OrderModel).filter(
        OrderModel.id == order_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    return order


@app.get(
    "/users/{user_id}/orders",
    response_model=list[OrderResponse]
)
def get_user_orders(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(UserModel).filter(
        UserModel.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return db.query(OrderModel).filter(
        OrderModel.user_id == user_id
    ).all()