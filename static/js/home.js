(() => {
    "use strict";

    const form = document.getElementById("prediction-form");
    if (!form) return;

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
        }
    };

    const $ = (id) => document.getElementById(id);
    const predictButton = $("predict-button");
    const resetButton = $("reset-form");
    const runAgainButton = $("run-again");
    const formError = $("form-error");
    const resultsGrid = $("results-grid");
    const resultsState = $("results-state");
    const resultsActions = $("results-actions");
    const toast = $("toast");

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
        showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function setResultsState(message, state = "") {
        resultsState.innerHTML = '<span class="state-dot"></span>';
        resultsState.append(document.createTextNode(` ${message}`));
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

        const backlogPayload = {
            previous_semester_cgpa: previousCgpa,
            attendance_percentage: attendance,
            previous_backlogs: Number(values.previous_backlogs),
            study_time_hours_per_day: studyHoursMap[studyCategory]
        };

        return {
            cgpa: sharedAcademicPayload,
            performance: { ...sharedAcademicPayload },
            backlog: backlogPayload
        };
    }

    function validateForm() {
        formError.classList.add("hidden");
        formError.textContent = "";

        if (!form.reportValidity()) return false;

        const numericRules = [
            ["class_12_percentage", 0, 100, "Class 12 percentage must be between 0 and 100."],
            ["class_10_percentage", 0, 100, "Class 10 percentage must be between 0 and 100."],
            ["previous_semester_cgpa", 0, 10, "Previous semester CGPA must be between 0 and 10."],
            ["attendance_percentage", 0, 100, "Attendance must be between 0 and 100."],
            ["previous_backlogs", 0, 4, "Previous backlogs must be between 0 and 4."]
        ];

        for (const [name, min, max, message] of numericRules) {
            const field = form.elements.namedItem(name);
            const value = Number(field.value);
            if (!Number.isFinite(value) || value < min || value > max) {
                field.focus();
                formError.textContent = message;
                formError.classList.remove("hidden");
                return false;
            }
        }

        if (!Number.isInteger(Number(form.elements.previous_backlogs.value))) {
            formError.textContent = "Previous backlogs must be a whole number.";
            formError.classList.remove("hidden");
            form.elements.previous_backlogs.focus();
            return false;
        }

        return true;
    }

    async function postPrediction(endpointKey, payload) {
        const endpoint = endpointConfig[endpointKey];
        const response = await fetch(endpoint.path, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

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
            value.classList.add("result-placeholder");
            status.textContent = "Waiting for response";
            status.className = "result-status";
            card.classList.remove("has-error");

            if (key === "cgpa") caption.textContent = "Predicted CGPA on a 10-point scale.";
            if (key === "performance") caption.textContent = "Predicted academic performance category.";
            if (key === "backlog") caption.textContent = "Predicted backlog status.";
        });
    }

    function setLoadingState() {
        resultsGrid.setAttribute("aria-busy", "true");
        setResultsState("Running 3 models", "is-loading");
        Object.values(endpointConfig).forEach((config) => {
            const value = $(config.resultId);
            const status = $(config.statusId);
            const card = document.querySelector(config.cardSelector);
            value.textContent = "Running…";
            value.classList.remove("result-placeholder");
            status.textContent = "Request in progress";
            status.className = "result-status";
            card.classList.remove("has-error");
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
        } else {
            result = body?.prediction?.backlog_status;
            if (typeof result !== "string" || !result.trim()) {
                throw new Error("The backlog endpoint did not return a backlog status.");
            }
            value.textContent = result;
            caption.textContent = "Predicted status based on the submitted academic profile.";
        }

        value.classList.remove("result-placeholder");
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
        value.classList.remove("result-placeholder");
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
        predictButton.querySelector(".button-arrow").textContent = "⋯";
        formError.classList.add("hidden");
        resultsActions.classList.add("hidden");
        setLoadingState();

        // These three HTTP requests are started concurrently. The result cards
        // are updated together after all three requests have settled.
        const keys = ["cgpa", "performance", "backlog"];
        const outcomes = await Promise.allSettled(
            keys.map((key) => postPrediction(key, payloads[key]))
        );

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
        if (failedCount === 0) {
            setResultsState("All predictions complete", "is-complete");
            showToast("All three predictions received");
        } else if (failedCount === 3) {
            setResultsState("All requests failed", "is-error");
            showToast("Could not reach the prediction API");
        } else {
            setResultsState(`${3 - failedCount} of 3 predictions complete`, "is-error");
            showToast("Some predictions could not be completed");
        }

        resultsActions.classList.remove("hidden");
        predictButton.disabled = false;
        predictButton.querySelector(".button-label").textContent = "Generate all predictions";
        predictButton.querySelector(".button-arrow").textContent = "→";
        document.getElementById("results-grid").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function resetAll() {
        formError.classList.add("hidden");
        resetResultCards();
        setResultsState("Waiting for input");
        resultsGrid.setAttribute("aria-busy", "false");
        resultsActions.classList.add("hidden");
        showToast("Form cleared");
    }

    form.addEventListener("submit", handleSubmit);
    form.addEventListener("reset", () => window.setTimeout(resetAll, 0));
    if (resetButton) resetButton.addEventListener("click", () => window.setTimeout(resetAll, 0));
    if (runAgainButton) {
        runAgainButton.addEventListener("click", () => {
            resetResultCards();
            setResultsState("Ready for another prediction");
            resultsActions.classList.add("hidden");
            document.getElementById("prediction-form").scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    const year = $("current-year");
    if (year) year.textContent = new Date().getFullYear();
    resetResultCards();
})();
