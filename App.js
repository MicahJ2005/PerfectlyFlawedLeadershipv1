/**
 * Perfectly Flawed Leadership — Expo React Native App
 * ─────────────────────────────────────────────────────
 * Install dependencies:
 *   npx create-expo-app PerfectlyFlawed --template blank
 *   cd PerfectlyFlawed
 *   npx expo install @react-navigation/native @react-navigation/bottom-tabs
 *   npx expo install react-native-screens react-native-safe-area-context
 *   npx expo install @expo/vector-icons expo-font
 *   npx expo install expo-secure-store expo-web-browser expo-auth-session
 *   npx expo install react-native-svg
 *
 * Then replace App.js with this file.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, Platform, KeyboardAvoidingView,
  ActivityIndicator, Alert, StatusBar, SafeAreaView, Modal,
  Animated, Keyboard,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polygon, Line, Polyline } from "react-native-svg";

SplashScreen.preventAutoHideAsync();

// ── Brand Colors ──────────────────────────────────────────────────────────────
const C = {
  cream:    "#EDEAE4",
  charcoal: "#2D2B28",
  gold:     "#C4922A",
  goldLight:"#E8B84B",
  midGrey:  "#7A7672",
  lightGrey:"#B0A898",
  white:    "#FDFAF5",
  warmBg:   "#F5F2EC",
  rust:     "#C05030",
};

const { width: W } = Dimensions.get("window");

// ── Google Sheets Config ──────────────────────────────────────────────────────
const SHEET_CONFIG = {
  spreadsheetId: "1DbcrsUyJJk3z7ekiyRrcXlRIXYNLFyc9RG5Ihrw9mW8",
  apiKey:        "AIzaSyB2dYtKyl-20kDKS6UzOLX9PYZ6C1Dxj80",
  clientId:      "1050853512448-1nhe3iqk8ugf8l9qk17ed25tu5i9k27c.apps.googleusercontent.com",
};

const sheetsAPI = {
  baseUrl: `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_CONFIG.spreadsheetId}`,
  async append(range, values, token) {
    console.log("[SheetsAPI] Appending to", range, "values:", values);
    try {
      const response = await fetch(
        `${this.baseUrl}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
        { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ values }) }
      );
      console.log("[SheetsAPI] Append response:", response.status, response.statusText);
      return response.ok;
    } catch (e) {
      console.error("[SheetsAPI] Append error:", e);
      return false;
    }
  },
  async read(range) {
    console.log("[SheetsAPI] Reading from", range);
    try {
      const response = await fetch(
        `${this.baseUrl}/values/${range}?key=${SHEET_CONFIG.apiKey}`,
        { method: "GET" }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("[SheetsAPI] Read data:", data);
        return data;
      } else {
        console.error("[SheetsAPI] Read error:", response.status, response.statusText);
        return null;
      }
    } catch (e) {
      console.error("[SheetsAPI] Read error:", e);
      return null;
    }
  },
};

// ── Data ──────────────────────────────────────────────────────────────────────
const SAMPLE_PRAYERS = [
  { id: 1, author: "James R.", group: "Morning Warriors", time: "2h ago", text: "Please pray for my daughter's surgery next Tuesday. Trusting God's hands.", hearts: 14, prayed: false },
  { id: 2, author: "Sarah M.", group: "Women's Circle", time: "5h ago", text: "Seeking guidance in a major career decision. Not sure which door to walk through.", hearts: 9, prayed: false },
  { id: 3, author: "Pastor Dave", group: "Leadership Team", time: "1d ago", text: "Our church is going through a season of transition. Pray for unity and vision.", hearts: 22, prayed: true },
];
const TOPICS = ["Humility in leadership","Perseverance through trials","Servant leadership","Grace under pressure","Finding purpose in pain","Authentic vulnerability","Forgiveness and freedom","Faith over fear","Leading with integrity","Rest and renewal"];
const GROUPS = ["Morning Warriors","Women's Circle","Leadership Team","General","Men's Brotherhood"];
const SITUATIONS = [
  { icon: "⚔️", label: "Team Conflict",          desc: "Navigating tension between people" },
  { icon: "📉", label: "Leading Through Failure", desc: "When plans fall apart" },
  { icon: "🎯", label: "Casting Vision",          desc: "Inspiring others toward a goal" },
  { icon: "🌿", label: "Developing Others",       desc: "Mentoring & growing your team" },
  { icon: "🔥", label: "Burnout & Limits",        desc: "Leading from an empty cup" },
  { icon: "🤝", label: "Difficult Conversations", desc: "Speaking truth with grace" },
  { icon: "🧭", label: "Decision Making",         desc: "Choosing wisely under pressure" },
  { icon: "🏔️", label: "Leading Change",          desc: "Moving people through transition" },
  { icon: "🙏", label: "Humble Leadership",       desc: "Strength rooted in surrender" },
  { icon: "💔", label: "Leading Through Loss",    desc: "Grief, tragedy, and resilience" },
];
const LEADERSHIP_STYLES = [
  { id: "directing",  label: "Directing",  sub: "High task, low relationship" },
  { id: "coaching",   label: "Coaching",   sub: "High task, high relationship" },
  { id: "supporting", label: "Supporting", sub: "Low task, high relationship" },
  { id: "delegating", label: "Delegating", sub: "Low task, low relationship" },
];

// ── SVG Icon Components (React Native safe) ──────────────────────────────────
const CompassIcon = ({ size = 24, color = C.gold }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <Circle cx="12" cy="12" r="10" /><Circle cx="12" cy="12" r="7" />
    <Polygon points="12,4 13.5,11 12,10 10.5,11" fill={color} stroke="none" />
    <Polygon points="12,20 10.5,13 12,14 13.5,13" fill={C.midGrey} stroke="none" />
    <Polygon points="20,12 13,10.5 14,12 13,13.5" fill={C.midGrey} stroke="none" />
    <Polygon points="4,12 11,13.5 10,12 11,10.5" fill={C.midGrey} stroke="none" />
  </Svg>
);
const CrossIcon = ({ size = 18, color = C.gold }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Line x1="12" y1="3" x2="12" y2="21" /><Line x1="5" y1="9" x2="19" y2="9" />
  </Svg>
);
const HeartIcon = ({ filled, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? C.gold : "none"} stroke={C.gold} strokeWidth="2">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);

// ── Tab Bar Icons ─────────────────────────────────────────────────────────────
const TabHomeIcon     = ({ color }) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9,22 9,12 15,12 15,22"/></Svg>;
const TabBookIcon     = ({ color }) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></Svg>;
const TabAdvisorIcon  = ({ color }) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Line x1="12" y1="2" x2="12" y2="6"/><Path d="M12 6a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3.5 5.5V20h-5v-2.5C7.5 16.5 6 14.5 6 12a6 6 0 0 1 6-6z"/><Line x1="9.5" y1="20" x2="14.5" y2="20"/><Line x1="10" y1="23" x2="14" y2="23"/></Svg>;
const TabUsersIcon    = ({ color }) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>;
const TabProfileIcon  = ({ color }) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>;

// ── Shared UI Components ──────────────────────────────────────────────────────
const GoldButton = ({ label, onPress, disabled, outline = false, style: xStyle }) => (
  <TouchableOpacity
    onPress={onPress} disabled={disabled} activeOpacity={0.8}
    style={[styles.goldBtn, outline && styles.goldBtnOutline, disabled && styles.goldBtnDisabled, xStyle]}
  >
    <Text style={[styles.goldBtnText, outline && styles.goldBtnOutlineText]}>{label}</Text>
  </TouchableOpacity>
);

const Card = ({ children, style: xStyle }) => (
  <View style={[styles.card, xStyle]}>{children}</View>
);

const SectionLabel = ({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

const DarkCard = ({ children }) => (
  <View style={styles.darkCard}>{children}</View>
);

// ── Claude API Helper ─────────────────────────────────────────────────────────
async function callClaude(system, userMsg) {
  console.log("[ClaudeAPI] Calling with system:", system, "userMsg:", userMsg);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  console.log("[ClaudeAPI] Response:", data);
  const text = data.content?.map(b => b.text || "").join("") || "";
  console.log("[ClaudeAPI] Full text response:", text);
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH SCREENS
// ════════════════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin, onSwitch }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (password.length < 6)   e.password = "Min 6 characters";
    return e;
  };

  const handleLogin = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    onLogin({ name: email.split("@")[0], email, provider: "email", avatar: email[0].toUpperCase() });
  };

  return (
    <SafeAreaProvider style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.authLogoWrap}>
            <View style={styles.authLogoCircle}>
              <CompassIcon size={44} />
            </View>
            <Text style={styles.authTitle}>Perfectly Flawed</Text>
            <Text style={styles.authSubtitle}>LEADERSHIP</Text>
            <Text style={styles.authTagline}>Welcome back, friend.</Text>
          </View>

          {/* Form */}
          <Card>
            <SectionLabel text="EMAIL" />
            <TextInput
              value={email} onChangeText={setEmail} keyboardType="email-address"
              autoCapitalize="none" placeholder="you@example.com"
              placeholderTextColor={C.lightGrey} style={[styles.input, errors.email && styles.inputError]}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <SectionLabel text="PASSWORD" style={{ marginTop: 10 }} />
            <View style={styles.inputRow}>
              <TextInput
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPass} placeholder="Your password"
                placeholderTextColor={C.lightGrey} style={[styles.input, { flex: 1 }, errors.password && styles.inputError]}
              />
              <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                <Text style={{ color: C.midGrey, fontSize: 13 }}>{showPass ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <GoldButton label={loading ? "Signing in…" : "Sign In"} onPress={handleLogin} disabled={loading} />
          </Card>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}
            onPress={() => onLogin({ name: "Guest User", email: "guest@example.com", provider: "google", avatar: "G" })}>
            <Text style={styles.googleBtnText}>G  Sign in with Google</Text>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSwitch}>
              <Text style={styles.switchLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

function SignupScreen({ onLogin, onSwitch }) {
  const [form, setForm]         = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSignup = async () => {
    const e = {};
    if (!form.name.trim())              e.name    = "Name required";
    if (!form.email.includes("@"))      e.email   = "Valid email required";
    if (form.password.length < 6)       e.password = "Min 6 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    onLogin({ name: form.name, email: form.email, provider: "email", avatar: form.name[0].toUpperCase() });
  };

  return (
    <SafeAreaProvider style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.authLogoWrap, { paddingTop: 36 }]}>
            <CompassIcon size={40} />
            <Text style={[styles.authTitle, { marginTop: 14 }]}>Create Account</Text>
            <Text style={styles.authTagline}>Join the Perfectly Flawed community</Text>
          </View>

          <Card>
            {[["Full Name","name","default",false],["Email","email","email-address",false],["Password","password","default",true],["Confirm Password","confirm","default",true]].map(([lbl,key,kb,sec]) => (
              <View key={key} style={{ marginBottom: 14 }}>
                <SectionLabel text={lbl.toUpperCase()} />
                <TextInput
                  value={form[key]} onChangeText={set(key)}
                  keyboardType={kb} autoCapitalize={kb === "email-address" ? "none" : "words"}
                  secureTextEntry={sec} placeholder={lbl}
                  placeholderTextColor={C.lightGrey} style={[styles.input, errors[key] && styles.inputError]}
                />
                {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
              </View>
            ))}
            <Text style={styles.termsText}>By signing up you agree to our Terms of Service and Privacy Policy.</Text>
            <GoldButton label={loading ? "Creating account…" : "Create Account"} onPress={handleSignup} disabled={loading} />
          </Card>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={onSwitch}><Text style={styles.switchLink}>Sign in</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ════════════════════════════════════════════════════════════════════════════

function HomeScreen({ navigation, route }) {
  const user = route.params?.user;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <SafeAreaProvider style={styles.screen}>
      <ScrollView style={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.homeDate}>{today}</Text>
            <Text style={styles.homeGreeting}>{greeting}, {user?.name?.split(" ")[0] || "friend"}.</Text>
            <Text style={styles.homeBrand}>Perfectly Flawed Leadership</Text>
          </View>
          <CompassIcon size={36} />
        </View>

        {/* Verse of the Day */}
        <DarkCard>
          <Text style={styles.vorLabel}>✦  VERSE OF THE DAY</Text>
          <Text style={styles.vorVerse}>"My grace is sufficient for you, for my power is made perfect in weakness."</Text>
          <Text style={styles.vorRef}>— 2 Corinthians 12:9</Text>
        </DarkCard>

        {/* Quick actions */}
        <View style={styles.quickGrid}>
          {[
            { label: "Today's Devotion", sub: "Designed just for you", icon: "📖", tab: "Devotion", gold: true },
            { label: "Leadership Advisor", sub: "Scripture-grounded advice", icon: "🧭", tab: "Advisor", gold: false },
            { label: "Prayer Wall", sub: "Community requests", icon: "🙏", tab: "Prayer", gold: false },
            { label: "Your Profile", sub: "Stats & saved content", icon: "✨", tab: "Profile", gold: false },
          ].map(({ label, sub, icon, tab, gold }) => (
            <TouchableOpacity key={tab} onPress={() => navigation.navigate(tab)}
              style={[styles.quickCard, gold && styles.quickCardGold]} activeOpacity={0.85}>
              <Text style={styles.quickIcon}>{icon}</Text>
              <Text style={[styles.quickLabel, gold && { color: C.white }]}>{label}</Text>
              <Text style={[styles.quickSub, gold && { color: "rgba(255,255,255,0.7)" }]}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Topics */}
        <Card>
          <SectionLabel text="TOPICS TO EXPLORE" />
          <View style={styles.topicWrap}>
            {TOPICS.slice(0, 8).map(t => (
              <TouchableOpacity key={t} onPress={() => navigation.navigate("Devotion", { topic: t })}
                style={styles.topicChip} activeOpacity={0.75}>
                <Text style={styles.topicChipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DEVOTION SCREEN
// ════════════════════════════════════════════════════════════════════════════

function DevotionScreen({ route }) {
  const user = route.params?.user;
  const [topic, setTopic]     = useState(route.params?.topic || "");
  const [devotion, setDevotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);

  const generate = async (t) => {
    console.log("[DevotionScreen] Generating devotion for topic:", t || topic);
    const finalTopic = t || topic || TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setLoading(true); setDevotion(null); setSaved(false);
    try {
      const parsed = await callClaude(
        `You are a devotional writer for Perfectly Flawed Leadership — a faith-based leadership ministry. Respond ONLY with valid JSON (no markdown): {"title":"...","scripture":{"verse":"...","reference":"..."},"body":"3-4 paragraphs","reflection":"one question","prayer":"2-3 sentence prayer"}`,
        `Write a devotion about: ${finalTopic}`
      );
      parsed.topic = finalTopic;
      setDevotion(parsed);
    } catch { Alert.alert("Error", "Could not generate devotion. Please try again."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (route.params?.topic) generate(route.params.topic); }, []);

  const saveDevotion = async () => {
    setSaved(true);
    if (user?.token && devotion && SHEET_CONFIG.spreadsheetId !== "YOUR_SPREADSHEET_ID") {
      await sheetsAPI.append("SavedDevotions!A:I", [[
        Date.now(), user.email, devotion.title, devotion.topic,
        devotion.scripture?.reference, devotion.body?.substring(0, 200),
        devotion.reflection, devotion.prayer, new Date().toISOString()
      ]], user.token);
    }
  };

  return (
    <SafeAreaProvider style={styles.screen}>
      <ScrollView style={styles.scrollPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.centerHeader}>
          <CompassIcon size={44} />
          <Text style={styles.screenTitle}>Daily Devotion</Text>
          <Text style={styles.screenSubtitle}>Led by Scripture. Shaped by grace.</Text>
        </View>

        {/* Input card */}
        <Card>
          <SectionLabel text="ENTER A TOPIC" />
          <View style={styles.inputRow}>
            <TextInput value={topic} onChangeText={setTopic} placeholder="e.g. perseverance, humility…"
              placeholderTextColor={C.lightGrey} style={[styles.input, { flex: 1 }]} returnKeyType="go"
              onSubmitEditing={() => topic && generate()} />
            <TouchableOpacity onPress={() => generate()} disabled={!topic || loading}
              style={[styles.goBtn, (!topic || loading) && styles.goBtnDisabled]}>
              <Text style={styles.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.orRow}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} />
          </View>

          <GoldButton label="✦  Surprise Me" onPress={() => generate(TOPICS[Math.floor(Math.random() * TOPICS.length)])} outline disabled={loading} />
        </Card>

        {/* Loading */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={styles.loadingText}>Preparing your devotion…</Text>
          </View>
        )}

        {/* Devotion result */}
        {devotion && !loading && (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <View style={styles.goldTopBar} />
            <View style={{ padding: 22 }}>
              <View style={styles.topicPill}><Text style={styles.topicPillText}>{devotion.topic}</Text></View>
              <Text style={styles.devTitle}>{devotion.title}</Text>

              <View style={styles.scriptureBox}>
                <Text style={styles.scriptureVerse}>"{devotion.scripture?.verse}"</Text>
                <Text style={styles.scriptureRef}>— {devotion.scripture?.reference}</Text>
              </View>

              {devotion.body?.split("\n\n").map((p, i) => (
                <Text key={i} style={styles.devBody}>{p}</Text>
              ))}

              <View style={styles.reflectBox}>
                <Text style={styles.reflectLabel}>REFLECT</Text>
                <Text style={styles.reflectText}>{devotion.reflection}</Text>
              </View>

              <View style={styles.prayerBox}>
                <View style={styles.prayerHeader}>
                  <CrossIcon size={14} /><Text style={styles.prayerLabel}>  CLOSING PRAYER</Text>
                </View>
                <Text style={styles.prayerText}>{devotion.prayer}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity onPress={saveDevotion}
                  style={[styles.actionBtn, saved && styles.actionBtnSaved]}>
                  <Text style={[styles.actionBtnText, saved && { color: C.white }]}>{saved ? "✓ Saved" : "Save"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: "rgba(45,43,40,0.2)" }]}>
                  <Text style={[styles.actionBtnText, { color: C.charcoal }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LEADERSHIP ADVISOR SCREEN
// ════════════════════════════════════════════════════════════════════════════

function AdvisorScreen({ route }) {
  const user = route.params?.user;
  const [step, setStep]         = useState("home");
  const [situation, setSituation] = useState(null);
  const [customSit, setCustomSit] = useState("");
  const [details, setDetails]   = useState("");
  const [style, setStyle]       = useState(null);
  const [teamLevel, setTeamLevel] = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);
  const [activeTab, setActiveTab] = useState("advice");

  const reset = () => { setStep("home"); setSituation(null); setDetails(""); setStyle(null); setTeamLevel(""); setResult(null); };

  const getAdvice = async () => {
    if (!details.trim()) return;
    setLoading(true);
    try {
      const parsed = await callClaude(
        `You are a faith-grounded leadership advisor for Perfectly Flawed Leadership. Respond ONLY with valid JSON (no markdown): {"headline":"bold truth 6-10 words","coretruth":"2-3 sentences","scriptures":[{"verse":"...","reference":"...","application":"..."},{"verse":"...","reference":"...","application":"..."},{"verse":"...","reference":"...","application":"..."}],"framework":{"name":"...","insight":"2 sentences"},"actions":["action1","action2","action3","action4"],"caution":"honest warning","prayer_focus":"1 sentence prayer"}`,
        `Situation: ${situation?.label}\nDetails: ${details}\nStyle: ${style || "Not specified"}\nTeam readiness: ${teamLevel || "Not specified"}`
      );
      parsed.situation = situation;
      parsed.timestamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      setResult(parsed);
      setHistory(h => [parsed, ...h.slice(0, 9)]);
      setStep("result");
      if (user?.token && SHEET_CONFIG.spreadsheetId !== "YOUR_SPREADSHEET_ID") {
        const s = parsed.scriptures || [], a = parsed.actions || [];
        sheetsAPI.append("LeadershipSessions!A:AA", [[
          Date.now(), user.email, situation?.label||"", situation?.icon||"", details,
          style||"", teamLevel||"", parsed.headline||"", parsed.coretruth||"",
          s[0]?.verse||"",s[0]?.reference||"",s[0]?.application||"",
          s[1]?.verse||"",s[1]?.reference||"",s[1]?.application||"",
          s[2]?.verse||"",s[2]?.reference||"",s[2]?.application||"",
          parsed.framework?.name||"", parsed.framework?.insight||"",
          a[0]||"",a[1]||"",a[2]||"",a[3]||"",
          parsed.caution||"", parsed.prayer_focus||"", new Date().toISOString(),
        ]], user.token);
      }
    } catch { Alert.alert("Error", "Could not generate advice. Please try again."); }
    finally { setLoading(false); }
  };

  if (step === "home") return (
    <SafeAreaProvider style={styles.screen}>
      <ScrollView style={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          <View>
            <Text style={styles.screenTitle}>Leadership Advisor</Text>
            <Text style={styles.screenSubtitle}>Scripture-grounded situational guidance</Text>
          </View>
        </View>

        <View style={styles.toggleRow}>
          {[["advice","Get Advice"],["history",`History (${history.length})`]].map(([t, label]) => (
            <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.toggleBtn, activeTab === t && styles.toggleBtnActive]}>
              <Text style={[styles.toggleBtnText, activeTab === t && { color: C.white }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "history" ? (
          history.length === 0
            ? <Text style={styles.emptyText}>Your past sessions will appear here.</Text>
            : history.map((h, i) => (
              <TouchableOpacity key={i} onPress={() => { setResult(h); setStep("result"); }} style={styles.historyCard} activeOpacity={0.85}>
                <Text style={{ fontSize: 20 }}>{h.situation?.icon}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.historyLabel}>{h.situation?.label}</Text>
                  <Text style={styles.historyTime}>{h.timestamp}</Text>
                  <Text style={styles.historyHeadline} numberOfLines={1}>"{h.headline}"</Text>
                </View>
                <Text style={{ color: C.gold, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))
        ) : (
          <>
            <DarkCard>
              <Text style={styles.vorLabel}>✦  HOW IT WORKS</Text>
              <Text style={styles.vorVerse}>Describe your leadership challenge. The Advisor responds with grounded Scripture, proven frameworks, and concrete next steps — not theory, but truth for the trenches.</Text>
            </DarkCard>

            <Text style={[styles.sectionLabel, { marginLeft: 0, marginBottom: 12, marginTop: 4 }]}>CHOOSE YOUR SITUATION</Text>
            <View style={styles.sitGrid}>
              {SITUATIONS.map(sit => (
                <TouchableOpacity key={sit.label} onPress={() => { setSituation(sit); setStep("form"); }}
                  style={styles.sitCard} activeOpacity={0.85}>
                  <Text style={styles.sitIcon}>{sit.icon}</Text>
                  <Text style={styles.sitLabel}>{sit.label}</Text>
                  <Text style={styles.sitDesc}>{sit.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Card>
              <SectionLabel text="OR DESCRIBE YOUR OWN" />
              <View style={styles.inputRow}>
                <TextInput value={customSit} onChangeText={setCustomSit} placeholder="e.g. Leading a struggling volunteer team…"
                  placeholderTextColor={C.lightGrey} style={[styles.input, { flex: 1 }]} returnKeyType="go"
                  onSubmitEditing={() => { if (customSit.trim()) { setSituation({ icon: "✏️", label: customSit, desc: "Custom" }); setStep("form"); }}} />
                <TouchableOpacity disabled={!customSit.trim()}
                  onPress={() => { if (customSit.trim()) { setSituation({ icon: "✏️", label: customSit, desc: "Custom" }); setStep("form"); }}}
                  style={[styles.goBtn, !customSit.trim() && styles.goBtnDisabled]}>
                  <Text style={styles.goBtnText}>Go</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaProvider>
  );

  if (step === "form") return (
    <SafeAreaProvider style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollPad} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={reset} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹  Back</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 28 }}>{situation?.icon}</Text>
            <View>
              <Text style={styles.screenTitle}>{situation?.label}</Text>
              <Text style={styles.screenSubtitle}>{situation?.desc}</Text>
            </View>
          </View>

          <Card>
            <SectionLabel text="DESCRIBE YOUR SITUATION *" />
            <TextInput value={details} onChangeText={setDetails} multiline numberOfLines={5}
              placeholder="Be specific. What is happening? Who is involved? What have you already tried?"
              placeholderTextColor={C.lightGrey} style={styles.textarea} textAlignVertical="top" />

            <SectionLabel text="YOUR CURRENT LEADERSHIP STYLE" style={{ marginTop: 18 }} />
            <View style={styles.styleGrid}>
              {LEADERSHIP_STYLES.map(s => (
                <TouchableOpacity key={s.id} onPress={() => setStyle(s.id === style ? null : s.id)}
                  style={[styles.styleBtn, style === s.id && styles.styleBtnActive]}>
                  <Text style={[styles.styleBtnLabel, style === s.id && { color: C.gold }]}>{s.label}</Text>
                  <Text style={styles.styleBtnSub}>{s.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionLabel text="TEAM / PERSON READINESS LEVEL" style={{ marginTop: 18 }} />
            <View style={styles.readinessRow}>
              {[["R1","Low skill,\nhigh will"],["R2","Low skill,\nlow will"],["R3","High skill,\nlow will"],["R4","High skill,\nhigh will"]].map(([id, lbl]) => (
                <TouchableOpacity key={id} onPress={() => setTeamLevel(teamLevel === id ? "" : id)}
                  style={[styles.readinessBtn, teamLevel === id && styles.readinessBtnActive]}>
                  <Text style={[styles.readinessBtnId, teamLevel === id && { color: C.gold }]}>{id}</Text>
                  <Text style={styles.readinessBtnLabel}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <GoldButton label={loading ? "Seeking wisdom…" : "Get Leadership Advice"} onPress={getAdvice} disabled={!details.trim() || loading} style={{ marginTop: 24 }} />
            {loading && <View style={{ alignItems: "center", marginTop: 16 }}>
              <ActivityIndicator size="large" color={C.gold} />
              <Text style={styles.loadingText}>Searching Scripture and proven frameworks…</Text>
            </View>}
          </Card>
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );

  if (step === "result" && result) return (
    <SafeAreaProvider style={styles.screen}>
      <ScrollView style={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={reset} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹  New Situation</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 22 }}>{result.situation?.icon}</Text>
          <Text style={styles.sectionLabel}>{result.situation?.label?.toUpperCase()}</Text>
        </View>

        <DarkCard>
          <Text style={styles.vorLabel}>✦  CORE TRUTH</Text>
          <Text style={styles.advHeadline}>"{result.headline}"</Text>
          <Text style={[styles.vorVerse, { marginTop: 10 }]}>{result.coretruth}</Text>
        </DarkCard>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <CrossIcon size={13} /><Text style={styles.sectionLabel}>SCRIPTURE FOUNDATION</Text>
          </View>
          {result.scriptures?.map((s, i) => (
            <View key={i} style={[styles.scriptureEntry, i < result.scriptures.length - 1 && styles.scriptureDivider]}>
              <Text style={styles.scriptureVerse}>"{s.verse}"</Text>
              <Text style={styles.scriptureRef}>— {s.reference}</Text>
              <Text style={styles.scriptureApp}>↳ {s.application}</Text>
            </View>
          ))}
        </Card>

        {result.framework && (
          <Card style={styles.frameworkCard}>
            <Text style={styles.sectionLabel}>LEADERSHIP FRAMEWORK</Text>
            <Text style={styles.frameworkName}>{result.framework.name}</Text>
            <Text style={styles.devBody}>{result.framework.insight}</Text>
          </Card>
        )}

        <Card>
          <Text style={styles.sectionLabel}>🎯  ACTION STEPS</Text>
          {result.actions?.map((a, i) => (
            <View key={i} style={styles.actionStep}>
              <View style={styles.actionNum}><Text style={styles.actionNumText}>{i + 1}</Text></View>
              <Text style={styles.actionText}>{a}</Text>
            </View>
          ))}
        </Card>

        {result.caution && (
          <View style={styles.cautionCard}>
            <Text style={styles.cautionLabel}>⚠  WATCH OUT FOR</Text>
            <Text style={styles.devBody}>{result.caution}</Text>
          </View>
        )}

        {result.prayer_focus && (
          <View style={styles.prayerBox}>
            <View style={styles.prayerHeader}>
              <CrossIcon size={13} /><Text style={styles.prayerLabel}>  PRAYER FOCUS</Text>
            </View>
            <Text style={styles.prayerText}>{result.prayer_focus}</Text>
          </View>
        )}

        <GoldButton label="+ New Situation" onPress={reset} outline style={{ marginTop: 8 }} />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaProvider>
  );

  return null;
}

// ════════════════════════════════════════════════════════════════════════════
// PRAYER SCREEN
// ════════════════════════════════════════════════════════════════════════════

function PrayerScreen({ route }) {
  const user = route.params?.user;
  const [prayers, setPrayers]     = useState(SAMPLE_PRAYERS);
  const [showModal, setShowModal] = useState(false);
  const [activeGroup, setActiveGroup] = useState("All");
  const [newPrayer, setNewPrayer] = useState({ text: "", group: "General", isAnon: false });
  const [submitted, setSubmitted] = useState(false);

  const filtered = activeGroup === "All" ? prayers : prayers.filter(p => p.group === activeGroup);

  const toggleHeart = id => setPrayers(prev => prev.map(p =>
    p.id === id ? { ...p, hearts: p.prayed ? p.hearts - 1 : p.hearts + 1, prayed: !p.prayed } : p
  ));

  const submitPrayer = async () => {
    if (!newPrayer.text.trim()) return;
    const prayer = { id: Date.now(), author: newPrayer.isAnon ? "Anonymous" : (user?.name || "You"), group: newPrayer.group, time: "Just now", text: newPrayer.text, hearts: 0, prayed: false };
    setPrayers(prev => [prayer, ...prev]);
    if (user?.token && SHEET_CONFIG.spreadsheetId !== "YOUR_SPREADSHEET_ID") {
      sheetsAPI.append("PrayerRequests!A:H", [[prayer.id, user.email, prayer.author, prayer.group, prayer.text, newPrayer.isAnon ? "TRUE" : "FALSE", new Date().toISOString(), 0]], user.token);
    }
    setNewPrayer({ text: "", group: "General", isAnon: false });
    setShowModal(false); setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <SafeAreaProvider style={styles.screen}>
      <View style={styles.prayerHeader}>
        <View>
          <Text style={styles.screenTitle}>Prayer Wall</Text>
          <Text style={styles.screenSubtitle}>Lift each other up in faith</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {submitted && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>🙏  Your prayer request has been shared.</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {["All", ...GROUPS].map(g => (
          <TouchableOpacity key={g} onPress={() => setActiveGroup(g)} style={[styles.groupChip, activeGroup === g && styles.groupChipActive]}>
            <Text style={[styles.groupChipText, activeGroup === g && { color: C.white }]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {filtered.map(prayer => (
          <Card key={prayer.id} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View style={[styles.avatar, { backgroundColor: `hsl(${(prayer.id * 47) % 360},30%,75%)` }]}>
                <Text style={styles.avatarText}>{prayer.author[0]}</Text>
              </View>
              <View>
                <Text style={styles.prayerAuthor}>{prayer.author}</Text>
                <Text style={styles.prayerMeta}>{prayer.group} · {prayer.time}</Text>
              </View>
            </View>
            <Text style={styles.prayerText2}>{prayer.text}</Text>
            <TouchableOpacity onPress={() => toggleHeart(prayer.id)}
              style={[styles.heartBtn, prayer.prayed && styles.heartBtnActive]}>
              <HeartIcon filled={prayer.prayed} size={14} />
              <Text style={styles.heartBtnText}>{prayer.prayed ? "Prayed" : "I prayed"} · {prayer.hearts}</Text>
            </TouchableOpacity>
          </Card>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* New prayer modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.screenTitle}>Share a Prayer Request</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><Text style={{ fontSize: 22, color: C.midGrey }}>✕</Text></TouchableOpacity>
              </View>
              <TextInput value={newPrayer.text} onChangeText={t => setNewPrayer(p => ({ ...p, text: t }))}
                placeholder="Share what's on your heart…" placeholderTextColor={C.lightGrey}
                multiline numberOfLines={4} style={styles.textarea} textAlignVertical="top" />

              <SectionLabel text="GROUP" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8 }}>
                {GROUPS.map(g => (
                  <TouchableOpacity key={g} onPress={() => setNewPrayer(p => ({ ...p, group: g }))}
                    style={[styles.groupChip, newPrayer.group === g && styles.groupChipActive]}>
                    <Text style={[styles.groupChipText, newPrayer.group === g && { color: C.white }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity onPress={() => setNewPrayer(p => ({ ...p, isAnon: !p.isAnon }))} style={styles.anonRow}>
                <View style={[styles.checkbox, newPrayer.isAnon && styles.checkboxChecked]}>
                  {newPrayer.isAnon && <Text style={{ color: C.white, fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={styles.anonText}>Post anonymously</Text>
              </TouchableOpacity>

              <GoldButton label="Submit Prayer Request" onPress={submitPrayer} disabled={!newPrayer.text.trim()} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ════════════════════════════════════════════════════════════════════════════

function ProfileScreen({ route }) {
  const { user, onLogout } = route.params || {};
  const sheetsReady = SHEET_CONFIG.spreadsheetId !== "YOUR_SPREADSHEET_ID";

  return (
    <SafeAreaProvider style={styles.screen}>
      <ScrollView style={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.avatar || "?"}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.providerBadge}>
            <Text style={styles.providerBadgeText}>{user?.provider === "google" ? "Google Account" : "Email Account"}</Text>
          </View>
        </View>

        <View style={[styles.sheetStatus, { backgroundColor: sheetsReady ? "#EEF8EE" : "#FFF8E8" }]}>
          <Text style={[styles.sheetStatusTitle, { color: sheetsReady ? "#2A6A2A" : "#8A6A2A" }]}>
            {sheetsReady ? "✓ Google Sheets Connected" : "⚠ Google Sheets Setup Required"}
          </Text>
          <Text style={styles.sheetStatusDesc}>
            {sheetsReady ? "Your data is syncing to your spreadsheet." : "Add your Sheet ID & API Key in the config to enable data sync."}
          </Text>
        </View>

        <View style={styles.statsRow}>
          {[["7","Day Streak"],["12","Devotions"],["5","Prayers"]].map(([n,l]) => (
            <View key={l} style={styles.statCard}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {sheetsReady && (
          <TouchableOpacity
            style={[styles.settingsRow, { backgroundColor: C.goldLight }]}
            onPress={async () => {
              const data = await sheetsAPI.read("PrayerRequests!A:H");
              Alert.alert("Sheet Data", JSON.stringify(data, null, 2));
            }}
          >
            <Text style={{ fontSize: 20 }}>📊</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.settingsTitle}>Test Sheet Read</Text>
              <Text style={styles.settingsSub}>Check if data is coming in</Text>
            </View>
          </TouchableOpacity>
        )}

        {[["🔔","Notifications","Daily devotion reminders"],["🙏","My Prayer Groups","Manage group memberships"],["📖","Saved Devotions","View your library"],["⚙️","App Settings","Theme, font size, language"]].map(([icon,title,sub]) => (
          <TouchableOpacity key={title} style={styles.settingsRow} activeOpacity={0.75}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.settingsTitle}>{title}</Text>
              <Text style={styles.settingsSub}>{sub}</Text>
            </View>
            <Text style={{ color: C.lightGrey, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaProvider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NAVIGATION + ROOT APP
// ════════════════════════════════════════════════════════════════════════════

const Tab = createBottomTabNavigator();

export default function App() {
  const [authScreen, setAuthScreen] = useState("login");
  const [user, setUser]             = useState(null);

  const [fontsLoaded] = useFonts({
    // Expo loads these from Google Fonts via @expo-google-fonts/playfair-display
    // For now they fall back to system fonts — install @expo-google-fonts packages for full branding
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const handleLogin  = (userData) => setUser(userData);
  const handleLogout = () => { setUser(null); setAuthScreen("login"); };

  if (!user) return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: C.cream }} onLayout={onLayoutRootView}>
        <StatusBar barStyle="dark-content" backgroundColor={C.cream} />
        {authScreen === "login"
          ? <LoginScreen onLogin={handleLogin} onSwitch={() => setAuthScreen("signup")} />
          : <SignupScreen onLogin={handleLogin} onSwitch={() => setAuthScreen("login")} />
        }
      </View>
    </SafeAreaProvider>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }} onLayout={onLayoutRootView}>
      <StatusBar barStyle="dark-content" backgroundColor={C.cream} />
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: C.gold,
              tabBarInactiveTintColor: C.lightGrey,
              tabBarLabelStyle: { fontFamily: "System", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
              tabBarIcon: ({ color }) => {
                const icons = { Home: TabHomeIcon, Devotion: TabBookIcon, Advisor: TabAdvisorIcon, Prayer: TabUsersIcon, Profile: TabProfileIcon };
                const IconComp = icons[route.name];
                return IconComp ? <IconComp color={color} /> : null;
              },
            })}
          >
            <Tab.Screen name="Home"     component={HomeScreen}     initialParams={{ user }} />
            <Tab.Screen name="Devotion" component={DevotionScreen} initialParams={{ user }} />
            <Tab.Screen name="Advisor"  component={AdvisorScreen}  initialParams={{ user }} />
            <Tab.Screen name="Prayer"   component={PrayerScreen}   initialParams={{ user }} />
            <Tab.Screen name="Profile"  component={ProfileScreen}  initialParams={{ user, onLogout: handleLogout }} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  screen:         { flex: 1, backgroundColor: C.cream },
  scrollPad:      { paddingHorizontal: 20 },
  card:           { backgroundColor: "rgba(255,255,255,0.82)", borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: "rgba(196,146,42,0.18)", shadowColor: "#2D2B28", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  darkCard:       { backgroundColor: C.charcoal, borderRadius: 20, padding: 22, marginBottom: 14, overflow: "hidden" },
  goldTopBar:     { height: 5, backgroundColor: C.gold },

  // Typography
  screenTitle:    { fontFamily: "Georgia", fontSize: 24, fontWeight: "700", color: C.charcoal, marginBottom: 2 },
  screenSubtitle: { fontFamily: "Georgia", fontSize: 13, color: C.midGrey },
  sectionLabel:   { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.midGrey, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  sectionLabel2:  { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.midGrey, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 },
  vorLabel:       { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.gold, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 },
  vorVerse:       { fontFamily: "Georgia", fontSize: 15, fontStyle: "italic", color: "rgba(253,250,245,0.9)", lineHeight: 24 },
  vorRef:         { fontFamily: "Georgia", fontSize: 12, fontWeight: "600", color: C.gold, marginTop: 10 },

  // Auth
  authScroll:     { paddingHorizontal: 24, paddingBottom: 40 },
  authLogoWrap:   { alignItems: "center", paddingTop: 52, paddingBottom: 32 },
  authLogoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(196,146,42,0.1)", borderWidth: 2, borderColor: "rgba(196,146,42,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  authTitle:      { fontFamily: "Georgia", fontSize: 26, fontWeight: "700", color: C.charcoal, marginBottom: 4 },
  authSubtitle:   { fontFamily: "Georgia", fontSize: 13, color: C.gold, fontWeight: "600", letterSpacing: 3 },
  authTagline:    { fontFamily: "Georgia", fontSize: 14, color: C.midGrey, fontStyle: "italic", marginTop: 10 },
  input:          { borderWidth: 1.5, borderColor: "rgba(196,146,42,0.3)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: "Georgia", fontSize: 14, color: C.charcoal, backgroundColor: C.white },
  inputError:     { borderColor: "#E57373" },
  inputRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn:         { paddingHorizontal: 10 },
  forgotWrap:     { alignItems: "flex-end", marginBottom: 18, marginTop: 10 },
  forgotText:     { fontFamily: "Georgia", fontSize: 12, color: C.gold, fontWeight: "600" },
  errorText:      { fontFamily: "Georgia", fontSize: 11, color: "#E57373", marginTop: 4 },
  termsText:      { fontFamily: "Georgia", fontSize: 11, color: C.lightGrey, lineHeight: 17, marginBottom: 16 },
  switchRow:      { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  switchText:     { fontFamily: "Georgia", fontSize: 13, color: C.midGrey },
  switchLink:     { fontFamily: "Georgia", fontSize: 13, color: C.gold, fontWeight: "600" },
  dividerRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 16 },
  dividerLine:    { flex: 1, height: 1, backgroundColor: "rgba(196,146,42,0.2)" },
  dividerText:    { fontFamily: "Georgia", fontSize: 10, color: C.lightGrey, letterSpacing: 0.8 },
  orRow:          { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  googleBtn:      { backgroundColor: C.white, borderWidth: 1.5, borderColor: "rgba(45,43,40,0.15)", borderRadius: 13, paddingVertical: 14, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  googleBtnText:  { fontFamily: "Georgia", fontSize: 14, fontWeight: "600", color: C.charcoal },

  // Buttons
  goldBtn:          { backgroundColor: C.gold, borderRadius: 13, paddingVertical: 15, alignItems: "center", shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  goldBtnOutline:   { backgroundColor: "transparent", borderWidth: 1.5, borderColor: C.gold, shadowOpacity: 0, elevation: 0 },
  goldBtnDisabled:  { backgroundColor: "#D4C5A5", shadowOpacity: 0, elevation: 0 },
  goldBtnText:      { fontFamily: "Georgia", fontSize: 15, fontWeight: "700", color: C.white, letterSpacing: 0.5 },
  goldBtnOutlineText: { color: C.gold },
  goBtn:            { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 13 },
  goBtnDisabled:    { backgroundColor: "#D4C5A5" },
  goBtnText:        { fontFamily: "Georgia", fontSize: 13, fontWeight: "600", color: C.white },

  // Home
  homeHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 28 },
  homeDate:     { fontFamily: "Georgia", fontSize: 12, color: C.lightGrey, marginBottom: 2 },
  homeGreeting: { fontFamily: "Georgia", fontSize: 22, fontWeight: "700", color: C.charcoal },
  homeBrand:    { fontFamily: "Georgia", fontSize: 13, color: C.midGrey, marginTop: 2 },
  quickGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  quickCard:    { width: (W - 52) / 2, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(196,146,42,0.2)" },
  quickCardGold:{ background: undefined, backgroundColor: "#E8B84B", background: "transparent" },
  quickIcon:    { fontSize: 24, marginBottom: 10 },
  quickLabel:   { fontFamily: "Georgia", fontSize: 14, fontWeight: "700", color: C.charcoal, marginBottom: 3 },
  quickSub:     { fontFamily: "Georgia", fontSize: 11, color: C.midGrey },
  topicWrap:    { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip:    { borderWidth: 1.5, borderColor: "rgba(196,146,42,0.3)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  topicChipText:{ fontFamily: "Georgia", fontSize: 12, color: C.midGrey },

  // Devotion
  centerHeader:   { alignItems: "center", paddingVertical: 28 },
  topicPill:      { backgroundColor: "rgba(196,146,42,0.12)", borderRadius: 20, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  topicPillText:  { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.gold, letterSpacing: 1, textTransform: "uppercase" },
  devTitle:       { fontFamily: "Georgia", fontSize: 22, fontWeight: "700", color: C.charcoal, marginBottom: 18, lineHeight: 30 },
  scriptureBox:   { backgroundColor: "rgba(196,146,42,0.07)", borderLeftWidth: 3, borderLeftColor: C.gold, borderRadius: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12, padding: 14, marginBottom: 18 },
  scriptureVerse: { fontFamily: "Georgia", fontSize: 14, fontStyle: "italic", color: C.charcoal, marginBottom: 6, lineHeight: 22 },
  scriptureRef:   { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.gold },
  scriptureApp:   { fontFamily: "Georgia", fontSize: 12, fontStyle: "italic", color: "#6A5A4A", marginTop: 4, lineHeight: 18 },
  scriptureEntry: { marginBottom: 14, paddingBottom: 14 },
  scriptureDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(196,146,42,0.12)" },
  devBody:        { fontFamily: "Georgia", fontSize: 14, color: "#3D3A36", lineHeight: 24, marginBottom: 14 },
  reflectBox:     { backgroundColor: C.white, borderRadius: 12, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: "rgba(196,146,42,0.3)", borderStyle: "dashed" },
  reflectLabel:   { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.gold, letterSpacing: 1.2, marginBottom: 8 },
  reflectText:    { fontFamily: "Georgia", fontSize: 14, fontStyle: "italic", color: C.charcoal, lineHeight: 22 },
  prayerBox:      { backgroundColor: "rgba(45,43,40,0.04)", borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "rgba(196,146,42,0.3)", borderStyle: "dashed" },
  prayerHeader:   { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  prayerLabel:    { fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.gold, letterSpacing: 1.2, textTransform: "uppercase" },
  prayerText:     { fontFamily: "Georgia", fontSize: 14, fontStyle: "italic", color: "#3D3A36", lineHeight: 22 },
  actionRow:      { flexDirection: "row", gap: 10, marginTop: 18 },
  actionBtn:      { flex: 1, borderWidth: 1.5, borderColor: "rgba(196,146,42,0.3)", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  actionBtnSaved: { backgroundColor: C.gold, borderColor: C.gold },
  actionBtnText:  { fontFamily: "Georgia", fontSize: 13, fontWeight: "600", color: C.gold },
  loadingWrap:    { alignItems: "center", paddingVertical: 40 },
  loadingText:    { fontFamily: "Georgia", fontSize: 13, color: C.midGrey, marginTop: 12, fontStyle: "italic" },

  // Advisor
  toggleRow:        { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 12, padding: 3, marginBottom: 18, borderWidth: 1, borderColor: "rgba(196,146,42,0.15)" },
  toggleBtn:        { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  toggleBtnActive:  { backgroundColor: C.gold },
  toggleBtnText:    { fontFamily: "Georgia", fontSize: 12, fontWeight: "600", color: C.midGrey, letterSpacing: 0.5, textTransform: "uppercase" },
  sitGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  sitCard:          { width: (W - 52) / 2, backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "rgba(196,146,42,0.2)" },
  sitIcon:          { fontSize: 22, marginBottom: 6 },
  sitLabel:         { fontFamily: "Georgia", fontSize: 13, fontWeight: "600", color: C.charcoal, marginBottom: 3 },
  sitDesc:          { fontFamily: "Georgia", fontSize: 11, color: C.lightGrey, lineHeight: 16 },
  styleGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleBtn:         { width: (W - 84) / 2, borderWidth: 1.5, borderColor: "rgba(196,146,42,0.25)", borderRadius: 11, padding: 10 },
  styleBtnActive:   { backgroundColor: "rgba(196,146,42,0.1)", borderColor: C.gold },
  styleBtnLabel:    { fontFamily: "Georgia", fontSize: 13, fontWeight: "600", color: C.charcoal, marginBottom: 2 },
  styleBtnSub:      { fontFamily: "Georgia", fontSize: 10, color: C.lightGrey },
  readinessRow:     { flexDirection: "row", gap: 8 },
  readinessBtn:     { flex: 1, borderWidth: 1.5, borderColor: "rgba(196,146,42,0.25)", borderRadius: 11, paddingVertical: 8, alignItems: "center" },
  readinessBtnActive: { backgroundColor: "rgba(196,146,42,0.1)", borderColor: C.gold },
  readinessBtnId:   { fontFamily: "Georgia", fontSize: 15, fontWeight: "700", color: C.charcoal, marginBottom: 2 },
  readinessBtnLabel:{ fontFamily: "Georgia", fontSize: 9, color: C.lightGrey, lineHeight: 13, textAlign: "center" },
  textarea:         { borderWidth: 1.5, borderColor: "rgba(196,146,42,0.3)", borderRadius: 12, padding: 14, fontFamily: "Georgia", fontSize: 13, color: C.charcoal, backgroundColor: C.white, minHeight: 110, lineHeight: 22 },
  backBtn:          { paddingVertical: 16 },
  backBtnText:      { fontFamily: "Georgia", fontSize: 15, color: C.midGrey },
  advHeadline:      { fontFamily: "Georgia", fontSize: 19, fontWeight: "700", color: C.white, lineHeight: 28, marginBottom: 12 },
  frameworkCard:    { backgroundColor: "rgba(196,146,42,0.08)", borderColor: "rgba(196,146,42,0.2)" },
  frameworkName:    { fontFamily: "Georgia", fontSize: 15, fontWeight: "700", color: C.gold, marginBottom: 8 },
  actionStep:       { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  actionNum:        { width: 24, height: 24, borderRadius: 12, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginTop: 1 },
  actionNumText:    { fontFamily: "Georgia", fontSize: 12, fontWeight: "700", color: C.white },
  actionText:       { flex: 1, fontFamily: "Georgia", fontSize: 13.5, color: C.charcoal, lineHeight: 22 },
  cautionCard:      { backgroundColor: "rgba(180,80,50,0.06)", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "rgba(180,80,50,0.18)", borderLeftWidth: 4, borderLeftColor: C.rust },
  cautionLabel:     { fontFamily: "Georgia", fontSize: 10, fontWeight: "600", color: "#A04020", letterSpacing: 1.2, marginBottom: 6 },
  historyCard:      { backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(196,146,42,0.18)", flexDirection: "row", alignItems: "center" },
  historyLabel:     { fontFamily: "Georgia", fontSize: 14, fontWeight: "700", color: C.charcoal },
  historyTime:      { fontFamily: "Georgia", fontSize: 11, color: C.lightGrey, marginBottom: 3 },
  historyHeadline:  { fontFamily: "Georgia", fontSize: 12, fontStyle: "italic", color: C.midGrey },
  emptyText:        { fontFamily: "Georgia", fontSize: 14, color: C.lightGrey, fontStyle: "italic", textAlign: "center", paddingVertical: 60 },

  // Prayer
  prayerHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 28, paddingBottom: 4 },
  addBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 },
  addBtnText:     { fontSize: 24, color: C.white, lineHeight: 26 },
  toast:          { backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#A5D6A7", borderRadius: 10, marginHorizontal: 20, padding: 12, marginBottom: 8 },
  toastText:      { fontFamily: "Georgia", fontSize: 13, color: "#388E3C" },
  groupScroll:    { paddingVertical: 12, maxHeight: 52 },
  groupChip:      { borderWidth: 1.5, borderColor: "rgba(196,146,42,0.25)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  groupChipActive:{ backgroundColor: C.gold, borderColor: C.gold },
  groupChipText:  { fontFamily: "Georgia", fontSize: 12, fontWeight: "600", color: C.midGrey },
  avatar:         { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText:     { fontFamily: "Georgia", fontSize: 14, fontWeight: "700", color: C.charcoal },
  prayerAuthor:   { fontFamily: "Georgia", fontSize: 13, fontWeight: "600", color: C.charcoal },
  prayerMeta:     { fontFamily: "Georgia", fontSize: 11, color: C.lightGrey },
  prayerText2:    { fontFamily: "Georgia", fontSize: 14, color: "#3D3A36", lineHeight: 22, marginBottom: 12 },
  heartBtn:       { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(196,146,42,0.25)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" },
  heartBtnActive: { backgroundColor: "rgba(196,146,42,0.1)", borderColor: C.gold },
  heartBtnText:   { fontFamily: "Georgia", fontSize: 12, fontWeight: "600", color: C.gold },
  modalOverlay:   { flex: 1, backgroundColor: "rgba(45,43,40,0.5)", justifyContent: "flex-end" },
  modalSheet:     { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  anonRow:        { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  checkbox:       { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: "rgba(196,146,42,0.4)", alignItems: "center", justifyContent: "center" },
  checkboxChecked:{ backgroundColor: C.gold, borderColor: C.gold },
  anonText:       { fontFamily: "Georgia", fontSize: 13, color: C.midGrey },

  // Profile
  profileTop:       { alignItems: "center", paddingVertical: 28 },
  profileAvatar:    { width: 80, height: 80, borderRadius: 40, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 14, shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 4 },
  profileAvatarText:{ fontFamily: "Georgia", fontSize: 30, fontWeight: "700", color: C.white },
  profileName:      { fontFamily: "Georgia", fontSize: 22, fontWeight: "700", color: C.charcoal, marginBottom: 4 },
  profileEmail:     { fontFamily: "Georgia", fontSize: 13, color: C.midGrey, marginBottom: 10 },
  providerBadge:    { backgroundColor: "rgba(196,146,42,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  providerBadgeText:{ fontFamily: "Georgia", fontSize: 11, fontWeight: "600", color: C.gold, letterSpacing: 0.8, textTransform: "uppercase" },
  sheetStatus:      { borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: "rgba(196,146,42,0.2)" },
  sheetStatusTitle: { fontFamily: "Georgia", fontSize: 12, fontWeight: "600", marginBottom: 4, letterSpacing: 0.8 },
  sheetStatusDesc:  { fontFamily: "Georgia", fontSize: 12, color: C.midGrey, lineHeight: 18 },
  statsRow:         { flexDirection: "row", gap: 10, marginBottom: 18 },
  statCard:         { flex: 1, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(196,146,42,0.15)" },
  statNum:          { fontFamily: "Georgia", fontSize: 24, fontWeight: "700", color: C.gold, marginBottom: 3 },
  statLabel:        { fontFamily: "Georgia", fontSize: 10, color: C.midGrey, textAlign: "center", lineHeight: 14 },
  settingsRow:      { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(196,146,42,0.12)" },
  settingsTitle:    { fontFamily: "Georgia", fontSize: 14, fontWeight: "600", color: C.charcoal, marginBottom: 2 },
  settingsSub:      { fontFamily: "Georgia", fontSize: 11, color: C.lightGrey },
  logoutBtn:        { borderWidth: 1.5, borderColor: "rgba(220,80,80,0.3)", borderRadius: 13, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  logoutText:       { fontFamily: "Georgia", fontSize: 14, fontWeight: "600", color: C.rust },

  // Tab bar
  tabBar: {
    backgroundColor: "rgba(253,250,245,0.97)",
    borderTopWidth: 1, borderTopColor: "rgba(196,146,42,0.2)",
    height: Platform.OS === "ios" ? 82 : 64,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    shadowColor: "#2D2B28", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 10,
  },
});
