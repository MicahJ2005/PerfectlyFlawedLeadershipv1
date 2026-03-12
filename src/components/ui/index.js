import { useState, useEffect } from "react";
import { GOLD, MIDGREY, LTGREY, WHITE, CHARCOAL } from "../../constants/colors";
import { css } from "../../constants/styles";
import { CompassIcon } from "../icons";

export function FieldInput({ label, type="text", value, onChange, placeholder, error, right }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={css.label}>{label}</label>}
      <div style={{ position:"relative" }}>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ ...css.input, borderColor: error ? "#E57373" : "rgba(196,146,42,0.3)", paddingRight: right ? 48 : 16 }} />
        {right && <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)" }}>{right}</div>}
      </div>
      {error && <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:"#E57373", margin:"5px 0 0" }}>{error}</p>}
    </div>
  );
}

export function GoldButton({ children, onClick, disabled, outline=false, small=false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%", border: outline ? `1.5px solid ${GOLD}` : "none", borderRadius:13,
      padding: small ? "10px 16px" : "14px",
      background: outline ? "transparent" : disabled ? "#D4C5A5" : GOLD,
      color: outline ? GOLD : WHITE,
      fontFamily:"Georgia,serif", fontSize: small ? 13 : 14, fontWeight:600,
      cursor: disabled ? "default" : "pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      boxShadow: !outline && !disabled ? "0 4px 14px rgba(196,146,42,0.35)" : "none",
      transition:"all 0.2s",
    }}>{children}</button>
  );
}

export function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ background:"#FFF0F0", border:"1px solid #F5C5C5", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#C05050", margin:0 }}>{msg}</p>
    </div>
  );
}

export function Spinner({ size=38 }) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDeg(d => (d + 6) % 360), 16);
    return () => clearInterval(t);
  }, []);
  return <div style={{ display:"inline-block", transform:`rotate(${deg}deg)` }}><CompassIcon size={size} /></div>;
}

export function LoadingState({ msg="Loading…" }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 0" }}>
      <Spinner size={40} />
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, marginTop:14, fontStyle:"italic" }}>{msg}</p>
    </div>
  );
}

export function Divider({ text="OR" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
      <div style={{ flex:1, height:1, background:"rgba(196,146,42,0.2)" }}/>
      <span style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, letterSpacing:"0.1em" }}>{text}</span>
      <div style={{ flex:1, height:1, background:"rgba(196,146,42,0.2)" }}/>
    </div>
  );
}
