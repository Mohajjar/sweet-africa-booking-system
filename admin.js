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
  getDocs,
  query,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
const logoutButton = document.getElementById("logout-button");
const mainContent = document.querySelector("main");
const adminContentDiv = document.getElementById("admin-content");
const navBookings = document.getElementById("nav-bookings");
const navCustomers = document.getElementById("nav-customers");

// --- Main Security Check ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
      mainContent.style.display = "block";
      setupNavigation();
      loadBookingsView(); // Load bookings by default
    } else {
      document.body.innerHTML = `<div class="h-screen w-screen flex flex-col justify-center items-center"><h1 class="text-2xl font-bold text-red-600">Access Denied</h1><p class="text-gray-600 mt-2">You do not have permission to view this page.</p><a href="index.html" class="mt-4 text-blue-500 hover:underline">Go to Booking Page</a></div>`;
    }
  } else {
    window.location.href = "login.html";
  }
});

// --- Navigation Logic ---
function setupNavigation() {
  navBookings.addEventListener("click", () => {
    setActiveTab(navBookings);
    loadBookingsView();
  });
  navCustomers.addEventListener("click", () => {
    setActiveTab(navCustomers);
    loadCustomersView();
  });
}

function setActiveTab(activeButton) {
  navBookings.classList.remove("admin-nav-active");
  navCustomers.classList.remove("admin-nav-active");
  activeButton.classList.add("admin-nav-active");
}

// --- View Loaders ---
async function loadBookingsView() {
  adminContentDiv.innerHTML = `
        <div class="bg-white shadow-lg rounded-2xl overflow-hidden">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="bookings-table-body" class="bg-white divide-y divide-gray-200">
                    <tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading bookings...</td></tr>
                </tbody>
            </table>
        </div>
    `;
  await fetchAndDisplayBookings();
}

function loadCustomersView() {
  adminContentDiv.innerHTML = `
        <div class="bg-white shadow-lg rounded-2xl overflow-hidden">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    </tr>
                </thead>
                <tbody id="customers-table-body" class="bg-white divide-y divide-gray-200">
                    <tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">Loading customers...</td></tr>
                </tbody>
            </table>
        </div>
    `;
  fetchAndDisplayCustomers();
}

// --- Data Fetching ---
async function fetchAndDisplayBookings() {
  const bookingsTableBody = document.getElementById("bookings-table-body");
  try {
    const querySnapshot = await getDocs(query(collection(db, "bookings")));
    bookingsTableBody.innerHTML = "";
    if (querySnapshot.empty) {
      bookingsTableBody.innerHTML =
        '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No customer bookings found.</td></tr>';
      return;
    }
    querySnapshot.forEach((docSnap) => {
      const bookingId = docSnap.id;
      const booking = docSnap.data();
      const row = document.createElement("tr");
      row.id = `booking-row-${bookingId}`;
      const statusBadge = `<span class="status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        booking.status === "Pending"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }">${booking.status || "N/A"}</span>`;
      const formattedPrice =
        typeof booking.totalPrice === "number"
          ? `$${booking.totalPrice.toFixed(2)}`
          : "N/A";
      const actionsDropdown = `<select data-booking-id="${bookingId}" class="status-select rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"><option value="Pending" ${
        booking.status === "Pending" ? "selected" : ""
      }>Pending</option><option value="Confirmed" ${
        booking.status === "Confirmed" ? "selected" : ""
      }>Confirmed</option><option value="Completed" ${
        booking.status === "Completed" ? "selected" : ""
      }>Completed</option><option value="Cancelled" ${
        booking.status === "Cancelled" ? "selected" : ""
      }>Cancelled</option></select>`;
      row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${booking.customerName}</div><div class="text-sm text-gray-500">${booking.customerEmail}</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${booking.service}</div><div class="text-sm text-gray-500">${booking.bedrooms} bed, ${booking.bathrooms} bath</div></td><td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900">${booking.date}</div><div class="text-sm text-gray-500">${booking.time}</div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${statusBadge}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${formattedPrice}</td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${actionsDropdown}</td>`;
      bookingsTableBody.appendChild(row);
    });
    document.querySelectorAll(".status-select").forEach((selectElement) => {
      selectElement.addEventListener("change", async (event) => {
        const newStatus = event.target.value;
        const bookingId = event.target.dataset.bookingId;
        event.target.disabled = true;
        const success = await updateBookingStatus(bookingId, newStatus);
        if (success) {
          const row = document.getElementById(`booking-row-${bookingId}`);
          const badge = row.querySelector(".status-badge");
          badge.textContent = newStatus;
          badge.className = `status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full`;
          if (newStatus === "Pending")
            badge.classList.add("bg-yellow-100", "text-yellow-800");
          else if (newStatus === "Completed" || newStatus === "Confirmed")
            badge.classList.add("bg-green-100", "text-green-800");
          else if (newStatus === "Cancelled")
            badge.classList.add("bg-red-100", "text-red-800");
        }
        event.target.disabled = false;
      });
    });
  } catch (error) {
    console.error("Error fetching bookings: ", error);
    bookingsTableBody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading bookings. Please check the console.</td></tr>';
  }
}

// --- THIS FUNCTION IS NOW FULLY IMPLEMENTED ---
async function fetchAndDisplayCustomers() {
  const customersTableBody = document.getElementById("customers-table-body");
  try {
    const querySnapshot = await getDocs(query(collection(db, "users")));
    customersTableBody.innerHTML = "";
    if (querySnapshot.empty) {
      customersTableBody.innerHTML =
        '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No customers found.</td></tr>';
      return;
    }
    querySnapshot.forEach((docSnap) => {
      const userId = docSnap.id;
      const user = docSnap.data();
      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${
                  user.name || "N/A"
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                  user.email || "N/A"
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${userId}</td>
            `;
      customersTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching customers: ", error);
    customersTableBody.innerHTML =
      '<tr><td colspan="3" class="px-6 py-4 text-center text-red-500">Error loading customers.</td></tr>';
  }
}

async function updateBookingStatus(bookingId, newStatus) {
  const bookingRef = doc(db, "bookings", bookingId);
  try {
    await updateDoc(bookingRef, { status: newStatus });
    return true;
  } catch (error) {
    console.error("Error updating booking status: ", error);
    return false;
  }
}

// --- Logout Logic ---
logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => console.error("Logout Error:", error));
});
