/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
// import { configureGenkit } from "./src/genkitSetup"; // If using Genkit with Firebase plugin

// Initialize Firebase Admin SDK
// It's recommended to initialize without arguments if deploying to Firebase,
// as it will automatically use the project's service account.
// If running locally or in other environments, you might need to provide credentials.
if (admin.apps.length === 0) {
  initializeApp();
}

// Initialize Genkit (if applicable and using Firebase plugin)
// configureGenkit();


// Export functions from their respective files
export * from "./src/userManagement";
export * from "./src/aiTutor";
export * from "./src/payments";

// Example HTTP function (can be removed if not needed)
// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
