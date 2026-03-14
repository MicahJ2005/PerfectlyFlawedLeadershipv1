import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, RUST, WHITE } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { PrayerGroupsScreen }  from "./PrayerGroupsScreen";
import { SavedDevotionsScreen } from "./SavedDevotionsScreen";
import { AppSettingsScreen }    from "./AppSettingsScreen";

export function ProfileScreen({ user, onLogout }) {
  const { darkMode } = useTheme();
  const [stats,        setStats]        = useState({ devotions:0, sessions:0, prayed:0 });
  const [subStatus,    setSubStatus]    = useState(null);
  const [portalLoading,setPortalLoading]= useState(false);
  const [subScreen,    setSubScreen]    = useState(null); // null | "groups" | "devotions" | "settings"

  useEffect(() => {
    if (!user) return;
    Promise.all([DB.getSavedDevotions(user.uid), DB.getLeadershipSessions(user.uid), DB.getPrayedCount(user.uid)])
      .then(([devs, sessions, prayed]) => setStats({ devotions:devs.length, sessions:sessions.length, prayed }))
      .catch(() => {});
    const unsub = DB.subscribeToUser(user.uid, data => setSubStatus(data.subscriptionStatus || null));
    return () => unsub();
  }, [user]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const API = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";
      const res = await fetch(`${API}/api/create-portal-session`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      alert(err.message);
      setPortalLoading(false);
    }
  };

  // Sub-screen navigation
  if (subScreen === "groups")    return <PrayerGroupsScreen  user={user} onBack={() => setSubScreen(null)} />;
  if (subScreen === "devotions") return <SavedDevotionsScreen user={user} onBack={() => setSubScreen(null)} />;
  if (subScreen === "settings")  return <AppSettingsScreen          onBack={() => setSubScreen(null)} />;

  const isGoogle = user?.providerData?.[0]?.providerId === "google.com";
  const initial  = (user?.displayName || user?.email || "?")[0].toUpperCase();

  const rows = [
    { icon:"🔔", title:"Notifications",    sub:"Daily devotion reminders",    onPress: null                          },
    { icon:"🙏", title:"My Prayer Groups", sub:"Manage group memberships",     onPress: () => setSubScreen("groups")   },
    { icon:"📖", title:"Saved Devotions",  sub:"View your saved library",      onPress: () => setSubScreen("devotions")},
    { icon:"⚙️", title:"App Settings",     sub:"Theme, font size, language",   onPress: () => setSubScreen("settings") },
  ];

  return (
    <div style={{ padding:"0 20px 100px", overflowY:"auto", height:"100%" }}>
      <div style={{ textAlign:"center", padding:"32px 0 24px" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", margin:"0 auto 14px", overflow:"hidden", background:"linear-gradient(135deg,#C4922A,#E8B84B)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(196,146,42,0.4)" }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width:80, height:80, objectFit:"cover", filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none" }}/>
            : <span style={{ fontFamily:"Georgia,serif", fontSize:30, fontWeight:700, color:WHITE }}>{initial}</span>
          }
        </div>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:"0 0 4px" }}>{user?.displayName || user?.email?.split("@")[0]}</h2>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:"0 0 10px" }}>{user?.email}</p>
        <span style={{ display:"inline-block", background:"rgba(196,146,42,0.12)", color:GOLD, fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", padding:"3px 12px", borderRadius:20 }}>
          {isGoogle ? "Google Account" : "Email Account"}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
        {[["🙏",stats.prayed,"Prayers"],["📖",stats.devotions,"Devotions"],["🧭",stats.sessions,"Sessions"]].map(([icon, n, label]) => (
          <div key={label} style={{ background:"rgba(255,255,255,0.7)", borderRadius:14, padding:"14px 10px", textAlign:"center", border:"1px solid rgba(196,146,42,0.15)" }}>
            <p style={{ fontSize:18, margin:"0 0 4px" }}>{icon}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:GOLD, margin:"0 0 3px" }}>{n}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:10, color:MIDGREY, margin:0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Firebase status */}
      <div style={{ background:"rgba(232,248,232,0.8)", borderRadius:14, padding:"14px 18px", marginBottom:18, border:"1px solid rgba(130,190,130,0.4)" }}>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:"#2A6A2A", margin:"0 0 3px", letterSpacing:"0.08em", textTransform:"uppercase" }}>✓ Firebase Connected</p>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"#4A8A4A", margin:0, lineHeight:1.6 }}>Your prayers, devotions, and leadership sessions are syncing securely to Firestore in real time.</p>
      </div>

      {/* Subscription */}
      {subStatus && (
        <div style={{ background:"rgba(255,255,255,0.7)", borderRadius:14, padding:"16px 18px", marginBottom:10, border:"1px solid rgba(196,146,42,0.2)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, margin:"0 0 2px" }}>Membership</p>
              <p style={{ fontFamily:"Georgia,serif", fontSize:11, color: subStatus === "active" ? "#4A8A4A" : MIDGREY, margin:0, textTransform:"capitalize" }}>
                {subStatus === "active" ? "✓ Active" : subStatus === "promo" ? "✓ Access code" : subStatus}
              </p>
            </div>
            {subStatus !== "promo" && (
              <button onClick={openPortal} disabled={portalLoading} style={{ background:"rgba(196,146,42,0.1)", border:"1px solid rgba(196,146,42,0.3)", borderRadius:10, padding:"8px 14px", fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:GOLD, cursor:"pointer", opacity: portalLoading ? 0.6 : 1 }}>
                {portalLoading ? "…" : "Manage"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Settings rows */}
      {rows.map(({ icon, title, sub, onPress }) => (
        <div
          key={title}
          onClick={onPress || undefined}
          style={{ background:"rgba(255,255,255,0.7)", borderRadius:14, padding:"16px 18px", marginBottom:10, border:"1px solid rgba(196,146,42,0.12)", display:"flex", alignItems:"center", gap:14, cursor: onPress ? "pointer" : "default", opacity: onPress ? 1 : 0.5 }}
        >
          <span style={{ fontSize:20 }}>{icon}</span>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, margin:0 }}>{title}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{sub}</p>
          </div>
          {onPress && <span style={{ color:LTGREY, fontSize:16 }}>›</span>}
        </div>
      ))}

      <button onClick={onLogout} style={{ width:"100%", marginTop:16, background:"transparent", border:"1.5px solid rgba(220,80,80,0.3)", borderRadius:13, padding:14, fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:RUST, cursor:"pointer" }}>
        Sign Out
      </button>
    </div>
  );
}
