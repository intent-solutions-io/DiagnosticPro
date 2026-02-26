/**
 * Firebase configuration and authentication
 * Complete Firebase setup with Firestore integration
 */
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';

// Firebase config (fallbacks match config/firebase.ts — these are public client-side values)
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "diagnostic-pro-prod",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "diagnostic-pro-prod.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "diagnostic-pro-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "298932670545",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:298932670545:web:d710527356371228556870",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VQW6LFYQPS",
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && !auth.emulatorConfig) {
  // Only connect if not already connected
  try {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Emulators already connected or not available
    console.log('Firebase emulators not connected:', error);
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
}

/**
 * Create new user account
 */
export async function signUp(email: string, password: string): Promise<User | null> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Sign up failed:', error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Get current user's ID token
 */
export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'REPLACE_WITH_FIREBASE_KEY');
}

// Export Firebase instances for direct use
export { auth, firestore, storage };
export type { User, Firestore };