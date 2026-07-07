
function icon(name, cls = "") {
    return `<i data-lucide="${name}" class="${cls}"></i>`;
}

// Get user initials for avatar
function getInitials(name) {
    if (!name) return "U";
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

// Render sidebar (call this in every page)
function renderSidebar(activePage) {
    const user = getUser() || { full_name: "User", email: "user@example.com" };
    const items = [
        { id: "dashboard", label: "Dashboard", icon: "layout-dashboard", href: "/dashboard" },
        { id: "history",   label: "Attendance", icon: "calendar-check", href: "/history" },
    ];

    const navHtml = items.map(item => `
        <a href="${item.href}" class="nav-item ${item.id === activePage ? 'active' : ''}">
            ${icon(item.icon)}
            <span>${item.label}</span>
        </a>
    `).join("");

    return `
    <aside class="sidebar" id="app-sidebar">
        <div class="sidebar-brand">
            <div class="brand-logo">A</div>
            <div>
                <div class="brand-name">Attendify</div>
                <div style="font-size:11px; color: var(--gray-500); margin-top:-2px;">Smart Attendance</div>
            </div>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-section-title">Menu</div>
            ${navHtml}

            <div class="nav-section-title" style="margin-top:20px;">Account</div>
            <a href="#" class="nav-item" id="sidebar-alerts-btn">
                ${icon("bell")}
                <span>Notifications</span>
                <span id="alert-badge-sidebar" class="badge badge-danger" style="margin-left:auto; display:none;">0</span>
            </a>
        </nav>

        <div class="sidebar-footer">
            <div class="avatar">${getInitials(user.full_name)}</div>
            <div class="user-info">
                <div class="user-name">${user.full_name}</div>
                <div class="user-email">${user.email}</div>
            </div>
            <button class="icon-btn" id="sidebar-logout-btn" title="Sign out">
                ${icon("log-out")}
            </button>
        </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
}

// Render topbar
function renderTopbar(pageTitle, rightContent = "") {
    return `
    <header class="topbar">
        <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" style="margin-right: 8px;">
            ${icon("menu")}
        </button>
        <h1 style="font-size:18px; font-weight:600; color: var(--gray-900); margin:0;">${pageTitle}</h1>
        <div style="margin-left:auto; display:flex; align-items:center; gap:10px;">
            ${rightContent}
        </div>
    </header>
    `;
}

// Wire up sidebar interactions (call after DOM ready)
function initLayout() {
    // Mobile toggle
    const sidebar = document.getElementById("app-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const menuBtn = document.getElementById("mobile-menu-btn");

    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("open");
        });
    }
    if (overlay) {
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("open");
        });
    }

    // Logout
    const logoutBtn = document.getElementById("sidebar-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("Sign out of Attendify?")) {
                clearAuth();
                window.location.href = "/";
            }
        });
    }

    // Refresh lucide icons
    if (window.lucide) window.lucide.createIcons();
}

// Better toast (overrides the one in config.js)
window.showToast = function (message, type = "info") {
    const icons = {
        success: "check-circle-2",
        error: "x-circle",
        warning: "alert-triangle",
        info: "info",
    };
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `${icon(icons[type] || "info")}<span>${message}</span>`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
        toast.style.transition = "opacity 0.3s, transform 0.3s";
        toast.style.opacity = "0";
        toast.style.transform = "translateX(120%)";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
};