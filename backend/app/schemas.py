from pydantic import BaseModel, Field


# =========================================================
# CATEGORY SCHEMAS
# =========================================================

class CategoryCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }


# =========================================================
# PRODUCT SCHEMAS
# =========================================================

class ProductCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255
    )

    price: int = Field(
        ge=0
    )

    category_id: int = Field(
        gt=0
    )


class ProductResponse(BaseModel):
    id: int
    name: str
    price: int
    category_id: int

    model_config = {
        "from_attributes": True
    }


# =========================================================
# INVENTORY SCHEMAS
# =========================================================

class InventoryCreate(BaseModel):
    product_id: int = Field(
        gt=0
    )

    quantity: int = Field(
        ge=0
    )


class InventoryResponse(BaseModel):
    id: int
    product_id: int
    quantity: int

    model_config = {
        "from_attributes": True
    }


# =========================================================
# USER SCHEMAS
# =========================================================

class UserCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

    email: str = Field(
        min_length=3,
        max_length=255
    )


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = {
        "from_attributes": True
    }


# =========================================================
# CART SCHEMAS
# =========================================================

class CartCreate(BaseModel):
    user_id: int = Field(
        gt=0
    )


class CartItemCreate(BaseModel):
    product_id: int = Field(
        gt=0
    )

    quantity: int = Field(
        gt=0
    )


class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int

    model_config = {
        "from_attributes": True
    }


class CartResponse(BaseModel):
    id: int
    user_id: int

    items: list[CartItemResponse] = Field(
        default_factory=list
    )

    model_config = {
        "from_attributes": True
    }


# =========================================================
# ORDER SCHEMAS
# =========================================================

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: int

    model_config = {
        "from_attributes": True
    }


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str

    items: list[OrderItemResponse] = Field(
        default_factory=list
    )

    model_config = {
        "from_attributes": True
    }