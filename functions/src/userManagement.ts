import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import type { UserProfile } from "./models"; // Assuming you'll create a models.ts for shared types

// Ensure Firebase Admin is initialized (it should be in index.ts)
// if (admin.apps.length === 0) {
//   admin.initializeApp();
// }

/**
 * Sets a custom user claim (e.g., role) for a given user.
 * This function should be callable by an admin.
 */
export const setUserRoleCallable = functions.https.onCall(async (data, context) => {
  // Check if the caller is an admin
  if (context.auth?.token?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Must be an administrative user to set roles."
    );
  }

  const { userId, newRole } = data;

  if (!userId || typeof userId !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a 'userId' argument."
    );
  }
  if (!newRole || !["student", "parent", "admin"].includes(newRole)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'newRole' (student, parent, admin)."
    );
  }

  try {
    await admin.auth().setCustomUserClaims(userId, { role: newRole });

    // Optionally, update the role in Firestore user profile as well for easier querying
    const userProfileRef = admin.firestore().collection("users").doc(userId);
    await userProfileRef.update({ role: newRole, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    functions.logger.info(`Role ${newRole} set for user ${userId} by ${context.auth?.uid}`);
    return { success: true, message: `Role ${newRole} set for user ${userId}.` };
  } catch (error) {
    functions.logger.error("Error setting user role:", error);
    throw new functions.https.HttpsError("internal", "Unable to set user role.", error);
  }
});

/**
 * Auth trigger that runs when a new user is created.
 * Sets a default role (e.g., 'student') and creates a user profile in Firestore.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const defaultRole = "student"; // Or determine based on sign-up flow

  try {
    // Set custom claim for the default role
    await admin.auth().setCustomUserClaims(user.uid, { role: defaultRole });
    functions.logger.info(`Default role '${defaultRole}' set for new user ${user.uid}`);

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: defaultRole,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      // Initialize other fields as needed
      preferences: {},
      subscriptionStatus: "inactive",
    };

    await admin.firestore().collection("users").doc(user.uid).set(userProfile);
    functions.logger.info(`User profile created in Firestore for ${user.uid}`);

    return null;
  } catch (error) {
    functions.logger.error("Error in onUserCreate trigger for user", user.uid, error);
    // Potentially send an alert or log to an error tracking service
    return null;
  }
});
