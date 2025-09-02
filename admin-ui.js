import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import {
  fetchAllBookings,
  fetchUsersByRole,
  updateBookingStatus,
  createNewStaff,
  deleteStaffMember,
} from "./admin-data.js";
import {
  loadBookingsView,
  displayBookings,
  renderPaginationControls,
  loadCustomersView,
  displayCustomers,
  loadStaffView,
  displayStaff,
  loadCalendarView,
  loadFinanceView,
  displayFinanceData,
  updateStatusBadge,
} from "./admin-ui.js";

// --- DOM Elements ---
const logoutButton = document.getElementById("logout-button");
const mainContent = document.querySelector("main");
const navBookings = document.getElementById("nav-bookings");
const navCustomers = document.getElementById("nav-customers");
const navCalendar = document.getElementById("nav-calendar");
const navFinance = document.getElementById("nav-finance");
const navStaff = document.getElementById("nav-staff");
const addNewBookingBtn = document.getElementById("add-new-booking-btn");

// --- STATE ---
let currentPage = 1;
const bookingsPerPage = 10;
let allBookingsCache = [];

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
    button.classList.toggle("border-blue-500", button === activeButton);
    button.classList.toggle("text-blue-600", button === activeButton);
    button.classList.toggle("font-semibold", button === activeButton);
    button.classList.toggle("border-transparent", button !== activeButton);
    button.classList.toggle("text-gray-500", button !== activeButton);
  });

  addNewBookingBtn.style.display =
    activeButton === navBookings ? "inline-block" : "none";
}

function setupNavigation() {
  const tabs = {
    [navBookings.id]: handleBookingsView,
    [navCustomers.id]: handleCustomersView,
    [navStaff.id]: handleStaffView,
    [navCalendar.id]: handleCalendarView,
    [navFinance.id]: handleFinanceView,
  };

  Object.keys(tabs).forEach((tabId) => {
    const button = document.getElementById(tabId);
    button.addEventListener("click", () => {
      setActiveTab(button);
      tabs[tabId]();
    });
  });
}

// --- View Handlers ---
async function handleBookingsView() {
  loadBookingsView();
  allBookingsCache = await fetchAllBookings();
  allBookingsCache.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderBookingsPage(currentPage);
}

function renderBookingsPage(page) {
  currentPage = page;
  const paginatedBookings = allBookingsCache.slice(
    (page - 1) * bookingsPerPage,
    page * bookingsPerPage
  );
  displayBookings(paginatedBookings, handleStatusUpdate);
  renderPaginationControls(
    allBookingsCache.length,
    bookingsPerPage,
    currentPage,
    renderBookingsPage
  );
}

async function handleCustomersView() {
  loadCustomersView();
  const customers = await fetchUsersByRole("customer");
  displayCustomers(customers);
}

async function handleStaffView() {
  loadStaffView();
  const staff = await fetchUsersByRole("staff");
  displayStaff(staff, handleRemoveStaff);
}

async function handleCalendarView() {
  const bookings = await fetchAllBookings();
  const events = bookings
    .map((booking) => {
      if (
        !booking.date ||
        !booking.time ||
        booking.date === "Not Selected" ||
        booking.time === "Not Selected"
      )
        return null;
      try {
        let [time, modifier] = booking.time.split(" ");
        let [hours, minutes] = time.split(":");
        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === "PM" && hours < 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
        const dateObj = new Date(
          `${booking.date} ${String(hours).padStart(2, "0")}:${minutes}:00`
        );
        if (isNaN(dateObj.getTime())) return null;
        return {
          title: `${booking.customerName} - ${booking.service}`,
          start: dateObj.toISOString(),
          color: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status),
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
  loadCalendarView(events);
}

async function handleFinanceView() {
  loadFinanceView();
  const allBookings = await fetchAllBookings();
  flatpickr("#date-range-filter", {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: (selectedDates) => {
      if (selectedDates.length === 2) {
        renderFinanceData(allBookings, selectedDates[0], selectedDates[1]);
      }
    },
  });
  renderFinanceData(allBookings);
}

function renderFinanceData(bookings, startDate, endDate) {
  const filtered =
    startDate && endDate
      ? bookings.filter(
          (b) => new Date(b.date) >= startDate && new Date(b.date) <= endDate
        )
      : bookings;

  let totalRevenue = 0,
    projectedRevenue = 0,
    validBookingsCount = 0,
    totalBookingValue = 0;
  filtered.forEach((b) => {
    const price = b.totalPrice || 0;
    if (b.status === "Completed") totalRevenue += price;
    if (b.status === "Pending" || b.status === "Confirmed")
      projectedRevenue += price;
    if (b.status !== "Cancelled") {
      validBookingsCount++;
      totalBookingValue += price;
    }
  });
  const avgBookingValue =
    validBookingsCount > 0 ? totalBookingValue / validBookingsCount : 0;

  displayFinanceData(
    { totalRevenue, projectedRevenue, avgBookingValue },
    filtered
  );
}

// --- Action Handlers ---
async function handleStatusUpdate(bookingId, newStatus, selectElement) {
  selectElement.disabled = true;
  const success = await updateBookingStatus(bookingId, newStatus);
  if (success) {
    updateStatusBadge(selectElement, newStatus);
    const bookingIndex = allBookingsCache.findIndex((b) => b.id === bookingId);
    if (bookingIndex > -1) allBookingsCache[bookingIndex].status = newStatus;
  }
  selectElement.disabled = false;
}

function handleRemoveStaff(userId, userName) {
  const modal = document.getElementById("delete-staff-modal");
  modal.classList.remove("hidden");

  const confirmBtn = document.getElementById("confirm-delete-staff-btn");
  const cancelBtn = document.getElementById("cancel-delete-staff-btn");

  const confirmHandler = async () => {
    const success = await deleteStaffMember(userId);
    if (success) {
      handleStaffView(); // Refresh the list
    } else {
      alert(
        `Failed to remove ${userName}. The user might need to be removed manually from Firebase Authentication if the issue persists.`
      );
    }
    modal.classList.add("hidden");
    confirmBtn.replaceWith(confirmBtn.cloneNode(true)); // Remove event listener
  };

  const cancelHandler = () => {
    modal.classList.add("hidden");
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  };

  confirmBtn.addEventListener("click", confirmHandler, { once: true });
  cancelBtn.addEventListener("click", cancelHandler, { once: true });
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
      handleBookingsView();
      // Modals setup
      // setupAddNewBooking();
      // setupAddNewStaff();
    } else {
      document.body.innerHTML = `<div class="h-screen w-screen flex flex-col justify-center items-center"><h1 class="text-2xl font-bold text-red-600">Access Denied</h1><p class="text-gray-600 mt-2">You do not have permission to view this page.</p><a href="booking.html" class="mt-4 text-blue-500 hover:underline">Go to Booking Page</a></div>`;
    }
  } else {
    window.location.href = "login.html";
  }
});

logoutButton.addEventListener("click", () => {
  signOut(auth).catch((error) => console.error("Logout Error:", error));
});
