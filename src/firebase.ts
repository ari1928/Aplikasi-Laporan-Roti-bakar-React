import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyB0u0c3l--tNdhMoUz8zQ1lGHnkix7yjjo",
  authDomain: "grand-subject-06ppv.firebaseapp.com",
  projectId: "grand-subject-06ppv",
  storageBucket: "grand-subject-06ppv.firebasestorage.app",
  messagingSenderId: "99827666639",
  appId: "1:99827666639:web:80b37eed68151fa9a3b1ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };
