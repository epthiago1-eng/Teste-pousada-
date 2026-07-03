import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "affable-unfolding-hnn32",
  appId: "1:578428392407:web:0bef2abf266e7fa29af192",
  apiKey: "AIzaSyDaW6ADouHcE11V6RFr-pH1oMWDfUpRwbw",
  authDomain: "affable-unfolding-hnn32.firebaseapp.com",
  storageBucket: "affable-unfolding-hnn32.firebasestorage.app",
  messagingSenderId: "578428392407"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-remixpousadagest-66fa948d-ca02-40d6-a02f-c9e57e62529a");
