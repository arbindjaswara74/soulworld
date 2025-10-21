// public/js/upload.js
// Handles story upload form submission safely and smoothly.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('uploadForm');
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const authorInput = document.getElementById('authorName');
  const submitBtn = document.getElementById('submitBtn');
  const statusMsg = document.getElementById('statusMsg');

  if (!form) return; // No form on page

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput?.value.trim();
    const content = contentInput?.value.trim();
    const authorName = authorInput?.value.trim() || "Anonymous";

    // Basic client-side validation
    if (!title || !content) {
      showMessage("⚠️ Please fill in both Title and Content fields.", "error");
      return;
    }

    // Disable button while submitting
    submitBtn.disabled = true;
    showMessage("⏳ Uploading your story... Please wait.", "info");

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, authorName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }

      // Reset form and show success
      form.reset();
      showMessage("✅ Your story was uploaded successfully!", "success");

      // Optional: redirect after short delay
      setTimeout(() => {
        window.location.href = "/stories.html";
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      showMessage("❌ Failed to upload: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Helper to show messages to user
  function showMessage(msg, type) {
    if (!statusMsg) {
      alert(msg);
      return;
    }
    statusMsg.textContent = msg;
    statusMsg.style.color =
      type === "success" ? "green" :
      type === "error" ? "red" :
      "blue";
  }
});
