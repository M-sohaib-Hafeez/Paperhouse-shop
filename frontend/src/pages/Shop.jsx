import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, money } from "../api";
import { useAuth } from "../auth.jsx";
import { useCart } from "../cart.jsx";

const TINTS = ["#E4EAFF", "#DDF3EA", "#FFE9D6", "#F3E3FA", "#FFF3C4", "#E1F0F7"];

export default function Shop() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const { user } = useAuth();
  const { cart, add } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.products().then(setProducts).catch((e) => setError(e.message));
  }, []);

  const inCart = (id) => cart.items.find((i) => i.product_id === id)?.quantity ?? 0;

  async function handleAdd(p) {
    if (!user) return navigate("/login", { state: { from: location.pathname } });
    try {
      await add(p.id, 1);
      setToast(`${p.name} added to your cart`);
      setTimeout(() => setToast(""), 2200);
    } catch (e) {
      setToast(e.message);
      setTimeout(() => setToast(""), 3000);
    }
  }

  return (
    <>
      <h1>Stationery for people who write things down</h1>
      <p className="muted lead">Pick what you need. Pay when it arrives.</p>

      {error && <p className="error">{error}</p>}
      {!products && !error && <p className="muted">Loading products…</p>}

      <div className="grid">
        {products?.map((p, i) => {
          const remaining = p.stock - inCart(p.id);
          return (
            <article key={p.id} className="card">
              <div className="tile" style={{ background: TINTS[i % TINTS.length] }} aria-hidden="true">
                {p.emoji}
              </div>
              <h3>{p.name}</h3>
              <p className="muted small">{p.description}</p>
              <div className="card-foot">
                <strong>{money(p.price_cents)}</strong>
                <span className={remaining <= 5 ? "small warn" : "small muted"}>
                  {remaining <= 0 ? "None left" : `${remaining} left`}
                </span>
              </div>
              <button className="btn" disabled={remaining <= 0} onClick={() => handleAdd(p)}>
                Add to cart
              </button>
            </article>
          );
        })}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
