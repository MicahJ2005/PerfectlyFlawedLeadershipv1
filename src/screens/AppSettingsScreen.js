import { useTheme } from "../context/ThemeContext";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";

export function AppSettingsScreen({ onBack }) {
  const { darkMode, toggleDark } = useTheme();

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"28px 0 8px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, color:CHARCOAL, padding:0, lineHeight:1, marginLeft:-4 }}>‹</button>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:0 }}>App Settings & Help</h1>
      </div>
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:"0 0 24px" }}>Customize your experience.</p>

      {/* Appearance section */}
      <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:MIDGREY, letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 10px" }}>Appearance</p>
      <div style={{ background:"rgba(255,255,255,0.82)", borderRadius:14, border:"1px solid rgba(196,146,42,0.18)", overflow:"hidden", marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 18px" }}>
          <span style={{ fontSize:22 }}>🌙</span>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, margin:"0 0 2px" }}>Dark Mode</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>Easier on the eyes in low light</p>
          </div>
          {/* Toggle switch */}
          <div
            onClick={toggleDark}
            style={{ width:50, height:28, borderRadius:14, background: darkMode ? GOLD : "rgba(176,168,152,0.5)", border:"none", cursor:"pointer", position:"relative", flexShrink:0, transition:"background 0.2s" }}
          >
            <div style={{ position:"absolute", top:3, left: darkMode ? 24 : 3, width:22, height:22, borderRadius:11, background:WHITE, boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
          </div>
        </div>
      </div>

      <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, textAlign:"center", lineHeight:1.7 }}>
        More settings coming soon — font size, notifications, and language preferences.
      </p>

      {/* Help & Support section */}
      <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:MIDGREY, letterSpacing:"0.12em", textTransform:"uppercase", margin:"8px 0 10px" }}>Help & Support</p>
      <div style={{ background:"rgba(255,255,255,0.82)", borderRadius:14, border:"1px solid rgba(196,146,42,0.18)", overflow:"hidden", marginBottom:12 }}>
        <a
          href="https://perfectlyflawedleadership.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 18px", textDecoration:"none" }}
        >
          <span style={{ fontSize:22 }}>🌐</span>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, margin:"0 0 2px" }}>Visit Our Website</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>perfectlyflawedleadership.com</p>
          </div>
          <span style={{ color:LTGREY, fontSize:16 }}>›</span>
        </a>
      </div>
      <div style={{ background:"rgba(255,255,255,0.82)", borderRadius:14, border:"1px solid rgba(196,146,42,0.18)", overflow:"hidden", marginBottom:24 }}>
        <a
          href="mailto:perfectlyflawedleadership@gmail.com"
          style={{ display:"flex", alignItems:"center", gap:14, padding:"18px 18px", textDecoration:"none" }}
        >
          <span style={{ fontSize:22 }}>✉️</span>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, margin:"0 0 2px" }}>Contact Support</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>perfectlyflawedleadership@gmail.com</p>
          </div>
          <span style={{ color:LTGREY, fontSize:16 }}>›</span>
        </a>
      </div>
    </div>
  );
}
