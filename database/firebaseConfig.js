// Import the functions you need from the SDKs you need
import "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDB5f03HQyNZaR9qowKDmz8GssoIDY7xuI",
  authDomain: "talleresunidos-a963f.firebaseapp.com",
  databaseURL: "https://talleresunidos-a963f-default-rtdb.firebaseio.com",
  projectId: "talleresunidos-a963f",
  storageBucket: "talleresunidos-a963f.firebasestorage.app",
  messagingSenderId: "68324831403",
  appId: "1:68324831403:web:b35403b1ee756fdfba07ee",
  measurementId: "G-6GK914RQT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app);

export { db };
export const storage = getStorage(app);