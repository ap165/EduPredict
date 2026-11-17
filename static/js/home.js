(() => {
  "use strict";

  // Theme preference defaults to System and is retained between visits.
  const themeSelect = document.getElementById("theme-select");
  const themeStorageKey = "edupredict-theme";
  const validThemes = ["system", "light", "dark"];

  function applyTheme(theme, persist = false) {
    const selectedTheme = validThemes.includes(theme) ? theme : "system";
    if (selectedTheme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
    if (themeSelect) themeSelect.value = selectedTheme;
    if (persist) {
      try {
        localStorage.setItem(themeStorageKey, selectedTheme);
      } catch (error) {
        console.warn("Unable to save theme preference:", error);
      }
    }
  }

  let savedTheme = "system";
  try {
    const storedTheme = localStorage.getItem(themeStorageKey);
    if (validThemes.includes(storedTheme)) savedTheme = storedTheme;
  } catch (error) {
    console.warn("Unable to read theme preference:", error);
  }
  applyTheme(savedTheme);
  if (themeSelect) themeSelect.addEventListener("change", () => applyTheme(themeSelect.value, true));

  const form = document.getElementById("prediction-form");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const endpointConfig = {
    cgpa: {
      path: "/api/v1/predictions/cgpa",
      resultId: "cgpa-result",
      statusId: "cgpa-status",
      captionId: "cgpa-caption",
      cardSelector: '[data-result-card="cgpa"]'
    },
    performance: {
      path: "/api/v1/predictions/performance",
      resultId: "performance-result",
      statusId: "performance-status",
      captionId: "performance-caption",
      cardSelector: '[data-result-card="performance"]'
    },
    backlog: {
      path: "/api/v1/predictions/backlog-risk",
      resultId: "backlog-result",
      statusId: "backlog-status",
      captionId: "backlog-caption",
      cardSelector: '[data-result-card="backlog"]'
    },
    career: {
      path: "/api/v1/predictions/career-path",
      resultId: "career-result",
      statusId: "career-status",
      captionId: "career-caption",
      cardSelector: '[data-result-card="career"]'
    }
  };

  const studyHoursMap = {
    "0-1 Hour": 0.5,
    "2-3 Hours": 2.5,
    "More than 3 Hours": 4.0
  };

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setResultsState(message, state = "") {
    resultsState.replaceChildren();
    const dot = document.createElement("span");
    dot.className = "state-dot";
    resultsState.append(dot, document.createTextNode(` ${message}`));
    resultsState.className = `results-state ${state}`.trim();
  }

  function attendanceCategory(value) {
    if (value >= 80) return "80%-100%";
    if (value >= 60) return "60%-79%";
    if (value >= 40) return "40%-59%";
    return "Below 40%";
  }

  function collectPayloads() {
    const values = Object.fromEntries(new FormData(form).entries());
    const attendance = Number(values.attendance_percentage);
    const previousCgpa = Number(values.previous_semester_cgpa);
    const studyCategory = values.study_time;

    // Keep the existing feature names and category mapping used by the
    // CGPA and performance endpoints.
    const sharedAcademicPayload = {
      class_12_percentage: Number(values.class_12_percentage),
      class_10_percentage: Number(values.class_10_percentage),
      family_income: values.family_income,
      hometown: values.hometown,
      exam_preparation: studyCategory,
      gaming_hours: values.gaming_hours,
      attendance_percentage: attendanceCategory(attendance),
      previous_semester_cgpa: previousCgpa
    };

    // The backlog endpoint expects attendance as a numeric percentage and
    // study time converted to the numeric values used during training.
    const backlogPayload = {
      previous_semester_cgpa: previousCgpa,
      attendance_percentage: attendance,
      previous_backlogs: Number(values.previous_backlogs),
      study_time_hours_per_day: studyHoursMap[studyCategory]
    };

    // Use the career model's exact dataset feature names, including spaces
    // and punctuation. The CGPA value is shared with the academic form field.
    const careerPayload = {
      "CGPA (out of 10)": previousCgpa,
      "Coding Rating": Number(values.coding_rating),
      "Public Speaking Rating": Number(values.public_speaking_rating),
      "Interested Subjects": values.interested_subjects.trim(),
      "Career Area": values.career_area.trim(),
      "Can Work Long": values.can_work_long,
      "Mathematics (%)": Number(values.mathematics_percentage),
      "Project Count": Number(values.project_count),
      "Project Focus": `${values.project_focus_primary}; ${values.project_focus_secondary}`,
      "Internship": values.internship,
      "Career Preference": values.career_preference
    };

    return {
      cgpa: sharedAcademicPayload,
      performance: { ...sharedAcademicPayload },
      backlog: backlogPayload,
      career: careerPayload
    };
  }

  function validateForm() {
    formError.hidden = true;
    formError.textContent = "";

    if (!form.reportValidity()) return false;

    const numericRules = [
      ["class_12_percentage", 0, 100, false, "Class 12 percentage must be between 0 and 100."],
      ["class_10_percentage", 0, 100, false, "Class 10 percentage must be between 0 and 100."],
      ["previous_semester_cgpa", 0, 10, false, "Previous semester CGPA must be between 0 and 10."],
      ["attendance_percentage", 0, 100, false, "Attendance must be between 0 and 100."],
      ["previous_backlogs", 0, 4, true, "Previous backlogs must be a whole number from 0 to 4."],
      ["coding_rating", 0, 10, true, "Coding rating must be a whole number from 0 to 10."],
      ["public_speaking_rating", 0, 10, true, "Public speaking rating must be a whole number from 0 to 10."],
      ["mathematics_percentage", 0, 100, false, "Mathematics percentage must be between 0 and 100."],
      ["project_count", 0, 50, true, "Project count must be a whole number from 0 to 50."]
    ];

    for (const [name, min, max, wholeNumber, message] of numericRules) {
      const field = form.elements.namedItem(name);
      const value = Number(field.value);
      if (!Number.isFinite(value) || value < min || value > max || (wholeNumber && !Number.isInteger(value))) {
        field.focus();
        formError.textContent = message;
        formError.hidden = false;
        return false;
      }
    }

    return true;
  }

  async function postPrediction(key, payload) {
    const endpoint = endpointConfig[key];
    let response;
    try {
      response = await fetch(endpoint.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch {
      throw new Error("Could not connect to the prediction API. Check that the server is running.");
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error(`The server returned an unreadable response (HTTP ${response.status}).`);
    }

    if (!response.ok || body.success === false) {
      const message = body.error || body.message || `Request failed with HTTP ${response.status}.`;
      throw new Error(message);
    }
    return body;
  }

  function resetResultCards() {
    Object.entries(endpointConfig).forEach(([key, config]) => {
      const value = $(config.resultId);
      const status = $(config.statusId);
      const caption = $(config.captionId);
      const card = document.querySelector(config.cardSelector);
      value.textContent = "—";
      value.classList.add("is-placeholder");
      status.textContent = "Not run yet";
      status.className = "result-status";
      card.classList.remove("has-error");

      const captions = {
        cgpa: "Predicted CGPA on a 10-point scale.",
        performance: "Predicted academic performance category.",
        backlog: "Predicted backlog status.",
        career: "Suggested career domain based on your profile."
      };
      caption.textContent = captions[key];
    });
  }

  function setLoadingState() {
    resultsGrid.setAttribute("aria-busy", "true");
    setResultsState("Running 4 models", "is-loading");
    Object.values(endpointConfig).forEach((config) => {
      $(config.resultId).textContent = "Running…";
      $(config.resultId).classList.remove("is-placeholder");
      $(config.statusId).textContent = "Request in progress";
      $(config.statusId).className = "result-status";
      document.querySelector(config.cardSelector).classList.remove("has-error");
    });
  }

  function displaySuccess(key, body) {
    const config = endpointConfig[key];
    const value = $(config.resultId);
    const status = $(config.statusId);
    const caption = $(config.captionId);
    const card = document.querySelector(config.cardSelector);

    let result;
    if (key === "cgpa") {
      result = body?.prediction?.predicted_next_semester_cgpa;
      if (typeof result !== "number" || !Number.isFinite(result)) {
        throw new Error("The CGPA endpoint did not return a valid numeric prediction.");
      }
      value.textContent = result.toFixed(2);
      caption.textContent = "Predicted next-semester CGPA out of 10.";
    } else if (key === "performance") {
      result = body?.prediction?.performance;
      if (typeof result !== "string" || !result.trim()) {
        throw new Error("The performance endpoint did not return a performance category.");
      }
      value.textContent = result;
      caption.textContent = "Predicted academic performance category.";
    } else if (key === "backlog") {
      result = body?.prediction?.backlog_status;
      if (typeof result !== "string" || !result.trim()) {
        throw new Error("The backlog endpoint did not return a backlog status.");
      }
      value.textContent = result;
      caption.textContent = "Predicted status based on the submitted academic profile.";
    } else {
      result = body?.prediction?.recommended_career_path;
      if (typeof result !== "string" || !result.trim()) {
        throw new Error("The career-path endpoint did not return a recommended career path.");
      }
      value.textContent = result;
      caption.textContent = "Suggested career domain based on your academic and career profile.";
    }

    value.classList.remove("is-placeholder");
    status.textContent = "Prediction received";
    status.className = "result-status success";
    card.classList.remove("has-error");
  }

  function displayError(key, error) {
    const config = endpointConfig[key];
    const value = $(config.resultId);
    const status = $(config.statusId);
    const caption = $(config.captionId);
    const card = document.querySelector(config.cardSelector);
    value.textContent = "Unable to predict";
    value.classList.remove("is-placeholder");
    status.textContent = "Request failed";
    status.className = "result-status error";
    caption.textContent = error?.message || "An unexpected error occurred while requesting this model.";
    card.classList.add("has-error");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const payloads = collectPayloads();
    predictButton.disabled = true;
    predictButton.querySelector(".button-label").textContent = "Running predictions…";
    predictButton.querySelector(".button-arrow").textContent = "···";
    formError.hidden = true;
    resultsActions.hidden = true;
    setLoadingState();

    const keys = ["cgpa", "performance", "backlog", "career"];
    const outcomes = await Promise.allSettled(keys.map((key) => postPrediction(key, payloads[key])));

    let failedCount = 0;
    outcomes.forEach((outcome, index) => {
      const key = keys[index];
      if (outcome.status === "fulfilled") {
        try {
          displaySuccess(key, outcome.value);
        } catch (error) {
          failedCount += 1;
          displayError(key, error);
        }
      } else {
        failedCount += 1;
        displayError(key, outcome.reason);
      }
    });

    resultsGrid.setAttribute("aria-busy", "false");
    const successCount = keys.length - failedCount;
    if (failedCount === 0) {
      setResultsState("All predictions complete", "is-complete");
      showToast("All four predictions received.");
    } else if (successCount === 0) {
      setResultsState("All requests failed", "is-error");
      showToast("Could not complete the prediction requests.");
    } else {
      setResultsState(`${successCount} of 4 predictions complete`, "is-error");
      showToast("Some predictions could not be completed.");
    }

    resultsActions.hidden = false;
    predictButton.disabled = false;
    predictButton.querySelector(".button-label").textContent = "Generate all predictions";
    predictButton.querySelector(".button-arrow").textContent = "→";
    resultsGrid.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function resetAll() {
    formError.hidden = true;
    formError.textContent = "";
    resetResultCards();
    setResultsState("Waiting for input");
    resultsGrid.setAttribute("aria-busy", "false");
    resultsActions.hidden = true;
  }

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", () => window.setTimeout(resetAll, 0));

  const runAgainButton = $("run-again");
  if (runAgainButton) {
    runAgainButton.addEventListener("click", () => {
      resetResultCards();
      setResultsState("Ready for another prediction");
      resultsActions.hidden = true;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const year = $("current-year");
  if (year) year.textContent = new Date().getFullYear();
  resetResultCards();
})();
