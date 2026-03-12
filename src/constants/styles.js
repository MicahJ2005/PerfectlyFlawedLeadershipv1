import { CHARCOAL, GOLD, MIDGREY, LTGREY, WHITE } from "./colors";

export const css = {
  label:   { fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:MIDGREY, letterSpacing:"0.12em", textTransform:"uppercase", display:"block", marginBottom:8 },
  input:   { width:"100%", boxSizing:"border-box", border:"1.5px solid rgba(196,146,42,0.3)", borderRadius:12, padding:"13px 16px", fontFamily:"Georgia,serif", fontSize:14, color:CHARCOAL, background:WHITE, outline:"none" },
  card:    { background:"rgba(255,255,255,0.82)", borderRadius:18, padding:22, marginBottom:14, border:"1px solid rgba(196,146,42,0.18)", boxShadow:"0 2px 14px rgba(45,43,40,0.07)" },
  darkCard:{ background:"linear-gradient(135deg,#2D2B28,#3D3A36)", borderRadius:20, padding:"22px 20px", marginBottom:14, position:"relative", overflow:"hidden" },
};
