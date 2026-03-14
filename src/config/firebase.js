import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyAJ2R_7MfExmdZRq4DrExlyNZkCv9pKJ7A",
  authDomain:        "devo4me.firebaseapp.com",
  projectId:         "devo4me",
  storageBucket:     "devo4me.firebasestorage.app",
  messagingSenderId: "1052504611022",
  appId:             "1:1052504611022:web:268875f9b8b667e683989f",
  measurementId:     "G-YM3JBXD5DR",
};

const firebaseApp    = initializeApp(firebaseConfig);
export const auth    = getAuth(firebaseApp);
export const db      = getFirestore(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

export const DB = {
  async saveUser(uid, data) {
    await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
  subscribeToUser(uid, callback) {
    return onSnapshot(doc(db, "users", uid), snap => callback(snap.data() || {}));
  },

  subscribePrayers(callback) {
    const q = query(collection(db, "prayerRequests"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false))
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
  async deactivatePrayer(prayerId) {
    await updateDoc(doc(db, "prayerRequests", prayerId), { active: false });
  },
  async getPrayedCount(uid) {
    const q    = query(collection(db, "prayerRequests"), where("prayedBy", "array-contains", uid));
    const snap = await getDocs(q);
    return snap.size;
  },
  async togglePrayed(prayerId, uid, hasPrayed) {
    await updateDoc(doc(db, "prayerRequests", prayerId), {
      prayedBy: hasPrayed ? arrayRemove(uid) : arrayUnion(uid),
      hearts:   increment(hasPrayed ? -1 : 1),
    });
  },

  async saveDevotions(uid, devotion) {
    console.log("Saving devotion for user", uid, "Devotion title:", devotion.title);
    return addDoc(collection(db, "users", uid, "savedDevotions"), {
      ...devotion,
      savedAt: serverTimestamp(),
    });
  },
  async deleteSavedDevotion(uid, devotionId) {
    await deleteDoc(doc(db, "users", uid, "savedDevotions", devotionId));
  },
  async getSavedDevotions(uid) {
    const q    = query(collection(db, "users", uid, "savedDevotions"), orderBy("savedAt", "desc"));
    const snap = await getDocs(q);
    console.log("Fetched saved devotions for user", uid, "Count:", snap.size);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

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

  // Verse of the Day
  async getRandomVerse() {
    const snap = await getDocs(collection(db, "verses"));
    if (snap.empty) return null;
    const docs = snap.docs;
    return docs[Math.floor(Math.random() * docs.length)].data();
  },
  async seedVerses(verses) {
    const snap = await getDocs(collection(db, "verses"));
    if (!snap.empty) return; // already seeded
    await Promise.all(verses.map(v => addDoc(collection(db, "verses"), v)));
  },

  // Private Prayer Groups
  async createPrivateGroup(uid, name, displayName) {
    const code = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    const ref  = await addDoc(collection(db, "privateGroups"), {
      name,
      code,
      createdBy:   uid,
      members:     [uid],
      memberNames: { [uid]: displayName || "Member" },
      createdAt:   serverTimestamp(),
    });
    return { id: ref.id, code };
  },
  async joinPrivateGroupByCode(uid, code, displayName) {
    const q    = query(collection(db, "privateGroups"), where("code", "==", code.toUpperCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No group found with that code.");
    const groupDoc = snap.docs[0];
    if ((groupDoc.data().members || []).includes(uid)) throw new Error("You're already in this group.");
    await updateDoc(doc(db, "privateGroups", groupDoc.id), {
      members:                     arrayUnion(uid),
      [`memberNames.${uid}`]:      displayName || "Member",
    });
    return { id: groupDoc.id, name: groupDoc.data().name };
  },
  async leavePrivateGroup(uid, groupId) {
    const { deleteField } = await import("firebase/firestore");
    await updateDoc(doc(db, "privateGroups", groupId), {
      members:                arrayRemove(uid),
      [`memberNames.${uid}`]: deleteField(),
    });
  },
  subscribeToUserPrivateGroups(uid, callback) {
    const q = query(collection(db, "privateGroups"), where("members", "array-contains", uid));
    return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  },
  subscribeToPrivateGroupPrayers(groupId, callback) {
    const q = query(collection(db, "privateGroups", groupId, "prayers"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false))
    );
  },
  async addPrivateGroupPrayer(groupId, data) {
    return addDoc(collection(db, "privateGroups", groupId, "prayers"), {
      ...data,
      createdAt: serverTimestamp(),
      hearts:    0,
      prayedBy:  [],
    });
  },
  async togglePrivateGroupPrayed(groupId, prayerId, uid, hasPrayed) {
    await updateDoc(doc(db, "privateGroups", groupId, "prayers", prayerId), {
      prayedBy: hasPrayed ? arrayRemove(uid) : arrayUnion(uid),
      hearts:   increment(hasPrayed ? -1 : 1),
    });
  },
  async deactivatePrivateGroupPrayer(groupId, prayerId) {
    await updateDoc(doc(db, "privateGroups", groupId, "prayers", prayerId), { active: false });
  },
};
