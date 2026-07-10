/**
 * Settings page: change password, profile info
 */

if (!requireVerified()) { throw new Error("Redirecting..."); }

const user = getUser();

// Inject sidebar + topbar
document.getElementById("sidebar-container").innerHTML = renderSidebar("settings");
document.getElementById("topbar-container").innerHTML = renderTopbar("Settings");

// Populate profile card (BEFORE lucide.createIcons)
function loadProfile() {
    const nameEl = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");
    const avatarEl = document.getElementById("profile-avatar");
    const statusEl = document.getElementById("profile-status");

    if (nameEl) nameEl.textContent = user.full_name || "User";
    if (emailEl) emailEl.textContent = user.email || "—";
    if (avatarEl) avatarEl.textContent = getInitials(user.full_name);

    if (statusEl) {
        if (user.is_verified) {
            statusEl.innerHTML = `
                <span class="badge badge-success">
                    <i data-lucide="shield-check" style="width:12px; height:12px;"></i>
                    Verified
                </span>
            `;
        } else {
            statusEl.innerHTML = `
                <span class="badge badge-warning">
                    <i data-lucide="alert-circle" style="width:12px; height:12px;"></i>
                    Not Verified
                </span>
            `;
        }
    }
}

// Load profile FIRST
loadProfile();

// Then init layout + icons
initLayout();
if (window.lucide) lucide.createIcons();

// Change password form handler
const passwordForm = document.getElementById("password-form");
if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const btnText = document.getElementById("submit-btn-text");
        const submitBtn = form.querySelector('button[type="submit"]');

        const currentPassword = form.current_password.value;
        const newPassword = form.new_password.value;
        const confirmPassword = form.confirm_password.value;

        // Client-side validation
        if (newPassword !== confirmPassword) {
            showToast("New password and confirm password do not match", "error");
            return;
        }
        if (newPassword.length < 6) {
            showToast("New password must be at least 6 characters", "error");
            return;
        }
        if (currentPassword === newPassword) {
            showToast("New password must be different from current password", "error");
            return;
        }

        btnText.textContent = "Updating...";
        submitBtn.disabled = true;

        try {
            await apiCall("/auth/change-password", {
                method: "POST",
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
            showToast("Password changed successfully!", "success");
            form.reset();
        } catch (err) {
            showToast(err.message || "Failed to change password", "error");
        } finally {
            btnText.textContent = "Update Password";
            submitBtn.disabled = false;
        }
    });
}