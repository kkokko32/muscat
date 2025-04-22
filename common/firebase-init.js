// ✅ Firebase 구성
const firebaseConfig = {
  apiKey: "AIzaSyAZ8jWpCo1ZeS3VrOQh8m5pCJRVi1wJRNY",
  authDomain: "muscat-86007.firebaseapp.com",
  projectId: "muscat-86007",
  storageBucket: "muscat-86007.firebasestorage.app",
  messagingSenderId: "741157244877",
  appId: "1:741157244877:web:3bba4655292e2e19cdbe84",
  measurementId: "G-VSBCZ125J2"
};

// ✅ Firebase 초기화
firebase.initializeApp(firebaseConfig);

// ✅ 인스턴스 전역 등록
window.db = firebase.firestore();
window.auth = firebase.auth();
window.storage = firebase.storage();

// ✅ Auth 함수 전역 등록
window.firebaseSignUp = (email, pw) =>
  firebase.auth().createUserWithEmailAndPassword(email, pw);

window.firebaseSignIn = (email, pw) =>
  firebase.auth().signInWithEmailAndPassword(email, pw);

window.firebaseSignOut = () => firebase.auth().signOut();

window.firebaseOnAuthStateChanged = (callback) =>
  firebase.auth().onAuthStateChanged(callback);

window.firebaseGoogleProvider = new firebase.auth.GoogleAuthProvider();

window.firebaseSignInWithGoogle = () =>
  firebase.auth().signInWithPopup(window.firebaseGoogleProvider);

// ✅ Firestore 함수 전역 등록
window.firebaseAddDoc = async (collectionName, data) => {
  return await window.db.collection(collectionName).add(data);
};

window.firebaseGetDocs = async (collectionName) => {
  return await window.db.collection(collectionName).get();
};

window.firebaseDeleteDoc = async (collectionName, docId) => {
  return await window.db.collection(collectionName).doc(docId).delete();
};

window.firebaseDoc = (collectionName, docId) => {
  return window.db.collection(collectionName).doc(docId);
};

window.firebaseServerTimestamp = () =>
  firebase.firestore.FieldValue.serverTimestamp();

// ✅ Storage 함수 전역 등록
window.firebaseUploadFile = async (path, file) => {
  const ref = firebase.storage().ref().child(path);
  const snapshot = await ref.put(file);
  return await snapshot.ref.getDownloadURL();
};

window.firebaseStorageRef = (path) => firebase.storage().ref().child(path);
window.firebaseUploadBytes = (ref, file) => ref.put(file);
window.firebaseGetDownloadURL = (ref) => ref.getDownloadURL();
