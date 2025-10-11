// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkg-xN-SAUMYf9i_TsmyVFM081NSImY7c",
  authDomain: "organiza-pro-fff29.firebaseapp.com",
  projectId: "organiza-pro-fff29",
  storageBucket: "organiza-pro-fff29.firebasestorage.app",
  messagingSenderId: "1028412843321",
  appId: "1:1028412843321:web:d354a6077985c078d2f4e8",
  measurementId: "G-FMX89SMWGH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);