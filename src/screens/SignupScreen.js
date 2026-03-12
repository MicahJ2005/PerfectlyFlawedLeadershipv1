import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { auth, DB, googleProvider } from "../config/firebase";
import { CHARCOAL, GOLD, LTGREY, MIDGREY, WHITE } from "../constants/colors";
import { css } from "../constants/styles";
import { CompassIcon, EyeIcon, GoogleLogo } from "../components/icons";
import { FieldInput, GoldButton, ErrorBanner, Divider } from "../components/ui";

export function SignupScreen({ onSwitch }) {
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
