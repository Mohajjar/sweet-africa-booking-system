// admin.js

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

const firebaseConfig = {
  apiKey: "AIzaSyAjKL8-QPcOKIXCC9L3K9EVRy2LfAcEhxI",
  authDomain: "sweet-africa-bookings.firebaseapp.com",
  projectId: "sweet-africa-bookings",
  storageBucket: "sweet-africa-bookings.firebasestorage.app",
  messagingSenderId: "950167391030",
  appId: "1:950167391030:web:1085602775ce912d220197",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HELPER FUNCTIONS ---
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

function getStatusColor(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "pending":
      return "#facc15";
    case "confirmed":
      return "#60a5fa";
    case "completed":
      return "#4ade80";
    case "cancelled":
      return "#f87171";
    default:
      return "#9ca3af";
  }
}

// --- DOM Elements ---
const logoutButton = document.getElementById("logout-button");
const mainContent = document.querySelector("main");
const adminContentDiv = document.getElementById("admin-content");
const navBookings = document.getElementById("nav-bookings");
const navCustomers = document.getElementById("nav-customers");
const navCalendar = document.getElementById("nav-calendar");

// --- MAIN APP LOGIC ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
      mainContent.style.display = "block";
      setupNavigation();
      loadBookingsView(); // Default view on page load
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
  navCalendar.addEventListener("click", () => {
    setActiveTab(navCalendar);
    loadCalendarView();
  });
}

function setActiveTab(activeButton) {
  navBookings.classList.remove("admin-nav-active");
  navCustomers.classList.remove("admin-nav-active");
  navCalendar.classList.remove("admin-nav-active");
  activeButton.classList.add("admin-nav-active");
}

// --- View Loaders ---
async function loadBookingsView() {
  adminContentDiv.innerHTML = `<div class="bg-white shadow-lg rounded-2xl overflow-hidden"><table class="min-w-full"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody id="bookings-table-body" class="bg-white divide-y divide-gray-200"><tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading bookings...</td></tr></tbody></table></div>`;
  await fetchAndDisplayBookings();
}

async function loadCustomersView() {
  adminContentDiv.innerHTML = `<div class="bg-white shadow-lg rounded-2xl overflow-hidden"><table class="min-w-full"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody id="customers-table-body" class="bg-white divide-y divide-gray-200"><tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Loading customers...</td></tr></tbody></table></div>`;
  await fetchAndDisplayCustomers();
}

async function loadCalendarView() {
  adminContentDiv.innerHTML = `<div id="booking-calendar"></div>`;
  await initializeAndDisplayCalendar();
}

// --- Data Fetching & Display ---
async function initializeAndDisplayCalendar() {
  const calendarEl = document.getElementById("booking-calendar");
  if (!calendarEl) return;
  try {
    const querySnapshot = await getDocs(query(collection(db, "bookings")));
    const events = querySnapshot.docs.map((doc) => {
      const booking = doc.data();
      const eventColor = getStatusColor(booking.status);
      const timeParts = booking.time ? booking.time.split(" ")[0] : "12:00";
      const dateStr = booking.date;
      const isoDate = new Date(dateStr).toISOString().split("T")[0];
      return {
        title: `${booking.customerName} - ${booking.service}`,
        start: `${isoDate}T${timeParts}:00`,
        color: eventColor,
        borderColor: eventColor,
      };
    });
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,listWeek",
      },
      events: events,
    });
    calendar.render();
  } catch (error) {
    console.error("Error fetching bookings for calendar: ", error);
    calendarEl.innerHTML =
      '<p class="text-red-500 text-center">Error loading calendar events.</p>';
  }
}

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

async function fetchAndDisplayBookings() {
  const bookingsTableBody = document.getElementById("bookings-table-body");
  try {
    const querySnapshot = await getDocs(query(collection(db, "bookings")));

    // Convert the booking documents to a standard array
    const bookings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // --- NEW SORTING LOGIC ---
    // This will sort the array to put "Pending" statuses first.
    bookings.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") {
        return -1; // a comes first
      }
      if (a.status !== "Pending" && b.status === "Pending") {
        return 1; // b comes first
      }
      return 0; // Keep original order for other statuses
    });
    // --- END OF SORTING LOGIC ---

    bookingsTableBody.innerHTML = ""; // Clear the loading message
    if (bookings.length === 0) {
      bookingsTableBody.innerHTML =
        '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No customer bookings found.</td></tr>';
      return;
    }

    // Now, loop through the SORTED bookings array to build the table
    bookings.forEach((bookingData) => {
      const bookingId = bookingData.id;
      const booking = bookingData; // The object now includes all data + id
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

    // Re-attach event listeners after rendering
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
          initializeAndDisplayCalendar();
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
