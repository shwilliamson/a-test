import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Uses FIRESTORE_EMULATOR_HOST environment variable automatically when set
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'demo-project',
  });
}

const db = admin.firestore();

// Configure emulator settings if running locally
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

export { db, admin };
