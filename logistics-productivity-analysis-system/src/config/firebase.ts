import { initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBHthN13gNWZGBtuB7-HtKRMmCzcDPtrGM",
  authDomain: "separacao-f8500.firebaseapp.com",
  projectId: "separacao-f8500",
  storageBucket: "separacao-f8500.firebasestorage.app",
  messagingSenderId: "945687269648",
  appId: "1:945687269648:web:5d09bd097b93e448921595"
};

let db: Firestore | null = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch {
  console.warn('Firebase: inicialização falhou. Usando armazenamento local.');
}

export { db };
export const isFirebaseAvailable = db !== null;
