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

// --- NEW HELPER FUNCTION FOR STATUS COLORS ---
function getStatusClasses(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

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
      loadBookingsView();
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

async function loadCustomersView() {
  adminContentDiv.innerHTML = `
        <div class="bg-white shadow-lg rounded-2xl overflow-hidden">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="customers-table-body" class="bg-white divide-y divide-gray-200">
                    <tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Loading customers...</td></tr>
                </tbody>
            </table>
        </div>
        <div id="edit-customer-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">Edit Customer</h3>
                    <div class="mt-2 px-7 py-3">
                        <form id="edit-customer-form">
                            <input type="hidden" id="edit-customer-id">
                            <input class="mb-3 px-3 py-2 text-gray-700 border rounded-md w-full" type="text" id="edit-customer-name" placeholder="Name">
                            <input class="mb-3 px-3 py-2 text-gray-700 border rounded-md w-full" type="email" id="edit-customer-email" placeholder="Email" disabled>
                            <input class="mb-3 px-3 py-2 text-gray-700 border rounded-md w-full" type="tel" id="edit-customer-phone" placeholder="Phone">
                            <div class="items-center px-4 py-3">
                                <button id="save-customer-button" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300">Save</button>
                                <button id="cancel-edit-customer-button" type="button" class="mt-3 px-4 py-2 bg-gray-200 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
  await fetchAndDisplayCustomers();
}

// --- Data Fetching & Display ---
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
      const statusClasses = getStatusClasses(booking.status);
      const statusBadge = `<span class="status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}">${
        booking.status || "N/A"
      }</span>`;
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
          badge.className = `status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(
            newStatus
          )}`;
        }
        event.target.disabled = false;
      });
    });
  } catch (error) {
    console.error("Error fetching bookings: ", error);
    bookingsTableBody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading bookings. Please check permissions and console.</td></tr>';
  }
}

async function fetchAndDisplayCustomers() {
  const customersTableBody = document.getElementById("customers-table-body");
  try {
    const querySnapshot = await getDocs(query(collection(db, "users")));
    customersTableBody.innerHTML = "";
    if (querySnapshot.empty) {
      customersTableBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No customers found.</td></tr>';
      return;
    }
    querySnapshot.forEach((docSnap) => {
      const userId = docSnap.id;
      const user = docSnap.data();
      const row = document.createElement("tr");

      // This new row structure includes the User ID and a direct link for the "Edit" button
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${
              user.name || "N/A"
            }</div>
            <div class="text-sm text-gray-400">${userId}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          user.email || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          user.phone || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <a href="profile.html?id=${userId}" class="text-indigo-600 hover:text-indigo-900">Edit</a>
        </td>
      `;
      customersTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching customers: ", error);
    customersTableBody.innerHTML =
      '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error loading customers.</td></tr>';
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
