import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyC2_Je5Z8pwEkrXqnIiQZsUxFW7tcEBPoY",
  authDomain: "store-61ceb.firebaseapp.com",
  projectId: "store-61ceb",
  storageBucket: "store-61ceb.appspot.com",
  messagingSenderId: "790902216535",
  appId: "1:790902216535:web:a020d64e3d68ccf7299012",
  measurementId: "G-52XBSJE7Z0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fs = getFirestore(app);
const storage = getStorage(app);

export { app, auth, fs, storage, firebaseConfig };
