document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("checkNews");
    const resultDiv = document.getElementById("result");

    button.addEventListener("click", async function () {
        const text = document.getElementById("newsText").value.trim();

        if (!text) {
            resultDiv.innerHTML = "<p style='color: red;'>⚠️ Please enter some text to analyze.</p>";
            return;
        }

        const apiUrl = "http://127.0.0.1:5000/predict";

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (data.error) {
                resultDiv.innerHTML = `<p style='color: red;'>❌ Error: ${data.error}</p>`;
            } else {
                const labelColor = data.label === "FAKE" ? "#ff4d4d" : "#28a745";

                const html = `
                    <p>
                        🧠 The article is predicted to be 
                        <strong style="color: ${labelColor};">${data.label}</strong>
                        with <strong>${data.confidence_tier}</strong>.
                    </p>
                    <p>🔎 Top contributing words: <em>${data.top_words.join(", ")}</em></p>
                    <p>${data.explanation}</p>
                `;
                resultDiv.innerHTML = html;
            }
        } catch (error) {
            resultDiv.innerHTML = "<p style='color: red;'>❌ Failed to connect to the API.</p>";
        }
    });
});
