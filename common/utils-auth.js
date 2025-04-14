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
  const signup = document.getElementById("btn-signup");
  const login = document.getElementById("btn-login");
  const mypage = document.getElementById("btn-mypage") || document.getElementById("mypage-btn");

  if (user) {
    console.log("로그인 중:", user.email);
    document.body.classList.add("logged-in");
    if (signup) signup.style.display = "none";
    if (login) login.style.display = "none";
    if (mypage) mypage.style.display = "inline-block";
    updateUIAfterLogin(user);
  } else {
    console.log("로그아웃 상태");
    document.body.classList.remove("logged-in");
    if (signup) signup.style.display = "inline-block";
    if (login) login.style.display = "inline-block";
    if (mypage) mypage.style.display = "none";
    resetUIAfterLogout();

    // 마이페이지 접근 차단
    if (window.location.pathname.includes("/mypage/")) {
      openLoginFromRedirect();
    }
  }
});

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

window.logout = function () {
  signOut(auth).then(() => {
    resetUIAfterLogout();
    window.location.href = "/index.html";
  });
}

window.updateUIAfterLogin = function (user) {
  const loginBtn = document.getElementById("btn-login") || document.getElementById("login-btn");
  const mypageBtn = document.getElementById("btn-mypage") || document.getElementById("mypage-btn");

  if (loginBtn) loginBtn.style.display = "none";
  if (mypageBtn) mypageBtn.style.display = "inline-block";
}

window.resetUIAfterLogout = function () {
  const loginBtn = document.getElementById("btn-login") || document.getElementById("login-btn");
  const mypageBtn = document.getElementById("btn-mypage") || document.getElementById("mypage-btn");

  if (loginBtn) loginBtn.style.display = "inline-block";
  if (mypageBtn) mypageBtn.style.display = "none";
}

window.closeModal = function () {
  const loginModal = document.getElementById("login-modal");
  const signupModal = document.getElementById("signup-modal");
  if (loginModal) loginModal.style.display = "none";
  if (signupModal) signupModal.style.display = "none";
  const placeholder = document.getElementById("modal-placeholder");
  if (placeholder) placeholder.innerHTML = "";
}

window.goToTemplate = function (templateUrl) {
  if (currentUser) {
    window.location.href = "/templates/templates-design/" + templateUrl;
  } else {
    openLoginFromRedirect();
  }
}

window.goToMypage = function () {
  if (currentUser) {
    window.location.href = "/mypage/mypage-index.html";
  } else {
    openLoginFromRedirect();
  }
}

// ✅ 추가: 내브랜딩페이지 (my-save.html)로 이동
window.goToMypageSave = function () {
  if (currentUser) {
    window.location.href = "/save-templates/my-save.html";
  } else {
    openLoginFromRedirect();
  }
}

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

window.openLoginModal = function () {
  closeModal();
  fetch("/common/login-modal.html")
    .then(res => res.text())
    .then(html => {
      const placeholder = document.getElementById("modal-placeholder");
      if (placeholder) placeholder.innerHTML = html;
      const loginModal = document.getElementById("login-modal");
      if (loginModal) loginModal.style.display = "flex";
    });
}

window.openSignupModal = function () {
  closeModal();
  fetch("/common/signup-modal.html")
    .then(res => res.text())
    .then(html => {
      const placeholder = document.getElementById("modal-placeholder");
      if (placeholder) placeholder.innerHTML = html;
      const signupModal = document.getElementById("signup-modal");
      if (signupModal) signupModal.style.display = "flex";
    });
}
