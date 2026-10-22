from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import CartItem, Product, User
from ..schemas import CartAddIn, CartOut, CartSetIn
from ..security import current_user

router = APIRouter(prefix="/cart", tags=["cart"])


def build_cart(db: Session, user: User) -> CartOut:
    rows = db.scalars(
        select(CartItem)
        .where(CartItem.user_id == user.id)
        .options(joinedload(CartItem.product))
        .order_by(CartItem.id)
    ).all()
    items = [
        {
            "product_id": r.product_id,
            "name": r.product.name,
            "emoji": r.product.emoji,
            "price_cents": r.product.price_cents,
            "quantity": r.quantity,
            "stock": r.product.stock,
            "line_total_cents": r.product.price_cents * r.quantity,
        }
        for r in rows
    ]
    return CartOut(
        items=items,
        count=sum(i["quantity"] for i in items),
        total_cents=sum(i["line_total_cents"] for i in items),
    )


def _get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product


def _find_line(db: Session, user: User, product_id: int) -> CartItem | None:
    return db.scalar(
        select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id)
    )


@router.get("", response_model=CartOut)
def get_cart(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return build_cart(db, user)


@router.post("/items", response_model=CartOut)
def add_item(data: CartAddIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    product = _get_product(db, data.product_id)
    line = _find_line(db, user, product.id)
    new_qty = (line.quantity if line else 0) + data.quantity
    if new_qty > product.stock:
        raise HTTPException(409, f"Only {product.stock} of {product.name} in stock")
    if line:
        line.quantity = new_qty
    else:
        db.add(CartItem(user_id=user.id, product_id=product.id, quantity=new_qty))
    db.commit()
    return build_cart(db, user)


@router.patch("/items/{product_id}", response_model=CartOut)
def set_quantity(
    product_id: int,
    data: CartSetIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    product = _get_product(db, product_id)
    line = _find_line(db, user, product_id)
    if not line:
        raise HTTPException(404, "Item is not in your cart")
    if data.quantity > product.stock:
        raise HTTPException(409, f"Only {product.stock} of {product.name} in stock")
    line.quantity = data.quantity
    db.commit()
    return build_cart(db, user)


@router.delete("/items/{product_id}", response_model=CartOut)
def remove_item(product_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(
        delete(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id)
    )
    db.commit()
    return build_cart(db, user)


@router.delete("", status_code=204)
def clear_cart(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(CartItem).where(CartItem.user_id == user.id))
    db.commit()
    return Response(status_code=204)
