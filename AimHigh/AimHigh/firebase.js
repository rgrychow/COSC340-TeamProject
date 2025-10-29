// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
// Edit 
import { getAuth, initializeAuth, getReactNativePersistance } from "firebase/auth";
// Edit
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Edit
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc1r0IycqYHObFNVWadhBTGLdbdmXe97o",
  authDomain: "aim-high-d86a1.firebaseapp.com",
  databaseURL: "https://aim-high-d86a1-default-rtdb.firebaseio.com",
  projectId: "aim-high-d86a1",
  storageBucket: "aim-high-d86a1.firebasestorage.app",
  messagingSenderId: "1019607569837",
  appId: "1:1019607569837:web:9279c1c4a13f0d7f91bd24",
  measurementId: "G-LV1KHT3SK7"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Edit: persitant storage so users stay signed in
let auth;
try {
  const hasPersistence = typeof getReactNativePersistence === "function";
  if (hasPersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch (e) {
  auth = getAuth(app);
}

// Initialize services
// Edit: export const auth = getAuth(app);
// Edit: export 
const db = getFirestore(app);
// Edit: export 
const storage = getStorage(app);

export { app, auth, db, storage}
