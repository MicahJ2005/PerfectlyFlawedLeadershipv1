const { onRequest }    = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const express          = require("express");
const cors             = require("cors");
const admin            = require("firebase-admin");

admin.initializeApp();

const anthropicKey        = defineSecret("ANTHROPIC_API_KEY");
const stripeSecretKey     = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const app = express();
app.use(cors({ origin: true }));

// ── Stripe Webhook (must use raw body for signature verification) ─────────────
app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const Stripe = require("stripe");
  const stripe = Stripe(stripeSecretKey.value());
  const sig    = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret.value());
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = admin.firestore();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const uid     = session.metadata?.firebaseUID;
    if (uid) {
      await db.collection("users").doc(uid).set({
        subscribed:         true,
        subscriptionStatus: "active",
        stripeCustomerId:   session.customer,
        subscriptionId:     session.subscription,
        updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub  = event.data.object;
    const snap = await db.collection("users").where("stripeCustomerId", "==", sub.customer).get();
    for (const doc of snap.docs) {
      await doc.ref.set({
        subscribed:         sub.status === "active",
        subscriptionStatus: sub.status,
        updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub  = event.data.object;
    const snap = await db.collection("users").where("stripeCustomerId", "==", sub.customer).get();
    for (const doc of snap.docs) {
      await doc.ref.set({
        subscribed:         false,
        subscriptionStatus: "canceled",
        updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
  }

  res.json({ received: true });
});

// ── Stripe Checkout Session ───────────────────────────────────────────────────
app.post("/api/create-checkout-session", express.json(), async (req, res) => {
  const Stripe = require("stripe");
  const stripe = Stripe(stripeSecretKey.value());
  const { priceId, uid, email } = req.body;

  if (!priceId || !uid) return res.status(400).json({ error: "priceId and uid required" });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode:                 "subscription",
      line_items:           [{ price: priceId, quantity: 1 }],
      customer_email:       email || undefined,
      metadata:             { firebaseUID: uid },
      success_url:          "https://devo4me.web.app?payment=success",
      cancel_url:           "https://devo4me.web.app",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Promo Code Redemption ─────────────────────────────────────────────────────
app.post("/api/redeem-code", express.json(), async (req, res) => {
  const { code, uid } = req.body;
  if (!code || !uid) return res.status(400).json({ error: "code and uid required" });

  const db       = admin.firestore();
  const codeRef  = db.collection("promoCodes").doc(code.trim().toUpperCase());
  const codeSnap = await codeRef.get();

  if (!codeSnap.exists) return res.status(404).json({ error: "Invalid code" });

  const data = codeSnap.data();
  if (!data.active) return res.status(400).json({ error: "This code has already been used or is no longer valid" });
  if (data.maxUses != null && (data.uses || 0) >= data.maxUses) {
    return res.status(400).json({ error: "This code has reached its usage limit" });
  }

  // Grant access and record usage
  const batch = db.batch();
  batch.set(db.collection("users").doc(uid), {
    subscribed:         true,
    subscriptionStatus: "promo",
    promoCode:          code.trim().toUpperCase(),
    updatedAt:          admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.update(codeRef, {
    uses:      admin.firestore.FieldValue.increment(1),
    ...(data.maxUses != null && (data.uses || 0) + 1 >= data.maxUses ? { active: false } : {}),
  });
  await batch.commit();

  res.json({ success: true });
});

// ── Claude helpers ────────────────────────────────────────────────────────────
async function callClaude(apiKey, system, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Anthropic API error ${res.status}: ${errorData.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

app.post("/api/devotion", express.json(), async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "topic is required" });
  try {
    const result = await callClaude(
      anthropicKey.value(),
      `You are a devotional writer for Perfectly Flawed Leadership — a faith-based leadership ministry. Tone: warm, honest, pastoral. Respond ONLY with valid JSON (no markdown, no backticks): {"title":"...","scripture":{"verse":"exact text","reference":"Book Ch:V"},"body":"3-4 paragraphs separated by \\n\\n","reflection":"one penetrating question","prayer":"2-3 sentence closing prayer"}`,
      `Write a devotion on the topic: ${topic}`
    );
    res.json(result);
  } catch (err) {
    console.error("Devotion error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/leadership", express.json(), async (req, res) => {
  const { situation, details, style, teamLevel } = req.body;
  if (!details) return res.status(400).json({ error: "details is required" });
  try {
    const result = await callClaude(
      anthropicKey.value(),
      `You are a seasoned, faith-grounded leadership advisor for Perfectly Flawed Leadership. Respond ONLY with valid JSON (no markdown, no backticks): {"headline":"bold truth 6-10 words","coretruth":"2-3 sentences","scriptures":[{"verse":"exact text","reference":"Book Ch:V","application":"1 sentence"},{"verse":"...","reference":"...","application":"..."},{"verse":"...","reference":"...","application":"..."}],"framework":{"name":"framework name","insight":"2 sentences applying it to this situation"},"actions":["verb-led action 1","action 2","action 3","action 4"],"caution":"one honest warning or blind spot","prayer_focus":"1-sentence prayer prompt"}`,
      `Situation: ${situation?.label}\nDetails: ${details}\nLeadership style: ${style || "Not specified"}\nTeam readiness: ${teamLevel || "Not specified"}`
    );
    res.json(result);
  } catch (err) {
    console.error("Leadership error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

exports.api = onRequest(
  { secrets: [anthropicKey, stripeSecretKey, stripeWebhookSecret] },
  app
);
