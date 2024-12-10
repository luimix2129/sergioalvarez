import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD6GtaH_q6kqCYp20urjxSK9Dk0Puy4YeY",
  authDomain: "sergioalvarezinm-352ad.firebaseapp.com",
  projectId: "sergioalvarezinm-352ad",
  storageBucket: "sergioalvarezinm-352ad.appspot.com",
  messagingSenderId: "153443778943",
  appId: "1:153443778943:web:580c808ee9868b247a1a4a",
  measurementId: "G-0GY1QKZFPW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

// Configure CORS for local development
if (import.meta.env.DEV) {
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { db, analytics, storage };