import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { CrossIcon } from "../components/icons";
import { LoadingState } from "../components/ui";

function formatDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
}

export function shareDevotion(devotion) {
  const subject = encodeURIComponent(`Devotion: ${devotion.title}`);
  const body = encodeURIComponent(
    `${devotion.title}\n\n` +
    `"${devotion.scripture?.verse}"\n— ${devotion.scripture?.reference}\n\n` +
    `${devotion.body}\n\n` +
    `Reflect:\n${devotion.reflection}\n\n` +
    `Closing Prayer:\n${devotion.prayer}\n\n` +
    `— Shared from Perfectly Flawed Leadership\nhttps://perfectlyflawedleadership.com\nhttps://devo4me.web.app`
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

export function DevotionDetail({ devotion, onBack }) {
  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"28px 0 20px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, color:CHARCOAL, padding:0, lineHeight:1, marginLeft:-4 }}>‹</button>
        <span style={{ display:"inline-block", background:"rgba(196,146,42,0.12)", color:GOLD, fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20 }}>
          {devotion.topic}
        </span>
      </div>

      <div style={{ background:"rgba(255,255,255,0.82)", borderRadius:18, padding:0, overflow:"hidden", border:"1px solid rgba(196,146,42,0.18)" }}>
        <div style={{ background:"linear-gradient(135deg,#C4922A,#E8B84B)", height:5 }} />
        <div style={{ padding:"22px 20px" }}>
          <h2 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:"0 0 18px", lineHeight:1.35 }}>{devotion.title}</h2>

          {/* Scripture */}
          <div style={{ background:"rgba(196,146,42,0.07)", borderLeft:`3px solid ${GOLD}`, borderRadius:"0 12px 12px 0", padding:"14px 16px", marginBottom:18 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic", color:CHARCOAL, margin:"0 0 6px", lineHeight:1.65 }}>"{devotion.scripture?.verse}"</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, margin:0 }}>— {devotion.scripture?.reference}</p>
          </div>

          {/* Body */}
          {devotion.body?.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontFamily:"Georgia,serif", fontSize:14.5, color:"#3D3A36", lineHeight:1.8, margin:"0 0 14px" }}>{para}</p>
          ))}

          {/* Reflect */}
          <div style={{ background:WHITE, borderRadius:12, padding:16, margin:"16px 0", border:"1px dashed rgba(196,146,42,0.4)" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, letterSpacing:"0.12em", textTransform:"uppercase", margin:"0 0 8px" }}>Reflect</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic", color:CHARCOAL, margin:0, lineHeight:1.7 }}>{devotion.reflection}</p>
          </div>

          {/* Prayer */}
          <div style={{ background:"rgba(45,43,40,0.04)", borderRadius:12, padding:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <CrossIcon size={14}/>
              <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Closing Prayer</p>
            </div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic", color:"#3D3A36", margin:0, lineHeight:1.7 }}>{devotion.prayer}</p>
          </div>

          <div style={{ display:"flex", gap:10, marginTop:18 }}>
            <button onClick={() => shareDevotion(devotion)} style={{ flex:1, border:"1.5px solid rgba(45,43,40,0.2)", borderRadius:10, padding:12, fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, background:"transparent", cursor:"pointer" }}>Share</button>
          </div>

          <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:"16px 0 0", textAlign:"right" }}>
            Saved {formatDate(devotion.savedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SavedDevotionsScreen({ user, onBack }) {
  const [devotions,  setDevotions]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);

  useEffect(() => {
    DB.getSavedDevotions(user.uid)
      .then(setDevotions)
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (e, devotionId) => {
    e.stopPropagation();
    await DB.deleteSavedDevotion(user.uid, devotionId);
    setDevotions(prev => prev.filter(d => d.id !== devotionId));
    setConfirmId(null);
  };

  if (selected) {
    return <DevotionDetail devotion={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"28px 0 8px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, color:CHARCOAL, padding:0, lineHeight:1, marginLeft:-4 }}>‹</button>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:0 }}>Saved Devotions</h1>
      </div>
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:"0 0 20px" }}>
        {devotions.length > 0 ? `${devotions.length} saved devotion${devotions.length > 1 ? "s" : ""}` : "Your library"}
      </p>

      {loading && <LoadingState msg="Loading your devotions…" />}

      {!loading && devotions.length === 0 && (
        <div style={{ textAlign:"center", paddingTop:60 }}>
          <p style={{ fontSize:40, marginBottom:12 }}>📖</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:600, color:CHARCOAL, margin:"0 0 8px" }}>No saved devotions yet</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:LTGREY, lineHeight:1.6 }}>Generate a devotion and tap Save to build your library.</p>
        </div>
      )}

      {devotions.map(d => (
        <div
          key={d.id}
          onClick={() => setSelected(d)}
          style={{ background:"rgba(255,255,255,0.82)", borderRadius:16, padding:0, marginBottom:12, border:"1px solid rgba(196,146,42,0.18)", overflow:"hidden", cursor:"pointer", boxShadow:"0 2px 10px rgba(45,43,40,0.06)" }}
        >
          <div style={{ background:"linear-gradient(135deg,#C4922A,#E8B84B)", height:3 }} />
          <div style={{ padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <span style={{ display:"inline-block", background:"rgba(196,146,42,0.1)", color:GOLD, fontFamily:"Georgia,serif", fontSize:10, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", padding:"3px 10px", borderRadius:20, marginBottom:8 }}>
                {d.topic}
              </span>
              {confirmId === d.id ? (
                <div onClick={e => e.stopPropagation()} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY }}>Remove?</span>
                  <button onClick={e => handleDelete(e, d.id)} style={{ background:"rgba(200,60,60,0.1)", border:"1px solid rgba(200,60,60,0.3)", borderRadius:8, padding:"3px 10px", fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:"#C03C3C", cursor:"pointer" }}>Yes</button>
                  <button onClick={e => { e.stopPropagation(); setConfirmId(null); }} style={{ background:"rgba(176,168,152,0.15)", border:"1px solid rgba(176,168,152,0.3)", borderRadius:8, padding:"3px 10px", fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, cursor:"pointer" }}>No</button>
                </div>
              ) : (
                <button onClick={e => { e.stopPropagation(); setConfirmId(d.id); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:LTGREY, padding:"0 0 0 8px", lineHeight:1 }}>🗑</button>
              )}
            </div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, color:CHARCOAL, margin:"0 0 4px", lineHeight:1.3 }}>{d.title}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:GOLD, margin:"0 0 6px" }}>{d.scripture?.reference}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{formatDate(d.savedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
