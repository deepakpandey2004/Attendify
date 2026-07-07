

if (!requireVerified()) { throw new Error("Redirecting..."); }

const user = getUser();

// ---- Inject sidebar + topbar ----
document.getElementById("sidebar-container").innerHTML = renderSidebar("dashboard");
document.getElementById("topbar-container").innerHTML = renderTopbar("Dashboard", `
    <div style="font-size:13px; color:var(--gray-500);" id="live-clock"></div>
`);

// Greeting
const firstName = user.full_name.split(" ")[0];
const hour = new Date().getHours();
const greetWord = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
document.getElementById("greeting").innerHTML = `${greetWord}, <span style="color:var(--brand-600);">${firstName}</span>`;
document.getElementById("date-today").textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
});

// Live clock in topbar
function updateClock() {
    const el = document.getElementById("live-clock");
    if (el) el.textContent = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
updateClock();
setInterval(updateClock, 1000);

// Initialize sidebar interactions
initLayout();
lucide.createIcons();

// ============ Today's Status ============
async function loadStatus() {
    try {
        const data = await apiCall("/attendance/today");
        renderStatus(data);
    } catch (err) {
        document.getElementById("status-content").innerHTML = `
            <div style="text-align:center; padding:24px; color:var(--danger-600);">
                <i data-lucide="alert-triangle" style="width:40px; height:40px; margin:0 auto 8px;"></i>
                <p style="font-weight:600;">Failed to load status</p>
                <p style="font-size:12px; color:var(--gray-500); margin-top:4px;">${err.message}</p>
            </div>`;
        lucide.createIcons();
    }
}

function fmtTime(dt) {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function renderStatus(data) {
    const badge = document.getElementById("status-badge");
    const content = document.getElementById("status-content");
    const actions = document.getElementById("action-buttons");

    // Not marked yet
    if (!data.attendance) {
        badge.textContent = "Not marked";
        badge.className = "badge badge-gray";
        content.innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <div style="width:60px; height:60px; border-radius:16px; background:var(--gray-100); margin:0 auto 14px; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="clock" style="width:28px; height:28px; color:var(--gray-400);"></i>
                </div>
                <p style="font-size:15px; font-weight:600; color:var(--gray-800); margin-bottom:4px;">Ready to start your day?</p>
                <p style="font-size:13px; color:var(--gray-500);">${data.message || "Mark your login attendance to begin"}</p>
            </div>`;
        actions.innerHTML = `
            <button onclick="goToCapture('login')" class="btn btn-success btn-lg btn-block pulse-ring">
                <i data-lucide="log-in"></i>
                Mark LOGIN Attendance
            </button>`;
        lucide.createIcons();
        return;
    }

    const a = data.attendance;
    const isActive = a.status === "active";
    const isFullDay = a.status === "full_day";
    const isHalfDay = a.status === "half_day";

    // Badge
    if (isActive) {
        badge.innerHTML = `<span class="badge-dot" style="background:var(--brand-500);"></span> Logged In`;
        badge.className = "badge badge-info";
    } else if (isFullDay) {
        badge.innerHTML = `<span class="badge-dot" style="background:var(--success-500);"></span> Full Day`;
        badge.className = "badge badge-success";
    } else if (isHalfDay) {
        badge.innerHTML = `<span class="badge-dot" style="background:var(--warning-500);"></span> Half Day`;
        badge.className = "badge badge-warning";
    }

    const loginLoc = a.login_address || (a.login_latitude != null ? `${a.login_latitude.toFixed(4)}, ${a.login_longitude.toFixed(4)}` : "—");
    const logoutLoc = a.logout_address || (a.logout_latitude != null ? `${a.logout_latitude.toFixed(4)}, ${a.logout_longitude.toFixed(4)}` : "");

    content.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div style="background:var(--success-50); border:1px solid #a7f3d0; border-radius:12px; padding:16px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <i data-lucide="log-in" style="width:14px; height:14px; color:var(--success-600);"></i>
                    <span style="font-size:11px; font-weight:600; color:var(--success-600); text-transform:uppercase; letter-spacing:0.05em;">Login</span>
                </div>
                <div style="font-size:24px; font-weight:700; color:var(--success-600); letter-spacing:-0.01em;">${fmtTime(a.login_time)}</div>
                <div style="font-size:11px; color:var(--gray-600); margin-top:6px; display:flex; align-items:flex-start; gap:4px;">
                    <i data-lucide="map-pin" style="width:12px; height:12px; margin-top:2px; flex-shrink:0;"></i>
                    <span style="line-height:1.4;">${loginLoc}</span>
                </div>
            </div>
            <div style="background:${a.logout_time ? 'var(--danger-50)' : 'var(--gray-50)'}; border:1px solid ${a.logout_time ? '#fecaca' : 'var(--gray-200)'}; border-radius:12px; padding:16px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    <i data-lucide="log-out" style="width:14px; height:14px; color:${a.logout_time ? 'var(--danger-600)' : 'var(--gray-400)'};"></i>
                    <span style="font-size:11px; font-weight:600; color:${a.logout_time ? 'var(--danger-600)' : 'var(--gray-400)'}; text-transform:uppercase; letter-spacing:0.05em;">Logout</span>
                </div>
                <div style="font-size:24px; font-weight:700; color:${a.logout_time ? 'var(--danger-600)' : 'var(--gray-400)'}; letter-spacing:-0.01em;">${fmtTime(a.logout_time)}</div>
                ${a.logout_time
                    ? `<div style="font-size:11px; color:var(--gray-600); margin-top:6px; display:flex; align-items:flex-start; gap:4px;">
                        <i data-lucide="map-pin" style="width:12px; height:12px; margin-top:2px; flex-shrink:0;"></i>
                        <span style="line-height:1.4;">${logoutLoc}</span>
                       </div>`
                    : `<div style="font-size:11px; color:var(--gray-400); margin-top:6px;">Not yet logged out</div>`}
            </div>
        </div>`;

    if (isActive) {
        actions.innerHTML = `
            <button onclick="goToCapture('logout')" class="btn btn-danger btn-lg btn-block pulse-ring">
                <i data-lucide="log-out"></i>
                Mark LOGOUT Attendance
            </button>`;
    } else {
        actions.innerHTML = `
            <div style="background:var(--success-50); border-radius:10px; padding:14px; text-align:center; display:flex; align-items:center; justify-content:center; gap:8px; color:var(--success-600); font-size:14px; font-weight:600;">
                <i data-lucide="check-circle-2" style="width:18px; height:18px;"></i>
                Attendance completed. See you tomorrow!
            </div>`;
    }
    lucide.createIcons();
}

function goToCapture(action) {
    window.location.href = `/capture?action=${action}`;
}

// ============ Quick Stats + Recent Activity ============
async function loadStatsAndActivity() {
    try {
        const data = await apiCall("/attendance/history?limit=200");
        document.getElementById("qs-total").textContent = data.total_days;
        document.getElementById("qs-full").textContent = data.full_days;
        document.getElementById("qs-half").textContent = data.half_days;
        const denom = (data.full_days || 0) + (data.half_days || 0) + (data.leaves || 0) + (data.active_days || 0);
        const pct = denom ? Math.round(((data.full_days + data.half_days * 0.5) / denom) * 100) : 0;
        document.getElementById("qs-pct").textContent = pct + "%";

        // Recent activity — last 5 real records (skip leaves for cleaner view)
        const recent = (data.records || []).filter(r => r.status !== "leave").slice(0, 5);
        const container = document.getElementById("recent-activity");
        if (recent.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:32px 16px;">
                    <i data-lucide="inbox" style="width:36px; height:36px; color:var(--gray-300); margin-bottom:8px;"></i>
                    <p style="font-size:13px; color:var(--gray-500);">No activity yet</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        container.innerHTML = recent.map(r => {
            const dot = r.status === "full_day" ? "dot-full" : r.status === "half_day" ? "dot-half" : "dot-active";
            const label = r.status === "full_day" ? "Full Day" : r.status === "half_day" ? "Half Day" : "Active";
            const cls = r.status === "full_day" ? "badge-success" : r.status === "half_day" ? "badge-warning" : "badge-info";
            const date = new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
            return `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--gray-100);">
                    <span class="status-dot ${dot}"></span>
                    <div style="flex:1;">
                        <div style="font-size:13px; font-weight:600; color:var(--gray-800);">${date}</div>
                        <div style="font-size:11px; color:var(--gray-500); margin-top:1px;">
                            ${fmtTime(r.login_time)} → ${fmtTime(r.logout_time)}
                        </div>
                    </div>
                    <span class="badge ${cls}">${label}</span>
                </div>`;
        }).join("");
    } catch (err) {
        console.error("Stats load error:", err);
    }
}

// ============ Alerts ============
async function loadAlerts() {
    try {
        const data = await apiCall("/alerts");
        const badge = document.getElementById("alert-badge-sidebar");
        if (badge) {
            if (data.unread_count > 0) {
                badge.textContent = data.unread_count;
                badge.style.display = "";
            } else {
                badge.style.display = "none";
            }
        }
        return data;
    } catch (err) { console.error(err); }
}

document.getElementById("sidebar-alerts-btn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    document.getElementById("alerts-modal").style.display = "flex";
    const list = document.getElementById("alerts-list");
    list.innerHTML = `<p style="text-align:center; color:var(--gray-400); padding:32px 0;">Loading...</p>`;
    const data = await loadAlerts();
    if (!data || data.total === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px 16px;">
                <i data-lucide="bell-off" style="width:36px; height:36px; color:var(--gray-300); margin-bottom:8px;"></i>
                <p style="font-size:13px; color:var(--gray-500);">No notifications yet</p>
            </div>`;
        lucide.createIcons();
        return;
    }
    list.innerHTML = data.alerts.map(a => `
        <div style="padding:12px; border-radius:10px; margin-bottom:8px; background:${a.is_read ? 'var(--gray-50)' : 'var(--brand-50)'}; ${a.is_read ? '' : 'border-left:3px solid var(--brand-500);'}">
            <div style="font-size:13px; font-weight:600; color:var(--gray-900);">${a.title}</div>
            <div style="font-size:12px; color:var(--gray-600); margin-top:4px; line-height:1.4;">${a.message}</div>
            <div style="font-size:11px; color:var(--gray-400); margin-top:6px;">${new Date(a.created_at).toLocaleString("en-IN")}</div>
        </div>
    `).join("");
    lucide.createIcons();
});

document.getElementById("close-alerts")?.addEventListener("click", () => {
    document.getElementById("alerts-modal").style.display = "none";
});
document.getElementById("alerts-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "alerts-modal") document.getElementById("alerts-modal").style.display = "none";
});
document.getElementById("mark-read-btn")?.addEventListener("click", async () => {
    try {
        await apiCall("/alerts/mark-all-read", { method: "POST" });
        document.getElementById("alert-badge-sidebar").style.display = "none";
        showToast("All notifications marked as read", "success");
        document.getElementById("alerts-modal").style.display = "none";
    } catch (err) { showToast(err.message, "error"); }
});

// ---- Init ----
loadStatus();
loadStatsAndActivity();
loadAlerts();