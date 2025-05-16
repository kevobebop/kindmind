/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from 'firebase-admin';

// Initialize the Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

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
