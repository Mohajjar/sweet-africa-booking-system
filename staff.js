import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// --- DOM Elements ---
const staffNameSpan = document.getElementById("staff-name");
const logoutButton = document.getElementById("logout-button");
const jobsListDiv = document.getElementById("jobs-list");
const loadingMessage = document.getElementById("loading-message");

// --- Main Logic ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().role === "staff") {
      const userData = userDocSnap.data();
      staffNameSpan.textContent = userData.name.split(" ")[0]; // Show first name
      // We will fetch jobs assigned to this user in a future step
      displayPlaceholderJobs();
    } else {
      // If user is not staff, deny access and redirect
      alert("Access Denied. You do not have permission to view this page.");
      window.location.href = "login.html";
    }
  } else {
    // Not logged in, redirect to login
    window.location.href = "login.html";
  }
});

// --- Placeholder Function ---
// In the future, this will fetch real jobs from the database.
function displayPlaceholderJobs() {
  loadingMessage.style.display = "none";
  jobsListDiv.innerHTML = `
        <div class="border border-gray-200 p-4 rounded-lg">
            <p class="text-gray-500 text-center">No upcoming jobs assigned to you yet.</p>
            <p class="text-gray-400 text-sm text-center mt-2">Check back later or contact your administrator.</p>
        </div>
    `;
}

// --- Logout ---
logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => {
    console.error("Logout Error:", error);
  });
});
