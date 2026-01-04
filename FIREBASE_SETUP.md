# Firebase Setup Guide

This project supports both the Firestore emulator (for testing) and real Firebase (for persistent local development).

## Option 1: Using the Emulator (Default)

The emulator is already configured. Data persists only between `docker compose stop/start` cycles, but is lost on `docker compose down`.

```bash
docker compose up -d
```

## Option 2: Using Real Firebase (Recommended for Development)

For persistent data across restarts, use a real Firebase project.

### Setup Steps

1. **Create a Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add project" or "Create a project"
   - Name it (e.g., "task-list-dev")
   - Disable Google Analytics (optional)

2. **Create Firestore Database**
   - Navigate to **Firestore Database** in the sidebar
   - Click "Create database"
   - Choose **"Start in test mode"** (wide-open rules for dev)
   - Select a region close to you

3. **Get Service Account Credentials**
   - Click the gear icon → **Project settings**
   - Go to **Service accounts** tab
   - Click **"Generate new private key"**
   - Save the JSON file as `firebase-admin-key.json` in the project root
   - **Important**: This file is already in `.gitignore` - never commit it!

4. **Update docker-compose.yml**

   In the `backend` service section:

   ```yaml
   environment:
     # Comment out the emulator line
     # - FIRESTORE_EMULATOR_HOST=firestore:8080

     # Uncomment the credentials line
     - GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-admin-key.json

   volumes:
     # Uncomment the credentials mount
     - ./firebase-admin-key.json:/app/firebase-admin-key.json:ro
   ```

5. **Optionally Remove Emulator**

   If you're not using the emulator, you can comment out or remove the `firestore` service entirely and remove it from the backend's `depends_on` section.

6. **Restart**

   ```bash
   docker compose down
   docker compose up -d
   ```

   You should see: "Using real Firebase with service account credentials"

### Switching Back to Emulator

Just reverse the comments in `docker-compose.yml` and restart.

## Security Rules for Production

The "test mode" rules allow all reads/writes. Before deploying to production:

1. Go to Firestore → Rules in Firebase Console
2. Update rules to require authentication
3. Example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Cost

Firebase has a generous free tier:
- **Free quota**: 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day
- **Storage**: 1 GB free
- More than enough for local development

## Benefits of Real Firebase

✓ Data persists across all restarts
✓ Use Firebase Console to browse/edit data
✓ Same environment as production
✓ Better debugging tools
✓ No emulator limitations
