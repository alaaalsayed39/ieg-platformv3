import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Phone, Mail, MapPin, Twitter, Facebook, Linkedin } from "lucide-react";
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

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.white, fontFamily: "Inter, sans-serif" }}>
     <PublicNavbar />
   

      {/* ── HERO BANNER ── */}
      <section style={{ background: C.navyDark, padding: "52px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* decorative circles */}
        <div style={{ position: "absolute", left: 40, top: 20, width: 80, height: 80, borderRadius: "50%", background: C.gold, opacity: 0.9 }} />
        <div style={{ position: "absolute", left: 20, top: 60, width: 100, height: 100, borderRadius: "50%", border: `3px solid ${C.gold}`, opacity: 0.4 }} />
        <div style={{ position: "absolute", right: 60, top: 10, width: 60, height: 4, borderRadius: 2, background: C.white, opacity: 0.3, transform: "rotate(-20deg)" }} />
        <div style={{ position: "absolute", right: 40, top: 30, width: 12, height: 12, borderRadius: "50%", background: C.gold, opacity: 0.8 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontFamily: "Inter", fontWeight: 900, fontSize: "clamp(28px,4vw,48px)", color: C.white, margin: "0 0 12px", letterSpacing: "-1px" }}>
            International Export Gateway
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontFamily: "Inter", fontSize: 16, fontWeight: 600 }}>
            Seamless Cross-Border Trade Solutions
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 64, alignItems: "start" }}>

          {/* LEFT: Form */}
          <div>
            <h2 style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 38, color: C.textDark, margin: "0 0 10px", letterSpacing: "-1px" }}>
              Get In Touch
            </h2>
            <p style={{ fontFamily: "Inter", fontSize: 14, color: C.textGray, margin: "0 0 32px", lineHeight: 1.6 }}>
              Your inquiries are important to us. Fill out the form below to connect with our team.
            </p>

            {!sent ? (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[
                    { label: "Name", key: "name", type: "text" },
                    { label: "Company", key: "company", type: "text" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: C.textDark, display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1.5px solid #e0e4ee", borderRadius: 8, padding: "11px 14px", fontFamily: "Inter", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                        onFocus={e => e.target.style.borderColor = C.gold}
                        onBlur={e => e.target.style.borderColor = "#e0e4ee"}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  {[
                    { label: "Email", key: "email", type: "email" },
                    { label: "Phone", key: "phone", type: "tel" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: C.textDark, display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input
                        type={f.type}
                        value={form[f.key]}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                        style={{ width: "100%", border: "1.5px solid #e0e4ee", borderRadius: 8, padding: "11px 14px", fontFamily: "Inter", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                        onFocus={e => e.target.style.borderColor = C.gold}
                        onBlur={e => e.target.style.borderColor = "#e0e4ee"}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 600, color: C.textDark, display: "block", marginBottom: 6 }}>Message</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ width: "100%", border: "1.5px solid #e0e4ee", borderRadius: 8, padding: "11px 14px", fontFamily: "Inter", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", transition: "border 0.2s" }}
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e => e.target.style.borderColor = "#e0e4ee"}
                  />
                </div>

                <button
                  type="submit"
                  style={{ background: C.gold, color: C.navyDark, border: "none", borderRadius: 30, padding: "13px 36px", fontFamily: "Inter", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,180,0,0.35)", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.goldHover; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = "none"; }}
                >
                  Send Message
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h3 style={{ fontFamily: "Inter", fontWeight: 800, fontSize: 24, color: C.textDark, margin: "0 0 8px" }}>Message Sent!</h3>
                <p style={{ fontFamily: "Inter", fontSize: 14, color: C.textGray }}>We'll get back to you within 24 hours.</p>
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div>
            {/* Social Icons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 24 }}>
              {[Twitter, Facebook, Linkedin].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f2f7", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", textDecoration: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.navyDark; e.currentTarget.querySelector("svg").style.color = C.white; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f0f2f7"; e.currentTarget.querySelector("svg").style.color = C.textDark; }}
                >
                  <Icon size={16} color={C.textDark} style={{ transition: "color 0.2s" }} />
                </a>
              ))}
            </div>

            {/* Headquarters */}
            <div style={{ background: C.bgPage, borderRadius: 16, padding: "24px", marginBottom: 20, border: "1px solid #edf0f7" }}>
              <h3 style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 16, color: C.textDark, margin: "0 0 16px" }}>Headquarters</h3>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <MapPin size={16} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontFamily: "Inter", fontSize: 13, color: C.textGray, lineHeight: 1.7 }}>
                  Cairo, Egypt<br />North Ring Road<br />Building No. 56, 2nd Floor
                </div>
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 13, color: C.textGray, marginBottom: 4 }}>
                <strong>Phone:</strong> +2 0120 759 1234
              </div>
              <div style={{ fontFamily: "Inter", fontSize: 13, color: C.textGray }}>
                <strong>Email:</strong> hello@iexportgateway.com
              </div>
            </div>

            {/* Map placeholder */}
            <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 20, border: "1px solid #edf0f7" }}>
              <iframe
                title="IEG Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3453.5!2d31.2357!3d30.0444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzDCsDAyJzM5LjkiTiAzMcKwMTQnMDguNSJF!5e0!3m2!1sen!2seg!4v1234567890"
                width="100%"
                height="160"
                style={{ border: 0, display: "block" }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>

            {/* Worldwide Presence */}
            <div style={{ background: C.navyDark, borderRadius: 16, padding: "20px 24px" }}>
              <h3 style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 15, color: C.white, margin: "0 0 14px" }}>Worldwide Presence</h3>
              <div style={{ background: "#0a1628", borderRadius: 10, padding: 16, position: "relative", height: 140, overflow: "hidden" }}>
                {/* Simple world map SVG */}
                <svg viewBox="0 0 400 200" style={{ width: "100%", height: "100%", opacity: 0.9 }}>
                  {/* Continents simplified */}
                  <ellipse cx="80" cy="90" rx="55" ry="40" fill={C.gold} opacity="0.85" />
                  <ellipse cx="100" cy="130" rx="30" ry="25" fill={C.gold} opacity="0.75" />
                  <ellipse cx="200" cy="80" rx="45" ry="35" fill={C.gold} opacity="0.85" />
                  <ellipse cx="230" cy="115" rx="20" ry="18" fill={C.gold} opacity="0.75" />
                  <ellipse cx="300" cy="85" rx="50" ry="30" fill={C.gold} opacity="0.85" />
                  <ellipse cx="320" cy="120" rx="25" ry="20" fill={C.gold} opacity="0.7" />
                  <ellipse cx="355" cy="95" rx="25" ry="22" fill={C.gold} opacity="0.8" />
                  {/* Egypt dot */}
                  <circle cx="215" cy="95" r="5" fill={C.white} />
                  <circle cx="215" cy="95" r="3" fill={C.gold} />
                </svg>
                <div style={{ position: "absolute", bottom: 12, left: 100, display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.gold }} />
                  <span style={{ color: C.gold, fontFamily: "Inter", fontSize: 11, fontWeight: 700 }}>Egypt Office</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.navyDark, padding: "24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={16} color={C.navyDark} />
            </div>
            <span style={{ color: C.gold, fontFamily: "Inter", fontWeight: 800, fontSize: 16 }}>IEG</span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {[
              { icon: Phone, label: "Call" },
              { icon: Mail, label: "Email" },
              { icon: Globe, label: "Website" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={16} color={C.white} />
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter", fontSize: 11 }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms & Conditions", "About Us", "Contact Us"].map(l => (
              <a key={l} href="#" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter", fontSize: 12, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.gold}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
              >{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}