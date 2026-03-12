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
  query,
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
