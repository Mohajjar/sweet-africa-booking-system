(() => {
  const backButton = document.getElementById("back-btn");
  const completeButton = document.getElementById("complete-booking-btn");
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const addressInput = document.getElementById("address");
  const apartmentInput = document.getElementById("apartment");
  const termsCheckbox = document.getElementById("terms-checkbox");
  const paymentCardRadio = document.getElementById("payment-card");
  const paymentCashRadio = document.getElementById("payment-cash");
  const creditCardInfoDiv = document.getElementById("credit-card-info");

  if (!completeButton) return;

  // Load existing data from bookingState
  fullNameInput.value = window.bookingState.customerName;
  emailInput.value = window.bookingState.customerEmail;
  phoneInput.value = window.bookingState.customerPhone;
  addressInput.value = window.bookingState.customerAddress;
  apartmentInput.value = window.bookingState.customerApartment;

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

  // Phone number auto-formatting
  phoneInput.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").substring(0, 10);
    let formatted = "";
    if (digits.length > 0) formatted = `(${digits.substring(0, 3)}`;
    if (digits.length > 3) formatted += `) ${digits.substring(3, 6)}`;
    if (digits.length > 6) formatted += `-${digits.substring(6, 10)}`;
    e.target.value = formatted;
    window.bookingState.customerPhone = `+1 ${formatted}`;
    window.updateSummary();
  });

  // Update state and summary on input
  fullNameInput.addEventListener("input", () => {
    window.bookingState.customerName = fullNameInput.value;
    window.updateSummary();
    validateForm();
  });
  emailInput.addEventListener("input", () => {
    window.bookingState.customerEmail = emailInput.value;
    window.updateSummary();
    validateForm();
  });
  addressInput.addEventListener("input", () => {
    window.bookingState.customerAddress = addressInput.value;
    window.updateSummary();
  });
  apartmentInput.addEventListener("input", () => {
    window.bookingState.customerApartment = apartmentInput.value;
    window.updateSummary();
  });
  termsCheckbox.addEventListener("change", validateForm);

  // Payment method visibility
  paymentCardRadio.addEventListener("change", () => {
    creditCardInfoDiv.style.display = "block";
  });
  paymentCashRadio.addEventListener("change", () => {
    creditCardInfoDiv.style.display = "none";
  });

  // --- NEW BOOKING SAVE LOGIC ---
  async function saveBooking() {
    const { collection, addDoc } = window.firebase;
    const db = window.db;

    try {
      completeButton.disabled = true;
      completeButton.textContent = "Saving...";

      const bookingData = {
        ...window.bookingState,
        totalPrice: window.calculatePrice(),
        status: "Pending",
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "bookings"), bookingData);

      // Show a success message
      const formContainer = document.querySelector(".step-content");
      formContainer.innerHTML = `
                <div class="text-center py-12">
                    <h2 class="text-2xl font-bold text-green-600">Booking Confirmed!</h2>
                    <p class="text-gray-600 mt-2">Thank you! Your booking has been saved successfully.</p>
                    <p class="mt-4">You will be redirected to your profile shortly.</p>
                </div>
            `;

      setTimeout(() => {
        sessionStorage.removeItem("bookingState");
        sessionStorage.removeItem("lastVisitedStep");
        window.location.href = "profile.html";
      }, 3000); // Wait 3 seconds before redirecting
    } catch (e) {
      console.error("Error adding document: ", e);
      const formContainer = document.querySelector(".step-content");
      const errorDiv = document.createElement("p");
      errorDiv.className = "text-red-500 text-center font-semibold mt-4";
      errorDiv.textContent =
        "There was an error saving your booking. Please try again.";
      formContainer.appendChild(errorDiv);

      completeButton.disabled = false;
      completeButton.textContent = "Complete Booking";
    }
  }

  // Navigation
  backButton.addEventListener("click", () => window.loadStep("step3_datetime"));
  completeButton.addEventListener("click", () => {
    if (!completeButton.disabled) {
      saveBooking();
    }
  });

  // Initial validation check
  validateForm();
})();
