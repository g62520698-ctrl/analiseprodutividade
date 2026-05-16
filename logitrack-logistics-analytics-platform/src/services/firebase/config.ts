import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBHthN13gNWZGBtuB7-HtKRMmCzcDPtrGM",
  authDomain: "separacao-f8500.firebaseapp.com",
  databaseURL: "https://separacao-f8500-default-rtdb.firebaseio.com",
  projectId: "separacao-f8500",
  storageBucket: "separacao-f8500.firebasestorage.app",
  messagingSenderId: "945687269648",
  appId: "1:945687269648:web:5d09bd097b93e448921595"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const db = getDatabase(app);
export const firestore = getFirestore(app);

// Messaging (async — only available in supported browsers)
export const messagingPromise = isSupported().then((supported) => {
  if (supported) {
    try {
      return getMessaging(app);
    } catch {
      return null;
    }
  }
  return null;
}).catch(() => null);

export { app };
