import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <h2>
              Stationery for<br />people who write
            </h2>
            <p>Pick what you need. Pay when it arrives.</p>
          </div>
          <p className="footer-big" aria-hidden="true">
            Write it down.<br />Make it<br />yours.
          </p>
        </div>

        <div className="footer-cols">
          <div>
            <div className="footer-brand">Paperhouse</div>
            <p>© {new Date().getFullYear()} Paperhouse. All rights reserved.</p>
          </div>
          <nav aria-label="Footer">
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/">Shop</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              {user ? <li><Link to="/orders">My orders</Link></li> : <li><Link to="/login">Log in</Link></li>}
              {user?.role === "admin" && <li><Link to="/admin">Admin</Link></li>}
            </ul>
          </nav>
          <div>
            <h4>Info</h4>
            <p>Payment: cash on delivery</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
