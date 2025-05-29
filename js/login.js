document.addEventListener("DOMContentLoaded", () => {
    // --- Konstanta Global ---
    const JSON_USERS_PATH = './json/users.json';

    // --- Seleksi Elemen DOM & Inisialisasi Awal ---
    const form = document.getElementById("login-form");
    const emailField = document.getElementById("email");
    const rememberMeCheckbox = document.getElementById("remember");

    // --- Fungsi Utilitas Pengambilan Data Pengguna ---
    async function fetchUsers() {
        try {
            const response = await fetch(JSON_USERS_PATH);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Tidak dapat mengambil users.json untuk login:", error);
            showPopup("Tidak dapat mengambil data pengguna. Silakan coba lagi nanti.", false);
            return null;
        }
    }

    // --- Logika Pengisian Email (Jika Diingat) ---
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail && emailField) {
        emailField.value = rememberedEmail;
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }

    // --- Logika Submit Form Login ---
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Form login dikirim.");

            // Pengambilan Nilai dari Form
            const emailInputEl = document.getElementById("email");
            const passwordInputEl = document.getElementById("password");
            const rememberMeChecked = rememberMeCheckbox ? rememberMeCheckbox.checked : false;

            const emailInput = emailInputEl ? emailInputEl.value.trim() : "";
            const passwordInput = passwordInputEl ? passwordInputEl.value : "";

            // Validasi Input Awal
            if (!emailInput || !passwordInput) {
                showPopup("Mohon isi semua field (Email dan Kata Sandi)!", false);
                return;
            }

            // Proses Autentikasi Pengguna
            const allUsers = await fetchUsers();

            if (!allUsers) {
                return;
            }

            const foundUser = allUsers.find(user => user.email === emailInput);

            if (foundUser) {
                // Pencocokan Pengguna dan Kata Sandi (Simulasi)
                if (passwordInput === foundUser.password) {
                    // Penanganan Login Berhasil
                    console.log("Login berhasil untuk:", foundUser.name);
                    showPopup(`Selamat datang kembali, ${foundUser.name}! Anda berhasil login.`, true, "Mengalihkan ke dasbor...", true);

                    const loggedInUserData = {
                        user_id: foundUser.user_id,
                        name: foundUser.name,
                        email: foundUser.email,
                        image_url: foundUser.image_url
                    };
                    localStorage.setItem("loggedInUser", JSON.stringify(loggedInUserData));

                    if (rememberMeChecked) {
                        localStorage.setItem("rememberedEmail", emailInput);
                    } else {
                        localStorage.removeItem("rememberedEmail");
                    }
                    localStorage.removeItem("registeredUser");

                    setTimeout(() => {
                        const urlParams = new URLSearchParams(window.location.search);
                        const redirectUrl = urlParams.get('redirect');
                        if (redirectUrl) {
                            window.location.href = decodeURIComponent(redirectUrl);
                        } else {
                            window.location.href = "dashboard.html";
                        }
                    }, 2000);

                } else {
                    // Penanganan Login Gagal (Password Salah)
                    console.warn("Login gagal: Kata sandi salah untuk email:", emailInput);
                    showPopup("Email atau kata sandi salah.", false);
                }
            } else {
                // Penanganan Login Gagal (Email Tidak Ditemukan)
                console.warn("Login gagal: Email tidak ditemukan:", emailInput);
                const recentlyRegisteredUserJSON = localStorage.getItem("registeredUser");

                if (recentlyRegisteredUserJSON) {
                    const recentlyRegisteredUser = JSON.parse(recentlyRegisteredUserJSON);
                    // Pengecekan Pengguna yang Baru Terdaftar (dari localStorage)
                    if (recentlyRegisteredUser && emailInput === recentlyRegisteredUser.email && passwordInput === recentlyRegisteredUser.password) {
                        console.log("Login berhasil untuk pengguna yang baru terdaftar (dari localStorage):", recentlyRegisteredUser.nama);
                        showPopup(`Selamat datang, ${recentlyRegisteredUser.nama}! Anda berhasil login.`, true, "Mengalihkan ke dasbor...", true);

                        const loggedInUserData = {
                            user_id: recentlyRegisteredUser.user_id || `temp_${Date.now()}`,
                            name: recentlyRegisteredUser.nama,
                            email: recentlyRegisteredUser.email,
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
                } else {
                    showPopup("Email tidak ditemukan.", false);
                }
            }
        });
    } else {
        // Penanganan jika Form Login Tidak Ditemukan
        console.error("Form login dengan ID 'login-form' tidak ditemukan.");
    }
});