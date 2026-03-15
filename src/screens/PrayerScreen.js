import { useState, useEffect, useRef } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { css } from "../constants/styles";
import { GROUPS } from "../constants/data";
import { HeartIcon } from "../components/icons";
import { GoldButton } from "../components/ui";

export function PrayerScreen({ user }) {
  const [prayers,          setPrayers]          = useState([]);
  const [privateGroups,    setPrivateGroups]     = useState([]);
  const [privateGroupPrayers, setPrivateGroupPrayers] = useState([]);
  const [activeGroup,      setActiveGroup]       = useState("All");   // public tab
  const [activePrivate,    setActivePrivate]     = useState(null);    // private group object | null
  const [showForm,         setShowForm]          = useState(false);
  const [newPrayer,        setNewPrayer]         = useState({ text:"", group:"General", isAnon:false });
  const [submitted,        setSubmitted]         = useState(false);
  const [confirmDelete,    setConfirmDelete]     = useState(null);
  const [userGroups,       setUserGroups]        = useState([]);
  const privateUnsubRef = useRef(null);

  // Public prayers + user profile
  useEffect(() => {
    const unsubPrayers = DB.subscribePrayers(setPrayers);
    const unsubUser    = user ? DB.subscribeToUser(user.uid, data => setUserGroups(data.groups || [])) : null;
    return () => { unsubPrayers(); if (unsubUser) unsubUser(); };
  }, [user]);

  // Private groups list
  useEffect(() => {
    if (!user) return;
    const unsub = DB.subscribeToUserPrivateGroups(user.uid, setPrivateGroups);
    return () => unsub();
  }, [user]);

  // Subscribe to active private group's prayers
  useEffect(() => {
    if (privateUnsubRef.current) { privateUnsubRef.current(); privateUnsubRef.current = null; }
    if (!activePrivate) { setPrivateGroupPrayers([]); return; }
    privateUnsubRef.current = DB.subscribeToPrivateGroupPrayers(activePrivate.id, setPrivateGroupPrayers);
    return () => { if (privateUnsubRef.current) privateUnsubRef.current(); };
  }, [activePrivate?.id]);

  const selectPublicTab = (g) => { setActiveGroup(g); setActivePrivate(null); };
  const selectPrivateTab = (group) => { setActivePrivate(group); setActiveGroup(null); };

  const visibleGroups = userGroups.length > 0 ? userGroups : GROUPS;
  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const isAnonExpired = (p) => p.isAnon && p.createdAt?.toDate && (Date.now() - p.createdAt.toDate().getTime() > TEN_DAYS_MS);
  const filterPrayers = (list) => list.filter(p => !isAnonExpired(p));
  const displayPrayers = filterPrayers(activePrivate ? privateGroupPrayers : (activeGroup === "All" ? prayers : prayers.filter(p => p.group === activeGroup)));

  const timeAgo = (ts) => {
    if (!ts?.toDate) return "";
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return "Just now";
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const deletePrayer = async (prayerId) => {
    if (activePrivate) await DB.deactivatePrivateGroupPrayer(activePrivate.id, prayerId);
    else               await DB.deactivatePrayer(prayerId);
    setConfirmDelete(null);
  };

  const handlePray = async (prayer) => {
    if (!user) return;
    if (activePrivate) await DB.prayForPrivateGroup(activePrivate.id, prayer.id, user.uid);
    else               await DB.prayFor(prayer.id, user.uid);
  };

  const submitPrayer = async () => {
    if (!newPrayer.text.trim() || !user) return;
    const author = newPrayer.isAnon ? "Anonymous" : (user.displayName || user.email.split("@")[0]);
    if (activePrivate) {
      await DB.addPrivateGroupPrayer(activePrivate.id, {
        author, uid: newPrayer.isAnon ? null : user.uid,
        text: newPrayer.text, isAnon: newPrayer.isAnon,
      });
    } else {
      await DB.addPrayer({
        author, uid: newPrayer.isAnon ? null : user.uid,
        group: newPrayer.group, text: newPrayer.text, isAnon: newPrayer.isAnon,
      });
    }
    setNewPrayer({ text:"", group:"General", isAnon:false });
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", position:"relative" }}>
      <div style={{ padding:"32px 20px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
          <div>
            <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:CHARCOAL, margin:"0 0 4px" }}>Prayer Wall</h1>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:0 }}>
              {activePrivate ? `🔒 ${activePrivate.name}` : "Lift each other up in prayer"}
            </p>
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

        {/* Group filter tabs */}
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12, scrollbarWidth:"none" }}>
          {/* Public tabs */}
          {["All", ...visibleGroups].map(g => {
            const active = !activePrivate && activeGroup === g;
            return (
              <button key={g} onClick={() => selectPublicTab(g)} style={{ flexShrink:0, border:`1.5px solid ${active ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:20, padding:"6px 14px", fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color: active ? WHITE : MIDGREY, background: active ? GOLD : "transparent", cursor:"pointer", whiteSpace:"nowrap" }}>
                {g}
              </button>
            );
          })}

          {/* Divider */}
          {privateGroups.length > 0 && (
            <div style={{ width:1, background:"rgba(196,146,42,0.25)", flexShrink:0, margin:"4px 4px" }} />
          )}

          {/* Private group tabs */}
          {privateGroups.map(group => {
            const active = activePrivate?.id === group.id;
            return (
              <button key={group.id} onClick={() => selectPrivateTab(group)} style={{ flexShrink:0, border:`1.5px solid ${active ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:20, padding:"6px 14px", fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color: active ? WHITE : MIDGREY, background: active ? GOLD : "rgba(196,146,42,0.06)", cursor:"pointer", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
                🔒 {group.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prayer list */}
      <div style={{ flex:1, overflowY:"auto", padding:"4px 20px 100px" }}>
        {displayPrayers.length === 0 && (
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:LTGREY, fontStyle:"italic", textAlign:"center", paddingTop:60 }}>No prayer requests yet. Be the first to share.</p>
        )}
        {displayPrayers.map(prayer => {
          const hasPrayed    = (prayer.prayedBy || []).includes(user?.uid);
          const isOwner      = user?.uid && prayer.uid === user.uid;
          const isConfirming = confirmDelete === prayer.id;
          const subtitle     = activePrivate ? timeAgo(prayer.createdAt) : `${prayer.group} · ${timeAgo(prayer.createdAt)}`;
          return (
            <div key={prayer.id} style={{ ...css.card, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`hsl(${(prayer.author?.charCodeAt(0) || 0) * 47 % 360},30%,75%)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, flexShrink:0 }}>
                  {prayer.author?.[0] || "?"}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:0 }}>{prayer.author}</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{subtitle}</p>
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
                <button onClick={() => handlePray(prayer)} style={{ background: hasPrayed ? "rgba(196,146,42,0.1)" : "transparent", border:`1px solid ${hasPrayed ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:20, padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                  <HeartIcon filled={hasPrayed} size={14}/>
                  <span style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:GOLD }}>{hasPrayed ? "Pray again" : "I prayed"} · {prayer.hearts || 0}</span>
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
            {activePrivate && (
              <div style={{ background:"rgba(196,146,42,0.08)", border:"1px solid rgba(196,146,42,0.25)", borderRadius:10, padding:"8px 12px", marginBottom:14 }}>
                <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:0 }}>🔒 Posting to <strong style={{ color:CHARCOAL }}>{activePrivate.name}</strong> (private)</p>
              </div>
            )}
            <textarea value={newPrayer.text} onChange={e => setNewPrayer(p => ({ ...p, text:e.target.value }))}
              placeholder="Share what's on your heart…" rows={4}
              style={{ ...css.input, resize:"none", lineHeight:1.7, height:100, marginBottom:14 }} />
            {!activePrivate && (
              <>
                <label style={css.label}>Group</label>
                <select value={newPrayer.group} onChange={e => setNewPrayer(p => ({ ...p, group:e.target.value }))}
                  style={{ ...css.input, marginBottom:14 }}>
                  {GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </>
            )}
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:20 }}>
              <input type="checkbox" checked={newPrayer.isAnon} onChange={e => setNewPrayer(p => ({ ...p, isAnon:e.target.checked }))} style={{ width:18, height:18, accentColor:GOLD }}/>
              <span style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY }}>Post anonymously (displayed for 10 days)</span>
            </label>
            <GoldButton onClick={submitPrayer} disabled={!newPrayer.text.trim()}>Submit Prayer Request</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}
