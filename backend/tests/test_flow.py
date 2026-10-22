import os
import tempfile

# use a throwaway database for tests (must be set before the app is imported)
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ["ADMIN_EMAIL"] = "admin@test.com"
os.environ["ADMIN_PASSWORD"] = "adminpass"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def register(client, email="sara@example.com"):
    r = client.post("/auth/register", json={"name": "Sara Khan", "email": email, "password": "secret12"})
    assert r.status_code == 201, r.text
    return r.json()["token"]


def test_full_purchase_flow(client):
    token = register(client)
    products = client.get("/products").json()
    pen, notebook = products[1], products[0]

    # add to cart (same product twice merges into one line)
    client.post("/cart/items", json={"product_id": pen["id"], "quantity": 2}, headers=auth(token))
    cart = client.post("/cart/items", json={"product_id": pen["id"], "quantity": 1}, headers=auth(token)).json()
    assert cart["count"] == 3
    cart = client.post("/cart/items", json={"product_id": notebook["id"]}, headers=auth(token)).json()
    assert cart["total_cents"] == 3 * pen["price_cents"] + notebook["price_cents"]

    # checkout
    r = client.post(
        "/orders/checkout",
        json={"shipping_name": "Sara Khan", "shipping_phone": "03001234567", "shipping_address": "House 4, Block B, Karachi"},
        headers=auth(token),
    )
    assert r.status_code == 201, r.text
    order = r.json()
    assert order["status"] == "new"
    assert order["total_cents"] == cart["total_cents"]
    assert len(order["items"]) == 2

    # cart emptied, stock reduced
    assert client.get("/cart", headers=auth(token)).json()["count"] == 0
    assert client.get(f"/products/{pen['id']}").json()["stock"] == pen["stock"] - 3

    # customer sees own order
    assert len(client.get("/orders", headers=auth(token)).json()) == 1

    # admin sees it as a new order
    admin = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpass"}).json()["token"]
    new_orders = client.get("/admin/orders?status=new", headers=auth(admin)).json()
    assert [o["id"] for o in new_orders] == [order["id"]]
    assert new_orders[0]["customer_email"] == "sara@example.com"
    assert client.get("/admin/summary", headers=auth(admin)).json()["counts"]["new"] == 1

    # admin moves it along, then cancels -> stock returns
    r = client.patch(f"/admin/orders/{order['id']}/status", json={"status": "shipped"}, headers=auth(admin))
    assert r.json()["status"] == "shipped"
    client.patch(f"/admin/orders/{order['id']}/status", json={"status": "cancelled"}, headers=auth(admin))
    assert client.get(f"/products/{pen['id']}").json()["stock"] == pen["stock"]
    r = client.patch(f"/admin/orders/{order['id']}/status", json={"status": "new"}, headers=auth(admin))
    assert r.status_code == 409


def test_customers_cannot_use_admin_routes(client):
    token = register(client, "ali@example.com")
    assert client.get("/admin/orders", headers=auth(token)).status_code == 403
    assert client.get("/admin/orders").status_code == 401


def test_cannot_exceed_stock_or_checkout_empty_cart(client):
    token = register(client, "zoya@example.com")
    stand = client.get("/products").json()[5]
    r = client.post("/cart/items", json={"product_id": stand["id"], "quantity": 99}, headers=auth(token))
    assert r.status_code == 409
    r = client.post(
        "/orders/checkout",
        json={"shipping_name": "Zoya", "shipping_phone": "03001234567", "shipping_address": "Somewhere in Karachi"},
        headers=auth(token),
    )
    assert r.status_code == 400


def test_duplicate_email_and_bad_login(client):
    register(client, "dup@example.com")
    r = client.post("/auth/register", json={"name": "Dup", "email": "dup@example.com", "password": "secret12"})
    assert r.status_code == 409
    r = client.post("/auth/login", json={"email": "dup@example.com", "password": "wrongpass"})
    assert r.status_code == 401
