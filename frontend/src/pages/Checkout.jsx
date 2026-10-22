import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth.jsx";
import { useCart } from "../cart.jsx";

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ shipping_name: user.name, shipping_phone: "", shipping_address: "", note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (cart.items.length === 0) {
    return (
      <div className="panel">
        <h1>Nothing to check out</h1>
        <Link className="btn" to="/">Back to the shop</Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const order = await api.checkout(form);
      await refresh();
      navigate("/orders", { state: { placed: order.id }, replace: true });
    } catch (err) {
      setError(err.message);
      refresh(); // stock may have changed
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Checkout</h1>
      <div className="two-col">
        <form className="panel" onSubmit={submit}>
          <h2>Delivery details</h2>
          <label>
            Full name
            <input value={form.shipping_name} onChange={set("shipping_name")} required minLength={2} />
          </label>
          <label>
            Phone number
            <input value={form.shipping_phone} onChange={set("shipping_phone")} required minLength={7} inputMode="tel" />
          </label>
          <label>
            Delivery address
            <textarea value={form.shipping_address} onChange={set("shipping_address")} required minLength={8} rows={3} />
          </label>
          <label>
            Note for the shop (optional)
            <textarea value={form.note} onChange={set("note")} rows={2} />
          </label>
          <p className="small muted">Payment: cash on delivery.</p>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={busy}>{busy ? "Placing order…" : `Place order · ${money(cart.total_cents)}`}</button>
        </form>

        <aside className="panel">
          <h2>Order summary</h2>
          {cart.items.map((i) => (
            <div className="summary-line" key={i.product_id}>
              <span>{i.quantity} × {i.name}</span>
              <span>{money(i.line_total_cents)}</span>
            </div>
          ))}
          <div className="total-row">
            <span>Total</span>
            <strong>{money(cart.total_cents)}</strong>
          </div>
        </aside>
      </div>
    </>
  );
}
