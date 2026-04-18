// src/components/layout/Navbar.tsx
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/SK-logo.png";
import { useAuth } from "../../context/AuthContext";
import { logOut } from "../../services/firebase";

export default function Navbar() {
const [scrolled, setScrolled] = useState(false);
const [menuOpen, setMenuOpen] = useState(false);
const [dropdownOpen, setDropdown] = useState(false);
const [cartCount] = useState(0);
  const dropdownRef                   = useRef<HTMLDivElement>(null);
  const { user, profile, isAdmin }    = useAuth();
  const navigate                      = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdown(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    await logOut();
    setDropdown(false);
    navigate("/");
  };

  const allNavLinks = [
    { to: "/",         label: "Home"     },
    { to: "/about",    label: "About"    },
    { to: "/projects", label: "Projects" },
    { to: "/products", label: "Products" },
    { to: "/contact",  label: "Contact"  },
  ];
  const navLinks = allNavLinks;

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const displayName = profile?.name ?? user?.displayName ?? "User";

  // Dropdown menu items
  const dropdownItems = [
    ...(isAdmin ? [
      { label: "🛡  Admin Panel", path: "/admin/dashboard" },
      { label: "📊  Analytics BI", path: "/admin/analytics" },
      { label: "🧠  AI/ML Lab", path: "/admin/ai-ml" },
    ] : []),
    { label: "⊞  Dashboard",  path: "/dashboard"           },
    { label: "👤  My Profile", path: "/dashboard#profile"   },
    { label: "⚙  Settings",   path: "/dashboard#settings"  },
  ];

  return (
    <>
      <style>{`
        .skw-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          background: rgba(10,15,10,0.96); border: 1px solid rgba(212,160,23,0.2);
          border-radius: 14px; min-width: 210px; z-index: 9999;
          overflow: hidden; backdrop-filter: blur(20px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,160,23,0.05);
          animation: ddFade .18s ease;
        }
        @keyframes ddFade {
          from { opacity:0; transform:translateY(-8px) scale(.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);   }
        }
        .skw-dd-header {
          padding: 14px 16px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .skw-dd-name  { font-weight: 700; font-size: 14px; color: #fff; margin: 0 0 2px; }
        .skw-dd-email { font-size: 11px; color: #666; margin: 0; word-break: break-all; }
        .skw-dd-item {
          display: flex; align-items: center; gap: 4px;
          padding: 11px 16px; font-size: 13.5px; color: #aaa;
          text-decoration: none; background: none; border: none;
          width: 100%; text-align: left; cursor: pointer;
          transition: background .15s, color .15s; font-family: inherit;
        }
        .skw-dd-item:hover { background: rgba(212,160,23,0.08); color: #d4a017; }
        .skw-dd-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0; }
        .skw-dd-logout { color: #F87171 !important; }
        .skw-dd-logout:hover { background: rgba(248,113,113,0.08) !important; }
      `}</style>

      <nav className={`skw-nav ${scrolled ? "skw-nav-scrolled" : ""}`}>
        {/* Logo */}
        <Link to="/" className="skw-nav-logo">
          <img src={logo} alt="ShriKrishna SteelWorks" className="h-12 w-auto object-contain" />
          <div className="skw-logo-text">
            <span className="skw-logo-main">ShriKrishna</span>
            <span className="skw-logo-sub">SteelWorks</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="skw-nav-links">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}
              className={({ isActive }) => `skw-nav-link ${isActive ? "skw-nav-active" : ""}`}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right Actions */}
        <div className="skw-nav-actions">


          {user ? (
            <div className="skw-user-menu" ref={dropdownRef} style={{ position:"relative" }}>
              {/* Avatar button */}
              <button className="skw-avatar-btn" onClick={() => setDropdown(!dropdownOpen)}>
                {user.photoURL
                  ? <img src={user.photoURL} alt={displayName} className="skw-avatar-img" />
                  : <div className="skw-avatar-initials">{getInitials(displayName)}</div>
                }
                <span className="skw-avatar-name">{displayName.split(" ")[0]}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transition:"transform .2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="skw-dropdown">
                  {/* Header */}
                  <div className="skw-dd-header">
                    <p className="skw-dd-name">{displayName}</p>
                    <p className="skw-dd-email">{user.email}</p>
                  </div>

                  {/* Nav items */}
                  {dropdownItems.map(item => (
                    <button key={item.path} className="skw-dd-item"
                      onClick={() => { navigate(item.path); setDropdown(false); }}>
                      {item.label}
                    </button>
                  ))}

                  <hr className="skw-dd-divider" />

                  {/* Logout */}
                  <button className="skw-dd-item skw-dd-logout" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      style={{ marginRight:"4px" }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="skw-login-btn">Login</Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="skw-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={menuOpen ? "skw-ham-open" : ""} />
          <span className={menuOpen ? "skw-ham-open" : ""} />
          <span className={menuOpen ? "skw-ham-open" : ""} />
        </button>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="skw-mobile-menu">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} className="skw-mobile-link"
                onClick={() => setMenuOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="skw-mobile-actions">

              {user ? (
                <>
                  {dropdownItems.map(item => (
                    <button key={item.path} className="skw-mobile-link"
                      style={{ background:"none", border:"none", color:"inherit", cursor:"pointer",
                        textAlign:"left", padding:"10px 0", fontSize:"14px", width:"100%" }}
                      onClick={() => { navigate(item.path); setMenuOpen(false); }}>
                      {item.label}
                    </button>
                  ))}
                  <button className="skw-btn-primary"
                    onClick={() => { handleLogout(); setMenuOpen(false); }}>
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="skw-btn-primary" onClick={() => setMenuOpen(false)}>Login</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}