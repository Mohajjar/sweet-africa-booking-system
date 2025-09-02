import {
  createUserWithEmailAndPassword,
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
  addDoc,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

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
const navStaff = document.getElementById("nav-staff");
const addNewBookingBtn = document.getElementById("add-new-booking-btn");

// --- STATE FOR PAGINATION ---
let currentPage = 1;
const bookingsPerPage = 10;

// --- Navigation ---
function setActiveTab(activeButton) {
  const navButtons = [
    navBookings,
    navCustomers,
    navCalendar,
    navFinance,
    navStaff,
  ];

  const activeClasses = ["border-blue-500", "text-blue-600", "font-semibold"];
  const inactiveClasses = ["border-transparent", "text-gray-500"];

  navButtons.forEach((button) => {
    if (button === activeButton) {
      button.classList.add(...activeClasses);
      button.classList.remove(...inactiveClasses);
    } else {
      button.classList.remove(...activeClasses);
      button.classList.add(...inactiveClasses);
    }
  });

  if (activeButton === navBookings) {
    addNewBookingBtn.style.display = "inline-block";
  } else {
    addNewBookingBtn.style.display = "none";
  }
}

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
  navStaff.addEventListener("click", () => {
    setActiveTab(navStaff);
    loadStaffView();
  });
}

// --- MAIN APP LOGIC ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
      mainContent.style.display = "block";
      setupNavigation();
      setActiveTab(navBookings);
      loadBookingsView();
      setupAddNewBooking();
      setupAddNewStaff();
    } else {
      document.body.innerHTML = `<div class="h-screen w-screen flex flex-col justify-center items-center"><h1 class="text-2xl font-bold text-red-600">Access Denied</h1><p class="text-gray-600 mt-2">You do not have permission to view this page.</p><a href="booking.html" class="mt-4 text-blue-500 hover:underline">Go to Booking Page</a></div>`;
    }
  } else {
    window.location.href = "login.html";
  }
});

