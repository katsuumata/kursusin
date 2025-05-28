document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form"); // Updated ID
    const JSON_USERS_PATH = './json/users.json';

    // --- Helper: Fetch Users ---
    async function fetchUsers() {
        try {
            const response = await fetch(JSON_USERS_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Could not fetch users.json for login:", error);
            showPopup("Tidak dapat mengambil data pengguna. Silakan coba lagi nanti.", false);
            return null; // Indicate failure to fetch
        }
    }

    // --- Pre-fill email if remembered ---
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const emailField = document.getElementById("email");
    const rememberMeCheckbox = document.getElementById("remember");

    if (rememberedEmail && emailField) {
        emailField.value = rememberedEmail;
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }

    // --- Form Submit Logic ---
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Login form submitted.");

            const emailInputEl = document.getElementById("email");
            const passwordInputEl = document.getElementById("password");
            const rememberMeChecked = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

            const emailInput = emailInputEl ? emailInputEl.value.trim() : "";
            const passwordInput = passwordInputEl ? passwordInputEl.value : "";

            if (!emailInput || !passwordInput) {
                showPopup("Mohon isi semua field (Email dan Kata Sandi)!", false);
                return;
            }

            // Fetch all users from users.json
            const allUsers = await fetchUsers();

            if (!allUsers) {
                // Error already shown by fetchUsers
                return;
            }

            const foundUser = allUsers.find(user => user.email === emailInput);

            if (foundUser) {
                // SIMULATION: In a real app, the backend would compare the hashed input password 
                // with the stored password_hash. Here, we compare with the plain 'password' field
                // from users.json for simulation purposes.
                if (passwordInput === foundUser.password) { // Using the plain 'password' field
                    console.log("Login successful for:", foundUser.name);
                    showPopup(`Selamat datang kembali, ${foundUser.name}! Anda berhasil login.`, true, "Mengalihkan ke dasbor...", true);

                    // Store logged-in user information (excluding password)
                    const loggedInUserData = {
                        user_id: foundUser.user_id,
                        name: foundUser.name,
                        email: foundUser.email,
                        image_url: foundUser.image_url
                        // Add other non-sensitive data if needed by other pages
                    };
                    localStorage.setItem("loggedInUser", JSON.stringify(loggedInUserData));

                    if (rememberMeChecked) {
                        localStorage.setItem("rememberedEmail", emailInput);
                    } else {
                        localStorage.removeItem("rememberedEmail");
                    }

                    // Clear any temporarily stored registeredUser from registration flow
                    localStorage.removeItem("registeredUser");

                    setTimeout(() => {
                        // Check for redirect URL from query params (e.g., after trying to access a protected page)
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirectUrl = urlParams.get('redirect');
                        if (redirectUrl) {
                            window.location.href = decodeURIComponent(redirectUrl);
                        } else {
                            window.location.href = "dashboard.html";
                        }
                    }, 2000);

                } else {
                    console.warn("Login failed: Incorrect password for email:", emailInput);
                    showPopup("Email atau kata sandi salah.", false);
                }
            } else {
                console.warn("Login failed: Email not found:", emailInput);
                // Check if this email was the one just registered and stored in localStorage
                const recentlyRegisteredUser = JSON.parse(localStorage.getItem("registeredUser"));
                if (recentlyRegisteredUser && emailInput === recentlyRegisteredUser.email && passwordInput === recentlyRegisteredUser.password) {
                    // This case handles if users.json hasn't "updated" yet in our simulation
                    // but the user just registered.
                    console.log("Login successful for recently registered user (from localStorage):", recentlyRegisteredUser.nama);
                    showPopup(`Selamat datang, ${recentlyRegisteredUser.nama}! Anda berhasil login.`, true, "Mengalihkan ke dasbor...", true);

                    const loggedInUserData = {
                        user_id: recentlyRegisteredUser.user_id || `temp_${Date.now()}`, // Use ID if available
                        name: recentlyRegisteredUser.nama,
                        email: recentlyRegisteredUser.email,
                        // image_url might not be in registeredUser from localStorage, add a default
                        image_url: "assets/user/default_profile_nav.png"
                    };
                    localStorage.setItem("loggedInUser", JSON.stringify(loggedInUserData));

                    if (rememberMeChecked) {
                        localStorage.setItem("rememberedEmail", emailInput);
                    } else {
                        localStorage.removeItem("rememberedEmail");
                    }
                    localStorage.removeItem("registeredUser");

                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 2000);
                } else {
                    showPopup("Email atau kata sandi salah, atau akun tidak ditemukan.", false);
                }
            }
        });
    } else {
        console.error("Login form with ID 'login-form' not found.");
    }
});
