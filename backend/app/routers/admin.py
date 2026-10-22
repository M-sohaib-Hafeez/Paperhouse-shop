from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import ORDER_STATUSES, Order, OrderItem, Product, User
from ..schemas import OrderOut, StatusIn, SummaryOut
from ..security import admin_only

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin_only)])


@router.get("/orders", response_model=list[OrderOut])
def list_orders(status: str | None = None, db: Session = Depends(get_db)):
    query = select(Order).options(joinedload(Order.items), joinedload(Order.user))
    if status:
        if status not in ORDER_STATUSES:
            raise HTTPException(400, f"status must be one of {ORDER_STATUSES}")
        query = query.where(Order.status == status)
    return db.scalars(query.order_by(Order.created_at.desc())).unique().all()


@router.get("/summary", response_model=SummaryOut)
def summary(db: Session = Depends(get_db)):
    counts = {s: 0 for s in ORDER_STATUSES}
    for status, n in db.execute(select(Order.status, func.count()).group_by(Order.status)):
        counts[status] = n
    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_cents), 0)).where(Order.status != "cancelled")
    )
    return {"counts": counts, "revenue_cents": revenue}


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_status(order_id: int, data: StatusIn, db: Session = Depends(get_db)):
    if data.status not in ORDER_STATUSES:
        raise HTTPException(400, f"status must be one of {ORDER_STATUSES}")
    order = db.scalar(
        select(Order)
        .where(Order.id == order_id)
        .options(joinedload(Order.items), joinedload(Order.user))
    )
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status == "cancelled" and data.status != "cancelled":
        raise HTTPException(409, "Cancelled orders can't be reopened")
    if data.status == "cancelled" and order.status != "cancelled":
        # put the stock back
        for item in order.items:
            db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock=Product.stock + item.quantity)
            )
    order.status = data.status
    db.commit()
    db.refresh(order)
    return order
