import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import { getStorage } from 'firebase/storage';

// Only import AsyncStorage on mobile (not on web)
let AsyncStorage;
if (Platform.OS !== 'web') {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6CiIuqj1FBrL7rHcxS7bZlRuBNOh6A9M",
  authDomain: "travelapp-finalproject.firebaseapp.com",
  projectId: "travelapp-finalproject",
storageBucket: "travelapp-finalproject.firebasestorage.app",
  messagingSenderId: "641910585625",
  appId: "1:641910585625:web:f6ffab809a1258b962ad88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth differently for web vs mobile
let firebase_auth;
if (Platform.OS === 'web') {
  // For web browser - use browser storage
  firebase_auth = getAuth(app);
  firebase_auth.setPersistence(browserLocalPersistence);
} else {
  // For mobile (iOS/Android) - use AsyncStorage
  firebase_auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}


export const storage = getStorage(app);

export const firebase_db = getFirestore(app);
export const firestore = getFirestore(app);

export { firebase_auth };
export default app;
