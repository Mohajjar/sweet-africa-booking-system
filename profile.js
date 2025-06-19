// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration (same as other pages)
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
const userNameSpan = document.getElementById("user-name");
const bookingsListDiv = document.getElementById("bookings-list");
const loadingMessage = document.getElementById("loading-message");
const logoutButton = document.getElementById("logout-button");

// --- Main Logic ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in.

    // 1. Display User's Name
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      userNameSpan.textContent = userDocSnap.data().name;
    }

    // 2. Fetch and Display User's Bookings
    const bookingsRef = collection(db, "bookings");
    // Create a query against the collection.
    const q = query(bookingsRef, where("customerEmail", "==", user.email));

    const querySnapshot = await getDocs(q);

    loadingMessage.style.display = "none"; // Hide the loading message

    if (querySnapshot.empty) {
      bookingsListDiv.innerHTML +=
        '<p class="text-gray-500">You have no bookings yet.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      const bookingElement = document.createElement("div");
      bookingElement.className = "border-b border-gray-200 py-4";
      bookingElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold text-lg">${booking.service} on ${
        booking.date
      }</p>
                        <p class="text-gray-600">${booking.time}</p>
                    </div>
                    <div class="text-right">
                         <p class="font-semibold text-lg">$${booking.totalPrice.toFixed(
                           2
                         )}</p>
                         <p class="px-3 py-1 text-sm font-semibold rounded-full ${
                           booking.status === "Pending"
                             ? "bg-yellow-200 text-yellow-800"
                             : "bg-green-200 text-green-800"
                         }">${booking.status}</p>
                    </div>
                </div>
            `;
      bookingsListDiv.appendChild(bookingElement);
    });
  } else {
    // User is signed out. Redirect them to the login page.
    window.location.href = "login.html";
  }
});

// --- Logout Logic ---
logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => {
    console.error("Logout Error:", error);
  });
});
