import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyApbPuhy4zVasFJFfB2L0FmxtZwRpZGosg",
  authDomain: "gen-lang-client-0312540102.firebaseapp.com",
  projectId: "gen-lang-client-0312540102",
  storageBucket: "gen-lang-client-0312540102.firebasestorage.app",
  messagingSenderId: "337794963827",
  appId: "1:337794963827:web:8af0e872e448f042960d06"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-nickellanches-8133d702-5451-4be1-a259-e8090108c42a");
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
