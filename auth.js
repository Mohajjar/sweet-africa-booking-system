// Import the functions you need from the SDKs you need
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
import { auth, db } from "./firebase-config.js"; // <-- Correctly importing from your new config file

// --- DOM Elements ---
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignupButton = document.getElementById("show-signup");
const showLoginButton = document.getElementById("show-login");
const errorMessageElement = document.getElementById("error-message");
const signupPhoneInput = document.getElementById("signup-phone");

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

// --- Phone Number Auto-Formatting ---
signupPhoneInput.addEventListener("input", (e) => {
  const input = e.target;
  const digits = input.value.replace(/\D/g, "").substring(0, 10);
  let formatted = "";

  if (digits.length > 0) {
    formatted = `(${digits.substring(0, 3)}`;
  }
  if (digits.length > 3) {
    formatted += `) ${digits.substring(3, 6)}`;
  }
  if (digits.length > 6) {
    formatted += `-${digits.substring(6, 10)}`;
  }
  input.value = formatted;
});

// --- Sign Up Logic (Now with all fields) ---
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Collect all data from the new form fields
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const phone = signupPhoneInput.value;
  const address = document.getElementById("signup-address").value;
  const city = document.getElementById("signup-city").value;
  const zip = document.getElementById("signup-zip").value;
  const gender = document.getElementById("signup-gender").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Save all collected information to the user's document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      phone: phone,
      address: address,
      city: city,
      zip: zip,
      gender: gender,
      role: "customer", // Set default role
    });

    // *** MODIFIED: Redirect to the new booking page ***
    window.location.href = "booking.html";
  } catch (error) {
    errorMessageElement.textContent = error.message;
  }
});

// --- Login Logic (with Admin Check) ---
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
      // *** MODIFIED: Redirect to the new booking page ***
      window.location.href = "booking.html";
    }
  } catch (error) {
    errorMessageElement.textContent = error.message;
  }
});
