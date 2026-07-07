/**
 * History page: full attendance record with detail modal
 */

if (!requireVerified()) { throw new Error("Redirecting..."); }

// Sidebar + topbar
document.getElementById("sidebar-container").innerHTML = renderSidebar("history");
document.getElementById("topbar-container").innerHTML = renderTopbar("Attendance History");
initLayout();
lucide.createIcons();

// ---- Formatters ----
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
}
function formatTime(dt) {
    if (!dt) return "—";
    return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function calcDuration(login, logout) {
    if (!login || !logout) return "—";
    const diff = (new Date(logout) - new Date(login)) / 60000;
    const h = Math.floor(diff / 60);
    const m = Math.round(diff % 60);
    return `${h}h ${m}m`;
}

// ---- Status helpers ----
function statusDot(status) {
    const map = { full_day: "dot-full", half_day: "dot-half", active: "dot-active", leave: "dot-leave" };
    return `<span class="status-dot ${map[status] || 'dot-active'}"></span>`;
}
function statusBadge(status) {
    const map = {
        full_day: { text: "Full Day", cls: "badge-success" },
        half_day: { text: "Half Day", cls: "badge-warning" },
        active:   { text: "Active",   cls: "badge-info" },
        leave:    { text: "Leave",    cls: "badge-danger" },
    };
    const s = map[status] || { text: status, cls: "badge-gray" };
    return `<span class="badge ${s.cls}">${s.text}</span>`;
}

// ---- Record row ----
function renderRecord(r) {
    if (r.status === "leave") {
        return `
        <div style="padding:14px 22px; display:flex; align-items:center; gap:14px; background:linear-gradient(90deg, var(--danger-50) 0%, transparent 40%); border-bottom:1px solid var(--gray-100);">
            ${statusDot(r.status)}
            <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-weight:600; color:var(--gray-900); font-size:14px;">${formatDate(r.date)}</span>
                    ${statusBadge(r.status)}
                </div>
                <div style="font-size:12px; color:var(--danger-600); margin-top:4px; display:flex; align-items:center; gap:5px;">
                    <i data-lucide="user-x" style="width:12px; height:12px;"></i>
                    Absent — no attendance recorded
                </div>
            </div>
        </div>`;
    }

    return `
        <div class="record-row" data-record='${encodeURIComponent(JSON.stringify(r))}' style="padding:14px 22px; display:flex; align-items:center; gap:14px; border-bottom:1px solid var(--gray-100); cursor:pointer; transition:background 0.15s;">
            ${statusDot(r.status)}
            <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-weight:600; color:var(--gray-900); font-size:14px;">${formatDate(r.date)}</span>
                    ${statusBadge(r.status)}
                    ${r.is_auto_logout ? '<span style="font-size:11px; color:var(--warning-600); display:inline-flex; align-items:center; gap:4px;"><i data-lucide="bot" style="width:12px; height:12px;"></i> Auto-logout</span>' : ''}
                </div>
                <div style="font-size:12px; color:var(--gray-500); margin-top:4px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <span style="display:inline-flex; align-items:center; gap:4px;">
                        <i data-lucide="log-in" style="width:12px; height:12px; color:var(--success-600);"></i>
                        ${formatTime(r.login_time)}
                    </span>
                    <span style="color:var(--gray-300);">→</span>
                    <span style="display:inline-flex; align-items:center; gap:4px;">
                        <i data-lucide="log-out" style="width:12px; height:12px; color:var(--danger-600);"></i>
                        ${formatTime(r.logout_time)}
                    </span>
                    <span style="display:inline-flex; align-items:center; gap:4px; color:var(--gray-400);">
                        <i data-lucide="hourglass" style="width:12px; height:12px;"></i>
                        ${calcDuration(r.login_time, r.logout_time)}
                    </span>
                </div>
            </div>
            <i data-lucide="chevron-right" style="width:16px; height:16px; color:var(--gray-300);"></i>
        </div>`;
}

// ---- Load history ----
async function loadHistory() {
    try {
        const data = await apiCall("/attendance/history?limit=200");

        document.getElementById("stat-total").textContent = data.total_days;
        document.getElementById("stat-full").textContent = data.full_days;
        document.getElementById("stat-half").textContent = data.half_days;
        document.getElementById("stat-leaves").textContent = data.leaves || 0;

        const denom = (data.full_days || 0) + (data.half_days || 0) + (data.leaves || 0) + (data.active_days || 0);
        const pct = denom ? Math.round(((data.full_days + data.half_days * 0.5) / denom) * 100) : 0;
        document.getElementById("stat-pct").textContent = pct + "%";

        const container = document.getElementById("records-container");
        document.getElementById("record-count").textContent = `${data.records.length} record${data.records.length !== 1 ? 's' : ''}`;

        if (!data.records.length) {
            container.innerHTML = `
                <div style="padding:60px 20px; text-align:center;">
                    <div style="width:64px; height:64px; border-radius:16px; background:var(--gray-100); margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
                        <i data-lucide="inbox" style="width:32px; height:32px; color:var(--gray-400);"></i>
                    </div>
                    <p style="font-size:15px; font-weight:600; color:var(--gray-800); margin-bottom:4px;">No attendance records yet</p>
                    <p style="font-size:13px; color:var(--gray-500); margin-bottom:20px;">Start marking your attendance from the dashboard</p>
                    <a href="/dashboard" class="btn btn-primary">
                        <i data-lucide="layout-dashboard"></i>
                        Go to Dashboard
                    </a>
                </div>`;
            lucide.createIcons();
            return;
        }

        container.innerHTML = data.records.map(renderRecord).join("");
        lucide.createIcons();

        // Wire up row clicks
        document.querySelectorAll(".record-row").forEach(row => {
            row.addEventListener("mouseenter", () => row.style.background = "var(--gray-50)");
            row.addEventListener("mouseleave", () => row.style.background = "transparent");
            row.addEventListener("click", () => {
                const record = JSON.parse(decodeURIComponent(row.dataset.record));
                showDetail(record);
            });
        });
    } catch (err) {
        console.error("History load error:", err);
        document.getElementById("records-container").innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--danger-600);">
                <i data-lucide="alert-triangle" style="width:32px; height:32px; margin:0 auto 8px;"></i>
                <p style="font-weight:600;">Failed to load history</p>
                <p style="font-size:12px; color:var(--gray-500); margin-top:4px;">${err.message}</p>
            </div>`;
        lucide.createIcons();
        showToast(err.message, "error");
    }
}

// ---- Detail Modal ----
function showDetail(record) {
    document.getElementById("modal-title").textContent = formatDate(record.date);
    document.getElementById("modal-subtitle").innerHTML = statusBadge(record.status) + (record.is_auto_logout ? ' <span style="font-size:11px; color:var(--warning-600); margin-left:6px;">• Auto-logged out at 11:59 PM</span>' : '');

    const loginSelfie = record.login_selfie_path ? `${CONFIG.UPLOADS_URL}/${record.login_selfie_path}` : null;
    const logoutSelfie = record.logout_selfie_path ? `${CONFIG.UPLOADS_URL}/${record.logout_selfie_path}` : null;

    const loginLoc = record.login_address || `${record.login_latitude?.toFixed(5)}, ${record.login_longitude?.toFixed(5)}`;
    const logoutLoc = record.logout_address || (record.logout_latitude ? `${record.logout_latitude.toFixed(5)}, ${record.logout_longitude.toFixed(5)}` : '');

    document.getElementById("modal-body").innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px;">
            <!-- Login -->
            <div style="background:var(--success-50); border:1px solid #a7f3d0; border-radius:12px; overflow:hidden;">
                <div style="padding:14px;">
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                        <i data-lucide="log-in" style="width:14px; height:14px; color:var(--success-600);"></i>
                        <span style="font-size:11px; font-weight:600; color:var(--success-600); text-transform:uppercase; letter-spacing:0.05em;">Login</span>
                    </div>
                    <div style="font-size:22px; font-weight:700; color:var(--success-600); letter-spacing:-0.01em;">${formatTime(record.login_time)}</div>
                    <div style="font-size:11px; color:var(--gray-600); margin-top:6px; display:flex; align-items:flex-start; gap:4px;">
                        <i data-lucide="map-pin" style="width:12px; height:12px; margin-top:2px; flex-shrink:0;"></i>
                        <span style="line-height:1.4;">${loginLoc}</span>
                    </div>
                </div>
                ${loginSelfie ? `<img src="${loginSelfie}" style="width:100%; display:block; border-top:1px solid #a7f3d0;" onerror="this.style.display='none'">` : ''}
            </div>

            <!-- Logout -->
            <div style="background:${record.logout_time ? 'var(--danger-50)' : 'var(--gray-50)'}; border:1px solid ${record.logout_time ? '#fecaca' : 'var(--gray-200)'}; border-radius:12px; overflow:hidden;">
                <div style="padding:14px;">
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
                        <i data-lucide="log-out" style="width:14px; height:14px; color:${record.logout_time ? 'var(--danger-600)' : 'var(--gray-400)'};"></i>
                        <span style="font-size:11px; font-weight:600; color:${record.logout_time ? 'var(--danger-600)' : 'var(--gray-400)'}; text-transform:uppercase; letter-spacing:0.05em;">Logout</span>
                    </div>
                    <div style="font-size:22px; font-weight:700; color:${record.logout_time ? 'var(--danger-600)' : 'var(--gray-400)'}; letter-spacing:-0.01em;">${formatTime(record.logout_time)}</div>
                    ${record.logout_time ? `
                        <div style="font-size:11px; color:var(--gray-600); margin-top:6px; display:flex; align-items:flex-start; gap:4px;">
                            <i data-lucide="map-pin" style="width:12px; height:12px; margin-top:2px; flex-shrink:0;"></i>
                            <span style="line-height:1.4;">${logoutLoc}</span>
                        </div>` : '<div style="font-size:11px; color:var(--gray-400); margin-top:6px;">Not logged out</div>'}
                </div>
                ${logoutSelfie ? `<img src="${logoutSelfie}" style="width:100%; display:block; border-top:1px solid #fecaca;" onerror="this.style.display='none'">` : ''}
            </div>
        </div>

        <div style="background:var(--brand-50); border:1px solid var(--brand-100); border-radius:12px; padding:14px; display:flex; align-items:center; gap:12px;">
            <div style="width:36px; height:36px; border-radius:10px; background:var(--brand-500); display:flex; align-items:center; justify-content:center;">
                <i data-lucide="hourglass" style="width:18px; height:18px; color:white;"></i>
            </div>
            <div>
                <div style="font-size:11px; font-weight:600; color:var(--brand-600); text-transform:uppercase; letter-spacing:0.05em;">Total Duration</div>
                <div style="font-size:18px; font-weight:700; color:var(--brand-700); margin-top:2px;">${calcDuration(record.login_time, record.logout_time)}</div>
            </div>
        </div>
    `;
    document.getElementById("detail-modal").style.display = "flex";
    lucide.createIcons();
}

document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("detail-modal").style.display = "none";
});
document.getElementById("detail-modal").addEventListener("click", (e) => {
    if (e.target.id === "detail-modal") document.getElementById("detail-modal").style.display = "none";
});

// ---- Init ----
loadHistory();