from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str


class AuthOut(BaseModel):
    token: str
    user: UserOut


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    price_cents: int
    stock: int
    emoji: str


class CartAddIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class CartSetIn(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartLineOut(BaseModel):
    product_id: int
    name: str
    emoji: str
    price_cents: int
    quantity: int
    stock: int
    line_total_cents: int


class CartOut(BaseModel):
    items: list[CartLineOut]
    count: int
    total_cents: int


class CheckoutIn(BaseModel):
    shipping_name: str = Field(min_length=2, max_length=120)
    shipping_phone: str = Field(min_length=7, max_length=40)
    shipping_address: str = Field(min_length=8, max_length=500)
    note: str = Field(default="", max_length=500)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    product_name: str
    unit_price_cents: int
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    total_cents: int
    payment_method: str
    shipping_name: str
    shipping_phone: str
    shipping_address: str
    note: str
    created_at: datetime
    customer_name: str
    customer_email: str
    items: list[OrderItemOut]


class StatusIn(BaseModel):
    status: str


class SummaryOut(BaseModel):
    counts: dict[str, int]
    revenue_cents: int
