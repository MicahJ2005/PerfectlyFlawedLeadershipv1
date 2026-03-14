import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { GROUPS } from "../constants/data";

export function PrayerGroupsScreen({ user, onBack }) {
  const [userGroups, setUserGroups] = useState([]);
  const [saving,     setSaving]     = useState(null); // group name being toggled

  useEffect(() => {
    const unsub = DB.subscribeToUser(user.uid, data => setUserGroups(data.groups || []));
    return () => unsub();
  }, [user]);

  const toggle = async (group) => {
    setSaving(group);
    const inGroup = userGroups.includes(group);
    const updated = inGroup ? userGroups.filter(g => g !== group) : [...userGroups, group];
    await DB.saveUser(user.uid, { groups: updated });
    setSaving(null);
  };

  const groupIcons = {
    "Morning Warriors": "🌅",
    "Women's Circle":   "🌸",
    "Leadership Team":  "🧭",
    "General":          "🙏",
    "Men's Brotherhood":"⚔️",
    "Family Roots":     "👨‍👩‍👧‍👦",
    "Evening Embers":   "🌙",
    "Community Table":  "🌍",
  };

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"28px 0 8px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:26, color:CHARCOAL, padding:0, lineHeight:1, marginLeft:-4 }}>‹</button>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:0 }}>My Prayer Groups</h1>
      </div>
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, lineHeight:1.6, margin:"0 0 24px" }}>
        Select the groups you belong to. Their prayer requests will be highlighted in your Prayer Wall filter.
      </p>

      {GROUPS.map(group => {
        const inGroup = userGroups.includes(group);
        const busy    = saving === group;
        return (
          <div
            key={group}
            onClick={() => !busy && toggle(group)}
            style={{ display:"flex", alignItems:"center", gap:14, background: inGroup ? "rgba(196,146,42,0.08)" : "rgba(255,255,255,0.7)", borderRadius:14, padding:"16px 18px", marginBottom:10, border:`1.5px solid ${inGroup ? GOLD : "rgba(196,146,42,0.15)"}`, cursor:"pointer" }}
          >
            <span style={{ fontSize:22 }}>{groupIcons[group] || "🙏"}</span>
            <p style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:600, color:CHARCOAL, margin:0, flex:1 }}>{group}</p>
            {/* Checkbox */}
            <div style={{ width:26, height:26, borderRadius:13, border:`2px solid ${inGroup ? GOLD : LTGREY}`, background: inGroup ? GOLD : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity: busy ? 0.5 : 1 }}>
              {inGroup && <span style={{ color:WHITE, fontSize:14, lineHeight:1 }}>✓</span>}
            </div>
          </div>
        );
      })}

      <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, textAlign:"center", marginTop:16, lineHeight:1.6 }}>
        {userGroups.length === 0
          ? "No groups selected — the Prayer Wall shows all groups."
          : `Joined ${userGroups.length} group${userGroups.length > 1 ? "s" : ""}.`}
      </p>
    </div>
  );
}
