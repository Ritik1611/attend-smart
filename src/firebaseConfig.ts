
// Import the functions you need from Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import authentication
import { getFirestore } from "firebase/firestore"; // Import Firestore (if needed)
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzfqlrKmvElPhFwEkZpiogbcfQbPrbC04",
  authDomain: "attendsmart-62252.firebaseapp.com",
  projectId: "attendsmart-62252",
  storageBucket: "attendsmart-62252.appspot.com", // ✅ FIXED storageBucket URL
  messagingSenderId: "750709568240",
  appId: "1:750709568240:web:9435f90e019ae307d98835",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // Firestore for database
export const storage = getStorage(app);
