document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("register-form");
    const JSON_USERS_PATH = './json/users.json'; // Path to your users data

    // --- Helper: Fetch Existing Users ---
    async function fetchUsers() {
        try {
            const response = await fetch(JSON_USERS_PATH);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn("users.json not found. Starting with an empty user list for checks.");
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Could not fetch users.json:", error);

            return [];
        }
    }

    // --- Helper: Generate Unique User ID (Simple version for simulation) ---
    function generateUserId(existingUsers) {
        let newIdNum = 1;
        if (existingUsers && existingUsers.length > 0) {
            const maxIdNum = existingUsers.reduce((max, user) => {
                const numPart = parseInt(user.user_id.replace(/[^0-9]/g, ''), 10);
                return numPart > max ? numPart : max;
            }, 0);
            newIdNum = maxIdNum + 1;
        }
        return `user${String(newIdNum).padStart(3, '0')}`;
    }


    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("Register form submitted.");

        // Ambil nilai input
        const namaInput = document.getElementById("nama-lengkap");
        const usiaInput = document.getElementById("usia");
        const genderRadio = document.querySelector('input[name="gender"]:checked');
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const konfirmasiPasswordInput = document.getElementById("konfirmasi-password");
        const termsCheckbox = document.getElementById("terms");

        const nama = namaInput ? namaInput.value.trim() : "";
        const usia = usiaInput ? parseInt(usiaInput.value.trim()) : NaN;
        const gender = genderRadio ? genderRadio.value : null;
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const konfirmasiPassword = konfirmasiPasswordInput ? konfirmasiPasswordInput.value : "";
        const termsChecked = termsCheckbox ? termsCheckbox.checked : false;

        // Validasi
        if (!nama || isNaN(usia) || !gender || !email || !password || !konfirmasiPassword) {
            console.warn("Validation failed: All fields required.");
            showPopup("Semua kolom wajib diisi.", false);
            return;
        }

        if (usia < 17 || usia > 100) {
            console.warn("Validation failed: Age out of range.");
            showPopup("Usia harus antara 17 sampai 100 tahun.", false);
            return;
        }

        if (!validateEmail(email)) {
            console.warn("Validation failed: Invalid email format.");
            showPopup("Email tidak valid.", false);
            return;
        }

        // Fetch existing users to check for email uniqueness
        const existingUsers = await fetchUsers();
        if (existingUsers.find(user => user.email === email)) {
            console.warn("Validation failed: Email already exists.");
            showPopup("Email ini sudah terdaftar. Silakan gunakan email lain.", false);
            return;
        }

        if (password.length < 6) {
            console.warn("Validation failed: Password too short.");
            showPopup("Kata sandi harus minimal 6 karakter.", false);
            return;
        }

        if (password !== konfirmasiPassword) {
            console.warn("Validation failed: Passwords do not match.");
            showPopup("Konfirmasi kata sandi tidak cocok.", false);
            return;
        }

        if (!termsChecked) {
            console.warn("Validation failed: Terms not agreed.");
            showPopup("Anda harus menyetujui syarat dan ketentuan.", false);
            return;
        }

        console.log("All client-side validations passed.");

        const newUserId = generateUserId(existingUsers);
        const newUserForDb = {
            user_id: newUserId,
            name: nama,
            email: email,
            password_hash: `simulated_hash_for_${password}`,
            age: usia,
            gender: gender,
            image_url: "assets/user/default_profile_nav.png"
        };

        console.log("New user data that WOULD be added to users.json:", newUserForDb);


        const userForLocalStorage = {
            user_id: newUserId,
            nama: nama,
            email: email,
            password: password,
        };
        localStorage.setItem("registeredUser", JSON.stringify(userForLocalStorage));
        console.log("User data saved to localStorage for potential login prefill:", userForLocalStorage);


        // Jika semua valid
        showPopup("Akun Anda berhasil dibuat!", true, "Mengalihkan ke halaman login...", true);
        setTimeout(() => {
            console.log("Redirecting to login.html");
            window.location.href = "login.html";
        }, 3000);
    });
});

// Validasi email
function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}
