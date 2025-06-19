(() => {
  const wrapper = document.getElementById("configure-step-wrapper");
  if (!wrapper) return;

  const partialCleaningCheckbox = document.getElementById(
    "partial-cleaning-checkbox"
  );
  partialCleaningCheckbox.checked = bookingState.isPartialCleaning;
  if (bookingState.isPartialCleaning) {
    wrapper.classList.add("partial-cleaning-active");
  }

  partialCleaningCheckbox.addEventListener("change", (event) => {
    bookingState.isPartialCleaning = event.target.checked;
    wrapper.classList.toggle(
      "partial-cleaning-active",
      bookingState.isPartialCleaning
    );
    if (!bookingState.isPartialCleaning) {
      bookingState.excludedItems = {};
      document.querySelectorAll(".exclusion-card").forEach((card) => {
        card.classList.remove("selected");
        card.querySelector("input").value = "0";
      });
    }
    updateSummary();
  });

  document.querySelectorAll(".exclusion-card").forEach((card) => {
    const excludeName = card.dataset.exclude;
    const inputField = card.querySelector("input");
    if (bookingState.excludedItems[excludeName]) {
      card.classList.add("selected");
      inputField.value = bookingState.excludedItems[excludeName];
    }
    card.querySelector(".exclude-minus").addEventListener("click", (e) => {
      e.stopPropagation();
      let count = Math.max(0, parseInt(inputField.value) - 1);
      inputField.value = count;
      if (count > 0) {
        bookingState.excludedItems[excludeName] = count;
      } else {
        card.classList.remove("selected");
        delete bookingState.excludedItems[excludeName];
      }
      updateSummary();
    });
    card.querySelector(".exclude-plus").addEventListener("click", (e) => {
      e.stopPropagation();
      let count = parseInt(inputField.value) + 1;
      inputField.value = count;
      bookingState.excludedItems[excludeName] = count;
      updateSummary();
    });
    card.addEventListener("click", () => {
      if (!card.classList.contains("selected")) {
        card.classList.add("selected");
        inputField.value = 1;
        bookingState.excludedItems[excludeName] = 1;
        updateSummary();
      }
    });
  });

  document
    .querySelectorAll(".input-row .quantity-input")
    .forEach((container) => {
      const inputField = container.querySelector("input");
      const roomType = inputField.dataset.roomInput;
      if (bookingState[roomType]) {
        inputField.value = bookingState[roomType];
      }
      container
        .querySelector(".quantity-minus")
        .addEventListener("click", () => {
          if (bookingState[roomType] > 1) {
            bookingState[roomType]--;
            inputField.value = bookingState[roomType];
            updateSummary();
          }
        });
      container
        .querySelector(".quantity-plus")
        .addEventListener("click", () => {
          bookingState[roomType]++;
          inputField.value = bookingState[roomType];
          updateSummary();
        });
    });

  document.querySelectorAll(".extras-grid .extra-card").forEach((card) => {
    const extraName = card.dataset.extra;
    if (bookingState.extras.includes(extraName)) {
      card.classList.add("selected");
    }
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
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

  document
    .getElementById("back-btn")
    .addEventListener("click", () => loadStep("step1_service"));
  document
    .getElementById("next-step-btn-2")
    .addEventListener("click", () => loadStep("step3_datetime"));

  updateSummary();
})();
