(() => {
    "use strict";

    const endpointSamples = {
        cgpa: {
            path: "/api/v1/predictions/cgpa",
            body: {
                class_12_percentage: 79,
                class_10_percentage: 75,
                family_income: "Upper middle (30,000-50,000)",
                hometown: "City",
                exam_preparation: "2-3 Hours",
                gaming_hours: "0-1 Hour",
                attendance_percentage: "80%-100%",
                previous_semester_cgpa: 8.2
            }
        },
        performance: {
            path: "/api/v1/predictions/performance",
            body: {
                class_12_percentage: 79,
                class_10_percentage: 75,
                family_income: "Upper middle (30,000-50,000)",
                hometown: "City",
                exam_preparation: "2-3 Hours",
                gaming_hours: "0-1 Hour",
                attendance_percentage: "80%-100%",
                previous_semester_cgpa: 8.2
            }
        },
        backlog: {
            path: "/api/v1/predictions/backlog-risk",
            body: {
                previous_semester_cgpa: 6.8,
                attendance_percentage: 65,
                previous_backlogs: 1,
                study_time_hours_per_day: 2.5
            }
        }
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function showToast(message) {
        const toast = $("#toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
    }

    async function copyText(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const field = document.createElement("textarea");
                field.value = text;
                field.setAttribute("readonly", "");
                field.style.position = "fixed";
                field.style.opacity = "0";
                document.body.appendChild(field);
                field.select();
                const copied = document.execCommand("copy");
                field.remove();
                if (!copied) throw new Error("Clipboard access is unavailable.");
            }
            showToast("Copied to clipboard");
        } catch (error) {
            showToast("Could not copy text");
            console.error("Clipboard copy failed:", error);
        }
    }

    function loadSample(endpointKey) {
        const sample = endpointSamples[endpointKey];
        if (!sample) return;
        const select = $("#playground-endpoint");
        const editor = $("#playground-body");
        if (select) select.value = endpointKey;
        if (editor) editor.value = JSON.stringify(sample.body, null, 2);
        const response = $("#response-output");
        const code = $("#response-code");
        const copy = $("#copy-response");
        const status = $("#request-status");
        if (response) response.textContent = "Your API response will appear here.";
        if (code) code.textContent = "—";
        if (copy) copy.disabled = true;
        if (status) {
            status.textContent = "Ready to test";
            status.className = "request-status";
        }
    }

    function initializeCopyButtons() {
        $$('[data-copy]').forEach((button) => {
            button.addEventListener("click", () => copyText(button.dataset.copy || ""));
        });

        $$('[data-copy-target]').forEach((button) => {
            button.addEventListener("click", () => {
                const target = document.getElementById(button.dataset.copyTarget);
                if (target) copyText(target.innerText);
            });
        });
    }

    function initializeNavigation() {
        const toggle = $("#mobile-nav-toggle");
        const sidebar = $("#docs-sidebar");
        if (toggle && sidebar) {
            toggle.addEventListener("click", () => {
                const isOpen = sidebar.classList.toggle("is-open");
                toggle.setAttribute("aria-expanded", String(isOpen));
                toggle.textContent = isOpen ? "Close" : "Menu";
            });
        }

        $$(".nav-link").forEach((link) => {
            link.addEventListener("click", () => {
                if (sidebar) sidebar.classList.remove("is-open");
                if (toggle) {
                    toggle.setAttribute("aria-expanded", "false");
                    toggle.textContent = "Menu";
                }
            });
        });

        const search = $("#docs-search");
        const empty = $("#docs-search-empty");
        if (search) {
            search.addEventListener("input", () => {
                const query = search.value.trim().toLowerCase();
                let visibleCount = 0;
                $$(".nav-link").forEach((link) => {
                    const matches = link.textContent.toLowerCase().includes(query);
                    link.hidden = !matches;
                    if (matches) visibleCount += 1;
                });
                if (empty) empty.classList.toggle("hidden", visibleCount !== 0);
            });
        }

        const sections = $$("main section[id]");
        const navLinks = $$(".nav-link");
        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        navLinks.forEach((link) => {
                            link.classList.toggle(
                                "active",
                                link.getAttribute("href") === `#${entry.target.id}`
                            );
                        });
                    }
                });
            }, { rootMargin: "-25% 0px -65% 0px" });
            sections.forEach((section) => observer.observe(section));
        }
    }

    async function sendPlaygroundRequest() {
        const endpointKey = $("#playground-endpoint")?.value;
        const sample = endpointSamples[endpointKey];
        const editor = $("#playground-body");
        const sendButton = $("#send-request");
        const status = $("#request-status");
        const output = $("#response-output");
        const responseCode = $("#response-code");
        const copyResponse = $("#copy-response");

        if (!sample || !editor || !sendButton || !status || !output || !responseCode) return;

        let payload;
        try {
            payload = JSON.parse(editor.value);
            if (payload === null || Array.isArray(payload) || typeof payload !== "object") {
                throw new Error("The request body must be a JSON object.");
            }
        } catch (error) {
            status.textContent = "Invalid JSON";
            status.className = "request-status is-error";
            output.textContent = error.message;
            responseCode.textContent = "JSON error";
            if (copyResponse) copyResponse.disabled = true;
            return;
        }

        sendButton.disabled = true;
        sendButton.textContent = "Sending...";
        status.textContent = "Request in progress";
        status.className = "request-status is-loading";
        output.textContent = "Waiting for the API response...";
        responseCode.textContent = "Pending";
        if (copyResponse) copyResponse.disabled = true;

        try {
            const response = await fetch(sample.path, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let formatted;
            try {
                formatted = JSON.stringify(JSON.parse(responseText), null, 2);
            } catch {
                formatted = responseText || "The server returned an empty response.";
            }

            output.textContent = formatted;
            responseCode.textContent = `${response.status} ${response.statusText || ""}`.trim();
            status.textContent = response.ok ? "Request successful" : "API returned an error";
            status.className = response.ok ? "request-status is-success" : "request-status is-error";
            if (copyResponse) copyResponse.disabled = !responseText;
        } catch (error) {
            output.textContent = `${error.message}\n\nCheck that the Flask server is running and that this documentation page is being served by the same Flask application.`;
            responseCode.textContent = "Network error";
            status.textContent = "Could not reach the API";
            status.className = "request-status is-error";
            if (copyResponse) copyResponse.disabled = true;
        } finally {
            sendButton.disabled = false;
            sendButton.innerHTML = '<span aria-hidden="true">▶</span> Send request';
        }
    }

    function initializePlayground() {
        const select = $("#playground-endpoint");
        const send = $("#send-request");
        const reset = $("#reset-playground");
        const copyResponse = $("#copy-response");
        const output = $("#response-output");

        if (!select || !send) return;
        loadSample(select.value || "cgpa");
        select.addEventListener("change", () => loadSample(select.value));
        send.addEventListener("click", sendPlaygroundRequest);
        if (reset) reset.addEventListener("click", () => loadSample(select.value));
        if (copyResponse && output) copyResponse.addEventListener("click", () => copyText(output.textContent));

        $$('[data-try-endpoint]').forEach((button) => {
            button.addEventListener("click", () => {
                loadSample(button.dataset.tryEndpoint);
                $("#playground")?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const year = $("#year");
        if (year) year.textContent = new Date().getFullYear();
        initializeCopyButtons();
        initializeNavigation();
        initializePlayground();
    });
})();
