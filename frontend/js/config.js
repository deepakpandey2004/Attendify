/**
 * Global config for Attendify frontend
 */
const CONFIG = {
    API_BASE_URL: window.location.origin + "/api/v1",
    UPLOADS_URL: window.location.origin + "/uploads",
    TOKEN_KEY: "attendify_token",
    USER_KEY: "attendify_user",
};

// ---- Token / user helpers ----
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

function saveAuth(token, user) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
}

function getUser() {
    const raw = localStorage.getItem(CONFIG.USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

function clearAuth() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
}

// ---- Route guards ----
function requireAuth() {
    if (!getToken()) {
        window.location.href = "/";
        return false;
    }
    return true;
}

function requireVerified() {
    if (!requireAuth()) return false;
    const user = getUser();
    if (user && !user.is_verified) {
        window.location.href = "/reference-face";
        return false;
    }
    return true;
}

// ---- API caller ----
async function apiCall(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Don't set Content-Type for FormData
    if (!(options.body instanceof FormData) && options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, { ...options, headers });

    // Auto-logout on token expiry
    if (response.status === 401) {
        clearAuth();
        if (window.location.pathname !== "/") {
            window.location.href = "/";
        }
        throw new Error("Session expired. Please sign in again.");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const msg = data.detail || `Error: ${response.status}`;
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data;
}

// ---- Fallback toast (layout.js overrides this with a better one) ----
function showToast(message, type = "info") {
    const colors = {
        success: "#059669", error: "#dc2626",
        warning: "#d97706", info: "#4f46e5"
    };
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed; top:20px; right:20px;
        background:${colors[type]}; color:white;
        padding:12px 18px; border-radius:8px;
        font-family:Inter, sans-serif; font-size:14px; font-weight:500;
        box-shadow:0 10px 25px rgba(0,0,0,0.15);
        z-index:9999; transition:all 0.3s;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(120%)";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}