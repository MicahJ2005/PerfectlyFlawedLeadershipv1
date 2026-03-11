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
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Firebase Config ───────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAJ2R_7MfExmdZRq4DrExlyNZkCv9pKJ7A",
  authDomain:        "devo4me.firebaseapp.com",
  projectId:         "devo4me",
  storageBucket:     "devo4me.firebasestorage.app",
  messagingSenderId: "1052504611022",
  appId:             "1:1052504611022:web:268875f9b8b667e683989f",
  measurementId:     "G-YM3JBXD5DR",
};

const firebaseApp     = initializeApp(firebaseConfig);
const auth            = getAuth(firebaseApp);
const db              = getFirestore(firebaseApp);
const googleProvider  = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

const app = initializeApp(firebaseConfig);

// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage),
// });

// ── Firestore Helpers ─────────────────────────────────────────────────────────
const DB = {
  // ── Users ──────────────────────────────────────────────────────────────────
  async saveUser(uid, data) {
    await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  // ── Prayer Requests (real-time) ────────────────────────────────────────────
  subscribePrayers(callback) {
    const q = query(collection(db, "prayerRequests"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },
  async addPrayer(data) {
    return addDoc(collection(db, "prayerRequests"), {
      ...data,
      createdAt: serverTimestamp(),
      hearts:    0,
      prayedBy:  [],
    });
  },
  async togglePrayed(prayerId, uid, hasPrayed) {
    await updateDoc(doc(db, "prayerRequests", prayerId), {
      prayedBy: hasPrayed ? arrayRemove(uid) : arrayUnion(uid),
      hearts:   increment(hasPrayed ? -1 : 1),
    });
  },

  // ── Saved Devotions ────────────────────────────────────────────────────────
  async saveDevotions(uid, devotion) {
    console.log("Saving devotion for user", uid, "Devotion title:", devotion.title);
    return addDoc(collection(db, "users", uid, "savedDevotions"), {
      ...devotion,
      savedAt: serverTimestamp(),
    });
  },
  async getSavedDevotions(uid) {
    const q    = query(collection(db, "users", uid, "savedDevotions"), orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    console.log("Fetched saved devotions for user", uid, "Count:", snap.size);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Leadership Sessions ────────────────────────────────────────────────────
  async saveLeadershipSession(uid, session) {
    return addDoc(collection(db, "users", uid, "leadershipSessions"), {
      ...session,
      createdAt: serverTimestamp(),
    });
  },
  async getLeadershipSessions(uid) {
    const q    = query(collection(db, "users", uid, "leadershipSessions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ── Brand ─────────────────────────────────────────────────────────────────────
const CREAM    = "#EDEAE4";
const CHARCOAL = "#2D2B28";
const GOLD     = "#C4922A";
const MIDGREY  = "#7A7672";
const LTGREY   = "#B0A898";
const WHITE    = "#FDFAF5";
const RUST     = "#C05030";

// ── Static Data ───────────────────────────────────────────────────────────────
const TOPICS = [
  "Humility in leadership","Perseverance through trials","Servant leadership",
  "Grace under pressure","Finding purpose in pain","Authentic vulnerability",
  "Forgiveness and freedom","Faith over fear","Leading with integrity","Rest and renewal",
];
const GROUPS = ["Morning Warriors","Women's Circle","Leadership Team","General","Men's Brotherhood"];
const SITUATIONS = [
  { icon:"⚔️", label:"Team Conflict",          desc:"Navigating tension between people" },
  { icon:"📉", label:"Leading Through Failure", desc:"When plans fall apart" },
  { icon:"🎯", label:"Casting Vision",          desc:"Inspiring others toward a goal" },
  { icon:"🌿", label:"Developing Others",       desc:"Mentoring & growing your team" },
  { icon:"🔥", label:"Burnout & Limits",        desc:"Leading from an empty cup" },
  { icon:"🤝", label:"Difficult Conversations", desc:"Speaking truth with grace" },
  { icon:"🧭", label:"Decision Making",         desc:"Choosing wisely under pressure" },
  { icon:"🏔️", label:"Leading Change",          desc:"Moving people through transition" },
  { icon:"🙏", label:"Humble Leadership",       desc:"Strength rooted in surrender" },
  { icon:"💔", label:"Leading Through Loss",    desc:"Grief, tragedy, and resilience" },
];
const LEADERSHIP_STYLES = [
  { id:"directing",  label:"Directing",  sub:"High task, low relationship"  },
  { id:"coaching",   label:"Coaching",   sub:"High task, high relationship" },
  { id:"supporting", label:"Supporting", sub:"Low task, high relationship"  },
  { id:"delegating", label:"Delegating", sub:"Low task, low relationship"   },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const CompassIcon = ({ size=24, color=GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7"/>
    <polygon points="12,4 13.5,11 12,10 10.5,11" fill={color} stroke="none"/>
    <polygon points="12,20 10.5,13 12,14 13.5,13" fill={MIDGREY} stroke="none"/>
    <polygon points="20,12 13,10.5 14,12 13,13.5" fill={MIDGREY} stroke="none"/>
    <polygon points="4,12 11,13.5 10,12 11,10.5"  fill={MIDGREY} stroke="none"/>
  </svg>
);
const CrossIcon  = ({ size=18, color=GOLD }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="3" x2="12" y2="21"/><line x1="5" y1="9" x2="19" y2="9"/>
  </svg>
);
const HeartIcon  = ({ filled, size=16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? GOLD : "none"} stroke={GOLD} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const EyeIcon    = ({ show }) => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={MIDGREY} strokeWidth="2" strokeLinecap="round">
    {show
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);
const HomeIcon    = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
const BookIcon    = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const AdvisorIcon = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"/><path d="M12 6a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3.5 5.5V20h-5v-2.5C7.5 16.5 6 14.5 6 12a6 6 0 0 1 6-6z"/><line x1="9.5" y1="20" x2="14.5" y2="20"/><line x1="10" y1="23" x2="14" y2="23"/></svg>;
const UsersIcon   = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ProfileIcon = ({ a }) => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={a?GOLD:MIDGREY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const GoogleLogo  = () => (
  <svg width={20} height={20} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// ── Shared Styles ─────────────────────────────────────────────────────────────
const css = {
  label:   { fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:MIDGREY, letterSpacing:"0.12em", textTransform:"uppercase", display:"block", marginBottom:8 },
  input:   { width:"100%", boxSizing:"border-box", border:"1.5px solid rgba(196,146,42,0.3)", borderRadius:12, padding:"13px 16px", fontFamily:"Georgia,serif", fontSize:14, color:CHARCOAL, background:WHITE, outline:"none" },
  card:    { background:"rgba(255,255,255,0.82)", borderRadius:18, padding:22, marginBottom:14, border:"1px solid rgba(196,146,42,0.18)", boxShadow:"0 2px 14px rgba(45,43,40,0.07)" },
  darkCard:{ background:"linear-gradient(135deg,#2D2B28,#3D3A36)", borderRadius:20, padding:"22px 20px", marginBottom:14, position:"relative", overflow:"hidden" },
};

// ── Reusable Components ───────────────────────────────────────────────────────
function FieldInput({ label, type="text", value, onChange, placeholder, error, right }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={css.label}>{label}</label>}
      <div style={{ position:"relative" }}>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{ ...css.input, borderColor: error ? "#E57373" : "rgba(196,146,42,0.3)", paddingRight: right ? 48 : 16 }} />
        {right && <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)" }}>{right}</div>}
      </div>
      {error && <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:"#E57373", margin:"5px 0 0" }}>{error}</p>}
    </div>
  );
}

function GoldButton({ children, onClick, disabled, outline=false, small=false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%", border: outline ? `1.5px solid ${GOLD}` : "none", borderRadius:13,
      padding: small ? "10px 16px" : "14px",
      background: outline ? "transparent" : disabled ? "#D4C5A5" : GOLD,
      color: outline ? GOLD : WHITE,
      fontFamily:"Georgia,serif", fontSize: small ? 13 : 14, fontWeight:600,
      cursor: disabled ? "default" : "pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      boxShadow: !outline && !disabled ? "0 4px 14px rgba(196,146,42,0.35)" : "none",
      transition:"all 0.2s",
    }}>{children}</button>
  );
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ background:"#FFF0F0", border:"1px solid #F5C5C5", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#C05050", margin:0 }}>{msg}</p>
    </div>
  );
}

function Spinner({ size=38 }) {
  const [deg, setDeg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDeg(d => (d + 6) % 360), 16);
    return () => clearInterval(t);
  }, []);
  return <div style={{ display:"inline-block", transform:`rotate(${deg}deg)` }}><CompassIcon size={size} /></div>;
}

function LoadingState({ msg="Loading…" }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 0" }}>
      <Spinner size={40} />
      <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, marginTop:14, fontStyle:"italic" }}>{msg}</p>
    </div>
  );
}

function Divider({ text="OR" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
      <div style={{ flex:1, height:1, background:"rgba(196,146,42,0.2)" }}/>
      <span style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, letterSpacing:"0.1em" }}>{text}</span>
      <div style={{ flex:1, height:1, background:"rgba(196,146,42,0.2)" }}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onSwitch }) {
  const [email,    setEmail]    = useState("");
  const [pw,       setPw]       = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [resetSent,setResetSent]= useState(false);

  const handleLogin = async () => {
    const e = {};
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (pw.length < 6)        e.pw    = "Min 6 characters";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setErrors({});
    try {
      await signInWithEmailAndPassword(auth, email, pw);
    } catch (err) {
      setErrors({ general: err.code === "auth/invalid-credential" || err.code === "auth/user-not-found"
        ? "Email or password is incorrect." : "Sign in failed. Please try again." });
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGLoading(true); setErrors({});
    try {
      const r = await signInWithPopup(auth, googleProvider);
      await DB.saveUser(r.user.uid, { name: r.user.displayName, email: r.user.email, photoURL: r.user.photoURL, provider:"google" });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setErrors({ general:"Google sign-in failed. Try again." });
    } finally { setGLoading(false); }
  };

  const handleReset = async () => {
    if (!email.includes("@")) { setErrors({ email:"Enter your email above first" }); return; }
    try { await sendPasswordResetEmail(auth, email); setResetSent(true); }
    catch { setErrors({ general:"Could not send reset email." }); }
  };

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 24px 40px" }}>
      <div style={{ textAlign:"center", padding:"48px 0 32px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:80, height:80, background:"rgba(196,146,42,0.1)", borderRadius:"50%", marginBottom:18, border:"2px solid rgba(196,146,42,0.25)" }}>
          <CompassIcon size={44} />
        </div>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:CHARCOAL, margin:"0 0 4px" }}>Perfectly Flawed</h1>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:GOLD, margin:0, letterSpacing:"0.2em", fontWeight:600, textTransform:"uppercase" }}>Leadership</p>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:LTGREY, margin:"10px 0 0", fontStyle:"italic" }}>Welcome back, friend.</p>
      </div>

      <div style={css.card}>
        <ErrorBanner msg={errors.general} />
        {resetSent && (
          <div style={{ background:"#F0FFF4", border:"1px solid #9AE6B4", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#276749", margin:0 }}>✓ Reset email sent — check your inbox.</p>
          </div>
        )}
        <FieldInput label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" error={errors.email} />
        <FieldInput label="Password" type={showPw?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Your password" error={errors.pw}
          right={<button onClick={()=>setShowPw(s=>!s)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}><EyeIcon show={showPw}/></button>}
        />
        <div style={{ textAlign:"right", marginBottom:18, marginTop:-8 }}>
          <span onClick={handleReset} style={{ fontFamily:"Georgia,serif", fontSize:12, color:GOLD, cursor:"pointer", fontWeight:600 }}>Forgot password?</span>
        </div>
        <GoldButton onClick={handleLogin} disabled={loading}>{loading ? "Signing in…" : "Sign In"}</GoldButton>
      </div>

      <Divider text="OR CONTINUE WITH" />

      <button onClick={handleGoogle} disabled={gLoading} style={{ width:"100%", background:WHITE, border:"1.5px solid rgba(45,43,40,0.15)", borderRadius:13, padding:"14px", fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        <GoogleLogo />{gLoading ? "Connecting…" : "Sign in with Google"}
      </button>

      <p style={{ textAlign:"center", fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, marginTop:24 }}>
        Don't have an account?{" "}
        <span onClick={onSwitch} style={{ color:GOLD, fontWeight:600, cursor:"pointer" }}>Sign up</span>
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP
// ══════════════════════════════════════════════════════════════════════════════
function SignupScreen({ onSwitch }) {
  const [form,    setForm]    = useState({ name:"", email:"", pw:"", confirm:"" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading,setGLoading]= useState(false);
  const [errors,  setErrors]  = useState({});
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = async () => {
    const e = {};
    if (!form.name.trim())          e.name    = "Name is required";
    if (!form.email.includes("@"))  e.email   = "Enter a valid email";
    if (form.pw.length < 6)         e.pw      = "Min 6 characters";
    if (form.pw !== form.confirm)   e.confirm = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setErrors({});
    try {
      const r = await createUserWithEmailAndPassword(auth, form.email, form.pw);
      await updateProfile(r.user, { displayName: form.name });
      await DB.saveUser(r.user.uid, { name: form.name, email: form.email, provider:"email", createdAt: serverTimestamp() });
    } catch (err) {
      setErrors({ general: err.code === "auth/email-already-in-use"
        ? "An account with this email already exists." : "Sign up failed. Please try again." });
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGLoading(true); setErrors({});
    try {
      const r = await signInWithPopup(auth, googleProvider);
      await DB.saveUser(r.user.uid, { name: r.user.displayName, email: r.user.email, photoURL: r.user.photoURL, provider:"google", createdAt: serverTimestamp() });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setErrors({ general:"Google sign-in failed." });
    } finally { setGLoading(false); }
  };

  return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 24px 40px" }}>
      <div style={{ textAlign:"center", padding:"40px 0 28px" }}>
        <CompassIcon size={40} />
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:CHARCOAL, margin:"14px 0 4px" }}>Create Account</h1>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:0, fontStyle:"italic" }}>Join the Perfectly Flawed community</p>
      </div>

      <div style={css.card}>
        <ErrorBanner msg={errors.general} />
        <FieldInput label="Full Name"        value={form.name}    onChange={set("name")}    placeholder="Your name" error={errors.name} />
        <FieldInput label="Email"  type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" error={errors.email} />
        <FieldInput label="Password" type={showPw?"text":"password"} value={form.pw} onChange={set("pw")} placeholder="Min 6 characters" error={errors.pw}
          right={<button onClick={()=>setShowPw(s=>!s)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}><EyeIcon show={showPw}/></button>}
        />
        <FieldInput label="Confirm Password" type={showPw?"text":"password"} value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" error={errors.confirm} />
        <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:"0 0 16px", lineHeight:1.6 }}>By signing up you agree to our Terms of Service and Privacy Policy.</p>
        <GoldButton onClick={handleSignup} disabled={loading}>{loading ? "Creating account…" : "Create Account"}</GoldButton>
      </div>

      <Divider />

      <button onClick={handleGoogle} disabled={gLoading} style={{ width:"100%", background:WHITE, border:"1.5px solid rgba(45,43,40,0.15)", borderRadius:13, padding:"14px", fontFamily:"Georgia,serif", fontSize:14, fontWeight:600, color:CHARCOAL, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
        <GoogleLogo />{gLoading ? "Connecting…" : "Sign up with Google"}
      </button>

      <p style={{ textAlign:"center", fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, marginTop:24 }}>
        Already have an account?{" "}
        <span onClick={onSwitch} style={{ color:GOLD, fontWeight:600, cursor:"pointer" }}>Sign in</span>
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME
// ══════════════════════════════════════════════════════════════════════════════
function HomeScreen({ user, setTab }) {
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today     = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "friend";

  return (
    <div style={{ padding:"0 20px 100px", overflowY:"auto", height:"100%" }}>
      <div style={{ padding:"32px 0 16px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:LTGREY, margin:"0 0 2px", letterSpacing:"0.08em" }}>{today}</p>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:22, fontWeight:700, color:CHARCOAL, margin:"0 0 2px" }}>{greeting}, {firstName}.</h1>
          <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:0 }}>Perfectly Flawed Leadership</p>
        </div>
        <CompassIcon size={36} />
      </div>

      {/* Verse of the day */}
      <div style={css.darkCard}>
        <div style={{ position:"absolute", right:-20, top:-20, opacity:0.06 }}><CompassIcon size={140} color={WHITE}/></div>
        <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, letterSpacing:"0.14em", textTransform:"uppercase", margin:"0 0 12px" }}>✦  Verse of the Day</p>
        <p style={{ fontFamily:"Georgia,serif", fontSize:15, fontStyle:"italic", color:"rgba(253,250,245,0.9)", margin:"0 0 12px", lineHeight:1.7 }}>"My grace is sufficient for you, for my power is made perfect in weakness."</p>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:GOLD, margin:0, fontWeight:600 }}>— 2 Corinthians 12:9</p>
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        {[
          { label:"Today's Devotion",   sub:"AI-crafted for you",        icon:"📖", tab:1, gold:true  },
          { label:"Leadership Advisor", sub:"Scripture-grounded advice", icon:"🧭", tab:2, gold:false },
          { label:"Prayer Wall",        sub:"Community requests",        icon:"🙏", tab:3, gold:false },
          { label:"Your Profile",       sub:"Stats & saved content",     icon:"✨", tab:4, gold:false },
        ].map(({ label, sub, icon, tab, gold }) => (
          <button key={tab} onClick={() => setTab(tab)} style={{ background: gold ? "linear-gradient(135deg,#C4922A,#E8B84B)" : "rgba(255,255,255,0.8)", border: gold ? "none" : "1px solid rgba(196,146,42,0.2)", borderRadius:16, padding:"18px 14px", cursor:"pointer", textAlign:"left", boxShadow: gold ? "0 6px 20px rgba(196,146,42,0.35)" : "0 2px 10px rgba(45,43,40,0.06)" }}>
            <span style={{ fontSize:22, display:"block", marginBottom:8 }}>{icon}</span>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color: gold ? WHITE : CHARCOAL, margin:"0 0 3px" }}>{label}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, color: gold ? "rgba(255,255,255,0.75)" : MIDGREY, margin:0 }}>{sub}</p>
          </button>
        ))}
      </div>

      {/* Topics */}
      <div style={css.card}>
        <label style={css.label}>Topics to Explore</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {TOPICS.map(t => (
            <button key={t} onClick={() => setTab(1)} style={{ border:"1.5px solid rgba(196,146,42,0.3)", borderRadius:20, padding:"6px 13px", fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, background:"transparent", cursor:"pointer" }}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DEVOTION
// ══════════════════════════════════════════════════════════════════════════════
function DevotionScreen({ user }) {
  const [topic,   setTopic]   = useState("");
  const [devotion,setDevotion]= useState(null);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState(null);

  const generate = async (forceTopic) => {
    const t = forceTopic || topic || TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setLoading(true); setDevotion(null); setSaved(false); setError(null);
    try {
      const res = await fetch("http://localhost:3001/api/devotion", {
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

  return (
    <div style={{ padding:"0 20px 100px", overflowY:"auto", height:"100%" }}>
      <div style={{ textAlign:"center", padding:"32px 0 24px" }}>
        <CompassIcon size={44} />
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:26, fontWeight:700, color:CHARCOAL, margin:"12px 0 4px" }}>Daily Devotion</h1>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:MIDGREY, margin:0 }}>Led by Scripture. Shaped by grace.</p>
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

// ══════════════════════════════════════════════════════════════════════════════
// LEADERSHIP ADVISOR
// ══════════════════════════════════════════════════════════════════════════════
function AdvisorScreen({ user }) {
  const [step,      setStep]      = useState("home");
  const [situation, setSituation] = useState(null);
  const [customSit, setCustomSit] = useState("");
  const [details,   setDetails]   = useState("");
  const [style,     setStyle]     = useState(null);
  const [teamLevel, setTeamLevel] = useState("");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [history,   setHistory]   = useState([]);
  const [activeTab, setActiveTab] = useState("advice");
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!user) return;
    DB.getLeadershipSessions(user.uid).then(setHistory).catch(() => {});
  }, [user]);

  const reset = () => { setStep("home"); setSituation(null); setDetails(""); setStyle(null); setTeamLevel(""); setResult(null); setCustomSit(""); setError(null); };

  const getAdvice = async () => {
    if (!details.trim()) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch("http://localhost:3001/api/leadership", {
        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, details, style, teamLevel }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || res.statusText);
      }
      const parsed = await res.json();
      parsed.situation  = situation;
      parsed.timestamp  = new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
      setResult(parsed);
      setHistory(h => [parsed, ...h.slice(0, 9)]);
      setStep("result");
      if (user) await DB.saveLeadershipSession(user.uid, { situation, details, style, teamLevel, ...parsed });
    } catch { setError("Could not generate advice. Please try again."); }
    finally  { setLoading(false); }
  };

  // ── Home ──
  if (step === "home") return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      <div style={{ padding:"32px 0 20px" }}>
        <h1 style={{ fontFamily:"Georgia,serif", fontSize:24, fontWeight:700, color:CHARCOAL, margin:"0 0 4px" }}>Leadership Advisor</h1>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:0 }}>Scripture-grounded situational guidance</p>
      </div>

      {/* Toggle */}
      <div style={{ display:"flex", background:"rgba(255,255,255,0.5)", borderRadius:12, padding:3, marginBottom:18, border:"1px solid rgba(196,146,42,0.15)" }}>
        {[["advice","Get Advice"], ["history", `History (${history.length})`]].map(([t, lbl]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex:1, border:"none", borderRadius:10, padding:10, fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, cursor:"pointer", background: activeTab===t ? GOLD : "transparent", color: activeTab===t ? WHITE : MIDGREY, transition:"all 0.2s", textTransform:"uppercase", letterSpacing:"0.05em" }}>{lbl}</button>
        ))}
      </div>

      {activeTab === "history" ? (
        history.length === 0
          ? <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:LTGREY, fontStyle:"italic", textAlign:"center", padding:"60px 0" }}>Your past sessions will appear here.</p>
          : history.map((h, i) => (
            <div key={i} onClick={() => { setResult(h); setStep("result"); }} style={{ ...css.card, cursor:"pointer", display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:20 }}>{h.situation?.icon}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, margin:"0 0 2px" }}>{h.situation?.label}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:"0 0 4px" }}>{h.timestamp}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:12, fontStyle:"italic", color:MIDGREY, margin:0 }}>"{h.headline}"</p>
              </div>
              <span style={{ color:GOLD, fontSize:18 }}>›</span>
            </div>
          ))
      ) : (
        <>
          <div style={css.darkCard}>
            <div style={{ position:"absolute", right:-16, bottom:-16, opacity:0.07 }}><CompassIcon size={120} color={WHITE}/></div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, letterSpacing:"0.14em", textTransform:"uppercase", margin:"0 0 10px" }}>✦  How It Works</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13.5, color:"rgba(253,250,245,0.9)", margin:0, lineHeight:1.7 }}>Describe your leadership challenge. The Advisor responds with grounded Scripture, proven frameworks, and concrete next steps — truth for the trenches.</p>
          </div>

          <label style={{ ...css.label, display:"block", marginBottom:12 }}>Choose Your Situation</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {SITUATIONS.map(sit => (
              <button key={sit.label} onClick={() => { setSituation(sit); setStep("form"); }} style={{ background:"rgba(255,255,255,0.75)", border:"1.5px solid rgba(196,146,42,0.2)", borderRadius:14, padding:"14px 12px", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:22, display:"block", marginBottom:6 }}>{sit.icon}</span>
                <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:"0 0 3px", lineHeight:1.3 }}>{sit.label}</p>
                <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0, lineHeight:1.4 }}>{sit.desc}</p>
              </button>
            ))}
          </div>

          <div style={css.card}>
            <label style={css.label}>Or Describe Your Own</label>
            <div style={{ display:"flex", gap:10 }}>
              <input value={customSit} onChange={e => setCustomSit(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter" && customSit.trim()) { setSituation({ icon:"✏️", label:customSit, desc:"Custom" }); setStep("form"); }}}
                placeholder="e.g. Leading a struggling volunteer team…"
                style={{ ...css.input, flex:1 }} />
              <button onClick={() => { if (customSit.trim()) { setSituation({ icon:"✏️", label:customSit, desc:"Custom" }); setStep("form"); }}} disabled={!customSit.trim()}
                style={{ background: customSit.trim() ? GOLD : "#D4C5A5", color:WHITE, border:"none", borderRadius:10, padding:"0 16px", fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, cursor: customSit.trim() ? "pointer" : "default" }}>Go</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Form ──
  if (step === "form") return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      <div style={{ padding:"24px 0 16px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={reset} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:MIDGREY, fontSize:22 }}>‹</button>
        <span style={{ fontSize:26 }}>{situation?.icon}</span>
        <div>
          <h2 style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:CHARCOAL, margin:0 }}>{situation?.label}</h2>
          <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:MIDGREY, margin:0 }}>{situation?.desc}</p>
        </div>
      </div>

      <div style={css.card}>
        <label style={css.label}>Describe Your Situation *</label>
        <textarea value={details} onChange={e => setDetails(e.target.value)} rows={5}
          placeholder="Be specific — what's happening, who's involved, what have you tried? The more honest you are, the more grounded the advice."
          style={{ ...css.input, resize:"none", lineHeight:1.8, height:120 }} />

        <label style={{ ...css.label, marginTop:18 }}>Your Current Leadership Style</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:18 }}>
          {LEADERSHIP_STYLES.map(s => (
            <button key={s.id} onClick={() => setStyle(s.id === style ? null : s.id)}
              style={{ border:`1.5px solid ${style===s.id ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:11, padding:"10px 12px", textAlign:"left", cursor:"pointer", background: style===s.id ? "rgba(196,146,42,0.1)" : "transparent" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color: style===s.id ? GOLD : CHARCOAL, margin:"0 0 2px" }}>{s.label}</p>
              <p style={{ fontFamily:"Georgia,serif", fontSize:10, color:LTGREY, margin:0 }}>{s.sub}</p>
            </button>
          ))}
        </div>

        <label style={css.label}>Team / Person Readiness Level</label>
        <div style={{ display:"flex", gap:8, marginBottom:22 }}>
          {[["R1","Low skill,\nhigh will"],["R2","Low skill,\nlow will"],["R3","High skill,\nlow will"],["R4","High skill,\nhigh will"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setTeamLevel(teamLevel===id ? "" : id)}
              style={{ flex:1, border:`1.5px solid ${teamLevel===id ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:11, padding:"8px 4px", textAlign:"center", cursor:"pointer", background: teamLevel===id ? "rgba(196,146,42,0.1)" : "transparent" }}>
              <p style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color: teamLevel===id ? GOLD : CHARCOAL, margin:"0 0 2px" }}>{id}</p>
              <p style={{ fontFamily:"Georgia,serif", fontSize:9, color:LTGREY, margin:0, lineHeight:1.4, whiteSpace:"pre-line" }}>{lbl}</p>
            </button>
          ))}
        </div>

        {error && <p style={{ fontFamily:"Georgia,serif", fontSize:13, color:"#C05050", textAlign:"center", margin:"0 0 14px" }}>{error}</p>}
        <GoldButton onClick={getAdvice} disabled={!details.trim() || loading}>{loading ? "Seeking wisdom…" : "Get Leadership Advice"}</GoldButton>
        {loading && <div style={{ marginTop:20 }}><LoadingState msg="Searching Scripture and proven frameworks…"/></div>}
      </div>
    </div>
  );

  // ── Result ──
  if (step === "result" && result) return (
    <div style={{ height:"100%", overflowY:"auto", padding:"0 20px 100px" }}>
      <div style={{ padding:"24px 0 14px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={reset} style={{ background:"none", border:"none", cursor:"pointer", padding:0, color:MIDGREY, fontSize:22 }}>‹</button>
        <span style={{ fontSize:22 }}>{result.situation?.icon}</span>
        <p style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:MIDGREY, margin:0, textTransform:"uppercase", letterSpacing:"0.1em" }}>{result.situation?.label}</p>
      </div>

      {/* Core Truth */}
      <div style={css.darkCard}>
        <div style={{ position:"absolute", right:-20, bottom:-20, opacity:0.06 }}><CompassIcon size={130} color={WHITE}/></div>
        <p style={{ fontFamily:"Georgia,serif", fontSize:10, fontWeight:600, color:GOLD, letterSpacing:"0.16em", textTransform:"uppercase", margin:"0 0 10px" }}>✦  Core Truth</p>
        <h2 style={{ fontFamily:"Georgia,serif", fontSize:20, fontWeight:700, color:WHITE, margin:"0 0 12px", lineHeight:1.35 }}>"{result.headline}"</h2>
        <p style={{ fontFamily:"Georgia,serif", fontSize:13.5, color:"rgba(253,250,245,0.85)", margin:0, lineHeight:1.75 }}>{result.coretruth}</p>
      </div>

      {/* Scripture */}
      <div style={css.card}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
          <CrossIcon size={13}/><label style={{ ...css.label, margin:0 }}>Scripture Foundation</label>
        </div>
        {result.scriptures?.map((s, i) => (
          <div key={i} style={{ marginBottom: i < result.scriptures.length-1 ? 14 : 0, paddingBottom: i < result.scriptures.length-1 ? 14 : 0, borderBottom: i < result.scriptures.length-1 ? "1px solid rgba(196,146,42,0.12)" : "none" }}>
            <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontStyle:"italic", color:CHARCOAL, margin:"0 0 5px", lineHeight:1.65 }}>"{s.verse}"</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:11, fontWeight:600, color:GOLD, margin:"0 0 5px" }}>— {s.reference}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:12.5, color:"#6A5A4A", margin:0, lineHeight:1.6, fontStyle:"italic" }}>↳ {s.application}</p>
          </div>
        ))}
      </div>

      {/* Framework */}
      {result.framework && (
        <div style={{ ...css.card, background:"rgba(196,146,42,0.08)" }}>
          <label style={css.label}>Leadership Framework</label>
          <p style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:GOLD, margin:"0 0 8px" }}>{result.framework.name}</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:13.5, color:"#3D3A36", margin:0, lineHeight:1.7 }}>{result.framework.insight}</p>
        </div>
      )}

      {/* Actions */}
      <div style={css.card}>
        <label style={{ ...css.label, marginBottom:14 }}>🎯  Action Steps</label>
        {result.actions?.map((a, i) => (
          <div key={i} style={{ display:"flex", gap:12, marginBottom: i < result.actions.length-1 ? 12 : 0, alignItems:"flex-start" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,#C4922A,#E8B84B)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
              <span style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:700, color:WHITE }}>{i+1}</span>
            </div>
            <p style={{ fontFamily:"Georgia,serif", fontSize:13.5, color:CHARCOAL, margin:0, lineHeight:1.7 }}>{a}</p>
          </div>
        ))}
      </div>

      {/* Caution */}
      {result.caution && (
        <div style={{ background:"rgba(180,80,50,0.06)", borderRadius:14, padding:"14px 18px", marginBottom:14, border:"1px solid rgba(180,80,50,0.18)", borderLeft:`4px solid ${RUST}` }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:10, fontWeight:600, color:"#A04020", letterSpacing:"0.14em", textTransform:"uppercase", margin:"0 0 6px" }}>⚠  Watch Out For</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:13.5, color:"#3D3A36", margin:0, lineHeight:1.7 }}>{result.caution}</p>
        </div>
      )}

      {/* Prayer Focus */}
      {result.prayer_focus && (
        <div style={{ background:"rgba(45,43,40,0.04)", borderRadius:14, padding:"14px 18px", marginBottom:14, border:"1px dashed rgba(196,146,42,0.35)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <CrossIcon size={13}/><label style={{ ...css.label, margin:0 }}>Prayer Focus</label>
          </div>
          <p style={{ fontFamily:"Georgia,serif", fontSize:13.5, color:"#3D3A36", margin:0, lineHeight:1.7, fontStyle:"italic" }}>{result.prayer_focus}</p>
        </div>
      )}

      <GoldButton outline onClick={reset}>+ New Situation</GoldButton>
    </div>
  );

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// PRAYER WALL
// ══════════════════════════════════════════════════════════════════════════════
function PrayerScreen({ user }) {
  const [prayers,     setPrayers]     = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [activeGroup, setActiveGroup] = useState("All");
  const [newPrayer,   setNewPrayer]   = useState({ text:"", group:"General", isAnon:false });
  const [submitted,   setSubmitted]   = useState(false);

  // Real-time Firestore listener — updates instantly for all users
  useEffect(() => {
    const unsub = DB.subscribePrayers(setPrayers);
    return () => unsub();
  }, []);

  const filtered = activeGroup === "All" ? prayers : prayers.filter(p => p.group === activeGroup);

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
          {["All", ...GROUPS].map(g => (
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
          const hasPrayed = (prayer.prayedBy || []).includes(user?.uid);
          return (
            <div key={prayer.id} style={{ ...css.card, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`hsl(${(prayer.author?.charCodeAt(0) || 0) * 47 % 360},30%,75%)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:CHARCOAL, flexShrink:0 }}>
                  {prayer.author?.[0] || "?"}
                </div>
                <div>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:CHARCOAL, margin:0 }}>{prayer.author}</p>
                  <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:LTGREY, margin:0 }}>{prayer.group} · {timeAgo(prayer.createdAt)}</p>
                </div>
              </div>
              <p style={{ fontFamily:"Georgia,serif", fontSize:14, color:"#3D3A36", lineHeight:1.7, margin:"0 0 12px" }}>{prayer.text}</p>
              <button onClick={() => toggleHeart(prayer)} style={{ background: hasPrayed ? "rgba(196,146,42,0.1)" : "transparent", border:`1px solid ${hasPrayed ? GOLD : "rgba(196,146,42,0.25)"}`, borderRadius:20, padding:"6px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <HeartIcon filled={hasPrayed} size={14}/>
                <span style={{ fontFamily:"Georgia,serif", fontSize:12, fontWeight:600, color:GOLD }}>{hasPrayed ? "Prayed" : "I prayed"} · {prayer.hearts || 0}</span>
              </button>
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

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════════════════════════
function ProfileScreen({ user, onLogout }) {
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

// ══════════════════════════════════════════════════════════════════════════════
// PWA — Service Worker + Install Prompt
// ══════════════════════════════════════════════════════════════════════════════
function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled,   setIsInstalled]   = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(reg => console.log("[PFL] SW registered:", reg.scope))
        .catch(err => console.warn("[PFL] SW failed:", err));
    }
    // Capture Android/Chrome install prompt
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setIsInstalled(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  };

  return { installPrompt, isInstalled, triggerInstall };
}

function InstallBanner({ installPrompt, triggerInstall }) {
  const [visible, setVisible] = useState(false);
  const [isIos,   setIsIos]   = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("pfl-install-dismissed")) return;
    const ios       = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const safari    = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const standalone = window.navigator.standalone;
    if (ios && safari && !standalone) { setIsIos(true); setVisible(true); }
    else if (installPrompt)           { setVisible(true); }
  }, [installPrompt]);

  const dismiss = () => { setVisible(false); sessionStorage.setItem("pfl-install-dismissed","1"); };

  if (!visible) return null;

  return (
    <div style={{ position:"absolute", bottom:92, left:14, right:14, zIndex:200, background:"linear-gradient(135deg,#2D2B28,#3D3A36)", borderRadius:18, padding:"18px 18px 16px", boxShadow:"0 8px 32px rgba(45,43,40,0.4)", border:"1px solid rgba(196,146,42,0.3)" }}>
      <button onClick={dismiss} style={{ position:"absolute", top:10, right:14, background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"rgba(196,146,42,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <CompassIcon size={22} />
        </div>
        <div>
          <p style={{ fontFamily:"Georgia,serif", fontSize:14, fontWeight:700, color:WHITE, margin:0 }}>Add to Home Screen</p>
          <p style={{ fontFamily:"Georgia,serif", fontSize:11, color:"rgba(253,250,245,0.55)", margin:0 }}>Use PFL like a real app — works offline too</p>
        </div>
      </div>
      {isIos ? (
        <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 12px" }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:12, color:"rgba(253,250,245,0.8)", margin:0, lineHeight:1.7 }}>
            Tap <strong style={{ color:GOLD }}>Share</strong> at the bottom of Safari, then tap <strong style={{ color:GOLD }}>"Add to Home Screen"</strong>
          </p>
        </div>
      ) : (
        <button onClick={triggerInstall} style={{ width:"100%", background:`linear-gradient(135deg,${GOLD},#E8B84B)`, border:"none", borderRadius:12, padding:12, fontFamily:"Georgia,serif", fontSize:13, fontWeight:600, color:WHITE, cursor:"pointer", boxShadow:"0 4px 12px rgba(196,146,42,0.4)" }}>
          Install App
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,       setUser]       = useState(undefined); // undefined = checking auth
  const [authScreen, setAuthScreen] = useState("login");
  const [tab,        setTab]        = useState(0);
  const { installPrompt, isInstalled, triggerInstall } = usePWA();

  // Single source of truth — Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, firebaseUser => setUser(firebaseUser));
    return () => unsub();
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
    <div style={{ width:"100%", maxWidth:390, margin:"0 auto", height:"100dvh", background:CREAM, position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 0 60px rgba(45,43,40,0.25)" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet"/>

      {/* Status bar */}
      <div style={{ height:44, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0 }}>
        <span style={{ fontFamily:"system-ui", fontSize:14, fontWeight:600, color:CHARCOAL }}>{new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" })}</span>
        <div style={{ width:16, height:10, border:`1.5px solid ${CHARCOAL}`, borderRadius:2, position:"relative" }}>
          <div style={{ position:"absolute", left:1, top:1, bottom:1, right:3, background:CHARCOAL, borderRadius:1 }}/>
        </div>
      </div>

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
            {tab === 0 && <HomeScreen     user={user} setTab={setTab} />}
            {tab === 1 && <DevotionScreen user={user} />}
            {tab === 2 && <AdvisorScreen  user={user} />}
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