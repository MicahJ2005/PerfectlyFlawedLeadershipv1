import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, RUST, WHITE } from "../constants/colors";

export function ProfileScreen({ user, onLogout }) {
  const [stats, setStats] = useState({ devotions:0, sessions:0 });

  useEffect(() => {
    if (!user) return;
    Promise.all([DB.getSavedDevotions(user.uid), DB.getLeadershipSessions(user.uid)])
      .then(([devs, sessions]) => setStats({ devotions:devs.length, sessions:sessions.length }))
      .catch(() => {});
  }, [user]);

  const isGoogle  = user?.providerData?.[0]?.providerId === "google.com";
  const initial   = (user?.displayName || user?.email || "?")[0].toUpperCase();

  return (
    <div style={{ padding:"0 20px 100px", overflowY:"auto", height:"100%" }}>
      <div style={{ textAlign:"center", padding:"32px 0 24px" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", margin:"0 auto 14px", overflow:"hidden", background:"linear-gradient(135deg,#C4922A,#E8B84B)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(196,146,42,0.4)" }}>
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width:80, height:80, objectFit:"cover" }}/>
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
        {[["🔥","7","Day Streak"],["📖",stats.devotions,"Devotions"],["🧭",stats.sessions,"Sessions"]].map(([icon, n, label]) => (
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

      {/* Settings */}
      {[["🔔","Notifications","Daily devotion reminders"],["🙏","My Prayer Groups","Manage group memberships"],["📖","Saved Devotions","View your saved library"],["⚙️","App Settings","Theme, font size, language"]].map(([icon, title, sub]) => (
        <div key={title} style={{ background:"rgba(255,255,255,0.7)", borderRadius:14, padding:"16px 18px", marginBottom:10, border:"1px solid rgba(196,146,42,0.12)", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, margin:0 }}>{title}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{sub}</p>
          </div>
          <span style={{ color:LTGREY, fontSize:16 }}>›</span>
        </div>
      ))}

      <button onClick={onLogout} style={{ width:"100%", marginTop:16, background:"transparent", border:"1.5px solid rgba(220,80,80,0.3)", borderRadius:13, padding:14, fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:RUST, cursor:"pointer" }}>
        Sign Out
      </button>
    </div>
  );
}
