import { useState, useEffect } from "react";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE, CREAM } from "../constants/colors";
import { CompassIcon, BookIcon, AdvisorIcon } from "../components/icons";
import { GoldButton } from "../components/ui";

// ─── Replace these with your actual Stripe Price IDs from the Stripe Dashboard ───
const MONTHLY_PRICE_ID = "prod_U8c6sT1TH5kRfM";  // e.g. $9.99/month
const ANNUAL_PRICE_ID  = "prod_U8rA4P8AaYRBZq";   // e.g. $69.99/year
// ─────────────────────────────────────────────────────────────────────────────────

const MONTHLY_LABEL = "$9.99 / month";
const ANNUAL_LABEL  = "$69.99 / year";
const ANNUAL_SAVINGS = "Save 25%";

export function PaywallScreen({ user, featureName }) {
  const [plan,       setPlan]       = useState("annual");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(false);
  const [showCode,   setShowCode]   = useState(false);
  const [code,       setCode]       = useState("");
  const [codeLoading,setCodeLoading]= useState(false);
  const [codeError,  setCodeError]  = useState(null);

  useEffect(() => {
    if (window.location.search.includes("payment=success")) {
      setSuccess(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const redeemCode = async () => {
    if (!code.trim()) return;
    setCodeLoading(true);
    setCodeError(null);
    try {
      const API = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";
      const res = await fetch(`${API}/api/redeem-code`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code: code.trim(), uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      // success — App.js will detect subscribed=true via Firestore listener and unmount this screen
    } catch (err) {
      setCodeError(err.message);
      setCodeLoading(false);
    }
  };

  const subscribe = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const priceId = plan === "monthly" ? MONTHLY_PRICE_ID : ANNUAL_PRICE_ID;
      const API     = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";
      const res     = await fetch(`${API}/api/create-checkout-session`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ priceId, uid: user.uid, email: user.email }),
      });
      if (!res.ok) throw new Error("Could not start checkout");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 32px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🙏</div>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:"0 0 12px" }}>Thank You!</h2>
        <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:MIDGREY, lineHeight:1.7, margin:"0 0 8px" }}>Your payment was received. Your account is being activated — this usually takes just a moment.</p>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:LTGREY, fontStyle:"italic" }}>This screen will update automatically.</p>
      </div>
    );
  }

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      {/* Header */}
      <div style={{ textAlign:"center", padding:"36px 0 24px" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#C4922A,#E8B84B)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <span style={{ fontSize:28 }}>✦</span>
        </div>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:CHARCOAL, margin:"0 0 8px" }}>Unlock Full Access</h1>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:0, lineHeight:1.6 }}>
          {featureName ? `${featureName} is a premium feature.` : "The AI features require a membership."} Join to unlock everything.
        </p>
      </div>

      {/* Feature list */}
      <div style={{ background:"rgba(196,146,42,0.07)", borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
        {[
          { Icon:BookIcon,     label:"Daily Devotion",        desc:"AI-generated devotions on any topic" },
          { Icon:AdvisorIcon,  label:"Leadership Advisor",    desc:"Scripture-grounded situational guidance" },
          { Icon:CompassIcon,  label:"Save & History",        desc:"Save devotions, revisit past sessions" },
        ].map(({ Icon, label, desc }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, lastChild:{ marginBottom:0 } }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"rgba(196,146,42,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon size={18} />
            </div>
            <div>
              <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:0 }}>{label}</p>
              <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:MIDGREY, margin:0 }}>{desc}</p>
            </div>
            <span style={{ marginLeft:"auto", color:GOLD, fontSize:16 }}>✓</span>
          </div>
        ))}
      </div>

      {/* Pricing toggle */}
      <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:MIDGREY, letterSpacing:"0.12em", textTransform:"uppercase", textAlign:"center", marginBottom:12 }}>Choose Your Plan</p>
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[
          { id:"monthly", label:"Monthly", price:MONTHLY_LABEL, badge:null },
          { id:"annual",  label:"Annual",  price:ANNUAL_LABEL,  badge:ANNUAL_SAVINGS },
        ].map(({ id, label, price, badge }) => (
          <button key={id} onClick={() => setPlan(id)} style={{ flex:1, border:`2px solid ${plan===id ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:16, padding:"14px 12px", cursor:"pointer", background: plan===id ? "rgba(196,146,42,0.08)" : "transparent", position:"relative", textAlign:"center" }}>
            {badge && (
              <span style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:GOLD, color:WHITE, fontFamily:"Georgia,serif", fontSize:10, fontWeight:700, padding:"2px 10px", borderRadius:10, whiteSpace:"nowrap" }}>{badge}</span>
            )}
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color: plan===id ? GOLD : CHARCOAL, margin:"0 0 4px" }}>{label}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:0 }}>{price}</p>
          </button>
        ))}
      </div>

      {error && (
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#C05050", textAlign:"center", margin:"0 0 12px" }}>{error}</p>
      )}

      <GoldButton onClick={subscribe} disabled={loading}>
        {loading ? "Redirecting to checkout…" : "Subscribe Now"}
      </GoldButton>

      <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, textAlign:"center", marginTop:12, lineHeight:1.6 }}>
        Cancel anytime. Prayer Wall is always free.{"\n"}Secure payment via Stripe.
      </p>

      {/* Promo code */}
      <div style={{ marginTop:24, textAlign:"center" }}>
        <button onClick={() => { setShowCode(v => !v); setCodeError(null); }} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, textDecoration:"underline" }}>
          {showCode ? "Hide" : "Have an access code?"}
        </button>
        {showCode && (
          <div style={{ marginTop:12, display:"flex", gap:8 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && redeemCode()}
              placeholder="Enter code"
              style={{ flex:1, border:"1.5px solid rgba(196,146,42,0.4)", borderRadius:10, padding:"10px 14px", fontFamily:"Georgia,serif", fontSize:13, color:CHARCOAL, background:WHITE, outline:"none", letterSpacing:"0.1em" }}
            />
            <button onClick={redeemCode} disabled={codeLoading || !code.trim()} style={{ background:GOLD, border:"none", borderRadius:10, padding:"10px 18px", fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color:WHITE, cursor:"pointer", opacity: codeLoading || !code.trim() ? 0.6 : 1 }}>
              {codeLoading ? "…" : "Apply"}
            </button>
          </div>
        )}
        {codeError && (
          <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"#C05050", margin:"8px 0 0", textAlign:"left" }}>{codeError}</p>
        )}
      </div>
    </div>
  );
}
