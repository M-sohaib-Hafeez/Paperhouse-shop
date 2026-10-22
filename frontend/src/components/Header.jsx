import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useCart } from "../cart.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">Paperhouse</Link>
        <nav className="nav nav-main" aria-label="Main">
          <NavLink to="/" end>Shop</NavLink>
          {user && <NavLink to="/orders">My orders</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <nav className="nav nav-side" aria-label="Account">
          <NavLink to="/cart" className="cart-link">
            Cart
            {cart.count > 0 && <span className="badge">{cart.count}</span>}
          </NavLink>
          {user ? (
            <button
              className="link-btn"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out ({user.name.split(" ")[0]})
            </button>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
