import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, money } from "../api";
import StatusPill from "../components/StatusPill.jsx";

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const placed = useLocation().state?.placed;

  useEffect(() => {
    api.myOrders().then(setOrders).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      {placed && <div className="notice">Order #{placed} is placed. The shop has been notified.</div>}
      <h1>My orders</h1>
      {error && <p className="error">{error}</p>}
      {orders && orders.length === 0 && (
        <div className="panel">
          <p className="muted">You haven't ordered anything yet.</p>
          <Link className="btn" to="/">Browse the shop</Link>
        </div>
      )}
      {orders?.map((o) => (
        <div className="panel order" key={o.id}>
          <div className="order-head">
            <strong>Order #{o.id}</strong>
            <StatusPill status={o.status} />
            <span className="muted small">{new Date(o.created_at).toLocaleString()}</span>
            <strong className="push">{money(o.total_cents)}</strong>
          </div>
          <ul className="items">
            {o.items.map((it) => (
              <li key={it.product_id}>{it.quantity} × {it.product_name}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
