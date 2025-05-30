import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCSciuwvryRQlpm8w_dxwng9wnJKW3BMME",
  authDomain: "fitbingo-70a5e.firebaseapp.com",
  projectId: "fitbingo-70a5e",
  storageBucket: "fitbingo-70a5e.firebasestorage.app",
  messagingSenderId: "795454041515",
  appId: "1:795454041515:web:ea01ea4a32ef8a758876ee"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// 認証とFirestoreのインスタンスを取得
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;