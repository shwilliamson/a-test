import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Supports both emulator and real Firebase
if (!admin.apps.length) {
  // If using emulator, initialize with minimal config
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Using Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || 'demo-project',
    });
  }
  // Otherwise, use service account credentials for real Firebase
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using real Firebase with service account credentials');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  // Fallback for local development without emulator
  else {
    console.warn('No Firebase credentials or emulator configured. Using default initialization.');
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || 'demo-project',
    });
  }
}

const db = admin.firestore();

export { db, admin };
