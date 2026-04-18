// src/pages/Auth.tsx  —  Unified single login (no admin/user tabs)
// Role is determined silently by the backend based on registered email.
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  signIn, signUp, signInWithGoogle, resetPassword,
} from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import "../auth-styles.css";

type Mode = "login" | "register";

// ── Particle background ────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const color = [74, 144, 217];
    const COUNT = 55;
    const dots = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: 0.6 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35, a: 0.15 + Math.random() * 0.55,
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${d.a})`;
        ctx.fill();
      });
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x; const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${0.04 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="auth-canvas" />;
}

// ── Visual branding panel ──────────────────────────────────────────────────────
function VisualPanel() {
  return (
    <div className="auth-visual">
      <div className="av-grid" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="av-grid-v" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="av-scan" aria-hidden />
      <div className="av-orbits" aria-hidden>
        <div className="av-ring av-ring--outer" /><div className="av-ring av-ring--mid" /><div className="av-ring av-ring--inner" />
        <div className="av-dot av-dot--1" />
        <div className="av-dot av-dot--2" />
        <div className="av-dot av-dot--3" />
      </div>
      <div className="av-brand">
        <div className="av-logo">
          <span className="av-logo-glyph">SKW</span>
          <div className="av-logo-pulse" />
        </div>
        <h2 className="av-title">
          <span className="av-title--main">ShriKrishna</span>
          <span className="av-title--sub">SteelWorks</span>
        </h2>
        <div className="av-badge">
          <span className="av-badge-dot" />Customer Portal
        </div>
        <p className="av-tagline">India's trusted industrial steel supply partner</p>
      </div>
      <div className="av-stats">
        {[{ n: "25+", l: "Years" }, { n: "200+", l: "Projects" }, { n: "6", l: "Districts" }, { n: "ISO", l: "Certified" }].map((s, i) => (
          <div key={s.l} className="av-stat" style={{ animationDelay: `${0.6 + i * 0.12}s` }}>
            <span className="av-stat-n">{s.n}</span><span className="av-stat-l">{s.l}</span>
          </div>
        ))}
      </div>
      <div className="av-corner av-corner--tl" aria-hidden><div /><div /><div /></div>
      <div className="av-corner av-corner--br" aria-hidden><div /><div /><div /></div>
      <span className="av-accent av-accent--1" aria-hidden>✦</span>
      <span className="av-accent av-accent--2" aria-hidden>◆</span>
      <span className="av-accent av-accent--3" aria-hidden>✦</span>
    </div>
  );
}

// ── Form input component ───────────────────────────────────────────────────────
function AuthInput({
  label, id, type = "text", placeholder, value, onChange, error, autoComplete, icon,
}: {
  label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  error?: string; autoComplete?: string; icon: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass = type === "password";
  return (
    <div className={["af-field", focused ? "af-field--focus" : "", error ? "af-field--error" : "", value ? "af-field--filled" : ""].join(" ").trim()}>
      <label htmlFor={id} className="af-label">{label}</label>
      <div className="af-wrap">
        <span className="af-icon" aria-hidden>{icon}</span>
        <input
          id={id} type={isPass ? (showPass ? "text" : "password") : type}
          placeholder={placeholder} value={value} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="af-input"
        />
        {isPass && (
          <button type="button" className="af-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
            {showPass
              ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            }
          </button>
        )}
        <div className="af-underline" />
      </div>
      {error && <p className="af-err" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 14h-1v-4h2v4h-1zm0 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" /></svg>{error}</p>}
    </div>
  );
}

// ── Password strength meter ────────────────────────────────────────────────────
function StrengthMeter({ pw }: { pw: string }) {
  const rules = [
    { ok: pw.length >= 6, label: "6+ chars" }, { ok: /[A-Z]/.test(pw), label: "Uppercase" },
    { ok: /[0-9]/.test(pw), label: "Number" }, { ok: /[^A-Za-z0-9]/.test(pw), label: "Symbol" },
  ];
  const score = rules.filter(r => r.ok).length;
  const info = score === 0 ? { label: "", color: "transparent" } : score === 1 ? { label: "Weak", color: "#EF4444" } :
    score === 2 ? { label: "Fair", color: "#F97316" } : score === 3 ? { label: "Good", color: "#EAB308" } : { label: "Strong", color: "#4ADE80" };
  return (
    <div className="auth-strength">
      <div className="as-bars">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="as-bar" style={{ background: n <= score ? info.color : "rgba(255,255,255,0.07)", transition: `background 0.3s ${n * 0.06}s` }} />
        ))}
        {score > 0 && <span className="as-label" style={{ color: info.color }}>{info.label}</span>}
      </div>
      <div className="as-rules">
        {rules.map(r => <span key={r.label} className={`as-rule ${r.ok ? "as-rule--ok" : ""}`}>{r.ok ? "✓" : "·"} {r.label}</span>)}
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: "fixed", top: "24px", right: "24px", zIndex: 9999,
      background: "linear-gradient(135deg, #1a2e1a, #2d4a2d)",
      border: "1px solid #4ADE80", borderRadius: "12px",
      padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px",
      color: "#fff", fontSize: "14px", fontWeight: 600,
      boxShadow: "0 8px 32px rgba(74,222,128,0.25)",
      animation: "slideIn 0.3s ease",
    }}>
      <span style={{ fontSize: "18px" }}>✅</span>
      {message}
    </div>
  );
}

// ── Main Auth Component ────────────────────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate();
  const { isAdmin, user, loading } = useAuth();

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? "/admin/dashboard" : "/", { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  const [mode, setMode] = useState<Mode>("login");
  const [flip, setFlip] = useState(false);
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalErr, setGlobalErr] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => { setErrors({}); setGlobalErr(""); }, [name, email, password, confirmPw]);

  const clearForm = useCallback(() => {
    setName(""); setCompany(""); setEmail(""); setPassword(""); setConfirmPw("");
    setErrors({}); setGlobalErr("");
  }, []);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setFlip(true);
    setTimeout(() => { setMode(m); clearForm(); setFlip(false); }, 250);
  };

  const showToast = (msg: string) => setToast(msg);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register" && !name.trim()) e.name = "Name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    if (mode === "register" && password !== confirmPw) e.confirmPw = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setAuthLoading(true); setGlobalErr("");
    try {
      if (mode === "register") {
        await signUp(email, password, name, "user");
        showToast("Account created! Welcome to ShriKrishna SteelWorks ✨");
        // Redirect happens via the useEffect watching user + isAdmin
      } else {
        await signIn(email, password);
        showToast("Login successful! Welcome back 🎉");
        // Redirect happens via the useEffect watching user + isAdmin
      }
    } catch (err: unknown) {
      const c = typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: string }).code ?? "")
        : "";
      const msg =
        c === "auth/user-not-found" ? "No account found with this email" :
          c === "auth/wrong-password" ? "Incorrect password" :
            c === "auth/email-already-in-use" ? "Email already registered" :
              c === "auth/too-many-requests" ? "Too many attempts — try again later" :
                c === "auth/invalid-credential" ? "Invalid email or password" :
                  c === "auth/weak-password" ? "Password is too weak (min 6 chars)" :
                    "Login failed. Please try again.";
      setGlobalErr(msg);
      showToast("❌ " + msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      showToast("Login successful! Welcome back 🎉");
    } catch (error: unknown) {
      const c = typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code ?? "")
        : "";
      setGlobalErr(
        c === "auth/popup-closed-by-user" ? "Sign-in popup was closed. Try again." :
          c === "auth/popup-blocked" ? "Popup blocked. Please allow popups." :
            "Google login failed. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetBusy(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch {
      setGlobalErr("Could not send reset email. Check the address.");
    } finally {
      setResetBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className="auth-page">
      {toast && <Toast message={toast} onDone={() => setToast("")} />}
      <ParticleCanvas />

      <div className="auth-blobs" aria-hidden>
        <div className="auth-blob auth-blob--1" />
        <div className="auth-blob auth-blob--2" />
        <div className="auth-blob auth-blob--3" />
      </div>

      <div className="auth-layout">
        <VisualPanel />

        <div className="auth-panel">
          <div className={`auth-card ${flip ? "auth-card--exit" : "auth-card--enter"}`}>
            <div className="auth-card-glow" />

            {/* Mode tabs: Sign In / Register */}
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`} onClick={() => switchMode("login")}>Sign In</button>
              <button className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`} onClick={() => switchMode("register")}>Register</button>
              <div className={`auth-tab-pill ${mode === "register" ? "auth-tab-pill--right" : ""}`} />
            </div>

            <div className="auth-head">
              <div className="auth-head-icon">
                {mode === "login"
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                }
              </div>
              <h1 className="auth-title">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="auth-subtitle">
                {mode === "login"
                  ? "Sign in to your ShriKrishna account"
                  : "Join and manage your steel projects"}
              </p>
            </div>

            {showReset ? (
              <div className="auth-reset">
                <button className="auth-reset-back" onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(""); }}>← Back to sign in</button>
                {resetSent ? (
                  <div className="auth-reset-done">
                    <div className="auth-reset-done-ring">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h3>Check your inbox</h3>
                    <p>We sent a reset link to <strong>{resetEmail}</strong></p>
                    <span>Also check your spam folder.</span>
                  </div>
                ) : (
                  <form onSubmit={handleReset} noValidate>
                    <p className="auth-reset-info">Enter your email and we'll send a password reset link.</p>
                    <AuthInput label="Email Address" id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={setResetEmail} icon="✉" />
                    <button type="submit" className="auth-btn" disabled={resetBusy}>
                      {resetBusy ? <span className="auth-spin" /> : "Send Reset Link"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {globalErr && (
                  <div className="auth-alert auth-alert--err" role="alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 14v-4m0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" /></svg>
                    {globalErr}
                  </div>
                )}

                {mode === "register" && <AuthInput label="Full Name" id="a-name" placeholder="Rajesh Sharma" value={name} onChange={setName} error={errors.name} autoComplete="name" icon="👤" />}
                {mode === "register" && <AuthInput label="Company (optional)" id="a-company" placeholder="ABC Constructions Pvt. Ltd." value={company} onChange={setCompany} autoComplete="organization" icon="🏢" />}
                <AuthInput label="Email Address" id="a-email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} error={errors.email} autoComplete="email" icon="✉" />
                <AuthInput label="Password" id="a-password" type="password" placeholder="Minimum 6 characters" value={password} onChange={setPassword} error={errors.password} autoComplete={mode === "login" ? "current-password" : "new-password"} icon="🔒" />
                {mode === "register" && password.length > 0 && <StrengthMeter pw={password} />}
                {mode === "register" && <AuthInput label="Confirm Password" id="a-confirm" type="password" placeholder="Repeat your password" value={confirmPw} onChange={setConfirmPw} error={errors.confirmPw} autoComplete="new-password" icon="🔒" />}

                {mode === "login" && (
                  <button type="button" className="auth-forgot" onClick={() => { setShowReset(true); setResetEmail(email); }}>Forgot password?</button>
                )}

                <button type="submit" disabled={authLoading} className={`auth-btn ${authLoading ? "auth-btn--loading" : ""}`}>
                  {authLoading ? <><span className="auth-spin" /> Processing…</> : <>{mode === "login" ? "Sign In" : "Create Account"} <span className="auth-btn-arrow">→</span></>}
                </button>

                <div className="auth-or"><span>or</span></div>
                <button type="button" className="auth-google" onClick={handleGoogle} disabled={authLoading}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.45 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </form>
            )}
          </div>

          <p className="auth-footer">🔒 Protected by Firebase Authentication · 256-bit SSL</p>
        </div>
      </div>
    </div>
  );
}