import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../api";
import { useCart } from "../cart.jsx";

export default function Cart() {
  const { cart, setQty, remove } = useCart();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const run = (fn) => async () => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="panel">
        <h1>Your cart is empty</h1>
        <p className="muted">Add something from the shop and it will show up here.</p>
        <Link className="btn" to="/">Browse the shop</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      {error && <p className="error">{error}</p>}
      <div className="panel">
        {cart.items.map((i) => (
          <div className="line" key={i.product_id}>
            <div className="line-emoji" aria-hidden="true">{i.emoji}</div>
            <div className="line-main">
              <strong>{i.name}</strong>
              <span className="muted small">{money(i.price_cents)} each</span>
            </div>
            <div className="qty">
              <button aria-label={`Fewer ${i.name}`} disabled={i.quantity <= 1} onClick={run(() => setQty(i.product_id, i.quantity - 1))}>−</button>
              <span>{i.quantity}</span>
              <button aria-label={`More ${i.name}`} disabled={i.quantity >= i.stock} onClick={run(() => setQty(i.product_id, i.quantity + 1))}>+</button>
            </div>
            <strong className="line-total">{money(i.line_total_cents)}</strong>
            <button className="link-btn danger" onClick={run(() => remove(i.product_id))}>Remove</button>
          </div>
        ))}
        <div className="total-row">
          <span>Total ({cart.count} {cart.count === 1 ? "item" : "items"})</span>
          <strong>{money(cart.total_cents)}</strong>
        </div>
        <button className="btn" onClick={() => navigate("/checkout")}>Go to checkout</button>
      </div>
    </>
  );
}
