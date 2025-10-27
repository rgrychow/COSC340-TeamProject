// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);