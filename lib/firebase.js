import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBK9rRIgDGYVs-GAWkGqn9CCGjxUj59EMw",
  authDomain: "betproexchange-c21ee.firebaseapp.com",
  projectId: "betproexchange-c21ee",
  storageBucket: "betproexchange-c21ee.firebasestorage.app",
  messagingSenderId: "68788117179",
  appId: "1:68788117179:web:2efbce9e894312451a539e",
  measurementId: "G-N6C2E1L5RD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Analytics initialization (client-side only)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, analytics };
