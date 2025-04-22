// Firebase SDK 모듈 import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyAZ8jWpCo1ZeS3VrOQh8m5pCJRVi1wJRNY",
  authDomain: "muscat-86007.firebaseapp.com",
  projectId: "muscat-86007",
  storageBucket: "muscat-86007.firebasestorage.app",
  messagingSenderId: "741157244877",
  appId: "1:741157244877:web:3bba4655292e2e19cdbe84",
  measurementId: "G-VSBCZ125J2"
};

// ✅ Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// ✅ Firebase 서비스 가져오기 및 전역 등록
window.db = getFirestore(app);
window.auth = getAuth(app);
window.storage = getStorage(app);

// ✅ Firestore 함수 전역 등록 (선택적)
window.firebaseCollection = collection;
window.firebaseAddDoc = addDoc;
window.firebaseDeleteDoc = deleteDoc;
window.firebaseGetDocs = getDocs;
window.firebaseDoc = doc;
window.firebaseServerTimestamp = serverTimestamp;

// ✅ Storage 함수 전역 등록 (선택적)
window.firebaseStorageRef = ref;
window.firebaseUploadBytes = uploadBytes;
window.firebaseGetDownloadURL = getDownloadURL;
