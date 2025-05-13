import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type UserCredential,
  type AuthProvider,
} from 'firebase/auth';
import { auth } from './firebase'; // Assuming firebase.ts is in the same directory
import type { FirebaseError } from 'firebase/app';

// --- Interfaces ---
export interface AppUser extends User {
  role?: 'student' | 'parent' | 'admin';
}

interface AuthResult {
  user: AppUser | null;
  error?: string;
}

// --- Providers ---
const googleProvider = new GoogleAuthProvider();

// --- Core Auth Functions ---
const handleAuthOp = async (
  authPromise: Promise<UserCredential>
): Promise<AuthResult> => {
  try {
    const result = await authPromise;
    const tokenResult = await result.user.getIdTokenResult();
    const role = tokenResult.claims.role as AppUser['role'] | undefined;
    return { user: { ...result.user, role } };
  } catch (error) {
    const firebaseError = error as FirebaseError;
    return { user: null, error: firebaseError.message };
  }
};

export const signInWithGoogle = async (): Promise<AuthResult> => {
  return handleAuthOp(signInWithPopup(auth, googleProvider));
};

export const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  return handleAuthOp(createUserWithEmailAndPassword(auth, email, password));
  // After sign-up, you'll likely want to call a Cloud Function to set the initial role.
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  return handleAuthOp(signInWithEmailAndPassword(auth, email, password));
};

export const signInAnonymouslyFirebase = async (): Promise<AuthResult> => {
  return handleAuthOp(signInAnonymously(auth));
};

export const signOut = async (): Promise<{ error?: string }> => {
  try {
    await firebaseSignOut(auth);
    return {};
  } catch (error) {
    const firebaseError = error as FirebaseError;
    return { error: firebaseError.message };
  }
};

// --- Auth State Observer ---
export const onAuthUserChanged = (
  callback: (user: AppUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role as AppUser['role'] | undefined;
      callback({ ...user, role });
    } else {
      callback(null);
    }
  });
};

// --- Role Management (primarily via backend/Cloud Functions) ---
// Client-side can only read roles from ID token. Setting roles requires admin privileges.

export const getUserRole = async (user: User): Promise<AppUser['role'] | undefined> => {
  try {
    const tokenResult = await user.getIdTokenResult(true); // Force refresh
    return tokenResult.claims.role as AppUser['role'] | undefined;
  } catch (error) {
    console.error("Error getting user role:", error);
    return undefined;
  }
};

// Example: To set a role, you'd typically call a Cloud Function.
// import { getFunctions, httpsCallable } from 'firebase/functions';
// const functions = getFunctions();
// const setAdminRole = httpsCallable(functions, 'setAdminRoleCallable');
// try {
//   await setAdminRole({ userIdToMakeAdmin: 'someUserId' });
//   console.log('Role set successfully');
// } catch (error) {
//   console.error('Error setting role:', error);
// }
