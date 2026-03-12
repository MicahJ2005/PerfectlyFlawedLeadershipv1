import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, DB, googleProvider } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { css } from "../constants/styles";
import { CompassIcon, EyeIcon, GoogleLogo } from "../components/icons";
import { FieldInput, GoldButton, ErrorBanner, Divider } from "../components/ui";

export function LoginScreen({ onSwitch }) {
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
