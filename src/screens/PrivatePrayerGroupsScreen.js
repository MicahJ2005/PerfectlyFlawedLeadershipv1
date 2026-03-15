import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { css } from "../constants/styles";
import { HeartIcon } from "../components/icons";
import { GoldButton } from "../components/ui";

// ── Group Prayer Wall ─────────────────────────────────────────────────────────
function GroupPrayerWall({ group, user, onBack }) {
  const [prayers,       setPrayers]       = useState([]);
  const [showForm,      setShowForm]      = useState(false);
  const [text,          setText]          = useState("");
  const [isAnon,        setIsAnon]        = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const unsub = DB.subscribeToPrivateGroupPrayers(group.id, setPrayers);
    return () => unsub();
  }, [group.id]);

  const timeAgo = (ts) => {
    if (!ts?.toDate) return "";
    const secs = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (secs < 60)    return "Just now";
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const submitPrayer = async () => {
    if (!text.trim()) return;
    const displayName = user.displayName || user.email?.split("@")[0] || "Member";
    await DB.addPrivateGroupPrayer(group.id, {
      author: isAnon ? "Anonymous" : displayName,
      uid:    isAnon ? null : user.uid,
      text,
      isAnon,
    });
    setText("");
    setIsAnon(false);
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const toggleHeart = async (prayer) => {
    const hasPrayed = (prayer.prayedBy || []).includes(user.uid);
    await DB.togglePrivateGroupPrayed(group.id, prayer.id, user.uid, hasPrayed);
  };

  const deletePrayer = async (prayerId) => {
    await DB.deactivatePrivateGroupPrayer(group.id, prayerId);
    setConfirmDelete(null);
  };

  const memberCount  = (group.members || []).length;
  const isCreator    = group.createdBy === user.uid;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", position:"relative" }}>
      <div style={{ padding:"28px 20px 0", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, color:CHARCOAL, padding:0, lineHeight:1, marginLeft:-4 }}>‹</button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:CHARCOAL, margin:0 }}>{group.name}</h1>
            <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:0 }}>{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background:GOLD, border:"none", borderRadius:"50%", width:40, height:40, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(196,146,42,0.4)", flexShrink:0 }}>
            <span style={{ color:WHITE, fontSize:22, lineHeight:1 }}>+</span>
          </button>
        </div>

        {/* Group code badge */}
        {isCreator && (
          <div style={{ background:"rgba(196,146,42,0.1)", border:"1px dashed rgba(196,146,42,0.4)", borderRadius:10, padding:"10px 14px", marginTop:12, marginBottom:4, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>🔑</span>
            <div>
              <p style={{ fontFamily:"Georgia,serif", fontSize:10, color:MIDGREY, margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.08em" }}>Invite Code</p>
              <p style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:GOLD, margin:0, letterSpacing:"0.18em" }}>{group.code}</p>
            </div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:"0 0 0 auto", lineHeight:1.5 }}>Share this code{"\n"}to invite others</p>
          </div>
        )}

        {submitted && (
          <div style={{ background:"#E8F5E9", border:"1px solid #A5D6A7", borderRadius:10, padding:"10px 14px", marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>🙏</span>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#388E3C", margin:0 }}>Your prayer request has been shared.</p>
          </div>
        )}
        <div style={{ height:12 }} />
      </div>

      {/* Prayer list */}
      <div style={{ flex:1, overflowY:"auto", padding:"4px 20px 100px" }}>
        {prayers.length === 0 && (
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:LTGREY, fontStyle:"italic", textAlign:"center", paddingTop:60 }}>No prayer requests yet. Be the first to share.</p>
        )}
        {prayers.map(prayer => {
          const hasPrayed    = (prayer.prayedBy || []).includes(user.uid);
          const isOwner      = prayer.uid === user.uid;
          const isConfirming = confirmDelete === prayer.id;
          return (
            <div key={prayer.id} style={{ ...css.card, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`hsl(${(prayer.author?.charCodeAt(0) || 0) * 47 % 360},30%,75%)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, flexShrink:0 }}>
                  {prayer.author?.[0] || "?"}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:0 }}>{prayer.author}</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{timeAgo(prayer.createdAt)}</p>
                </div>
                {isOwner && !isConfirming && (
                  <button onClick={() => setConfirmDelete(prayer.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:LTGREY, fontSize:16, lineHeight:1 }}>✕</button>
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
                  <HeartIcon filled={hasPrayed} size={14} />
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
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Share what's on your heart…" rows={4}
              style={{ ...css.input, resize:"none", lineHeight:1.7, height:100, marginBottom:14 }} />
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:20 }}>
              <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} style={{ width:18, height:18, accentColor:GOLD }} />
              <span style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY }}>Post anonymously (displayed for 10 days)</span>
            </label>
            <GoldButton onClick={submitPrayer} disabled={!text.trim()}>Submit Prayer Request</GoldButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function PrivatePrayerGroupsScreen({ user, onBack }) {
  const [groups,      setGroups]      = useState([]);
  const [activeGroup, setActiveGroup] = useState(null); // group object or null
  const [showCreate,  setShowCreate]  = useState(false);
  const [showJoin,    setShowJoin]    = useState(false);
  const [newName,     setNewName]     = useState("");
  const [joinCode,    setJoinCode]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [created,     setCreated]     = useState(null); // { name, code } after creation

  useEffect(() => {
    const unsub = DB.subscribeToUserPrivateGroups(user.uid, setGroups);
    return () => unsub();
  }, [user.uid]);

  if (activeGroup) {
    return <GroupPrayerWall group={activeGroup} user={user} onBack={() => setActiveGroup(null)} />;
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "Member";

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { code } = await DB.createPrivateGroup(user.uid, newName.trim(), displayName);
      setCreated({ name: newName.trim(), code });
      setNewName("");
      setShowCreate(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError("");
    try {
      await DB.joinPrivateGroupByCode(user.uid, joinCode, displayName);
      setJoinCode("");
      setShowJoin(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (group) => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    await DB.leavePrivateGroup(user.uid, group.id);
  };

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"28px 0 8px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, color:CHARCOAL, padding:0, lineHeight:1, marginLeft:-4 }}>‹</button>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:0 }}>Private Groups</h1>
      </div>
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, lineHeight:1.6, margin:"0 0 20px" }}>
        Create a private prayer group and invite others with a unique code.
      </p>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:10, marginBottom:24 }}>
        <button onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }} style={{ flex:1, background:GOLD, border:"none", borderRadius:12, padding:"12px 0", fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color:WHITE, cursor:"pointer" }}>
          + Create Group
        </button>
        <button onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }} style={{ flex:1, background:"rgba(196,146,42,0.1)", border:`1.5px solid rgba(196,146,42,0.35)`, borderRadius:12, padding:"12px 0", fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color:GOLD, cursor:"pointer" }}>
          Join with Code
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background:"rgba(255,255,255,0.85)", borderRadius:16, padding:"18px 18px 20px", marginBottom:18, border:`1.5px solid rgba(196,146,42,0.25)` }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, margin:"0 0 12px" }}>New Group Name</p>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Thursday Morning Circle"
            style={{ ...css.input, marginBottom:12 }} />
          {error ? <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"#C05030", margin:"0 0 10px" }}>{error}</p> : null}
          <div style={{ display:"flex", gap:8 }}>
            <GoldButton onClick={handleCreate} disabled={loading || !newName.trim()}>{loading ? "Creating…" : "Create"}</GoldButton>
            <button onClick={() => { setShowCreate(false); setError(""); }} style={{ flex:1, background:"transparent", border:`1px solid ${LTGREY}`, borderRadius:12, padding:"12px 0", fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div style={{ background:"rgba(255,255,255,0.85)", borderRadius:16, padding:"18px 18px 20px", marginBottom:18, border:`1.5px solid rgba(196,146,42,0.25)` }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, margin:"0 0 12px" }}>Enter Group Code</p>
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. A3BX7K" maxLength={6}
            style={{ ...css.input, letterSpacing:"0.18em", fontWeight:700, marginBottom:12 }} />
          {error ? <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"#C05030", margin:"0 0 10px" }}>{error}</p> : null}
          <div style={{ display:"flex", gap:8 }}>
            <GoldButton onClick={handleJoin} disabled={loading || joinCode.length < 6}>{loading ? "Joining…" : "Join"}</GoldButton>
            <button onClick={() => { setShowJoin(false); setError(""); }} style={{ flex:1, background:"transparent", border:`1px solid ${LTGREY}`, borderRadius:12, padding:"12px 0", fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Success banner after group creation */}
      {created && (
        <div style={{ background:"rgba(196,146,42,0.1)", border:"1px solid rgba(196,146,42,0.35)", borderRadius:14, padding:"14px 18px", marginBottom:18 }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:"0 0 4px" }}>"{created.name}" created!</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:"0 0 8px" }}>Share this code to invite members:</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:GOLD, letterSpacing:"0.2em", margin:"0 0 8px" }}>{created.code}</p>
          <button onClick={() => setCreated(null)} style={{ background:"none", border:"none", fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, cursor:"pointer", padding:0 }}>Dismiss</button>
        </div>
      )}

      {/* Group list */}
      {groups.length === 0 && !showCreate && !showJoin && (
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:LTGREY, fontStyle:"italic", textAlign:"center", paddingTop:20 }}>
          You haven't joined any private groups yet.
        </p>
      )}
      {groups.map(group => {
        const memberCount = (group.members || []).length;
        const isCreator   = group.createdBy === user.uid;
        return (
          <div key={group.id} onClick={() => setActiveGroup(group)}
            style={{ background:"rgba(255,255,255,0.7)", borderRadius:14, padding:"16px 18px", marginBottom:10, border:"1.5px solid rgba(196,146,42,0.18)", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(196,146,42,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🔒</div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:CHARCOAL, margin:"0 0 2px" }}>{group.name}</p>
              <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:MIDGREY, margin:0 }}>
                {memberCount} member{memberCount !== 1 ? "s" : ""}
                {isCreator ? " · Admin" : ""}
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
              <span style={{ color:LTGREY, fontSize:16 }}>›</span>
              <button
                onClick={e => { e.stopPropagation(); handleLeave(group); }}
                style={{ background:"none", border:`1px solid rgba(192,80,48,0.3)`, borderRadius:8, padding:"3px 8px", fontFamily:"Georgia,serif", fontSize:10, color:"#C05030", cursor:"pointer" }}
              >
                Leave
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
