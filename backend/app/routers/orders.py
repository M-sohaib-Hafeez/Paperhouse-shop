from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import CartItem, Order, OrderItem, Product, User
from ..schemas import CheckoutIn, OrderOut
from ..security import current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", response_model=OrderOut, status_code=201)
def checkout(data: CheckoutIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Turn the cart into an order in ONE transaction.

    - prices are re-read from the database (never trusted from the client)
    - stock is decremented with a conditional UPDATE, so two buyers can't
      both take the last item
    - if anything fails, everything rolls back and the cart is left untouched
    """
    lines = db.scalars(
        select(CartItem).where(CartItem.user_id == user.id).options(joinedload(CartItem.product))
    ).all()
    if not lines:
        raise HTTPException(400, "Your cart is empty")

    order = Order(
        user_id=user.id,
        status="new",
        shipping_name=data.shipping_name.strip(),
        shipping_phone=data.shipping_phone.strip(),
        shipping_address=data.shipping_address.strip(),
        note=data.note.strip(),
    )
    total = 0
    try:
        for line in lines:
            product = line.product
            result = db.execute(
                update(Product)
                .where(Product.id == product.id, Product.stock >= line.quantity)
                .values(stock=Product.stock - line.quantity)
            )
            if result.rowcount == 0:
                raise HTTPException(409, f"Sorry, {product.name} just ran out of stock")
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    product_name=product.name,
                    unit_price_cents=product.price_cents,
                    quantity=line.quantity,
                )
            )
            total += product.price_cents * line.quantity
        order.total_cents = total
        db.add(order)
        db.execute(delete(CartItem).where(CartItem.user_id == user.id))
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderOut])
def my_orders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .options(joinedload(Order.items), joinedload(Order.user))
        .order_by(Order.created_at.desc())
    ).unique().all()
