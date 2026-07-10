/**
 * Salary page: monthly salary breakdown with deductions
 */

if (!requireVerified()) { throw new Error("Redirecting..."); }

const user = getUser();

// Inject sidebar + topbar
document.getElementById("sidebar-container").innerHTML = renderSidebar("salary");
document.getElementById("topbar-container").innerHTML = renderTopbar("Salary");
initLayout();
lucide.createIcons();

// ---------- Populate Month Selector ----------
function populateMonthSelector() {
    const select = document.getElementById("month-select");
    const now = new Date();
    const options = [];

    // Show last 12 months
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
        options.push(`<option value="${year}-${month}">${label}</option>`);
    }
    select.innerHTML = options.join("");

    select.addEventListener("change", () => {
        const [year, month] = select.value.split("-");
        loadSalary(parseInt(month), parseInt(year));
    });
}

// ---------- Currency Formatter ----------
function formatCurrency(amount, currency = "₹") {
    return `${currency}${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ---------- Load Salary Data ----------
async function loadSalary(month, year) {
    try {
        const params = (month && year) ? `?month=${month}&year=${year}` : "";
        const data = await apiCall(`/attendance/salary${params}`);
        renderSalaryCard(data);
        renderDailyBreakdown(data);
    } catch (err) {
        console.error("Salary load error:", err);
        document.getElementById("salary-card").innerHTML = `
            <div class="card-body">
                <div style="text-align:center; padding:24px; color:var(--danger-600);">
                    <i data-lucide="alert-triangle" style="width:40px; height:40px; margin:0 auto 8px;"></i>
                    <p style="font-weight:600;">Failed to load salary data</p>
                    <p style="font-size:12px; color:var(--gray-500); margin-top:4px;">${err.message}</p>
                </div>
            </div>`;
        lucide.createIcons();
        showToast(err.message, "error");
    }
}

// ---------- Render Salary Card ----------
function renderSalaryCard(data) {
    const card = document.getElementById("salary-card");
    const cur = data.currency;
    const deductionPct = data.monthly_salary > 0
        ? ((data.deductions.total_deduction / data.monthly_salary) * 100).toFixed(1)
        : 0;

    card.innerHTML = `
        <div class="card-body" style="padding: 0;">

            <!-- Top: Month + Salary Overview -->
            <div style="padding:24px; background:linear-gradient(135deg, var(--brand-500), var(--accent-500)); color:white; border-radius:14px 14px 0 0;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:20px;">
                    <div>
                        <div style="font-size:12px; text-transform:uppercase; opacity:0.85; letter-spacing:0.05em; font-weight:600;">
                            ${data.month_name}
                        </div>
                        <div style="font-size:14px; opacity:0.9; margin-top:4px;">
                            Base Salary
                        </div>
                        <div style="font-size:36px; font-weight:800; letter-spacing:-0.02em; margin-top:2px;">
                            ${formatCurrency(data.monthly_salary, cur)}
                        </div>
                        <div style="font-size:12px; opacity:0.85; margin-top:6px;">
                            ${formatCurrency(data.per_day_salary, cur)} per day × ${data.working_days_in_month} working days
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px; text-transform:uppercase; opacity:0.85; letter-spacing:0.05em; font-weight:600;">
                            Attendance Rate
                        </div>
                        <div style="font-size:42px; font-weight:800; letter-spacing:-0.02em; margin-top:2px;">
                            ${data.summary.attendance_rate}%
                        </div>
                        <div style="font-size:12px; opacity:0.85;">
                            ${data.summary.full_days} full · ${data.summary.half_days} half · ${data.summary.leaves} leaves
                        </div>
                    </div>
                </div>
            </div>

            <!-- Middle: Deductions Breakdown -->
            <div style="padding:24px;">
                <h3 style="font-size:14px; font-weight:600; color:var(--gray-500); text-transform:uppercase; letter-spacing:0.05em; margin:0 0 16px 0;">
                    <i data-lucide="minus-circle" style="width:14px; height:14px; display:inline;"></i>
                    Deductions
                </h3>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">

                    <!-- Leave Deduction -->
                    <div style="background:var(--danger-50); border:1px solid #fecaca; border-radius:12px; padding:16px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <i data-lucide="user-x" style="width:14px; height:14px; color:var(--danger-600);"></i>
                            <span style="font-size:11px; font-weight:600; color:var(--danger-600); text-transform:uppercase; letter-spacing:0.05em;">Leaves</span>
                        </div>
                        <div style="font-size:22px; font-weight:700; color:var(--danger-600); letter-spacing:-0.01em;">
                            − ${formatCurrency(data.deductions.leave_deduction, cur)}
                        </div>
                        <div style="font-size:11px; color:var(--gray-600); margin-top:4px;">
                            ${data.summary.leaves} day(s) × ${formatCurrency(data.per_day_salary, cur)}
                        </div>
                    </div>

                    <!-- Half Day Deduction -->
                    <div style="background:var(--warning-50); border:1px solid #fde68a; border-radius:12px; padding:16px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <i data-lucide="clock-alert" style="width:14px; height:14px; color:var(--warning-600);"></i>
                            <span style="font-size:11px; font-weight:600; color:var(--warning-600); text-transform:uppercase; letter-spacing:0.05em;">Half Days</span>
                        </div>
                        <div style="font-size:22px; font-weight:700; color:var(--warning-600); letter-spacing:-0.01em;">
                            − ${formatCurrency(data.deductions.half_day_deduction, cur)}
                        </div>
                        <div style="font-size:11px; color:var(--gray-600); margin-top:4px;">
                            ${data.summary.half_days} day(s) × ${formatCurrency(data.per_day_salary / 2, cur)}
                        </div>
                    </div>

                    <!-- Total Deduction -->
                    <div style="background:#fef2f2; border:2px solid var(--danger-500); border-radius:12px; padding:16px;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <i data-lucide="trending-down" style="width:14px; height:14px; color:var(--danger-600);"></i>
                            <span style="font-size:11px; font-weight:700; color:var(--danger-600); text-transform:uppercase; letter-spacing:0.05em;">Total Deducted</span>
                        </div>
                        <div style="font-size:26px; font-weight:800; color:var(--danger-600); letter-spacing:-0.02em;">
                            − ${formatCurrency(data.deductions.total_deduction, cur)}
                        </div>
                        <div style="font-size:11px; color:var(--gray-600); margin-top:4px;">
                            ${deductionPct}% of base salary
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom: Final Salary -->
            <div style="padding:20px 24px; background:var(--success-50); border-top:1px solid #a7f3d0; border-radius:0 0 14px 14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
                <div>
                    <div style="font-size:12px; text-transform:uppercase; color:var(--success-600); font-weight:700; letter-spacing:0.05em;">
                        <i data-lucide="wallet" style="width:14px; height:14px; display:inline;"></i>
                        Net Payable Salary
                    </div>
                    <div style="font-size:11px; color:var(--gray-600); margin-top:2px;">
                        After all deductions
                    </div>
                </div>
                <div style="font-size:32px; font-weight:800; color:var(--success-600); letter-spacing:-0.02em;">
                    ${formatCurrency(data.final_salary, cur)}
                </div>
            </div>

        </div>
    `;
    lucide.createIcons();
}

// ---------- Render Daily Breakdown ----------
function renderDailyBreakdown(data) {
    const container = document.getElementById("breakdown-container");
    const cur = data.currency;

    // Filter — only show relevant days (past + today)
    const relevantDays = data.daily_breakdown.filter(d => !d.is_future);

    document.getElementById("record-count").textContent = `${relevantDays.length} day(s)`;

    if (!relevantDays.length) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:var(--gray-400);">
                <i data-lucide="inbox" style="width:36px; height:36px; margin-bottom:8px;"></i>
                <p>No data for this month yet</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    const statusConfig = {
        full_day: { dot: "dot-full",   label: "Full Day",   cls: "badge-success" },
        half_day: { dot: "dot-half",   label: "Half Day",   cls: "badge-warning" },
        active:   { dot: "dot-active", label: "Active",     cls: "badge-info" },
        leave:    { dot: "dot-leave",  label: "Leave",      cls: "badge-danger" },
        weekend:  { dot: "",           label: "Weekend",    cls: "badge-gray" },
    };

    const rows = relevantDays.map(d => {
        const cfg = statusConfig[d.status] || statusConfig.weekend;
        const dateObj = new Date(d.date);
        const dateStr = dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

        // Weekend row (different style)
        if (d.status === "weekend") {
            return `
            <div style="padding:12px 22px; display:flex; align-items:center; gap:14px; border-bottom:1px solid var(--gray-100); background:var(--gray-50); opacity:0.7;">
                <div style="width:12px;"></div>
                <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:500; color:var(--gray-600); font-size:13px;">${dateStr}</span>
                        <span style="font-size:11px; color:var(--gray-500);">${d.day_name}</span>
                        <span class="badge badge-gray">Weekend</span>
                    </div>
                </div>
                <div style="font-size:12px; color:var(--gray-400);">No deduction</div>
            </div>`;
        }

        // Normal day
        const deductionText = d.deduction > 0
            ? `<span style="color:var(--danger-600); font-weight:700; font-size:14px;">− ${formatCurrency(d.deduction, cur)}</span>`
            : `<span style="color:var(--success-600); font-weight:600; font-size:12px;">✓ Paid</span>`;

        return `
        <div style="padding:12px 22px; display:flex; align-items:center; gap:14px; border-bottom:1px solid var(--gray-100);">
            <span class="status-dot ${cfg.dot}"></span>
            <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span style="font-weight:600; color:var(--gray-900); font-size:14px;">${dateStr}</span>
                    <span style="font-size:11px; color:var(--gray-500);">${d.day_name}</span>
                    <span class="badge ${cfg.cls}">${cfg.label}</span>
                </div>
            </div>
            <div>${deductionText}</div>
        </div>`;
    }).join("");

    container.innerHTML = rows;
    lucide.createIcons();
}

// ---------- Init ----------
populateMonthSelector();
loadSalary();  // Load current month by default