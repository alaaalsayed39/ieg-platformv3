import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Globe, Menu, X } from "lucide-react";

const C = {
  navyDark: "#0d1b3e",
  gold: "#f5b400",
  goldHover: "#e0a200",
};

const links = [
  { label: "Home",      to: "/" },
  { label: "Services",  to: "/services" },
  { label: "Exporters", to: "/auth/register" },
  { label: "Buyers",    to: "/auth/register" },
  { label: "Pricing",   to: "/pricing" },
  { label: "About Us",  to: "/about" },
  { label: "Contact",   to: "/contact" },
];

export default function PublicNavbar({ activeSection = "" }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 999,
      background: C.navyDark,
      backdropFilter: "blur(20px)",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
      boxShadow: scrolled ? "0 2px 28px rgba(0,0,0,0.28)" : "none",
      transition: "all 0.3s ease",
    }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70 }}>

        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "linear-gradient(135deg,#f5b400,#e0a200)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(245,180,0,0.35)" }}>
            <Globe size={20} color={C.navyDark} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ color: C.gold, fontFamily: "Inter", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", lineHeight: 1 }}>IEG</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter", fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 1 }}>International Export Gateway</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2 }} className="nav-desktop">
          {links.map((l) => (
            <NavLinkItem key={l.label} to={l.to} active={activeSection === l.label}>
              {l.label}
            </NavLinkItem>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="nav-desktop">
          <button onClick={() => navigate("/auth/login")}
            style={{ background: "transparent", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 8, padding: "8px 22px", fontFamily: "Inter", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
          >Login</button>
          <button onClick={() => navigate("/auth/register")}
            style={{ background: C.gold, color: C.navyDark, border: "none", borderRadius: 8, padding: "9px 22px", fontFamily: "Inter", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 14px rgba(245,180,0,0.38)", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.goldHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
          >Get Started</button>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setMobile(m => !m)} className="mobile-menu-btn"
          style={{ display: "none", background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 6 }}>
          {mobile ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobile && (
        <div style={{ background: "#0a1628", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 24px 20px" }}>
          {links.map((l) => (
            <a key={l.label} href={l.to} onClick={() => { setMobile(false); navigate(l.to); }}
              style={{ display: "block", color: "rgba(255,255,255,0.78)", fontFamily: "Inter", fontWeight: 500, fontSize: 15, padding: "11px 0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {l.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button onClick={() => navigate("/auth/login")} style={{ flex: 1, border: "1px solid rgba(255,255,255,0.2)", background: "none", color: "#fff", borderRadius: 8, padding: "11px 0", fontFamily: "Inter", fontWeight: 600, cursor: "pointer" }}>Login</button>
            <button onClick={() => navigate("/auth/register")} style={{ flex: 1, background: C.gold, color: C.navyDark, border: "none", borderRadius: 8, padding: "11px 0", fontFamily: "Inter", fontWeight: 700, cursor: "pointer" }}>Get Started</button>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLinkItem({ children, active, to }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  return (
    <a href={to} onClick={e => { e.preventDefault(); navigate(to); }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ color: active ? C.gold : hov ? "#fff" : "rgba(255,255,255,0.75)", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, padding: "6px 14px", borderRadius: 6, textDecoration: "none", transition: "all 0.18s", borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent", display: "inline-block", letterSpacing: "0.01em" }}>
      {children}
    </a>
  );
}