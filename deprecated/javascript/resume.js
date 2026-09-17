// resume.js — resume-only behavior

(function () {
  function initResumeAccordion() {
    const accs = document.querySelectorAll(".resume-acc");
    if (!accs.length) return;

    accs.forEach((d) => {
      d.addEventListener("toggle", () => {
        // Only enforce "single open" when one is opened
        if (!d.open) return;

        accs.forEach((other) => {
          if (other !== d) other.open = false;
        });
      });
    });
  }

  window.addEventListener("load", initResumeAccordion);
})();
