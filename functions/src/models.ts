import type { Timestamp } from "firebase-admin/firestore";

// This file can be used to share common data models between your functions
// and potentially with your frontend if structured carefully (e.g., by excluding admin-specific types).

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role: 'student' | 'parent' | 'admin';
  preferences?: {
    learningStyle?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stripeCustomerId?: string;
  subscriptionStatus?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
  stripeSubscriptionId?: string;
}

// Add other shared interfaces (Lesson, ChatMessage, etc.) if needed by functions.
