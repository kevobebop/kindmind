import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  type DocumentReference,
  type CollectionReference,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { db } from './firebase'; // Assuming firebase.ts is in the same directory
import type { AppUser } from './auth'; // Assuming auth.ts is in the same directory

// --- Interfaces for Firestore Collections ---

export interface UserProfile extends Omit<AppUser, 'uid' | 'email' | 'emailVerified' | 'photoURL' | 'displayName' | 'phoneNumber' | 'providerId' | 'tenantId' | 'isAnonymous' | 'metadata' | 'providerData' | 'toJSON' | 'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'refreshToken'> {
  uid: string; // From Auth
  email?: string | null; // From Auth
  displayName?: string | null; // From Auth
  photoURL?: string | null; // From Auth
  role: 'student' | 'parent' | 'admin';
  preferences?: {
    learningStyle?: string;
    // Add other preferences
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
  // For parents, link to students, e.g., studentIds: string[]
  // For students, link to parents, e.g., parentIds: string[]
}

export interface Lesson {
  id?: string; // Document ID
  studentId: string;
  title: string;
  content: string; // Could be structured (e.g., steps, video links)
  subject: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatMessage {
  id?: string; // Document ID
  senderId: string; // 'student' or 'orbii' (AI)
  text: string;
  imageUrl?: string; // For image questions
  timestamp: Timestamp;
}

export interface ChatSession {
  id?: string; // Document ID
  studentId: string;
  // messages: ChatMessage[]; // Typically a subcollection: /chatSessions/{sessionId}/messages
  lastMessage?: ChatMessage;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Quiz {
  id?: string; // Document ID
  title: string;
  topic: string;
  questions: Array<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
  createdAt: Timestamp;
}

export interface QuizAttempt {
  id?: string; // Document ID
  quizId: string;
  studentId: string;
  answers: Array<{ questionIndex: number; selectedAnswer: string }>;
  score: number; // e.g., percentage
  completedAt: Timestamp;
}

export interface Progress {
  id?: string; // Document ID
  studentId: string;
  subject: string;
  masteryLevel: 'Beginner' | 'Proficient' | 'Master';
  lastActivityAt: Timestamp;
  // Could include specific skills or topics mastered
}

export interface Feedback {
  id?: string; // Document ID
  userId: string;
  rating?: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  type: 'bug_report' | 'feature_request' | 'general_feedback';
  createdAt: Timestamp;
}

// --- Firestore Utility Functions ---

// Get a document
export const getDocument = async <T extends DocumentData>(collectionPath: string, docId: string): Promise<T | null> => {
  const docRef = doc(db, collectionPath, docId) as DocumentReference<T>;
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Set (create or overwrite) a document
export const setDocument = async <T extends DocumentData>(collectionPath: string, docId: string, data: T, merge = true): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  const dataWithTimestamps = {
    ...data,
    updatedAt: serverTimestamp(),
    ...(merge ? {} : { createdAt: serverTimestamp() }), // Add createdAt only if not merging or it doesn't exist
  };
  await setDoc(docRef, dataWithTimestamps, { merge });
};

// Add a new document with an auto-generated ID
export const addDocument = async <T extends DocumentData>(collectionPath: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentReference<T>> => {
  const collRef = collection(db, collectionPath) as CollectionReference<T>;
  const dataWithTimestamps = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  return addDoc(collRef, dataWithTimestamps as any); // Firestore types can be tricky with serverTimestamp
};

// Update a document
export const updateDocument = async <T extends DocumentData>(collectionPath: string, docId: string, data: Partial<T>): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  const dataWithTimestamp = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, dataWithTimestamp);
};

// Delete a document
export const deleteDocument = async (collectionPath: string, docId: string): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
};

// Query documents
export const queryDocuments = async <T extends DocumentData>(q: Query<T>): Promise<T[]> => {
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as T));
};


// --- Specific Collection Functions (Examples) ---

// User Profile
export const getUserProfile = (userId: string) => getDocument<UserProfile>('users', userId);
export const createUserProfile = (userId: string, data: Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>) =>
  setDocument<UserProfile>('users', userId, { ...data, uid: userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, false);
export const updateUserProfile = (userId: string, data: Partial<UserProfile>) => updateDocument<UserProfile>('users', userId, data);

// Lessons
export const getLessonsForStudent = async (studentId: string): Promise<Lesson[]> => {
  const lessonsRef = collection(db, 'lessons') as CollectionReference<Lesson>;
  const q = query(lessonsRef, where('studentId', '==', studentId));
  return queryDocuments(q);
};

// Chat Messages (assuming subcollection)
// /users/{userId}/chatSessions/{sessionId}/messages
export const addChatMessage = (userId: string, sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
  addDocument<ChatMessage>(`users/${userId}/chatSessions/${sessionId}/messages`, message);

// You would add more specific functions for other collections as needed.
