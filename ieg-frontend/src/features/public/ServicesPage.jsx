import { useNavigate } from "react-router-dom";
import { Globe, Shield, Package, TrendingUp, Search, FileText } from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
const C = {
  navyDark: "#0d1b3e",
  navyLight: "#1a2f6e",
  gold: "#f5b400",
  goldHover: "#e0a200",
  white: "#ffffff",
  textDark: "#1a2340",
  textGray: "#666666",
  bgPage: "#f8f9fc",
};

const services = [
  {
    icon: Globe,
    title: "Export Facilitation",
    desc: "Streamline processes from quotation to order fulfillment.",
  },
  {
    icon: Shield,
    title: "Customs Clearance",
    desc: "Customs clearance regulations with ease and speed.",
  },
  {
    icon: Package,
    title: "Logistics Management",
    desc: "End-to-end supply chain management for seamless operations.",
  },
  {
    icon: TrendingUp,
    title: "Trade Finance",
    desc: "Secure financing solutions to identify your international trade growth.",
  },
  {
    icon: Search,
    title: "Market Intelligence",
    desc: "Global financing insights to support opportunities and navigate market trends.",
  },
  {
    icon: FileText,
    title: "Document Management",
    desc: "Streamline compliance with automated documentation solutions.",
  },
];

const benefits = [
  "Reduced Costs & Time",
  "Seamless Customs Processes",
  "Optimized Supply Chains",
  "Data-Driven Insights",
  "Regulatory Compliance",
  "Enhanced Global Reach",
  "Risk Mitigation",
  "Streamlined Documentation",
];

export default function ServicesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: C.white, fontFamily: "Inter, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <PublicNavbar />

      {/* ── HERO ── */}
      <section style={{ background: C.navyDark, padding: "72px 24px 80px", textAlign: "center" }}>
        <div style={{ color: C.gold, fontFamily: "Inter", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>
          Our Services
        </div>
        <h1 style={{ fontFamily: "Inter", fontWeight: 900, fontSize: "clamp(32px,5vw,58px)", color: C.white, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-1px" }}>
          Comprehensive Export<br />Solutions
        </h1>
        <p style={{ color: "rgba(255,255,255,0.62)", fontFamily: "Inter", fontSize: 15, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 36px" }}>
          Streamline your global trade journey with our end-to-end export management services.
        </p>
        <button
          onClick={() => navigate("/auth/register")}
          style={{ background: C.gold, color: C.navyDark, border: "none", borderRadius: 30, padding: "14px 36px", fontFamily: "Inter", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,180,0,0.4)", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.goldHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
        >
          Explore Our Services
        </button>
      </section>

      {/* ── SERVICE CARDS ── */}
      <section style={{ padding: "0 24px", marginTop: -40, maxWidth: 1240, margin: "-40px auto 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 0, background: C.white, borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                style={{ padding: "32px 20px", borderRight: i < services.length - 1 ? "1px solid #f0f2f7" : "none", textAlign: "center", transition: "all 0.25s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.navyDark; e.currentTarget.querySelectorAll("*").forEach(el => { if (el.tagName !== "svg" && el.tagName !== "path") el.style.color = C.white; }); }}
                onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.querySelectorAll("*").forEach(el => { if (el.tagName !== "svg" && el.tagName !== "path") el.style.color = ""; }); }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: C.navyDark, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Icon size={24} color={C.gold} />
                </div>
                <h3 style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: C.textDark, margin: "0 0 10px" }}>{s.title}</h3>
                <p style={{ fontFamily: "Inter", fontSize: 12, color: C.textGray, lineHeight: 1.6, margin: "0 0 20px" }}>{s.desc}</p>
                <button style={{ background: C.gold, color: C.navyDark, border: "none", borderRadius: 20, padding: "8px 20px", fontFamily: "Inter", fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.goldHover}
                  onMouseLeave={e => e.currentTarget.style.background = C.gold}
                >
                  Learn More
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section style={{ padding: "80px 24px", maxWidth: 1240, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 32, color: C.textDark, textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.5px" }}>
          Benefits of Our Services
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {benefits.map((b) => (
            <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(245,180,0,0.15)", border: "1.5px solid rgba(245,180,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke={C.gold} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontFamily: "Inter", fontSize: 14, fontWeight: 600, color: C.textDark }}>{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: C.navyDark, margin: "0 24px 80px", borderRadius: 16, padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1192, marginLeft: "auto", marginRight: "auto" }}>
        <h2 style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 28, color: C.white, margin: 0, letterSpacing: "-0.5px" }}>
          Partner with IEG Today
        </h2>
        <button
          onClick={() => navigate("/contact")}
          style={{ background: C.gold, color: C.navyDark, border: "none", borderRadius: 30, padding: "14px 36px", fontFamily: "Inter", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,180,0,0.4)", transition: "all 0.2s", whiteSpace: "nowrap" }}
          onMouseEnter={e => { e.currentTarget.style.background = C.goldHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
        >
          Get in Touch
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDark, padding: "28px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={16} color={C.navyDark} />
            </div>
            <span style={{ color: C.gold, fontFamily: "Inter", fontWeight: 800, fontSize: 16 }}>IEG</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "Inter", fontSize: 12 }}>International Export Gateway</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {["📞 1-800-EXPORT-GW", "✉ info@ieggateway.com", "📍 123 Trade Avenue, New York, NY 10001"].map(item => (
              <span key={item} style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter", fontSize: 12 }}>{item}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}