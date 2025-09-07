import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore} from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBuyefPfjXVoGq3siZk9qzW6hS8BMKFSds",
  authDomain: "healthtracking-1870e.firebaseapp.com",
  projectId: "healthtracking-1870e",
  storageBucket: "healthtracking-1870e.firebasestorage.app",
  messagingSenderId: "745549161497",
  appId: "1:745549161497:web:447aa6fd1b67af68213688",
  measurementId: "G-QRP2V0K5XY"
};

const app = initializeApp(firebaseConfig);

// ✅ JS SDK export
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // quan trọng
});
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});


