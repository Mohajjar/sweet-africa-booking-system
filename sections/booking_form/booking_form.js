// sections/booking_form/booking_form.js
(() => {
  // --- SERVICE SELECTION ---
  const serviceCards = document.querySelectorAll(".service-card");
  serviceCards.forEach((card) => {
    card.addEventListener("click", () => {
      serviceCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      bookingState.industry = card.dataset.industry;
      bookingState.service = card.dataset.serviceName;
      updateSummary();
    });
  });

  // --- QUANTITY INPUTS (BEDROOMS/BATHROOMS) ---
  const quantityInputs = document.querySelectorAll(".quantity-input");
  quantityInputs.forEach((container) => {
    const minusBtn = container.querySelector(".quantity-minus");
    const plusBtn = container.querySelector(".quantity-plus");
    const input = container.querySelector("input");
    const roomType = container.parentElement
      .querySelector("label")
      .textContent.toLowerCase();

    minusBtn.addEventListener("click", () => {
      let count = parseInt(input.value);
      if (count > 1) {
        count--;
        input.value = count;
        bookingState[roomType] = count;
        updateSummary();
      }
    });
    plusBtn.addEventListener("click", () => {
      let count = parseInt(input.value);
      count++;
      input.value = count;
      bookingState[roomType] = count;
      updateSummary();
    });
  });

  // --- EXTRAS SELECTION ---
  const extraCards = document.querySelectorAll(".extra-card");
  extraCards.forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      const extraName = card.dataset.extra;
      if (bookingState.extras.includes(extraName)) {
        bookingState.extras = bookingState.extras.filter(
          (e) => e !== extraName
        );
      } else {
        bookingState.extras.push(extraName);
      }
      updateSummary();
    });
  });

  // --- DATE & TIME ---
  flatpickr("#date-picker", {
    minDate: "today",
    dateFormat: "F j, Y",
    onChange: (selectedDates, dateStr) => {
      bookingState.date = dateStr;
      updateSummary();
    },
  });
  const timeSlots = document.querySelectorAll(".time-slot");
  timeSlots.forEach((slot) => {
    slot.addEventListener("click", () => {
      timeSlots.forEach((s) => s.classList.remove("selected"));
      slot.classList.add("selected");
      bookingState.time = slot.textContent;
      updateSummary();
    });
  });

  // --- DETAILS & PAYMENT ---
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const addressInput = document.getElementById("address");
  const apartmentInput = document.getElementById("apartment");
  const termsCheckbox = document.getElementById("terms-checkbox");
  const completeButton = document.getElementById("complete-booking-btn");

  // Pre-fill user data
  fullNameInput.value = bookingState.customerName;
  emailInput.value = bookingState.customerEmail;

  // Listeners to update state
  fullNameInput.addEventListener("input", () => {
    bookingState.customerName = fullNameInput.value;
    updateSummary();
    validateForm();
  });
  emailInput.addEventListener("input", () => {
    bookingState.customerEmail = emailInput.value;
    updateSummary();
    validateForm();
  });
  phoneInput.addEventListener("input", () => {
    const digits = phoneInput.value.replace(/\D/g, "").substring(0, 10);
    let formatted = "";
    if (digits.length > 0) formatted = `(${digits.substring(0, 3)}`;
    if (digits.length > 3) formatted += `) ${digits.substring(3, 6)}`;
    if (digits.length > 6) formatted += `-${digits.substring(6, 10)}`;
    phoneInput.value = formatted;
    bookingState.customerPhone = `+1 ${formatted}`;
    updateSummary();
  });
  addressInput.addEventListener("input", () => {
    bookingState.customerAddress = addressInput.value;
    updateSummary();
  });
  apartmentInput.addEventListener("input", () => {
    bookingState.customerApartment = apartmentInput.value;
    updateSummary();
  });

  // --- [NEW] INPUT FORMATTING FOR PAYMENT FIELDS ---
  const cardNumberInput = document.getElementById("card-number");
  const expiryDateInput = document.getElementById("expiry-date");

  // Auto-format for Card Number: XXXX XXXX XXXX XXXX
  cardNumberInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    const formattedValue = value.match(/.{1,4}/g)?.join(" ") || "";
    e.target.value = formattedValue;
  });

  // Auto-format for Expiry Date: MM/YY
  expiryDateInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4);
    }
    e.target.value = value;
  });
  // --- [END NEW CODE] ---

  termsCheckbox.addEventListener("change", validateForm);

  // Payment method toggle
  document.getElementById("payment-card").addEventListener("change", () => {
    document.getElementById("credit-card-info").style.display = "block";
  });
  document.getElementById("payment-cash").addEventListener("change", () => {
    document.getElementById("credit-card-info").style.display = "none";
  });

  // Final validation
  function validateForm() {
    const isNameValid = fullNameInput.value.trim() !== "";
    const isEmailValid = emailInput.value.trim().includes("@");
    const areTermsAccepted = termsCheckbox.checked;
    completeButton.disabled = !(
      isNameValid &&
      isEmailValid &&
      areTermsAccepted
    );
  }
  validateForm(); // Initial check

  // Final "Complete Booking" button
  completeButton.addEventListener("click", async () => {
    if (completeButton.disabled) return;

    const bookingData = {
      ...bookingState,
      totalPrice: calculatePrice(),
      status: "Pending",
    };

    try {
      await window.firebase.addDoc(
        window.firebase.collection(window.db, "bookings"),
        bookingData
      );
      alert("Thank you! Your booking is complete.");
      // Optionally, reset the form here by clearing sessionStorage and reloading
      sessionStorage.removeItem("bookingState");
      window.location.reload();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("There was an error submitting your booking. Please try again.");
    }
  });
})();
