import { initializeApp } from "[https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js)";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "[https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js)";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "[https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js)";

// Your web app's Firebase configuration
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
const viewModeContent = document.getElementById("view-mode-content");
const profileForm = document.getElementById("profile-form");
const editProfileButton = document.getElementById("edit-profile-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const saveProfileButton = document.getElementById("save-profile-button");
const successMessage = document.getElementById("success-message");

const viewName = document.getElementById("view-name");
const viewEmail = document.getElementById("view-email");
const viewPhone = document.getElementById("view-phone");
const viewAddress = document.getElementById("view-address");

const profileNameInput = document.getElementById("profile-name");
const profileEmailInput = document.getElementById("profile-email");
const profilePhoneInput = document.getElementById("profile-phone");
const profileAddressInput = document.getElementById("profile-address");
const profileCityInput = document.getElementById("profile-city");
const profileStateInput = document.getElementById("profile-state");
const profileZipInput = document.getElementById("profile-zip");

const bookingsListDiv = document.getElementById("bookings-list");
const loadingMessage = document.getElementById("loading-message");
const logoutButton = document.getElementById("logout-button");

function populateUserData(userData) {
  viewName.textContent = userData.name || "N/A";
  viewEmail.textContent = userData.email || "N/A";
  viewPhone.textContent = userData.phone || "N/A";
  const fullAddress = [
    userData.address,
    userData.city,
    userData.state,
    userData.zip,
  ]
    .filter(Boolean)
    .join(", ");
  viewAddress.textContent = fullAddress || "N/A";

  profileNameInput.value = userData.name || "";
  profileEmailInput.value = userData.email || "";
  profilePhoneInput.value = userData.phone || "";
  profileAddressInput.value = userData.address || "";
  profileCityInput.value = userData.city || "";
  profileStateInput.value = userData.state || "";
  profileZipInput.value = userData.zip || "";
}

// --- Main Logic ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    let userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log(
        "User document not found. Creating one for existing auth user."
      );
      try {
        const initialData = {
          email: user.email,
          name: user.displayName || "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zip: "",
        };
        await setDoc(userDocRef, initialData);
        userDocSnap = await getDoc(userDocRef);
      } catch (error) {
        console.error("Error creating user document:", error);
        return;
      }
    }

    let userData = userDocSnap.data();
    populateUserData(userData);

    fetchAndDisplayBookings(user.email);

    editProfileButton.addEventListener("click", () => {
      viewModeContent.classList.add("hidden");
      profileForm.classList.remove("hidden");
    });

    cancelEditButton.addEventListener("click", () => {
      populateUserData(userData); // Reset form to original data
      profileForm.classList.add("hidden");
      viewModeContent.classList.remove("hidden");
    });

    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      saveProfileButton.disabled = true;
      saveProfileButton.textContent = "Saving...";

      const updatedData = {
        name: profileNameInput.value.trim(),
        phone: profilePhoneInput.value.trim(),
        address: profileAddressInput.value.trim(),
        city: profileCityInput.value.trim(),
        state: profileStateInput.value.trim(),
        zip: profileZipInput.value.trim(),
      };

      try {
        await updateDoc(userDocRef, updatedData);
        userData = { ...userData, ...updatedData }; // Update local data object
        populateUserData(userData);
        profileForm.classList.add("hidden");
        viewModeContent.classList.remove("hidden");
        successMessage.classList.remove("hidden");
        setTimeout(() => successMessage.classList.add("hidden"), 3000);
      } catch (error) {
        console.error("Error updating profile: ", error);
        alert("Could not update profile. Please try again.");
      } finally {
        saveProfileButton.disabled = false;
        saveProfileButton.textContent = "Save Changes";
      }
    });
  } else {
    window.location.href = "login.html";
  }
});

async function fetchAndDisplayBookings(userEmail) {
  const bookingsRef = collection(db, "bookings");
  const q = query(bookingsRef, where("customerEmail", "==", userEmail));
  const querySnapshot = await getDocs(q);

  loadingMessage.style.display = "none";
  bookingsListDiv.innerHTML = "";

  if (querySnapshot.empty) {
    bookingsListDiv.innerHTML =
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
                    <p class="font-bold text-md">${booking.service} on ${
      booking.date
    }</p>
                    <p class="text-gray-600 text-sm">${booking.time}</p>
                </div>
                <div class="text-right">
                     <p class="font-semibold text-md">$${booking.totalPrice.toFixed(
                       2
                     )}</p>
                     <p class="px-3 py-1 text-xs font-semibold rounded-full ${
                       booking.status === "Pending"
                         ? "bg-yellow-200 text-yellow-800"
                         : "bg-green-200 text-green-800"
                     }">${booking.status}</p>
                </div>
            </div>
        `;
    bookingsListDiv.appendChild(bookingElement);
  });
}

logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => {
    console.error("Logout Error:", error);
  });
});
