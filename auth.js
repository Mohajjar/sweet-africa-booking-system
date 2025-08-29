import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// --- DOM Elements ---
// *** MODIFIED: Select containers for showing/hiding ***
const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");

// *** MODIFIED: Select the <form> tags directly by their new IDs ***
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const showSignupButton = document.getElementById("show-signup");
const showLoginButton = document.getElementById("show-login");
const errorMessageElement = document.getElementById("error-message");

// --- Form Switching Logic ---
showSignupButton.addEventListener("click", (e) => {
  e.preventDefault();
  loginFormContainer.classList.add("hidden");
  signupFormContainer.classList.remove("hidden");
  errorMessageElement.textContent = "";
});

showLoginButton.addEventListener("click", (e) => {
  e.preventDefault();
  signupFormContainer.classList.add("hidden");
  loginFormContainer.classList.remove("hidden");
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

    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: "customer",
      phone: "",
      address: "",
      city: "",
      zip: "",
      gender: "",
    });

    window.location.href = "booking.html";
  } catch (error) {
    errorMessageElement.textContent = error.message;
  }
});

// --- Login Logic ---
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

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "booking.html";
    }
  } catch (error) {
    errorMessageElement.textContent = error.message;
  }
});
