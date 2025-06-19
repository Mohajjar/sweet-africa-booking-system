// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration (same as in index.html)
const firebaseConfig = {
  apiKey: "AIzaSyAjKL8-QPcOKIXCC9L3K9EVRy2LfAcEhxI",
  authDomain: "sweet-africa-bookings.firebaseapp.com",
  projectId: "sweet-africa-bookings",
  storageBucket: "sweet-africa-bookings.firebasestorage.app",
  messagingSenderId: "950167391030",
  appId: "1:950167391030:web:1085602775ce912d220197",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DOM Elements ---
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignupButton = document.getElementById("show-signup");
const showLoginButton = document.getElementById("show-login");
const errorMessageElement = document.getElementById("error-message");

// --- Form Switching Logic ---
showSignupButton.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
  errorMessageElement.textContent = "";
});

showLoginButton.addEventListener("click", (e) => {
  e.preventDefault();
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  errorMessageElement.textContent = "";
});

// --- Sign Up Logic ---
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save user's name and email to Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      // New users do NOT get a role by default
    });

    // Redirect to the booking page after successful signup
    window.location.href = "index.html";
  } catch (error) {
    errorMessageElement.textContent = error.message;
  }
});

// --- Login Logic (Now with Admin Check) ---
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // --- THIS IS THE NEW "SMART" PART ---
    // Check the user's role in the database
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
      // If user is an admin, redirect to the admin dashboard
      window.location.href = "admin.html";
    } else {
      // Otherwise, redirect to the regular booking page
      window.location.href = "index.html";
    }
  } catch (error) {
    errorMessageElement.textContent = error.message;
  }
});
