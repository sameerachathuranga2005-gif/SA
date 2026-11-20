import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBrTC627zgZjGVI7w-iWQhfC64bED4aAHk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'zoom-fc1ea.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'zoom-fc1ea',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'zoom-fc1ea.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '669210578363',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:669210578363:web:03f80e3d81b5561262c89e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-SYNLNWZPF0',
};

// Initialize Firebase once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;
