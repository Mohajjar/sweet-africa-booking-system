(() => {
  // Handle Industry Selection
  const industryCards = document.querySelectorAll("[data-industry]");
  industryCards.forEach((card) => {
    if (card.dataset.industry === bookingState.industry) {
      card.classList.add("selected");
    }
    card.addEventListener("click", () => {
      industryCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      bookingState.industry = card.dataset.industry;
      updateSummary();
    });
  });

  // Handle Service Type Selection
  const serviceCards = document.querySelectorAll("[data-service]");
  serviceCards.forEach((card) => {
    if (card.dataset.service === bookingState.service) {
      card.classList.add("selected");
    }
    card.addEventListener("click", () => {
      serviceCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      bookingState.service = card.dataset.service;
      updateSummary();
    });
  });

  // Handle Navigation
  document.getElementById("next-step-btn-1").addEventListener("click", () => {
    loadStep("step2_configure");
  });
})();
