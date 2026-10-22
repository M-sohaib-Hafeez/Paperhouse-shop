import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers tables)
from .database import Base, SessionLocal, engine
from .routers import admin, auth, cart, orders, products
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="Paperhouse API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, products.router, cart.router, orders.router, admin.router):
    app.include_router(r)


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "docs": "/docs"}
