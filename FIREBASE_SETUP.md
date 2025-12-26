# Firebase Setup Guide

This guide will help you set up Firebase for your wedding photobooth gallery.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "shahnila-josh-wedding")
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

## Step 2: Register Your App

1. In your Firebase project, click the web icon (`</>`) to add a web app
2. Enter app nickname (e.g., "Wedding Photobooth")
3. Don't check "Firebase Hosting" (you can add this later if needed)
4. Click "Register app"
5. Copy the Firebase configuration object - you'll need these values

## Step 3: Set up Firebase Storage

1. In Firebase Console, go to "Storage" in the left menu
2. Click "Get Started"
3. Click "Start in production mode" (we'll set rules next)
4. Choose a location close to your wedding venue
5. Click "Done"

### Configure Storage Rules

Go to the "Rules" tab in Storage and replace with:

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{photoId} {
      // Anyone can read photos
      allow read: if true;

      // Anyone can upload photos
      allow write: if request.resource.size < 10 * 1024 * 1024  // 10MB limit
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
\`\`\`

Click "Publish" to save the rules.

## Step 4: Set up Firestore Database

1. In Firebase Console, go to "Firestore Database" in the left menu
2. Click "Create database"
3. Start in "production mode"
4. Choose the same location as your Storage
5. Click "Enable"

### Configure Firestore Rules

Go to the "Rules" tab in Firestore and replace with:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wedding-photos/{photoId} {
      // Anyone can read photos
      allow read: if true;

      // Anyone can create photos
      allow create: if request.resource.data.keys().hasAll([
        'downloadURL',
        'storagePath',
        'filter',
        'timestamp'
      ]);

      // Anyone can delete their own photos
      allow delete: if true;
    }
  }
}
\`\`\`

Click "Publish" to save the rules.

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Open `.env` and fill in your Firebase configuration values from Step 2:

   \`\`\`
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   \`\`\`

3. Save the file

## Step 6: Test the Integration

1. Restart your development server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Open the app in your browser
3. Take a photo and check:
   - Photo appears in the gallery
   - Firebase Storage has the image (check in Firebase Console > Storage)
   - Firestore has the photo metadata (check in Firebase Console > Firestore Database)

## Optional: Add Password Protection

If you want to add password protection to prevent unauthorized access:

1. Enable Firebase Authentication in the Firebase Console
2. Let me know and I can add a simple password protection screen

## Optional: Deploy to Firebase Hosting

To host your photobooth online:

1. Install Firebase CLI:
   \`\`\`bash
   npm install -g firebase-tools
   \`\`\`

2. Login to Firebase:
   \`\`\`bash
   firebase login
   \`\`\`

3. Initialize Firebase in your project:
   \`\`\`bash
   firebase init hosting
   \`\`\`

4. Build and deploy:
   \`\`\`bash
   npm run build
   firebase deploy
   \`\`\`

## Troubleshooting

### Photos not uploading
- Check that you created `.env` file with correct Firebase config
- Verify Storage rules are set correctly
- Check browser console for errors

### Photos not appearing in gallery
- Verify Firestore rules are set correctly
- Check that the collection name is `wedding-photos`
- Check browser console for permission errors

### Need Help?
Contact me if you need assistance with any of these steps!
