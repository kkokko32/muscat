import { auth } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    console.log("로그인 중:", user.email);
    document.body.classList.add("logged-in");
    updateUIAfterLogin(user);
  } else {
    console.log("로그아웃 상태");
    document.body.classList.remove("logged-in");
    resetUIAfterLogout();
  }
});

// 회원가입
window.signUp = function () {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      closeModal();
      updateUIAfterLogin(userCredential.user);
    })
    .catch((error) => {
      alert("회원가입 실패: " + error.message);
    });
}

// 로그인
window.signIn = function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      closeModal();
      updateUIAfterLogin(userCredential.user);
    })
    .catch((error) => {
      alert("로그인 실패: " + error.message);
    });
}

// 구글 로그인
window.signInWithGoogle = function () {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      closeModal();
      updateUIAfterLogin(result.user);
    })
    .catch((error) => {
      alert("로그인 실패: " + error.message);
    });
}

// 로그아웃
window.logout = function () {
  signOut(auth).then(() => {
    resetUIAfterLogout();
    window.location.href = "/index.html";
  });
}

// 로그인 후 UI 변경 함수
window.updateUIAfterLogin = function (user) {
  const loginBtn = document.getElementById("login-btn");
  const mypageBtn = document.getElementById("btn-mypage") || document.getElementById("mypage-btn");

  if (loginBtn) loginBtn.style.display = "none";
  if (mypageBtn) mypageBtn.style.display = "inline-block";
}

// 로그아웃 후 UI 초기화
window.resetUIAfterLogout = function () {
  const loginBtn = document.getElementById("login-btn");
  const mypageBtn = document.getElementById("btn-mypage") || document.getElementById("mypage-btn");

  if (loginBtn) loginBtn.style.display = "inline-block";
  if (mypageBtn) mypageBtn.style.display = "none";
}

// 모달 닫기
window.closeModal = function () {
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  if (loginModal) loginModal.style.display = "none";
  if (signupModal) signupModal.style.display = "none";
  const placeholder = document.getElementById("modal-placeholder");
  if (placeholder) placeholder.innerHTML = "";
}

// 템플릿 상세 페이지 이동 전 로그인 확인
window.goToTemplate = function (templateUrl) {
  if (currentUser) {
    window.location.href = "/templates/templates-design/" + templateUrl;
  } else {
    const modal = document.getElementById("login-required-modal");
    if (modal) modal.style.display = "flex";
  }
}

// 마이페이지 접근 전 로그인 확인
window.goToMypage = function () {
  if (currentUser) {
    window.location.href = "/mypage/mypage-index.html";
  } else {
    alert("로그인이 필요한 서비스입니다.");
  }
}

// 로그인 유도 후 모달 열기
window.openLoginFromRedirect = function () {
  closeModal();
  fetch("/common/login-modal.html")
    .then(res => res.text())
    .then(html => {
      const placeholder = document.getElementById("modal-placeholder");
      if (placeholder) placeholder.innerHTML = html;
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.style.display = "flex";
      const requiredModal = document.getElementById("login-required-modal");
      if (requiredModal) requiredModal.style.display = "none";
    });
}