// --- View Loaders ---
async function loadBookingsView() {
  adminContentDiv.innerHTML = `<div class="bg-white shadow-lg rounded-2xl overflow-hidden"><table class="min-w-full"><thead class="bg-gray-50"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th></tr></thead><tbody id="bookings-table-body" class="bg-white divide-y divide-gray-200"><tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading bookings...</td></tr></tbody></table></div><div id="pagination-container" class="mt-4 flex justify-center"></div>`;
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

async function loadStaffView() {
  adminContentDiv.innerHTML = `
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Staff Management</h2>
        <button id="add-new-staff-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition">+ Add New Staff</button>
    </div>
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
            <tbody id="staff-table-body" class="bg-white divide-y divide-gray-200">
                <tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Loading staff...</td></tr>
            </tbody>
        </table>
    </div>`;

  const addNewStaffBtn = document.getElementById("add-new-staff-btn");
  const staffModal = document.getElementById("add-staff-modal");
  if (addNewStaffBtn && staffModal) {
    addNewStaffBtn.addEventListener("click", () => {
      staffModal.classList.remove("hidden");
    });
  }
  await fetchAndDisplayStaff();
}

// --- Data Fetching & Logic ---
async function fetchAllBookings() {
  try {
    const querySnapshot = await getDocs(query(collection(db, "bookings")));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    const allBookings = await fetchAllBookings();
    const events = allBookings
      .map((booking) => {
        if (!booking.date || booking.date === "Not Selected") return null;
        let timeStr = "12:00:00";
        if (booking.time && booking.time !== "Not Selected") {
          try {
            let [time, modifier] = booking.time.split(" ");
            let [hours, minutes] = time.split(":");
            hours = parseInt(hours, 10);
            if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
            if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
            const paddedHours = String(hours).padStart(2, "0");
            timeStr = `${paddedHours}:${minutes}:00`;
          } catch (e) {
            console.warn("Could not parse time for booking:", booking.time);
          }
        }
        const dateObj = new Date(`${booking.date} ${timeStr}`);
        if (isNaN(dateObj.getTime())) {
          console.warn("Skipping event with invalid date:", booking);
          return null;
        }
        return {
          title: `${booking.customerName} - ${booking.service}`,
          start: dateObj.toISOString(),
          color: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status),
          extendedProps: {
            bookingDetails: booking,
          },
        };
      })
      .filter(Boolean);

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "listWeek",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "",
      },
      events: events,
      editable: false,
      height: "auto",
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
    const bookings = await fetchAllBookings();
    bookings.sort((a, b) => new Date(b.date) - new Date(a.date));

    bookingsTableBody.innerHTML = "";
    if (bookings.length === 0) {
      bookingsTableBody.innerHTML =
        '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No customer bookings found.</td></tr>';
      return;
    }

    const paginatedBookings = bookings.slice(
      (currentPage - 1) * bookingsPerPage,
      currentPage * bookingsPerPage
    );

    paginatedBookings.forEach((booking) => {
      const row = document.createElement("tr");
      row.id = `booking-row-${booking.id}`;
      const statusClasses = getStatusClasses(booking.status);
      const statusBadge = `<span class="status-badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}">${
        booking.status || "N/A"
      }</span>`;
      const formattedPrice =
        typeof booking.totalPrice === "number"
          ? `$${booking.totalPrice.toFixed(2)}`
          : "N/A";
      const actionsDropdown = `<select data-booking-id="${
        booking.id
      }" class="status-select rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"><option value="Pending" ${
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

    renderPaginationControls(bookings.length);

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
      '<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading bookings.</td></tr>';
  }
}

async function fetchAndDisplayCustomers() {
  const customersTableBody = document.getElementById("customers-table-body");
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "customer"));
    const querySnapshot = await getDocs(q);

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

async function fetchAndDisplayStaff() {
  const staffTableBody = document.getElementById("staff-table-body");
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "staff"));
    const querySnapshot = await getDocs(q);

    staffTableBody.innerHTML = "";
    if (querySnapshot.empty) {
      staffTableBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No staff members found.</td></tr>';
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                  user.phone || "N/A"
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="profile.html?id=${userId}" class="text-indigo-600 hover:text-indigo-900">Edit</a>
                </td>
            `;
      staffTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching staff: ", error);
    staffTableBody.innerHTML =
      '<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Error loading staff.</td></tr>';
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

// --- ADD NEW BOOKING MODAL LOGIC ---
function setupAddNewBooking() {
  const modal = document.getElementById("add-booking-modal");
  const openModalBtn = document.getElementById("add-new-booking-btn");
  const closeModalBtn = document.getElementById("cancel-add-booking-btn");
  const addBookingForm = document.getElementById("add-booking-form");
  const priceInput = document.getElementById("new-booking-price");

  flatpickr("#new-booking-date", {
    minDate: "today",
    dateFormat: "F j, Y",
  });

  openModalBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  priceInput.addEventListener("blur", (e) => {
    const value = parseFloat(e.target.value.replace(/[^0-9.]/g, ""));
    if (!isNaN(value)) {
      e.target.value = `$${value.toFixed(2)}`;
    }
  });

  addBookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newBookingData = {
      customerName: document.getElementById("new-booking-name").value,
      customerEmail: document.getElementById("new-booking-email").value,
      service: document.getElementById("new-booking-service").value,
      bedrooms: parseInt(document.getElementById("new-booking-bedrooms").value),
      bathrooms: parseInt(
        document.getElementById("new-booking-bathrooms").value
      ),
      date: document.getElementById("new-booking-date").value,
      time: document.getElementById("new-booking-time").value,
      totalPrice: parseFloat(priceInput.value.replace(/[^0-9.]/g, "")),
      status: "Confirmed",
      notes: document.getElementById("new-booking-notes").value,
    };

    try {
      await addDoc(collection(db, "bookings"), newBookingData);
      modal.classList.add("hidden");
      addBookingForm.reset();

      if (navBookings.classList.contains("admin-nav-active")) {
        loadBookingsView();
      }
      if (navCalendar.classList.contains("admin-nav-active")) {
        loadCalendarView();
      }
    } catch (error) {
      console.error("Error adding new booking: ", error);
      alert("Failed to add booking. Please check the console for errors.");
    }
  });
}

// --- ADD NEW STAFF MODAL LOGIC ---
function setupAddNewStaff() {
  const modal = document.getElementById("add-staff-modal");
  const closeModalBtn = document.getElementById("cancel-add-staff-btn");
  const addStaffForm = document.getElementById("add-staff-form");
  const errorMessage = document.getElementById("add-staff-error");

  if (!modal || !closeModalBtn || !addStaffForm) return;

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    addStaffForm.reset();
    errorMessage.classList.add("hidden");
  });

  addStaffForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMessage.classList.add("hidden");

    const name = document.getElementById("new-staff-name").value;
    const email = document.getElementById("new-staff-email").value;
    const phone = document.getElementById("new-staff-phone").value;
    const password = document.getElementById("new-staff-password").value;

    if (password.length < 6) {
      errorMessage.textContent = "Password must be at least 6 characters long.";
      errorMessage.classList.remove("hidden");
      return;
    }

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
        phone: phone,
        role: "staff",
      });

      modal.classList.add("hidden");
      addStaffForm.reset();
      loadStaffView(); // Refresh the staff list
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.classList.remove("hidden");
    }
  });
}

function renderPaginationControls(totalBookings) {
  const paginationContainer = document.getElementById("pagination-container");
  if (!paginationContainer) return;

  const totalPages = Math.ceil(totalBookings / bookingsPerPage);
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  const createButton = (text, pageNumber, isDisabled = false) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.disabled = isDisabled;
    button.className = `px-4 py-2 mx-1 rounded-md ${
      isDisabled
        ? "bg-gray-200 text-gray-500"
        : "bg-white text-gray-700 hover:bg-gray-100"
    } border border-gray-300`;
    if (!isDisabled) {
      button.addEventListener("click", () => {
        currentPage = pageNumber;
        fetchAndDisplayBookings();
      });
    }
    return button;
  };

  paginationContainer.appendChild(
    createButton("Previous", currentPage - 1, currentPage === 1)
  );

  for (let i = 1; i <= totalPages; i++) {
    const button = createButton(i, i, i === currentPage);
    if (i === currentPage) {
      button.classList.add("bg-blue-500", "text-white");
    }
    paginationContainer.appendChild(button);
  }

  paginationContainer.appendChild(
    createButton("Next", currentPage + 1, currentPage === totalPages)
  );
}

// --- Logout ---
logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => console.error("Logout Error:", error));
});
