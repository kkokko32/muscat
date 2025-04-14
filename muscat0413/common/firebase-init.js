// common/firebase-init.js

// Firebase 모듈 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase 프로젝트 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyAZ8jWpCo1ZeS3VrOQh8m5pCJRVi1wJRNY",
  authDomain: "muscat-86007.firebaseapp.com",
  projectId: "muscat-86007",
  storageBucket: "muscat-86007.appspot.com",  // ← `.app` → `.appspot.com`으로 수정됨
  messagingSenderId: "741157244877",
  appId: "1:741157244877:web:3bba4655292e2e19cdbe84",
  measurementId: "G-VSBCZ125J2"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase Auth 모듈 추출해서 외부에서 쓸 수 있게 export
export const auth = getAuth(app);


import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firestore 모듈도 export
export const db = getFirestore(app);
