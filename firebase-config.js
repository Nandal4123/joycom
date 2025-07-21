// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDldYr1xOyH_H44UR7tXS_hUomXbbkGVEg",
    authDomain: "joy-counseling-center.firebaseapp.com",
    projectId: "joy-counseling-center",
    storageBucket: "joy-counseling-center.firebasestorage.app",
    messagingSenderId: "976976902307",
    appId: "1:976976902307:web:93114b8dd4c7691daa6716",
    measurementId: "G-GR2197VTJ4"
};

// Firebase 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, analytics }; 