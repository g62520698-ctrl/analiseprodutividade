import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ✅ Nova configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCk0q3JLzHZeMHi0J7DT8CfSVW03mNoK3A",
  authDomain: "separacao2-c88c7.firebaseapp.com",
  projectId: "separacao2-c88c7",
  storageBucket: "separacao2-c88c7.firebasestorage.app",
  messagingSenderId: "127015747521",
  appId: "1:127015747521:web:490d5b49f6dc7c4481b940"
};

// ✅ Inicialização única — evita "app already exists"
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// ✅ Firestore conectado
export const db = getFirestore(app);

// ✅ Debug — confirma conexão no console
console.log("🔥 Firebase conectado:", firebaseConfig.projectId);

// ✅ Coleções padronizadas
export const COLLECTIONS = {
  REGISTROS: 'registros',
  SEPARADORES: 'separadores',
  INSIGHTS: 'insights',
  LOGS: 'logs',
} as const;
