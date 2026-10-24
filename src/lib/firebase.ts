import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, runTransaction } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const getNextOrderNumber = async (): Promise<number> => {
  const counterRef = doc(db, 'system', 'daily_order_counter');
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  try {
    const newNumber = await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(counterRef);
      
      if (!sfDoc.exists()) {
        transaction.set(counterRef, { count: 1, date: today });
        return 1;
      }
      
      const data = sfDoc.data();
      if (data.date !== today) {
        transaction.update(counterRef, { count: 1, date: today });
        return 1;
      } else {
        const newCount = (data.count || 0) + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      }
    });
    try {
      localStorage.setItem('nickel_daily_counter', JSON.stringify({ date: today, count: newNumber }));
    } catch {}
    return newNumber;
  } catch (e) {
    try {
      const raw = localStorage.getItem('nickel_daily_counter');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && typeof parsed.count === 'number') {
          const next = parsed.count + 1;
          localStorage.setItem('nickel_daily_counter', JSON.stringify({ date: today, count: next }));
          return next;
        }
      }
      localStorage.setItem('nickel_daily_counter', JSON.stringify({ date: today, count: 1 }));
      return 1;
    } catch {
      return Math.floor(Math.random() * 900) + 100;
    }
  }
};
