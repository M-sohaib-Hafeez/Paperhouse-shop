import { useCallback, useEffect, useRef, useState } from "react";
import { api, money } from "../api";
import StatusPill from "../components/StatusPill.jsx";

const STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"];
const POLL_MS = 10000;

export default function Admin() {
  const [filter, setFilter] = useState("new");
  const [orders, setOrders] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState(new Set());
  const seen = useRef(null);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([api.adminOrders(filter), api.adminSummary()]);
      // highlight orders that appeared since the last refresh
      const ids = new Set(list.map((o) => o.id));
      if (seen.current) setFresh(new Set([...ids].filter((id) => !seen.current.has(id))));
      seen.current = ids;
      setOrders(list);
      setSummary(sum);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [filter]);

  useEffect(() => {
    seen.current = null;
    setOrders(null);
    load();
    const t = setInterval(load, POLL_MS); // simple polling keeps the list live
    return () => clearInterval(t);
  }, [load]);

  async function changeStatus(id, status) {
    try {
      await api.adminSetStatus(id, status);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Orders</h1>
      {summary && (
        <p className="muted">
          Revenue so far (excluding cancelled): <strong>{money(summary.revenue_cents)}</strong> · refreshes every 10 seconds
        </p>
      )}

      <div className="tabs" role="tablist">
        {STATUSES.map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} className={filter === s ? "tab on" : "tab"} onClick={() => setFilter(s)}>
            {s}
            {summary && <span className={s === "new" && summary.counts.new > 0 ? "count hot" : "count"}>{summary.counts[s]}</span>}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!orders && !error && <p className="muted">Loading orders…</p>}
      {orders && orders.length === 0 && <div className="panel muted">No {filter} orders.</div>}

      {orders?.map((o) => (
        <div className={fresh.has(o.id) ? "panel order fresh" : "panel order"} key={o.id}>
          <div className="order-head">
            <strong>Order #{o.id}</strong>
            <StatusPill status={o.status} />
            <span className="muted small">{new Date(o.created_at).toLocaleString()}</span>
            <strong className="push">{money(o.total_cents)}</strong>
          </div>
          <div className="order-body">
            <div>
              <ul className="items">
                {o.items.map((it) => (
                  <li key={it.product_id}>{it.quantity} × {it.product_name} <span className="muted">({money(it.unit_price_cents)} each)</span></li>
                ))}
              </ul>
            </div>
            <div className="small">
              <div><strong>{o.shipping_name}</strong> · {o.shipping_phone}</div>
              <div className="muted">{o.customer_email}</div>
              <div>{o.shipping_address}</div>
              {o.note && <div className="muted">Note: {o.note}</div>}
            </div>
            <label className="status-select">
              Status
              <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} disabled={o.status === "cancelled"}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </div>
      ))}
    </>
  );
}
