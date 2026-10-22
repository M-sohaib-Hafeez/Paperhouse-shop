import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user =
        mode === "login"
          ? await login(form.email, form.password)
          : await register(form.name, form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>{mode === "login" ? "Log in" : "Create your account"}</h1>
      {mode === "register" && (
        <label>
          Full name
          <input value={form.name} onChange={set("name")} required minLength={2} autoComplete="name" />
        </label>
      )}
      <label>
        Email
        <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
      </label>
      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={set("password")}
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="small muted">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <button type="button" className="link-btn inline" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </form>
  );
}
