
if (getToken()) {
    const user = getUser();
    if (user && user.is_verified) {
        window.location.href = "/dashboard";
    } else {
        window.location.href = "/reference-face";
    }
}
 
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");

function switchTab(mode) {
    if (mode === "login") {
        tabLogin.classList.add("active");
        tabSignup.classList.remove("active");
        loginForm.style.display = "";
        signupForm.style.display = "none";
        formTitle.textContent = "Welcome back";
        formSubtitle.textContent = "Sign in to continue to your dashboard";
    } else {
        tabSignup.classList.add("active");
        tabLogin.classList.remove("active");
        signupForm.style.display = "";
        loginForm.style.display = "none";
        formTitle.textContent = "Get started";
        formSubtitle.textContent = "Create your Attendify account in seconds";
    }
    lucide.createIcons();
}

tabLogin.addEventListener("click", () => switchTab("login"));
tabSignup.addEventListener("click", () => switchTab("signup"));

// ---- LOGIN ----
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnText = document.getElementById("login-btn-text");
    const originalText = btnText.textContent;
    btnText.textContent = "Signing in...";

    const formData = new FormData(loginForm);
    try {
        const data = await apiCall("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: formData.get("email"),
                password: formData.get("password"),
            }),
        });
        saveAuth(data.access_token, data.user);
        showToast("Welcome back! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = data.user.is_verified ? "/dashboard" : "/reference-face";
        }, 700);
    } catch (err) {
        showToast(err.message || "Invalid credentials", "error");
        btnText.textContent = originalText;
    }
});

// ---- SIGNUP ----
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnText = document.getElementById("signup-btn-text");
    const originalText = btnText.textContent;
    btnText.textContent = "Creating account...";

    const formData = new FormData(signupForm);
    try {
        const data = await apiCall("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                full_name: formData.get("full_name"),
                email: formData.get("email"),
                password: formData.get("password"),
            }),
        });
        saveAuth(data.access_token, data.user);
        showToast("Account created! Let's set up face verification.", "success");
        setTimeout(() => (window.location.href = "/reference-face"), 900);
    } catch (err) {
        showToast(err.message || "Signup failed", "error");
        btnText.textContent = originalText;
    }
});