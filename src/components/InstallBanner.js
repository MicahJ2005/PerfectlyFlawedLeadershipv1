import { useState, useEffect } from "react";
import { GOLD, WHITE } from "../constants/colors";
import { CompassIcon } from "./icons";

export function InstallBanner({ installPrompt, triggerInstall }) {
  const [visible, setVisible] = useState(false);
  const [isIos,   setIsIos]   = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pfl-install-dismissed")) return;
    const ios       = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari    = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const standalone = window.navigator.standalone;
    if (ios && safari && !standalone) { setIsIos(true); setVisible(true); }
    else if (installPrompt)           { setVisible(true); }
  }, [installPrompt]);

  const dismiss = () => { setVisible(false); sessionStorage.setItem("pfl-install-dismissed","1"); };

  if (!visible) return null;

  return (
    <div style={{ position:"absolute", bottom:92, left:14, right:14, zIndex:200, background:"linear-gradient(135deg,#2D2B28,#3D3A36)", borderRadius:18, padding:"18px 18px 16px", boxShadow:"0 8px 32px rgba(45,43,40,0.4)", border:"1px solid rgba(196,146,42,0.3)" }}>
      <button onClick={dismiss} style={{ position:"absolute", top:10, right:14, background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"rgba(196,146,42,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <CompassIcon size={22} />
        </div>
        <div>
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:WHITE, margin:0 }}>Add to Home Screen</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:"rgba(253,250,245,0.55)", margin:0 }}>Use PFL like a real app — works offline too</p>
        </div>
      </div>
      {isIos ? (
        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 12px" }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"rgba(253,250,245,0.8)", margin:0, lineHeight:1.7 }}>
            Tap <strong style={{ color:GOLD }}>Share</strong> at the bottom of Safari, then tap <strong style={{ color:GOLD }}>"Add to Home Screen"</strong>
          </p>
        </div>
      ) : (
        <button onClick={triggerInstall} style={{ width:"100%", background:`linear-gradient(135deg,${GOLD},#E8B84B)`, border:"none", borderRadius:12, padding:12, fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:WHITE, cursor:"pointer", boxShadow:"0 4px 12px rgba(196,146,42,0.4)" }}>
          Install App
        </button>
      )}
    </div>
  );
}
