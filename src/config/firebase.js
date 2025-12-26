import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
// Replace these values with your Firebase project settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'your_api_key_here'
  )
}

// Initialize Firebase only if configured
let app = null
let storage = null
let db = null

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig)
    storage = getStorage(app)
    db = getFirestore(app)
    console.log('Firebase initialized successfully')
  } else {
    console.warn('Firebase not configured. Using local storage fallback.')
  }
} catch (error) {
  console.error('Error initializing Firebase:', error)
}

export { storage, db }
export default app
