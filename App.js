// ─────────────────────────────────────────────────────────────────────────────
// Perfectly Flawed Leadership — Firebase Edition
// Project: devo4me
//
// SETUP (run once in your project folder):
//   npm install firebase
//
// FIREBASE CONSOLE CHECKLIST:
//   1. Authentication → Sign-in method → Enable "Email/Password"
//   2. Authentication → Sign-in method → Enable "Google"
//   3. Firestore Database → Create database → Start in test mode
//
// FIRESTORE COLLECTIONS (auto-created on first write):
//   /users/{uid}
//   /users/{uid}/savedDevotions/{id}
//   /users/{uid}/leadershipSessions/{id}
//   /prayerRequests/{id}
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, DB } from "./src/config/firebase";
import { CREAM, CHARCOAL, GOLD, LTGREY } from "./src/constants/colors";
import { HomeIcon, BookIcon, AdvisorIcon, UsersIcon, ProfileIcon } from "./src/components/icons";
import { LoadingState } from "./src/components/ui";
import { InstallBanner } from "./src/components/InstallBanner";
import { usePWA } from "./src/hooks/usePWA";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { LoginScreen }    from "./src/screens/LoginScreen";
import { SignupScreen }   from "./src/screens/SignupScreen";
import { HomeScreen }     from "./src/screens/HomeScreen";
import { DevotionScreen } from "./src/screens/DevotionScreen";
import { AdvisorScreen }  from "./src/screens/AdvisorScreen";
import { PrayerScreen }   from "./src/screens/PrayerScreen";
import { ProfileScreen }  from "./src/screens/ProfileScreen";
import { PaywallScreen }  from "./src/screens/PaywallScreen";

function AppContent() {
  const { darkMode } = useTheme();
  const [user,         setUser]         = useState(undefined); // undefined = checking auth
  const [authScreen,   setAuthScreen]   = useState("login");
  const [tab,          setTab]          = useState(0);
  const [subscribed,   setSubscribed]   = useState(false);
  const [pendingTopic, setPendingTopic] = useState(null);
  const { installPrompt, isInstalled, triggerInstall } = usePWA();

  useEffect(() => {
    let unsubUser = null;
    const unsubAuth = onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser);
      if (unsubUser) { unsubUser(); unsubUser = null; }
      if (firebaseUser) {
        unsubUser = DB.subscribeToUser(firebaseUser.uid, data => {
          setSubscribed(data.subscribed === true);
        });
      } else {
        setSubscribed(false);
      }
    });
    return () => { unsubAuth(); if (unsubUser) unsubUser(); };
  }, []);

  const handleLogout = async () => { await signOut(auth); setTab(0); };

  const tabs = [
    { label:"Home",     Icon:HomeIcon     },
    { label:"Devotion", Icon:BookIcon     },
    { label:"Advisor",  Icon:AdvisorIcon  },
    { label:"Prayer",   Icon:UsersIcon    },
    { label:"Profile",  Icon:ProfileIcon  },
  ];

  return (
    <div style={{ width:"100%", maxWidth:390, margin:"0 auto", height:"100dvh", background:CREAM, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 0 60px rgba(45,43,40,0.25)", filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet"/>

      {/* Status bar */}
      {/* <div style={{ height:44, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0 }}>
        <span style={{ fontFamily:"system-ui", fontSize:14, fontWeight:600, color:CHARCOAL }}>{new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" })}</span>
        <div style={{ width:16, height:10, border:`1.5px solid ${CHARCOAL}`, borderRadius:2, position:"relative" }}>
          <div style={{ position:"absolute", left:1, top:1, bottom:1, right:3, background:CHARCOAL, borderRadius:1 }}/>
        </div>
      </div> */}

      {/* Content area */}
      <div style={{ flex:1, overflow:"hidden", position:"relative" }}>

        {/* Auth loading */}
        {user === undefined && (
          <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <LoadingState msg="Loading…" />
          </div>
        )}

        {/* Auth screens */}
        {user === null && (
          authScreen === "login"
            ? <LoginScreen  onSwitch={() => setAuthScreen("signup")} />
            : <SignupScreen onSwitch={() => setAuthScreen("login")}  />
        )}

        {/* App screens */}
        {user && (
          <>
            {tab === 0 && <HomeScreen     user={user} setTab={setTab} onTopicSelect={t => { setPendingTopic(t); setTab(1); }} />}
            {tab === 1 && (subscribed ? <DevotionScreen user={user} pendingTopic={pendingTopic} onTopicConsumed={() => setPendingTopic(null)} /> : <PaywallScreen user={user} featureName="Daily Devotion" />)}
            {tab === 2 && (subscribed ? <AdvisorScreen  user={user} /> : <PaywallScreen user={user} featureName="Leadership Advisor" />)}
            {tab === 3 && <PrayerScreen   user={user} />}
            {tab === 4 && <ProfileScreen  user={user} onLogout={handleLogout} />}
          </>
        )}
      </div>

      {/* PWA install banner */}
      {user && !isInstalled && (
        <InstallBanner installPrompt={installPrompt} triggerInstall={triggerInstall} />
      )}

      {/* Bottom nav — only when logged in */}
      {user && (
        <div style={{ height:80, background:"rgba(253,250,245,0.97)", backdropFilter:"blur(20px)", borderTop:"1px solid rgba(196,146,42,0.2)", display:"flex", alignItems:"center", justifyContent:"space-around", padding:"0 10px 8px", flexShrink:0, boxShadow:"0 -4px 20px rgba(45,43,40,0.06)" }}>
          {tabs.map(({ label, Icon }, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"8px 12px", position:"relative" }}>
              {tab === i && <div style={{ position:"absolute", top:-1, left:"50%", transform:"translateX(-50%)", width:24, height:2, background:GOLD, borderRadius:1 }}/>}
              <Icon a={tab === i} />
              <span style={{ fontFamily:"Georgia,serif", fontSize:10, fontWeight:600, letterSpacing:"0.05em", color: tab===i ? GOLD : LTGREY }}>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return <ThemeProvider><AppContent /></ThemeProvider>;
}
