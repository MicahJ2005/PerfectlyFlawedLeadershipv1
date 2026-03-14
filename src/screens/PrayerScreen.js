import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { css } from "../constants/styles";
import { GROUPS } from "../constants/data";
import { HeartIcon } from "../components/icons";
import { GoldButton } from "../components/ui";

export function PrayerScreen({ user }) {
  const [prayers,        setPrayers]        = useState([]);
  const [showForm,       setShowForm]       = useState(false);
  const [activeGroup,    setActiveGroup]    = useState("All");
  const [newPrayer,      setNewPrayer]      = useState({ text:"", group:"General", isAnon:false });
  const [submitted,      setSubmitted]      = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [userGroups,     setUserGroups]     = useState([]);

  useEffect(() => {
    const unsubPrayers = DB.subscribePrayers(setPrayers);
    const unsubUser    = user ? DB.subscribeToUser(user.uid, data => setUserGroups(data.groups || [])) : null;
    return () => { unsubPrayers(); if (unsubUser) unsubUser(); };
  }, [user]);

  // Show only the user's joined groups in the filter tabs; fall back to all groups if none selected
  const visibleGroups = userGroups.length > 0 ? userGroups : GROUPS;

  const filtered = activeGroup === "All" ? prayers : prayers.filter(p => p.group === activeGroup);

  const deletePrayer = async (prayerId) => {
    await DB.deactivatePrayer(prayerId);
    setConfirmDelete(null);
  };

  const toggleHeart = async (prayer) => {
    if (!user) return;
    const hasPrayed = (prayer.prayedBy || []).includes(user.uid);
    await DB.togglePrayed(prayer.id, user.uid, hasPrayed);
  };

  const submitPrayer = async () => {
    if (!newPrayer.text.trim() || !user) return;
    await DB.addPrayer({
      author:  newPrayer.isAnon ? "Anonymous" : (user.displayName || user.email.split("@")[0]),
      uid:     newPrayer.isAnon ? null : user.uid,
      group:   newPrayer.group,
      text:    newPrayer.text,
      isAnon:  newPrayer.isAnon,
    });
    setNewPrayer({ text:"", group:"General", isAnon:false });
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const timeAgo = (ts) => {
    if (!ts?.toDate) return "";
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return "Just now";
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", position:"relative" }}>
      <div style={{ padding:"32px 20px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:CHARCOAL, margin:"0 0 4px" }}>Prayer Wall</h1>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:0 }}>Lift each other up in faith</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background:GOLD, border:"none", borderRadius:"50%", width:44, height:44, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(196,146,42,0.4)", flexShrink:0 }}>
            <span style={{ color:WHITE, fontSize:24, lineHeight:1 }}>+</span>
          </button>
        </div>

        {submitted && (
          <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:10, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>🙏</span>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#388E3C", margin:0 }}>Your prayer request has been shared.</p>
          </div>
        )}

        {/* Group filter */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none" }}>
          {["All", ...visibleGroups].map(g => (
            <button key={g} onClick={() => setActiveGroup(g)} style={{ flexShrink:0, border:`1.5px solid ${activeGroup===g ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:20, padding:"6px 14px", fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color: activeGroup===g ? WHITE : MIDGREY, background: activeGroup===g ? GOLD : "transparent", cursor:"pointer", whiteSpace:"nowrap" }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Prayer list */}
      <div style={{ flex:1, overflowY:"auto", padding:"4px 20px 100px" }}>
        {prayers.length === 0 && (
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:LTGREY, fontStyle:"italic", textAlign:"center", paddingTop:60 }}>No prayer requests yet. Be the first to share.</p>
        )}
        {filtered.map(prayer => {
          const hasPrayed   = (prayer.prayedBy || []).includes(user?.uid);
          const isOwner     = user?.uid && prayer.uid === user.uid;
          const isConfirming = confirmDelete === prayer.id;
          return (
            <div key={prayer.id} style={{ ...css.card, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`hsl(${(prayer.author?.charCodeAt(0) || 0) * 47 % 360},30%,75%)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, flexShrink:0 }}>
                  {prayer.author?.[0] || "?"}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:0 }}>{prayer.author}</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{prayer.group} · {timeAgo(prayer.createdAt)}</p>
                </div>
                {isOwner && !isConfirming && (
                  <button onClick={() => setConfirmDelete(prayer.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:LTGREY, fontSize:16, lineHeight:1 }} title="Remove prayer request">✕</button>
                )}
              </div>
              <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:"#3D3A36", lineHeight:1.7, margin:"0 0 12px" }}>{prayer.text}</p>
              {isConfirming ? (
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:0, flex:1 }}>Remove this request?</p>
                  <button onClick={() => deletePrayer(prayer.id)} style={{ background:"#D32F2F", border:"none", borderRadius:14, padding:"5px 12px", fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:WHITE, cursor:"pointer" }}>Remove</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ background:"transparent", border:`1px solid ${MIDGREY}`, borderRadius:14, padding:"5px 12px", fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, cursor:"pointer" }}>Keep</button>
                </div>
              ) : (
                <button onClick={() => toggleHeart(prayer)} style={{ background: hasPrayed ? "rgba(196,146,42,0.1)" : "transparent", border:`1px solid ${hasPrayed ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:20, padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <HeartIcon filled={hasPrayed} size={14}/>
                  <span style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:GOLD }}>{hasPrayed ? "Prayed" : "I prayed"} · {prayer.hearts || 0}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit prayer modal */}
      {showForm && (
        <div style={{ position:"absolute", inset:0, background:"rgba(45,43,40,0.55)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
          <div style={{ background:WHITE, borderRadius:"24px 24px 0 0", padding:"28px 24px 44px", width:"100%", boxSizing:"border-box" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:CHARCOAL, margin:0 }}>Share a Prayer Request</h3>
              <button onClick={() => setShowForm(false)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:MIDGREY, padding:0 }}>✕</button>
            </div>
            <textarea value={newPrayer.text} onChange={e => setNewPrayer(p => ({ ...p, text:e.target.value }))}
              placeholder="Share what's on your heart…" rows={4}
              style={{ ...css.input, resize:"none", lineHeight:1.7, height:100, marginBottom:14 }} />
            <label style={css.label}>Group</label>
            <select value={newPrayer.group} onChange={e => setNewPrayer(p => ({ ...p, group:e.target.value }))}
              style={{ ...css.input, marginBottom:14 }}>
              {GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:20 }}>
              <input type="checkbox" checked={newPrayer.isAnon} onChange={e => setNewPrayer(p => ({ ...p, isAnon:e.target.checked }))} style={{ width:18, height:18, accentColor:GOLD }}/>
              <span style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY }}>Post anonymously</span>
            </label>
            <GoldButton onClick={submitPrayer} disabled={!newPrayer.text.trim()}>Submit Prayer Request</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}
