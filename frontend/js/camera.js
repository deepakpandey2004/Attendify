
const LOCATIONIQ_API_KEY = "pk.5c3f2c31debc2ea5acb60e3e04131772"
class CameraCapture {
    constructor({ videoEl, canvasEl, loadingEl, faceGuideEl, addOverlay = true }) {
        this.video = videoEl;
        this.canvas = canvasEl;
        this.loading = loadingEl;
        this.faceGuide = faceGuideEl;
        this.addOverlay = addOverlay;
        this.stream = null;
        this.location = null;
        this.address = null;
        this.captured = false;
    }

    async start() {
        try {
            this.location = await this._getLocation();

            // Background: fetch address (non-blocking)
            this._fetchAddress()
                .then((addr) => {
                    this.address = addr;
                    console.log("[Camera] Address:", addr);
                })
                .catch((e) => {
                    console.warn("[Camera] Address fetch failed:", e.message);
                    this.address = null;
                });

            // Start front camera
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
            this.video.srcObject = this.stream;

            this.video.onloadedmetadata = () => {
    this.loading.style.display = "none";
    this.loading.classList.add("hidden");
    if (this.faceGuide) {
        this.faceGuide.style.display = "flex";
        this.faceGuide.classList.remove("hidden");
    }
    // Explicitly play video (some browsers need this)
    this.video.play().catch(e => console.warn("Video play error:", e));
};
        } catch (err) {
            this.loading.innerHTML = `
                <div class="text-center text-red-300 p-6">
                    <i class="fas fa-video-slash text-5xl mb-3"></i>
                    <p class="font-semibold">Camera / Location access denied</p>
                    <p class="text-xs mt-1">${err.message}</p>
                    <p class="text-xs mt-2">Please allow permissions and reload.</p>
                </div>`;
            throw err;
        }
    }

    _getLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                }),
                (err) => reject(new Error("Location permission denied: " + err.message)),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    async _fetchAddress() {
    if (!this.location) return null;
    const { latitude, longitude } = this.location;
    console.log(`[Camera] Fetching address for: ${latitude}, ${longitude}`);

    // ---- Provider 1: LocationIQ (BEST for free + detail) ----
    if (LOCATIONIQ_API_KEY && LOCATIONIQ_API_KEY.startsWith("pk.")) {
        try {
            const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&zoom=18&addressdetails=1&accept-language=en`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log("[Camera] LocationIQ response:", data);

                const a = data.address || {};
                const parts = [
                    a.house_number,
                    a.house || a.building || a.amenity || a.shop || a.office,
                    a.road || a.pedestrian || a.footway,
                    a.neighbourhood || a.residential || a.hamlet,
                    a.suburb || a.quarter,
                    a.city_district || a.district,
                    a.city || a.town || a.village || a.municipality,
                    a.state,
                    a.postcode,
                    a.country,
                ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);

                if (parts.length >= 3) {
                    console.log("[Camera] ✅ Using LocationIQ");
                    return parts.join(", ");
                }
                // If detail is weak, fall back to display_name
                if (data.display_name) {
                    console.log("[Camera] ✅ Using LocationIQ (display_name)");
                    return data.display_name;
                }
            } else {
                console.warn("[Camera] LocationIQ HTTP error:", res.status);
            }
        } catch (e) {
            console.warn("[Camera] LocationIQ failed:", e.message);
        }
    }

    // ---- Provider 2: BigDataCloud (fallback, no key) ----
    try {
        const url1 = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
        const res1 = await fetch(url1);
        if (res1.ok) {
            const d = await res1.json();
            const parts = [
                d.locality,
                d.city,
                d.principalSubdivision,
                d.postcode,
                d.countryName,
            ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
            if (parts.length) {
                console.log("[Camera] ✅ Using BigDataCloud (fallback)");
                return parts.join(", ");
            }
        }
    } catch (e) {
        console.warn("[Camera] BigDataCloud failed:", e.message);
    }

    // ---- Provider 3: Nominatim (last resort) ----
    try {
        const url2 = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
        const res2 = await fetch(url2, { headers: { "Accept-Language": "en" } });
        if (res2.ok) {
            const data = await res2.json();
            return data.display_name || null;
        }
    } catch (e) {
        console.warn("[Camera] Nominatim failed:", e.message);
    }

    return null;
}

    capture() {
    const ctx = this.canvas.getContext("2d");
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    if (this.addOverlay) this._drawOverlay(ctx);

    this.video.style.display = "none";
    this.video.classList.add("hidden");
    this.canvas.style.display = "block";
    this.canvas.classList.remove("hidden");
    if (this.faceGuide) {
        this.faceGuide.style.display = "none";
        this.faceGuide.classList.add("hidden");
    }
    this.captured = true;
}

    _drawOverlay(ctx) {
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-IN", {
            year: "numeric", month: "short", day: "2-digit",
        });
        const timeStr = now.toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        });
        const coords = this.location
            ? `${this.location.latitude.toFixed(5)}, ${this.location.longitude.toFixed(5)}`
            : "N/A";
        const addr = this.address || "Location fetched (address loading...)";

        const padding = 16;
        const fontSize = Math.max(14, Math.floor(this.canvas.width / 65));
        ctx.font = `bold ${fontSize}px monospace`;

        // Wrap address
        const maxWidth = this.canvas.width - padding * 2;
        const addrLines = this._wrapText(ctx, `📍 ${addr}`, maxWidth);
        const totalLines = 2 + addrLines.length;

        const lineGap = 6;
        const boxHeight = fontSize * totalLines + lineGap * (totalLines - 1) + padding * 2;

        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, this.canvas.height - boxHeight, this.canvas.width, boxHeight);

        ctx.fillStyle = "white";
        ctx.textBaseline = "top";
        let y = this.canvas.height - boxHeight + padding;

        ctx.fillText(`📅 ${dateStr}   🕒 ${timeStr}`, padding, y);
        y += fontSize + lineGap;

        ctx.fillText(`🌐 ${coords}`, padding, y);
        y += fontSize + lineGap;

        for (const line of addrLines) {
            ctx.fillText(line, padding, y);
            y += fontSize + lineGap;
        }
    }

    _wrapText(ctx, text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let current = "";
        for (const w of words) {
            const test = current ? current + " " + w : w;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = w;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    retake() {
    this.canvas.style.display = "none";
    this.canvas.classList.add("hidden");
    this.video.style.display = "block";
    this.video.classList.remove("hidden");
    if (this.faceGuide) {
        this.faceGuide.style.display = "flex";
        this.faceGuide.classList.remove("hidden");
    }
    this.captured = false;
}

    getBlob() {
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
        });
    }

    getLocation() {
        return this.location;
    }

    getAddress() {
        return this.address;
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach((t) => t.stop());
            this.stream = null;
        }
    }
}

// Expose globally
window.CameraCapture = CameraCapture;

