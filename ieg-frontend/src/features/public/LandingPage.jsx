import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Star,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Users,
  Clock,
  Building2,
  Package,
  Ship,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import api from "../../config/api";

/* ─── DESIGN TOKENS ──────────────────────────────────────────────────────── */
const C = {
  navyDark: "#0d1b3e",
  navyMid: "#1a2340",
  navyLight: "#1a2f6e",
  gold: "#f5b400",
  goldHover: "#e0a200",
  bgPage: "#f8f9fc",
  white: "#ffffff",
  textDark: "#1a2340",
  textGray: "#666666",
  textMuted: "#999999",
  border: "#edf0f7",
  borderLight: "#f0f2f7",
  success: "#22c55e",
};

/* ─── ANIMATED COUNTER ───────────────────────────────────────────────────── */
function AnimCounter({ end, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const numEnd = parseInt(String(end).replace(/\D/g, "")) || 0;
          const step = numEnd / (duration / 16);
          let cur = 0;
          const timer = setInterval(() => {
            cur = Math.min(cur + step, numEnd);
            setVal(Math.floor(cur));
            if (cur >= numEnd) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── NAV LINK ───────────────────────────────────────────────────────────── */
function NavLinkItem({ children, active, to, hash = "" }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    if (hash) {
      // same page scroll or navigate then scroll
      navigate(to);
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      navigate(to);
    }
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        color: active ? C.gold : hov ? "#fff" : "rgba(255,255,255,0.75)",
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        fontSize: 14,
        padding: "6px 14px",
        borderRadius: 6,
        textDecoration: "none",
        transition: "all 0.18s",
        borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
        display: "inline-block",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </a>
  );
}

/* ─── SECTION HEADING ─────────────────────────────────────────────────────── */
function SectionHeading({ title, subtitle, light = false }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <h2
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: "clamp(26px, 3vw, 36px)",
          color: light ? "#fff" : C.textDark,
          margin: "0 0 14px",
          letterSpacing: "-0.5px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: 48,
          height: 3,
          background: C.gold,
          borderRadius: 2,
          margin: "0 auto 16px",
        }}
      />
      {subtitle && (
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            color: light ? "rgba(255,255,255,0.65)" : C.textGray,
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.65,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ─── NAVBAR ──────────────────────────────────────────────────────────────── */
function Navbar({ activeSection }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

const links = [
  { label: "Home",      to: "/",                  hash: "#hero" },
  { label: "Services",  to: "/services" },
{ label: "Exporters", to: "/auth/register" },
{ label: "Buyers", to: "/auth/register" },
  { label: "Pricing",   to: "/pricing" },
  { label: "About Us",  to: "/about" },
  { label: "Contact",   to: "/contact" },
];
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        background: C.navyDark,
        backdropFilter: "blur(20px)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        boxShadow: scrolled ? "0 2px 28px rgba(0,0,0,0.28)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 70,
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              background: "linear-gradient(135deg,#f5b400,#e0a200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 12px rgba(245,180,0,0.35)",
            }}
          >
            <Globe size={20} color={C.navyDark} strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                color: C.gold,
                fontFamily: "Inter",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              IEG
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontFamily: "Inter",
                fontSize: 9,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                marginTop: 1,
              }}
            >
              International Export Gateway
            </div>
          </div>
        </Link>

        {/* Desktop links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 2 }}
          className="nav-desktop"
        >
          {links.map((l) => (
            <NavLinkItem
              key={l.label}
              to={l.to}
              hash={l.hash}
              active={activeSection === l.label}
            >
              {l.label}
            </NavLinkItem>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 10 }}
          className="nav-desktop"
        >
          <button
            onClick={() => navigate("/auth/login")}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 8,
              padding: "8px 22px",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.09)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
            }}
          >
            Login
          </button>

          <button
            onClick={() => navigate("/auth/register")}
            style={{
              background: C.gold,
              color: C.navyDark,
              border: "none",
              borderRadius: 8,
              padding: "9px 22px",
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 2px 14px rgba(245,180,0,0.38)",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.goldHover;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 22px rgba(245,180,0,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.gold;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow =
                "0 2px 14px rgba(245,180,0,0.38)";
            }}
          >
            Get Started
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobile((m) => !m)}
          className="mobile-menu-btn"
          style={{
            display: "none",
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            padding: 6,
          }}
        >
          {mobile ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobile && (
        <div
          style={{
            background: "#0a1628",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "12px 24px 20px",
          }}
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.to}
              onClick={(e) => {
                e.preventDefault();
                setMobile(false);
                if (l.hash) {
                  navigate(l.to);
                  setTimeout(() => {
                    const el = document.querySelector(l.hash);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }, 120);
                } else {
                  navigate(l.to);
                }
              }}
              style={{
                display: "block",
                color: "rgba(255,255,255,0.78)",
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: 15,
                padding: "11px 0",
                textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              onClick={() => navigate("/auth/login")}
              style={{
                flex: 1,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "none",
                color: "#fff",
                borderRadius: 8,
                padding: "11px 0",
                fontFamily: "Inter",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/auth/register")}
              style={{
                flex: 1,
                background: C.gold,
                color: C.navyDark,
                border: "none",
                borderRadius: 8,
                padding: "11px 0",
                fontFamily: "Inter",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ────────────────────────────────────────────────────────────────── */
function Hero({ platformStats }) {
  const navigate = useNavigate();

  const stats = [
    {
      icon: Users,
      value: platformStats?.exporters || 10000,
      suffix: "+",
      label: "Exporters",
    },
    {
      icon: Globe,
      value: platformStats?.countries || 75,
      suffix: "+",
      label: "Countries",
    },
    {
      icon: Clock,
      value: "24/7",
      suffix: "",
      label: "Smart Support",
      isText: true,
    },
  ];

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: 580,
        background: C.navyDark,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Ship photo — right portion */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "65% center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* World-map dot overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: "50% 50%",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
        }}
      />

      {/* Gradient: left=solid navy, right=transparent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(100deg, #0d1b3e 0%, #0d1b3e 35%, rgba(13,27,62,0.93) 52%, rgba(13,27,62,0.6) 68%, rgba(13,27,62,0.18) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1240,
          margin: "0 auto",
          padding: "64px 24px",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(245,180,0,0.13)",
              border: "1px solid rgba(245,180,0,0.38)",
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.gold,
                boxShadow: `0 0 8px ${C.gold}`,
              }}
            />
            <span
              style={{
                color: C.gold,
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.05em",
              }}
            >
              Egypt's Official Export Platform
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              margin: "0 0 20px",
              letterSpacing: "-1.5px",
              lineHeight: 1.03,
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(38px, 5.8vw, 64px)",
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              Connect Egypt
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(38px, 5.8vw, 64px)",
                color: C.gold,
                textTransform: "uppercase",
              }}
            >
              To Global Markets
            </div>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.72)",
              fontFamily: "Inter",
              fontSize: "clamp(14px, 1.6vw, 17px)",
              lineHeight: 1.65,
              maxWidth: 460,
              margin: "0 0 36px",
            }}
          >
            One smart platform connecting exporters, buyers, logistics
            providers, customs, and global opportunities.
          </p>

          {/* CTA row */}
          <div
            className="hero-btns"
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 52,
            }}
          >
            <button
              onClick={() => navigate("/auth/register")}
              style={{
                background: C.gold,
                color: C.navyDark,
                border: "none",
                borderRadius: 8,
                padding: "14px 28px",
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 20px rgba(245,180,0,0.42)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.goldHover;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.gold;
                e.currentTarget.style.transform = "none";
              }}
            >
              Start Exporting <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate("/buyer/marketplace")}
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.35)",
                borderRadius: 8,
                padding: "14px 28px",
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                backdropFilter: "blur(8px)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              }}
            >
              Explore Suppliers <ArrowRight size={16} />
            </button>
          </div>

          {/* Stats */}
          <div
            className="hero-stats"
            style={{ display: "flex", gap: 36, flexWrap: "wrap" }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 11,
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <s.icon size={19} color="rgba(255,255,255,0.72)" />
                </div>
                <div>
                  <div
                    style={{
                      color: "#fff",
                      fontFamily: "Inter",
                      fontWeight: 900,
                      fontSize: 21,
                      lineHeight: 1,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {s.isText ? (
                      s.value
                    ) : (
                      <AnimCounter end={s.value} suffix={s.suffix} />
                    )}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: "Inter",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PARTNERS ────────────────────────────────────────────────────────────── */
function Partners() {
  const partners = [
    {
      key: "nbe",
      render: () => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 11,
              color: "#1a6b1a",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            البنك الأهلي المصري
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 12,
              color: "#1a6b1a",
              letterSpacing: "0.05em",
              marginTop: 3,
            }}
          >
            NATIONAL BANK OF EGYPT
          </div>
        </div>
      ),
    },
    {
      key: "egyptair",
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: "#00205b",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: "#fff",
                fontFamily: "Inter",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              ✈
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "Inter",
                fontWeight: 900,
                fontSize: 13,
                color: "#00205b",
                letterSpacing: "-0.3px",
              }}
            >
              EGYPTAIR
            </div>
            <div
              style={{
                fontFamily: "Inter",
                fontSize: 8,
                color: "#666",
                letterSpacing: "0.06em",
              }}
            >
              A STAR ALLIANCE MEMBER
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "maersk",
      render: () => (
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#0082c8",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontFamily: "Inter",
                fontWeight: 900,
                fontSize: 18,
              }}
            >
              ✦
            </span>
          </div>
          <span
            style={{
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 18,
              color: "#333",
              letterSpacing: "-0.5px",
            }}
          >
            MAERSK
          </span>
        </div>
      ),
    },
    {
      key: "mti",
      render: () => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 12,
              color: "#8b0000",
              lineHeight: 1.3,
            }}
          >
            Ministry of
            <br />
            Trade &amp; Industry
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 4,
              gap: 2,
            }}
          >
            {["#cc0000", "#fff", "#000"].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 16,
                  background: c,
                  border: c === "#fff" ? "1px solid #ddd" : "none",
                }}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "fedcoc",
      render: () => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 14,
              color: "#0d1b3e",
              letterSpacing: "-0.3px",
            }}
          >
            FEDCOC
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontSize: 9,
              color: "#666",
              letterSpacing: "0.04em",
              marginTop: 2,
            }}
          >
            Federation of Egyptian
            <br />
            Chamber of Commerce
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      style={{
        background: "#fff",
        borderTop: "1px solid #f0f0f0",
        borderBottom: "1px solid #f0f0f0",
        padding: "32px 0",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        {/* Divider label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
          <span
            style={{
              color: "#aaa",
              fontFamily: "Inter",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Trusted By Our Partners
          </span>
          <div style={{ flex: 1, height: 1, background: "#e8e8e8" }} />
        </div>

        <div
          className="partner-logos"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            flexWrap: "wrap",
          }}
        >
          {partners.map((p, i) => (
            <div
              key={p.key}
              style={{
                flex: "1 1 170px",
                minWidth: 130,
                maxWidth: 230,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 18px",
                height: 68,
                borderRight:
                  i < partners.length - 1 ? "1px solid #f0f2f7" : "none",
                transition: "opacity 0.2s",
                opacity: 0.82,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.82")}
            >
              {p.render()}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── WHY CHOOSE IEG ──────────────────────────────────────────────────────── */
function WhyChooseIEG() {
  const features = [
    {
      icon: Zap,
      title: "Faster Export Process",
      desc: "Digital procedures and smart automation to reduce time and speed up your exports.",
    },
    {
      icon: Shield,
      title: "Secure Transactions",
      desc: "End-to-end secure platform with verified companies and safe payments.",
    },
    {
      icon: Globe,
      title: "Reach Global Buyers",
      desc: "Connect with thousands of verified buyers from around the world.",
    },
  ];

  return (
    <section
      id="why-choose"
      style={{ background: C.bgPage, padding: "84px 0" }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <SectionHeading title="Why Choose IEG?" />

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {features.map((f, i) => {
            const [hov, setHov] = useState(false);
            return (
              <div
                key={f.title}
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "36px 30px",
                  border: `1px solid ${hov ? "#c8d4ec" : C.border}`,
                  boxShadow: hov
                    ? "0 10px 36px rgba(13,27,62,0.13)"
                    : "0 2px 14px rgba(13,27,62,0.055)",
                  transition: "all 0.26s ease",
                  transform: hov ? "translateY(-5px)" : "none",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: C.navyDark,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: hov ? `0 6px 20px rgba(13,27,62,0.35)` : "none",
                    transition: "box-shadow 0.26s",
                  }}
                >
                  <f.icon size={28} color={C.gold} strokeWidth={1.8} />
                </div>
                <h3
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 700,
                    fontSize: 19,
                    color: C.textDark,
                    margin: "0 0 12px",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: 14,
                    color: C.textGray,
                    lineHeight: 1.68,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: "1",
      icon: Building2,
      title: "Register Company",
      desc: "Create your company profile in minutes.",
    },
    {
      num: "2",
      icon: Package,
      title: "Upload Products",
      desc: "Add your products and specifications.",
    },
    {
      num: "3",
      icon: Users,
      title: "Get Buyers",
      desc: "Receive inquiries and quotes from buyers.",
    },
    {
      num: "4",
      icon: Ship,
      title: "Ship Worldwide",
      desc: "Complete orders and ship globally.",
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{ background: "#fff", padding: "84px 0" }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <SectionHeading title="How It Works" />

        <div
          className="steps-row"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            flexWrap: "nowrap",
            overflowX: "auto",
            gap: 0,
            paddingBottom: 8,
          }}
        >
          {steps.map((step, i) => (
            <div
              key={step.num}
              style={{
                display: "flex",
                alignItems: "flex-start",
                flexShrink: 0,
              }}
            >
              {/* Card */}
              <div
                style={{ textAlign: "center", width: 190, padding: "0 10px" }}
              >
                {/* Number bubble */}
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "linear-gradient(145deg, #0d1b3e, #1a2f6e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                    boxShadow: "0 4px 18px rgba(13,27,62,0.28)",
                  }}
                >
                  <span
                    style={{
                      color: C.gold,
                      fontFamily: "Inter",
                      fontWeight: 900,
                      fontSize: 24,
                      lineHeight: 1,
                    }}
                  >
                    {step.num}
                  </span>
                </div>

                {/* Icon badge */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: "#f0f4ff",
                    border: "1.5px solid #d4ddf0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <step.icon size={22} color={C.navyDark} />
                </div>

                <h4
                  style={{
                    fontFamily: "Inter",
                    fontWeight: 700,
                    fontSize: 15,
                    color: C.textDark,
                    margin: "0 0 8px",
                  }}
                >
                  {step.title}
                </h4>
                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: 13,
                    color: "#888",
                    lineHeight: 1.58,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>

              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <div
                  className="steps-arrow"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingTop: 28,
                    margin: "0 4px",
                    flexShrink: 0,
                  }}
                >
                  <ArrowRight size={24} color="#cbd5e0" strokeWidth={2} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── ANALYTICS ───────────────────────────────────────────────────────────── */
function Analytics({ dashStats }) {
  const navigate = useNavigate();

  const metrics = [
    {
      label: "Total Orders",
      value: dashStats?.totalOrders || "2,350",
      delta: "+10.3%",
    },
    {
      label: "Revenue",
      value: dashStats?.revenue || "$5.48M",
      delta: "+18.9%",
    },
    {
      label: "Active Buyers",
      value: dashStats?.buyers || "1,320",
      delta: "+9.4%",
    },
    { label: "Countries", value: dashStats?.countries || "75", delta: "+6.3%" },
  ];

  const topCountries = [
    { name: "Saudi Arabia", pct: 25 },
    { name: "United States", pct: 20 },
    { name: "United Kingdom", pct: 18 },
    { name: "Germany", pct: 15 },
    { name: "UAE", pct: 9 },
  ];

  /* tiny line-chart path */
  const chartPath =
    "M0 44 C15 40 25 34 40 28 C55 22 70 40 85 32 C100 24 115 12 130 16 C145 20 160 14 175 8 C185 4 195 6 200 4";

  return (
    <section id="analytics" style={{ background: C.bgPage, padding: "84px 0" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <div
          className="analytics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.55fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Left copy */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 2.5,
                  background: C.gold,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  color: C.gold,
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Live Analytics
              </span>
            </div>

            <h2
              style={{
                fontFamily: "Inter",
                fontWeight: 900,
                fontSize: "clamp(28px,3.6vw,46px)",
                color: C.textDark,
                lineHeight: 1.1,
                margin: "0 0 20px",
                letterSpacing: "-1px",
              }}
            >
              Your Business,
              <br />
              <span style={{ color: C.navyLight }}>In Real Time</span>
            </h2>

            <p
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                color: C.textGray,
                lineHeight: 1.72,
                margin: "0 0 32px",
                maxWidth: 350,
              }}
            >
              Track orders, revenue, and global performance from your dashboard.
            </p>

            <button
              onClick={() => navigate("/auth/register")}
              style={{
                background: C.navyDark,
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "13px 26px",
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 18px rgba(13,27,62,0.25)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.navyLight;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.navyDark;
                e.currentTarget.style.transform = "none";
              }}
            >
              Explore Dashboard <ArrowRight size={16} />
            </button>
          </div>

          {/* Right dashboard mockup */}
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 10px 52px rgba(13,27,62,0.14)",
              border: `1px solid #e4e8f4`,
            }}
          >
            {/* Topbar */}
            <div
              style={{
                background: C.navyDark,
                padding: "13px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Sidebar dots */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  "Dashboard",
                  "Orders",
                  "Products",
                  "Buyers",
                  "Documents",
                  "Payments",
                  "Reports",
                  "Settings",
                ].map((item, i) => (
                  <div
                    key={item}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: i === 0 ? C.gold : "rgba(255,255,255,0.18)",
                      }}
                    />
                    <span
                      style={{
                        color: i === 0 ? C.gold : "rgba(255,255,255,0.25)",
                        fontFamily: "Inter",
                        fontSize: 8,
                        fontWeight: i === 0 ? 700 : 400,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 56,
                  background: "rgba(255,255,255,0.08)",
                }}
              />

              {/* Header text */}
              <div>
                <div
                  style={{
                    color: "#fff",
                    fontFamily: "Inter",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Dashboard
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: "Inter",
                    fontSize: 10,
                  }}
                >
                  IEG Platform — Export Analytics
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "14px 16px", background: "#f8f9fc" }}>
              {/* Metrics row */}
              <div
                className="dashboard-metrics"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      background: "#fff",
                      borderRadius: 10,
                      padding: "10px 12px",
                      border: `1px solid ${C.border}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        color: "#aaa",
                        fontFamily: "Inter",
                        fontSize: 9,
                        marginBottom: 4,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        color: C.textDark,
                        fontFamily: "Inter",
                        fontWeight: 800,
                        fontSize: 15,
                        letterSpacing: "-0.5px",
                      }}
                    >
                      {m.value}
                    </div>
                    <div
                      style={{
                        color: C.success,
                        fontFamily: "Inter",
                        fontSize: 9,
                        fontWeight: 700,
                        marginTop: 2,
                      }}
                    >
                      {m.delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.25fr 1fr",
                  gap: 10,
                }}
              >
                {/* Revenue chart */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 11,
                    padding: "12px 14px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: C.textDark,
                          fontFamily: "Inter",
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        Revenue Overview
                      </div>
                      <div
                        style={{
                          color: "#bbb",
                          fontFamily: "Inter",
                          fontSize: 9,
                        }}
                      >
                        This Month
                      </div>
                    </div>
                    <BarChart3 size={14} color="#ccc" />
                  </div>
                  <svg
                    width="100%"
                    height="64"
                    viewBox="0 0 200 54"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="revGrd" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#0d1b3e"
                          stopOpacity="0.16"
                        />
                        <stop
                          offset="100%"
                          stopColor="#0d1b3e"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d={`${chartPath} L200 54 L0 54 Z`}
                      fill="url(#revGrd)"
                    />
                    <path
                      d={chartPath}
                      stroke="#0d1b3e"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Top countries */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 11,
                    padding: "12px 14px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      color: C.textDark,
                      fontFamily: "Inter",
                      fontWeight: 700,
                      fontSize: 12,
                      marginBottom: 10,
                    }}
                  >
                    Top Countries
                  </div>
                  {topCountries.map((c) => (
                    <div key={c.name} style={{ marginBottom: 7 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Inter",
                            fontSize: 10,
                            color: "#555",
                          }}
                        >
                          {c.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "Inter",
                            fontSize: 10,
                            color: C.navyDark,
                            fontWeight: 700,
                          }}
                        >
                          {c.pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: "#eff1f7",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(c.pct / 25) * 100}%`,
                            background: `linear-gradient(90deg, #0d1b3e, #1a2f6e)`,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ────────────────────────────────────────────────────────── */
function Testimonials() {
  const [active, setActive] = useState(0);

  const items = [
    {
      quote:
        '"IEG helped us reach new markets and grow our exports significantly."',
      name: "Ahmed El Mansouty",
      title: "CEO, Agro Export",
      avatar: "A",
      bg: "#0d1b3e",
      stars: 5,
    },
    {
      quote: '"The platform is easy to use and the support is excellent."',
      name: "Sara Khaled",
      title: "Export Manager, Textiles Co.",
      avatar: "S",
      bg: "#1a2f6e",
      stars: 5,
    },
    {
      quote: '"Fast approvals and secure transactions. Highly recommend!"',
      name: "Mohamed Tarek",
      title: "CEO, Food Industries",
      avatar: "M",
      bg: "#1a2340",
      stars: 5,
    },
  ];

  return (
    <section style={{ background: "#fff", padding: "84px 0" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
        <SectionHeading title="What Our Clients Say" />

        <div
          className="testimonials-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 24,
          }}
        >
          {items.map((t, i) => {
            const [hov, setHov] = useState(false);
            return (
              <div
                key={t.name}
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "28px 26px",
                  border: `1px solid ${hov ? "#c8d4ec" : C.border}`,
                  boxShadow: hov
                    ? "0 10px 36px rgba(13,27,62,0.12)"
                    : "0 2px 14px rgba(13,27,62,0.055)",
                  transition: "all 0.26s",
                  transform: hov ? "translateY(-4px)" : "none",
                  cursor: "default",
                }}
              >
                {/* Stars */}
                <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} size={16} color={C.gold} fill={C.gold} />
                  ))}
                </div>

                <p
                  style={{
                    fontFamily: "Inter",
                    fontSize: 14,
                    color: "#555",
                    lineHeight: 1.72,
                    fontStyle: "italic",
                    margin: "0 0 22px",
                  }}
                >
                  {t.quote}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: t.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 10px rgba(13,27,62,0.25)",
                    }}
                  >
                    <span
                      style={{
                        color: "#fff",
                        fontFamily: "Inter",
                        fontWeight: 800,
                        fontSize: 18,
                      }}
                    >
                      {t.avatar}
                    </span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 14,
                        color: C.textDark,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "Inter",
                        fontSize: 12,
                        color: "#999",
                        marginTop: 2,
                      }}
                    >
                      {t.title}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 36,
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === active ? C.navyDark : "#cbd5e0",
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA BANNER ──────────────────────────────────────────────────────────── */
function CTABanner() {
  const navigate = useNavigate();

  return (
    <section
      id="cta"
      style={{ position: "relative", overflow: "hidden", padding: "62px 24px" }}
    >
      {/* Background: ship photo + overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1400&q=70')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, #0d1b3e 0%, #1a2f6e 60%, #0d1b3e 100%)",
        }}
      />

      {/* Dot pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1240,
          margin: "0 auto",
        }}
      >
        <div
          className="cta-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Inter",
                fontWeight: 900,
                fontSize: "clamp(24px,3.2vw,38px)",
                color: "#fff",
                margin: "0 0 10px",
                letterSpacing: "-0.8px",
              }}
            >
              Ready to Expand Globally?
            </h2>
            <p
              style={{
                fontFamily: "Inter",
                fontSize: 15,
                color: "rgba(255,255,255,0.62)",
                margin: 0,
              }}
            >
              Join thousands of exporters growing their business worldwide.
            </p>
          </div>

          <button
            onClick={() => navigate("/auth/register")}
            style={{
              background: C.gold,
              color: C.navyDark,
              border: "none",
              borderRadius: 9,
              padding: "15px 36px",
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 9,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 22px rgba(245,180,0,0.45)",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.goldHover;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(245,180,0,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.gold;
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow =
                "0 4px 22px rgba(245,180,0,0.45)";
            }}
          >
            Join Now <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ──────────────────────────────────────────────────────────────── */
function Footer() {
  const navigate = useNavigate();

  const quickLinks = [
    { label: "Home",      to: "/" },
    { label: "Services",  to: "/services" },
    { label: "Exporters", to: "/" },
    { label: "Buyers",    to: "/" },
    { label: "Pricing",   to: "/pricing" },
    { label: "Contact",   to: "/contact" },
  ];
  const services = [
    "Customs Clearance",
    "Logistics & Shipping",
    "Trade Finance",
    "Supplier Matching",
    "Market Insights",
    "Government Approvals",
  ];
  const support = [
    { label: "Help Center",        to: "/contact" },
    { label: "FAQs",               to: "/contact" },
    { label: "Terms & Conditions", to: "/" },
    { label: "Privacy Policy",     to: "/" },
    { label: "Contact Us",         to: "/contact" },
  ];

  const socials = [
    { icon: Facebook },
    { icon: Linkedin },
    { icon: Twitter },
    { icon: Youtube },
  ];

  return (
    <footer
      id="footer"
      style={{
        background: C.navyDark,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{ maxWidth: 1240, margin: "0 auto", padding: "58px 24px 32px" }}
      >
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: `linear-gradient(135deg,${C.gold},${C.goldHover})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 12px rgba(245,180,0,0.3)",
                }}
              >
                <Globe size={20} color={C.navyDark} strokeWidth={2.5} />
              </div>
              <div>
                <div
                  style={{
                    color: C.gold,
                    fontFamily: "Inter",
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: "-0.5px",
                    lineHeight: 1,
                  }}
                >
                  IEG
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.38)",
                    fontFamily: "Inter",
                    fontSize: 8.5,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  International Export Gateway
                </div>
              </div>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.46)",
                fontFamily: "Inter",
                fontSize: 13,
                lineHeight: 1.72,
                margin: "0 0 22px",
                maxWidth: 240,
              }}
            >
              Connecting Egypt to global markets through innovation,
              partnerships, and smart solutions.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {socials.map((s, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.gold;
                    e.currentTarget.style.borderColor = C.gold;
                    e.currentTarget.querySelector("svg").style.color =
                      C.navyDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.querySelector("svg").style.color =
                      "rgba(255,255,255,0.65)";
                  }}
                >
                  <s.icon
                    size={15}
                    color="rgba(255,255,255,0.65)"
                    style={{ transition: "color 0.2s" }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 14,
                color: "#fff",
                margin: "0 0 18px",
              }}
            >
              Quick Links
            </h4>
            {quickLinks.map((l) => (
              <Link key={l.label} to={l.to} className="footer-link" style={{ display: "block", color: "rgba(255,255,255,0.46)", fontFamily: "Inter", fontSize: 13, textDecoration: "none", marginBottom: 10, transition: "color 0.18s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.46)"}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Services */}
          <div>
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 14,
                color: "#fff",
                margin: "0 0 18px",
              }}
            >
              Services
            </h4>
            {services.map((l) => (
              <a key={l} href="#" className="footer-link" style={{ display: "block", color: "rgba(255,255,255,0.46)", fontFamily: "Inter", fontSize: 13, textDecoration: "none", marginBottom: 10, transition: "color 0.18s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.46)"}
              >
                {l}
              </a>
            ))}
          </div>

          {/* Support */}
          <div>
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 14,
                color: "#fff",
                margin: "0 0 18px",
              }}
            >
              Support
            </h4>
            {support.map((l) => (
              <Link key={l.label} to={l.to} className="footer-link" style={{ display: "block", color: "rgba(255,255,255,0.46)", fontFamily: "Inter", fontSize: 13, textDecoration: "none", marginBottom: 10, transition: "color 0.18s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.46)"}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4
              style={{
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 14,
                color: "#fff",
                margin: "0 0 18px",
              }}
            >
              Contact Us
            </h4>
            {[
              { icon: Phone, label: "+20 123 456 7890" },
              { icon: Mail, label: "info@ieg.gov.eg" },
              { icon: MapPin, label: "123 El Tahrir St., Cairo, Egypt" },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background: "rgba(245,180,0,0.1)",
                    border: "1px solid rgba(245,180,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <c.icon size={13} color={C.gold} />
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.52)",
                    fontFamily: "Inter",
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="footer-bottom"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.3)",
              fontFamily: "Inter",
              fontSize: 13,
            }}
          >
            © 2024 International Export Gateway. All Rights Reserved.
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms & Conditions"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "Inter",
                  fontSize: 12,
                  textDecoration: "none",
                  transition: "color 0.18s",
                }}
                onMouseEnter={(e) => (e.target.style.color = C.gold)}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255,255,255,0.3)")
                }
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT EXPORT ─────────────────────────────────────────────────────────── */
export default function LandingPage({ scrollTo }) {
  const [platformStats, setPlatformStats] = useState(null);
  const [dashStats, setDashStats] = useState(null);
  const [activeSection, setActiveSection] = useState("Home");

  /* Auto-scroll to section when navigating via route */
  useEffect(() => {
    if (scrollTo) {
      const tryScroll = (attempts = 0) => {
        const el = document.getElementById(scrollTo);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 80);
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };
      tryScroll();
    }
  }, [scrollTo]);

  /* Dynamic stats from backend */
  useEffect(() => {
    api
      .get("/public/stats")
      .then((r) => {
        const d = r?.data?.data;
        if (d) {
          setPlatformStats({
            exporters: d.totalUsers || 0,
            countries: d.countries || 0,
          });
          const rev = d.platformRevenue || 0;
          setDashStats({
            totalOrders: (d.totalOrders || 0).toLocaleString(),
            revenue: rev >= 1e6 ? `$${(rev / 1e6).toFixed(2)}M` : rev >= 1e3 ? `$${(rev / 1e3).toFixed(1)}K` : `$${rev}`,
            buyers: (d.totalUsers || 0).toLocaleString(),
            countries: String(d.countries || 0),
          });
        }
      })
      .catch(() => {
        /* use defaults */
      });
  }, []);

  /* Active section detection */
  useEffect(() => {
    const sections = [
      { id: "hero", label: "Home" },
      { id: "why-choose", label: "Services" },
      { id: "how-it-works", label: "Exporters" },
      { id: "analytics", label: "Buyers" },
      { id: "cta", label: "Pricing" },
    ];
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const match = sections.find((s) => s.id === e.target.id);
            if (match) setActiveSection(match.label);
          }
        });
      },
      { threshold: 0.4 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) ob.observe(el);
    });
    return () => ob.disconnect();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .analytics-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .steps-row { flex-direction: column !important; align-items: center !important; }
          .steps-arrow { display: none !important; }
          .hero-btns { flex-direction: column !important; }
          .hero-btns button { width: 100% !important; justify-content: center !important; }
          .cta-row { flex-direction: column !important; text-align: center !important; align-items: center !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          .dashboard-metrics { grid-template-columns: repeat(2,1fr) !important; }
          .partner-logos > div { border-right: none !important; border-bottom: 1px solid #f0f2f7; }
          .footer-bottom { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

      <Navbar activeSection={activeSection} />
      <Hero platformStats={platformStats} />
      <Partners />
      <WhyChooseIEG />
      <HowItWorks />
      <Analytics dashStats={dashStats} />
      <Testimonials />
      <CTABanner />
      <Footer />
    </div>
  );
}