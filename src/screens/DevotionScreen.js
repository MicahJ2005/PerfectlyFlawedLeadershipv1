import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { css } from "../constants/styles";
import { TOPICS } from "../constants/data";
import { CompassIcon, CrossIcon } from "../components/icons";
import { GoldButton, LoadingState, Divider } from "../components/ui";
import { SavedDevotionsScreen, DevotionDetail } from "./SavedDevotionsScreen";

export function DevotionScreen({ user, pendingTopic, onTopicConsumed }) {
  const [topic,          setTopic]          = useState("");
  const [devotion,       setDevotion]       = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState(null);
  const [recentDevotions,  setRecentDevotions]  = useState([]);
  const [showHistory,      setShowHistory]      = useState(false);
  const [selectedDevotion, setSelectedDevotion] = useState(null);

  useEffect(() => {
    if (pendingTopic) {
      setTopic(pendingTopic);
      onTopicConsumed?.();
    }
  }, [pendingTopic]);

  useEffect(() => {
    if (!user) return;
    DB.getSavedDevotions(user.uid).then(all => setRecentDevotions(all.slice(0, 5)));
  }, [user]);

  const generate = async (forceTopic) => {
    const t = forceTopic || topic || TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setLoading(true); setDevotion(null); setSaved(false); setError(null);
    try {
      const API = process.env.NODE_ENV === "development" ? "http://localhost:3001" : "";
      const res = await fetch(`${API}/api/devotion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("API Error:", res.status, errorData);
        throw new Error(`API Error: ${res.status} - ${errorData.error || res.statusText}`);
      }
      const parsed = await res.json();
      parsed.topic = t;
      setDevotion(parsed);
      if (forceTopic) setTopic(forceTopic);
    } catch (err) {
      console.error("Devotion generation error:", err.message);
      setError(`Could not generate devotion: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveDevotion = async () => {
    if (!devotion || !user) return;
    setSaved(true);
    try {
      await DB.saveDevotions(user.uid, {
        title: devotion.title, topic: devotion.topic,
        scripture: devotion.scripture, body: devotion.body,
        reflection: devotion.reflection, prayer: devotion.prayer,
      });
    } catch { /* silent — already marked saved in UI */ }
  };

  if (selectedDevotion) {
    return <DevotionDetail devotion={selectedDevotion} onBack={() => setSelectedDevotion(null)} />;
  }
  if (showHistory) {
    return <SavedDevotionsScreen user={user} onBack={() => setShowHistory(false)} />;
  }

  const formatDate = (ts) => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleDateString("en-US", { month:"short", day:"numeric" });
  };

  return (
    <div style={{ padding:"0 20px 100px", overflowY:"auto", height:"100%" }}>
      <div style={{ textAlign:"center", padding:"32px 0 24px" }}>
        <CompassIcon size={44} />
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:CHARCOAL, margin:"12px 0 4px" }}>Daily Devotion</h1>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#7A7672", margin:0 }}>Led by Scripture. Shaped by grace.</p>
      </div>

      <div style={css.card}>
        <label style={css.label}>Enter a Topic</label>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==="Enter" && topic && generate()}
            placeholder="e.g. perseverance, humility…"
            style={{ ...css.input, flex:1 }} />
          <button onClick={() => generate()} disabled={!topic || loading}
            style={{ background: topic && !loading ? GOLD : "#D4C5A5", color:WHITE, border:"none", borderRadius:10, padding:"0 18px", fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, cursor: topic && !loading ? "pointer" : "default" }}>
            Go
          </button>
        </div>
        <Divider />
        <GoldButton outline onClick={() => generate(TOPICS[Math.floor(Math.random()*TOPICS.length)])} disabled={loading}>✦  Surprise Me</GoldButton>
      </div>

      {/* Recent devotions */}
      {recentDevotions.length > 0 && !devotion && !loading && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:0 }}>Recent Devotions</p>
            <button onClick={() => setShowHistory(true)} style={{ background:"none", border:"none", fontFamily:"Georgia,serif", fontSize:12, color:GOLD, cursor:"pointer", padding:0, fontWeight:600 }}>View all ›</button>
          </div>
          {recentDevotions.map(d => (
            <div key={d.id} onClick={() => setSelectedDevotion(d)}
              style={{ background:"rgba(255,255,255,0.75)", borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid rgba(196,146,42,0.15)", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color:CHARCOAL, margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.title}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:GOLD, margin:"0 0 2px" }}>{d.scripture?.reference}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:10, color:LTGREY, margin:0 }}>{d.topic} · {formatDate(d.savedAt)}</p>
              </div>
              <span style={{ color:MIDGREY, fontSize:16, flexShrink:0 }}>›</span>
            </div>
          ))}
        </div>
      )}

      {loading && <LoadingState msg="Preparing your devotion…" />}
      {error   && <div style={{ background:"#FFF0F0", border:"1px solid #F5C5C5", borderRadius:12, padding:16, textAlign:"center" }}><p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#C05050", margin:0 }}>{error}</p></div>}

      {devotion && !loading && (
        <div style={{ ...css.card, padding:0, overflow:"hidden" }}>
          <div style={{ background:"linear-gradient(135deg,#C4922A,#E8B84B)", height:5 }}/>
          <div style={{ padding:"22px 20px" }}>
            <span style={{ display:"inline-block", background:"rgba(196,146,42,0.12)", color:GOLD, fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, marginBottom:14 }}>
              {devotion.topic}
            </span>
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
                <CrossIcon size={14}/><p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Closing Prayer</p>
              </div>
              <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic", color:"#3D3A36", margin:0, lineHeight:1.7 }}>{devotion.prayer}</p>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              <button onClick={saveDevotion} style={{ flex:1, border:`1.5px solid ${saved ? GOLD : "rgba(196,146,42,0.3)"}`, borderRadius:10, padding:12, fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color: saved ? WHITE : GOLD, background: saved ? GOLD : "transparent", cursor:"pointer" }}>
                {saved ? "✓ Saved to Firebase" : "Save"}
              </button>
              <button style={{ flex:1, border:"1.5px solid rgba(45,43,40,0.2)", borderRadius:10, padding:12, fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, background:"transparent", cursor:"pointer" }}>Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
