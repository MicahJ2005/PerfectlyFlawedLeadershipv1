import { useState, useEffect } from "react";
import { DB } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, RUST, WHITE } from "../constants/colors";
import { useTheme } from "../context/ThemeContext";
import { PrayerGroupsScreen }        from "./PrayerGroupsScreen";
import { SavedDevotionsScreen }       from "./SavedDevotionsScreen";
import { AppSettingsScreen }          from "./AppSettingsScreen";
import { PrivatePrayerGroupsScreen }  from "./PrivatePrayerGroupsScreen";

const VAPID_PUBLIC_KEY = "BM1JS_k8Me_v-rdRzCZ819lc3Xwy5FCLzCes01DigNU-lBIueOMZpDCeNWFrPuzFG8eC2lPebxs-twDQaEcUqFo";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function ProfileScreen({ user, onLogout, setTab }) {
  const { darkMode } = useTheme();
  const [stats,          setStats]          = useState({ devotions:0, sessions:0, prayed:0 });
  const [subStatus,      setSubStatus]      = useState(null);
  const [portalLoading,  setPortalLoading]  = useState(false);
  const [subScreen,      setSubScreen]      = useState(null);
  const [notifEnabled,   setNotifEnabled]   = useState(false);
  const [notifLoading,   setNotifLoading]   = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([DB.getSavedDevotions(user.uid), DB.getLeadershipSessions(user.uid), DB.getPrayedCount(user.uid)])
      .then(([devs, sessions, prayed]) => setStats({ devotions:devs.length, sessions:sessions.length, prayed }))
      .catch(() => {});
    const unsub = DB.subscribeToUser(user.uid, data => setSubStatus(data.subscriptionStatus || null));
    DB.hasPushSubscription(user.uid).then(setNotifEnabled);
    return () => unsub();
  }, [user]);

  const toggleNotifications = async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      if (notifEnabled) {
        await DB.removePushSubscription(user.uid);
        setNotifEnabled(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { alert("Please allow notifications in your browser settings."); return; }
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        await DB.savePushSubscription(user.uid, sub.toJSON());
        setNotifEnabled(true);
      }
    } catch (e) {
      alert("Could not update notification settings: " + e.message);
    } finally {
      setNotifLoading(false);
    }
  };

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
  if (subScreen === "groups")         return <PrayerGroupsScreen        user={user} onBack={() => setSubScreen(null)} />;
  if (subScreen === "privateGroups")  return <PrivatePrayerGroupsScreen  user={user} onBack={() => setSubScreen(null)} />;
  if (subScreen === "devotions")      return <SavedDevotionsScreen       user={user} onBack={() => setSubScreen(null)} />;
  if (subScreen === "settings")       return <AppSettingsScreen                onBack={() => setSubScreen(null)} />;

  const isGoogle = user?.providerData?.[0]?.providerId === "google.com";
  const initial  = (user?.displayName || user?.email || "?")[0].toUpperCase();

  const rows = [
    { icon:"🔔", title:"Notifications",       sub: notifLoading ? "Updating…" : notifEnabled ? "Tap to disable" : "Get notified of new prayers", onPress: toggleNotifications, badge: notifEnabled ? "On" : null },
    { icon:"🙏", title:"My Prayer Groups",   sub:"Manage group memberships",        onPress: () => setSubScreen("groups")          },
    { icon:"🔒", title:"Private Groups",     sub:"Create or join with a code",      onPress: () => setSubScreen("privateGroups")   },
    { icon:"📖", title:"Saved Devotions",    sub:"View your saved library",         onPress: () => setSubScreen("devotions")       },
    { icon:"⚙️", title:"App Settings & Help", sub:"Theme, font size, language",    onPress: () => setSubScreen("settings")        },
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
        {[
          ["🙏", stats.prayed,    "Prayers",   () => setTab(3)],
          ["📖", stats.devotions, "Devotions",  () => setSubScreen("devotions")],
          ["🧭", stats.sessions,  "Sessions",   () => setTab(2)],
        ].map(([icon, n, label, onPress]) => (
          <div key={label} onClick={onPress} style={{ background:"rgba(255,255,255,0.7)", borderRadius:14, padding:"14px 10px", textAlign:"center", border:"1px solid rgba(196,146,42,0.15)", cursor:"pointer" }}>
            <p style={{ fontSize:18, margin:"0 0 4px" }}>{icon}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:GOLD, margin:"0 0 3px" }}>{n}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:10, color:MIDGREY, margin:0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Firebase status */}
      <div style={{ background:"rgba(232,248,232,0.8)", borderRadius:14, padding:"14px 18px", marginBottom:18, border:"1px solid rgba(130,190,130,0.4)" }}>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:"#2A6A2A", margin:"0 0 3px", letterSpacing:"0.08em", textTransform:"uppercase" }}>✓ Secure Connection</p>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"#4A8A4A", margin:0, lineHeight:1.6 }}>Your prayers, devotions, and leadership sessions are saved securely in real time.</p>
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
      {rows.map(({ icon, title, sub, onPress, badge }) => (
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
          {badge && <span style={{ background:"rgba(196,146,42,0.15)", color:GOLD, fontFamily:"Georgia,serif", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>{badge}</span>}
          {onPress && <span style={{ color:LTGREY, fontSize:16 }}>›</span>}
        </div>
      ))}

      <button onClick={() => {
        const subject = encodeURIComponent("You should check out Perfectly Flawed Leadership");
        const body = encodeURIComponent(
          "Hey,\n\nI've been using the Perfectly Flawed Leadership app and thought you might find it meaningful too.\n\n" +
          "It's a faith-based leadership tool with daily devotions, a prayer wall, and an leadership advisor — all grounded in Scripture.\n\n" +
          "Check it out:\n" +
          "App: https://devo4me.web.app\n" +
          "Website: https://perfectlyflawedleadership.com\n\n" +
          "Hope it encourages you!"
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }} style={{ width:"100%", marginTop:10, background:"rgba(196,146,42,0.08)", border:"1.5px solid rgba(196,146,42,0.3)", borderRadius:13, padding:14, fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:GOLD, cursor:"pointer" }}>
        Invite a Friend
      </button>

      <button onClick={onLogout} style={{ width:"100%", marginTop:10, background:"transparent", border:"1.5px solid rgba(220,80,80,0.3)", borderRadius:13, padding:14, fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:RUST, cursor:"pointer" }}>
        Sign Out
      </button>
    </div>
  );
}
