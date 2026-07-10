/**
 * Capture page: mark login/logout attendance
 */

if (!requireVerified()) { throw new Error("Redirecting..."); }

const urlParams = new URLSearchParams(window.location.search);
const action = urlParams.get("action") || "login";

// Update UI based on action (safe null checks)
const title = document.getElementById("page-title");
const subtitle = document.getElementById("page-subtitle");
const actionIcon = document.getElementById("action-icon");

if (title) title.textContent = action === "login" ? "Mark Login" : "Mark Logout";
if (subtitle) subtitle.textContent = action === "login"
    ? "Capture selfie to start your workday"
    : "Capture selfie to end your workday";

if (actionIcon) {
    actionIcon.style.background = action === "login" ? "var(--success-500)" : "var(--danger-500)";
    actionIcon.innerHTML = `<i data-lucide="${action === "login" ? "log-in" : "log-out"}" style="width:18px; height:18px; color:white;"></i>`;
}

if (window.lucide) lucide.createIcons();

// Init camera
const cam = new CameraCapture({
    videoEl: document.getElementById("video"),
    canvasEl: document.getElementById("canvas"),
    loadingEl: document.getElementById("camera-loading"),
    faceGuideEl: document.getElementById("face-guide"),
    addOverlay: true,
});

cam.start().then(() => {
    const liveInfo = document.getElementById("live-info");
    if (liveInfo) liveInfo.style.display = "block";
    updateLiveInfo();
    setInterval(updateLiveInfo, 1000);
    if (window.lucide) lucide.createIcons();
}).catch(err => {
    console.error("Camera start error:", err);
});

function updateLiveInfo() {
    const timeEl = document.getElementById("live-time");
    const locEl = document.getElementById("live-location");
    if (timeEl) {
        timeEl.textContent = new Date().toLocaleTimeString("en-IN", {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    const loc = cam.getLocation();
    const addr = cam.getAddress();
    if (loc && locEl) {
        const coords = `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
        locEl.textContent = addr || coords;
    }
}

// Buttons
const captureBtn = document.getElementById("capture-btn");
const retakeBtn = document.getElementById("retake-btn");
const submitBtn = document.getElementById("submit-btn");
const liveInfo = document.getElementById("live-info");

if (captureBtn) {
    captureBtn.addEventListener("click", () => {
        cam.capture();
        captureBtn.style.display = "none";
        if (retakeBtn) retakeBtn.style.display = "";
        if (submitBtn) submitBtn.style.display = "";
        if (liveInfo) liveInfo.style.display = "none";
    });
}

if (retakeBtn) {
    retakeBtn.addEventListener("click", () => {
        cam.retake();
        if (captureBtn) captureBtn.style.display = "";
        retakeBtn.style.display = "none";
        if (submitBtn) submitBtn.style.display = "none";
        if (liveInfo) liveInfo.style.display = "block";
    });
}

if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
    const btnText = document.getElementById("submit-btn-text");

    // Safety check — ensure photo was captured
    if (!cam.captured) {
        showToast("Please capture a photo first before submitting", "error");
        return;
    }

    btnText.textContent = "Submitting...";
    submitBtn.disabled = true;

    try {
        const blob = await cam.getBlob();
        if (!blob) {
            throw new Error("Failed to capture photo. Please try again.");
        }
        const loc = cam.getLocation();
        if (!loc) throw new Error("Location not available. Please enable GPS.");

        const addr = cam.getAddress() || `Lat:${loc.latitude.toFixed(4)}, Lng:${loc.longitude.toFixed(4)}`;

        const formData = new FormData();
        formData.append("file", blob, `${action}.jpg`);
        formData.append("latitude", loc.latitude);
        formData.append("longitude", loc.longitude);
        formData.append("address", addr);

        await apiCall(`/attendance/${action}`, { method: "POST", body: formData });

        showToast(`${action === "login" ? "Login" : "Logout"} marked successfully!`, "success");
        cam.stop();
        setTimeout(() => window.location.href = "/dashboard", 1200);
    } catch (err) {
        showToast(err.message || "Failed to mark attendance", "error");
        btnText.textContent = "Submit";
        submitBtn.disabled = false;
    }
});
}