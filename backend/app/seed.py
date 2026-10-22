import os

from sqlalchemy import select

from .models import Product, User
from .security import hash_password

PRODUCTS = [
    ("Dotted notebook, A5", "160 pages of 100gsm paper that won't bleed through.", 65000, 40, "📓"),
    ("Gel pens, set of 10", "0.5mm tip, ten colours, dries in seconds.", 48000, 60, "🖊️"),
    ("Weekly desk planner", "Tear-off sheets, one week per page, non-slip base.", 90000, 25, "🗓️"),
    ("Sticky note cube", "400 sheets in five bright colours.", 22000, 100, "🗒️"),
    ("Highlighter pack, 6", "Chisel tip, water-based, no smudging.", 38000, 50, "🖍️"),
    ("Wooden pen stand", "Holds pens, scissors and a ruler. Solid sheesham wood.", 75000, 15, "✏️"),
]


def seed(db):
    if not db.scalar(select(Product).limit(1)):
        for name, desc, price, stock, emoji in PRODUCTS:
            db.add(Product(name=name, description=desc, price_cents=price, stock=stock, emoji=emoji))

    email = os.getenv("ADMIN_EMAIL", "admin@shop.com").lower()
    if not db.scalar(select(User).where(User.email == email)):
        db.add(
            User(
                name="Shop Admin",
                email=email,
                password_hash=hash_password(os.getenv("ADMIN_PASSWORD", "admin123")),
                role="admin",
            )
        )
    db.commit()
