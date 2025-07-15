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

// --- Firebase Config ---
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
const navFinance = document.getElementById("nav-finance");

// --- MAIN APP LOGIC ---
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

// --- Navigation ---
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
  navFinance.addEventListener("click", () => {
    setActiveTab(navFinance);
    loadFinanceView();
  });
}

function setActiveTab(activeButton) {
  [navBookings, navCustomers, navCalendar, navFinance].forEach((button) =>
    button.classList.remove("admin-nav-active")
  );
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

async function loadFinanceView() {
  adminContentDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-2xl shadow-lg"><h3 class="text-sm font-medium text-gray-500">Total Revenue</h3><p id="kpi-total-revenue" class="text-3xl font-bold text-gray-800 mt-1">$0.00</p></div>
            <div class="bg-white p-6 rounded-2xl shadow-lg"><h3 class="text-sm font-medium text-gray-500">Projected Revenue</h3><p id="kpi-projected-revenue" class="text-3xl font-bold text-gray-800 mt-1">$0.00</p></div>
            <div class="bg-white p-6 rounded-2xl shadow-lg"><h3 class="text-sm font-medium text-gray-500">Average Booking Value</h3><p id="kpi-avg-booking" class="text-3xl font-bold text-gray-800 mt-1">$0.00</p></div>
        </div>
        <div class="mb-6"><label for="date-range-filter" class="font-semibold text-gray-700">Filter by Date Range:</label><input type="text" id="date-range-filter" placeholder="Select a date range..." class="mt-1 block w-full md:w-80 border-gray-300 rounded-md shadow-sm"></div>
        <div class="bg-white shadow-lg rounded-2xl overflow-hidden">
            <table class="min-w-full"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th></tr></thead><tbody id="finance-table-body" class="bg-white divide-y divide-gray-200"></tbody></table>
        </div>`;

  const allBookings = await fetchAllBookings();
  flatpickr("#date-range-filter", {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: function (selectedDates) {
      if (selectedDates.length === 2) {
        calculateAndDisplayFinance(
          allBookings,
          selectedDates[0],
          selectedDates[1]
        );
      }
    },
  });
  calculateAndDisplayFinance(allBookings);
}

// --- Data Fetching & Logic ---
async function fetchAllBookings() {
  try {
    const querySnapshot = await getDocs(query(collection(db, "bookings")));
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Error fetching all bookings: ", error);
    return [];
  }
}

async function calculateAndDisplayFinance(allBookings, startDate, endDate) {
  let filteredBookings = allBookings;
  if (startDate && endDate) {
    filteredBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }
  let totalRevenue = 0,
    projectedRevenue = 0,
    validBookingsCount = 0,
    totalBookingValue = 0;
  filteredBookings.forEach((booking) => {
    const price = booking.totalPrice || 0;
    if (booking.status === "Completed") totalRevenue += price;
    if (booking.status === "Pending" || booking.status === "Confirmed")
      projectedRevenue += price;
    if (booking.status !== "Cancelled") {
      validBookingsCount++;
      totalBookingValue += price;
    }
  });
  const avgBookingValue =
    validBookingsCount > 0 ? totalBookingValue / validBookingsCount : 0;
  document.getElementById(
    "kpi-total-revenue"
  ).textContent = `$${totalRevenue.toFixed(2)}`;
  document.getElementById(
    "kpi-projected-revenue"
  ).textContent = `$${projectedRevenue.toFixed(2)}`;
  document.getElementById(
    "kpi-avg-booking"
  ).textContent = `$${avgBookingValue.toFixed(2)}`;
  const financeTableBody = document.getElementById("finance-table-body");
  financeTableBody.innerHTML = "";
  if (filteredBookings.length === 0) {
    financeTableBody.innerHTML =
      '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No transactions found for this period.</td></tr>';
    return;
  }
  filteredBookings.forEach((booking) => {
    const row = document.createElement("tr");
    const statusClasses = getStatusClasses(booking.status);
    row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
      booking.date
    }</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
      booking.customerName
    }</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
      booking.service
    }</td><td class="px-6 py-4 whitespace-nowrap"><span class="status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}">${
      booking.status
    }</span></td><td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">$${(
      booking.totalPrice || 0
    ).toFixed(2)}</td>`;
    financeTableBody.appendChild(row);
  });
}

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
      editable: false,
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
    const bookings = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    bookings.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      return 0;
    });
    bookingsTableBody.innerHTML = "";
    if (bookings.length === 0) {
      bookingsTableBody.innerHTML =
        '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No customer bookings found.</td></tr>';
      return;
    }
    bookings.forEach((bookingData) => {
      const { id: bookingId, ...booking } = bookingData;
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
          initializeAndDisplayCalendar();
        }
        event.target.disabled = false;
      });
    });
  } catch (error) {
    console.error("Error fetching bookings: ", error);
    bookingsTableBody.innerHTML =
      '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading bookings.</td></tr>';
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
      row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${
        user.name || "N/A"
      }</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
        user.email || "N/A"
      }</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
        user.phone || "N/A"
      }</td><td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href="profile.html?id=${userId}" class="text-indigo-600 hover:text-indigo-900">Edit</a></td>`;
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

// --- Logout ---
logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => console.error("Logout Error:", error));
});
