(() => {
  const nextButton = document.getElementById("next-step-btn-3");
  const datePickerInput = document.getElementById("date-picker");

  function validateStep() {
    const isDateSet = bookingState.date && bookingState.date !== "Not Selected";
    const isTimeSet = bookingState.time && bookingState.time !== "Not Selected";
    nextButton.disabled = !(isDateSet && isTimeSet);
  }

  // Initialize Flatpickr
  flatpickr(datePickerInput, {
    inline: true,
    minDate: "today",
    dateFormat: "F j, Y",
    defaultDate:
      bookingState.date === "Not Selected" ? null : bookingState.date,
    onChange: function (selectedDates, dateStr, instance) {
      bookingState.date = dateStr;
      updateSummary();
      validateStep();
    },
  });

  // Handle Time Slot Selection
  const timeSlots = document.querySelectorAll(".time-slot");
  timeSlots.forEach((slot) => {
    if (slot.dataset.time === bookingState.time) {
      slot.classList.add("selected");
    }
    slot.addEventListener("click", () => {
      timeSlots.forEach((s) => s.classList.remove("selected"));
      slot.classList.add("selected");
      bookingState.time = slot.dataset.time;
      updateSummary();
      validateStep();
    });
  });

  // Handle Navigation
  document
    .getElementById("back-btn")
    .addEventListener("click", () => loadStep("step2_configure"));
  nextButton.addEventListener("click", () => {
    if (!nextButton.disabled) {
      loadStep("step4_details");
    }
  });

  // Initial validation check
  validateStep();
})();
