
document.addEventListener("DOMContentLoaded", function () {
        const button = document.getElementById("checkNews");
        const resultDiv = document.getElementById("result");
        const feedbackSection = document.getElementById("feedback-section");
    
        let currentArticle = "";
        let currentLabel = "";
    
        // Tab switching
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    
                btn.classList.add("active");
                document.getElementById(btn.dataset.tab).classList.add("active");
            });
        });
    
        // Render thumbs up/down and feedback form
        function renderFeedbackUI() {
            feedbackSection.innerHTML = `
                <p>Was this prediction helpful?</p>
                <button id="thumbs-up">👍</button>
                <button id="thumbs-down">👎</button>
                <div id="feedback-form" style="display: none; margin-top: 10px;">
                    <textarea id="feedback-reason" placeholder="Why was it wrong? (optional)" rows="3" style="width: 100%;"></textarea>
                    <button id="submit-feedback">Submit Feedback</button>
                </div>
            `;
    
            document.getElementById("thumbs-up").addEventListener("click", () => {
                feedbackSection.innerHTML = "<p>✅ Thanks for your feedback!</p>";
            });
    
            document.getElementById("thumbs-down").addEventListener("click", () => {
                document.getElementById("feedback-form").style.display = "block";
            });
    
            document.getElementById("submit-feedback").addEventListener("click", async () => {
                const feedbackText = document.getElementById("feedback-reason").value.trim();
                const response = await fetch("http://127.0.0.1:5000/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: currentArticle,
                        label: currentLabel,
                        feedback: feedbackText || "User flagged this as incorrect"
                    })
                });
    
                const data = await response.json();
                if (data.status === "Feedback saved!") {
                    feedbackSection.innerHTML = "<p>✅ Feedback received. Thank you!</p>";
                } else {
                    feedbackSection.innerHTML = "<p style='color: red;'>⚠️ Failed to submit feedback.</p>";
                }
            });
        }
    
        // Save to history (localStorage)
        function saveToHistory(text, label) {
            const preview = text.slice(0, 40).trim() + (text.length > 40 ? "..." : "");
            const entry = { preview, label, timestamp: Date.now() };
            let history = JSON.parse(localStorage.getItem("news_history") || "[]");
            history.unshift(entry);
            history = history.slice(0, 5);
            localStorage.setItem("news_history", JSON.stringify(history));
            updateHistoryUI();
        }
    
        // Show history
        function updateHistoryUI() {
            const historyList = document.getElementById("history-list");
            const history = JSON.parse(localStorage.getItem("news_history") || "[]");
            historyList.innerHTML = "";
    
            history.forEach(item => {
                const icon = item.label === "REAL" ? "✔" : "❌";
                const li = document.createElement("li");
                li.textContent = `${icon} ${item.preview}`;
                historyList.appendChild(li);
            });
        }
    
        // On click: check articlet
        button.addEventListener("click", async function () {
            const text = document.getElementById("newsText").value.trim();
            resultDiv.innerHTML = "";
            feedbackSection.innerHTML = "";
            currentArticle = "";
            currentLabel = "";
    
            if (!text) {
                resultDiv.innerHTML = "<p style='color: red;'>⚠️ Please enter some text to analyze.</p>";
                return;
            }
    
            try {
                const response = await fetch("http://127.0.0.1:5000/predict", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: text })
                });
    
                const data = await response.json();
    
                if (data.error) {
                    resultDiv.innerHTML = `<p style='color: red;'>❌ Error: ${data.error}</p>`;
                } else {
                    const labelColor = data.label === "FAKE" ? "#ff4d4d" : "#28a745";
                    const explanation = data.explanation || "";
                    const topWords = data.top_words?.length
                        ? `<p>🔎 Top contributing words: <em>${data.top_words.join(", ")}</em></p>`
                        : "";
    
                    const html = `
                        <p>
                            🧠 The article is predicted to be 
                            <strong style="color: ${labelColor};">${data.label}</strong>
                            with <strong>${data.confidence_tier}</strong>.
                        </p>
                        ${topWords}
                        <p>${explanation}</p>
                    `;
                    resultDiv.innerHTML = html;
    
                    // Update feedback & history
                    currentArticle = data.original_text || text;
                    currentLabel = data.label;
                    renderFeedbackUI();
                    saveToHistory(text, data.label);
                }
            } catch (error) {
                resultDiv.innerHTML = "<p style='color: red;'>❌ Failed to connect to the API.</p>";
            }
        });
    
        // On load, show any saved history
        updateHistoryUI();
    });
                                        
    // Render thumbs up/down and feedback form
    function renderFeedbackUI() {
        feedbackSection.innerHTML = `
            <p>Was this prediction helpful?</p>
            <button id="thumbs-up">👍</button>
            <button id="thumbs-down">👎</button>
            <div id="feedback-form" style="display: none; margin-top: 10px;">
                <textarea id="feedback-reason" placeholder="Why was it wrong? (optional)" rows="3" style="width: 100%;"></textarea>
                <button id="submit-feedback">Submit Feedback</button>
            </div>
        `;

        document.getElementById("thumbs-up").addEventListener("click", () => {
            feedbackSection.innerHTML = "<p>✅ Thanks for your feedback!</p>";
        });

        document.getElementById("thumbs-down").addEventListener("click", () => {
            document.getElementById("feedback-form").style.display = "block";
        });

        document.getElementById("submit-feedback").addEventListener("click", async () => {
            const feedbackText = document.getElementById("feedback-reason").value.trim();
            const response = await fetch("http://127.0.0.1:5000/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: currentArticle,
                    label: currentLabel,
                    feedback: feedbackText || "User flagged this as incorrect"
                })
            });

            const data = await response.json();
            if (data.status === "Feedback saved!") {
                feedbackSection.innerHTML = "<p>✅ Feedback received. Thank you!</p>";
            } else {
                feedbackSection.innerHTML = "<p style='color: red;'>⚠️ Failed to submit feedback.</p>";
            }
        });
    }

    // Save to history (localStorage)
    function saveToHistory(text, label) {
        const preview = text.slice(0, 40).trim() + (text.length > 40 ? "..." : "");
        const entry = { preview, label, timestamp: Date.now() };
        let history = JSON.parse(localStorage.getItem("news_history") || "[]");
        history.unshift(entry);
        history = history.slice(0, 5);
        localStorage.setItem("news_history", JSON.stringify(history));
        updateHistoryUI();
    }

    // Show history
    function updateHistoryUI() {
        const historyList = document.getElementById("history-list");
        const history = JSON.parse(localStorage.getItem("news_history") || "[]");
        historyList.innerHTML = "";

        history.forEach(item => {
            const icon = item.label === "REAL" ? "✔" : "❌";
            const li = document.createElement("li");
            li.textContent = `${icon} ${item.preview}`;
            historyList.appendChild(li);
        });
    }

    // On click: check articlet
    button.addEventListener("click", async function () {
        const text = document.getElementById("newsText").value.trim();
        resultDiv.innerHTML = "";
        feedbackSection.innerHTML = "";
        currentArticle = "";
        currentLabel = "";

        if (!text) {
            resultDiv.innerHTML = "<p style='color: red;'>⚠️ Please enter some text to analyze.</p>";
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (data.error) {
                resultDiv.innerHTML = `<p style='color: red;'>❌ Error: ${data.error}</p>`;
            } else {
                const labelColor = data.label === "FAKE" ? "#ff4d4d" : "#28a745";
                const explanation = data.explanation || "";
                const topWords = data.top_words?.length
                    ? `<p>🔎 Top contributing words: <em>${data.top_words.join(", ")}</em></p>`
                    : "";

                const html = `
                    <p>
                        🧠 The article is predicted to be 
                        <strong style="color: ${labelColor};">${data.label}</strong>
                        with <strong>${data.confidence_tier}</strong>.
                    </p>
                    ${topWords}
                    <p>${explanation}</p>
                `;
                resultDiv.innerHTML = html;

                // Update feedback & history
                currentArticle = data.original_text || text;
                currentLabel = data.label;
                renderFeedbackUI();
                saveToHistory(text, data.label);
            }
        } catch (error) {
            resultDiv.innerHTML = "<p style='color: red;'>❌ Failed to connect to the API.</p>";
        }
    });

    // On load, show any saved history
    updateHistoryUI();
