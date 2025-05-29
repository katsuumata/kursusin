document.addEventListener("DOMContentLoaded", function () {
    // --- Konfigurasi Awal dan Elemen DOM ---
    const form = document.getElementById("register-form");
    const JSON_USERS_PATH = './json/users.json';

    // --- Fungsi Pembantu: Mengambil Data Pengguna yang Ada ---
    async function fetchUsers() {
        try {
            const response = await fetch(JSON_USERS_PATH);
            if (!response.ok) {
                // Menangani kasus jika users.json tidak ditemukan
                if (response.status === 404) {
                    return [];
                }
                throw new Error(`Terjadi kesalahan HTTP! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            // Menangani kesalahan saat mengambil data pengguna
            return [];
        }
    }

    // --- Fungsi Pembantu: Membuat ID Pengguna Unik ---
    function generateUserId(existingUsers) {
        let newIdNum = 1;
        if (existingUsers && existingUsers.length > 0) {
            // Mencari ID numerik tertinggi dari pengguna yang sudah ada
            const maxIdNum = existingUsers.reduce((max, user) => {
                const numPart = parseInt(user.user_id.replace(/[^0-9]/g, ''), 10);
                return numPart > max ? numPart : max;
            }, 0);
            newIdNum = maxIdNum + 1;
        }
        // Mengembalikan ID pengguna baru dengan format yang konsisten
        return `user${String(newIdNum).padStart(3, '0')}`;
    }

    // --- Fungsi Validasi Email Kustom ---
    function validateEmail(email) {
        // Memastikan email tidak kosong
        if (email.length === 0) {
            return { valid: false, message: "Email tidak boleh kosong." };
        }

        // Memeriksa keberadaan '@'
        const atIndex = email.indexOf('@');
        if (atIndex === -1) {
            return { valid: false, message: "Email harus mengandung karakter '@'." };
        }

        // Memeriksa keberadaan '.' setelah '@'
        const dotIndex = email.indexOf('.', atIndex);
        if (dotIndex === -1) {
            return { valid: false, message: "Email tidak valid. Contoh: nama@domain.com" };
        }

        // Memastikan ada karakter sebelum '@', di antara '@' dan '.', dan setelah '.'
        if (atIndex === 0 || dotIndex === atIndex + 1 || dotIndex === email.length - 1) {
            return { valid: false, message: "Format email tidak valid. Periksa penulisan karakter." };
        }

        // Memastikan tidak ada spasi
        if (email.includes(' ')) {
            return { valid: false, message: "Email tidak boleh mengandung spasi." };
        }

        // Validasi domain
        const domain = email.substring(atIndex);
        const allowedDomains = ["@gmail.com", "@ymail.com", "@yahoo.com", "@binus.ac.id"];
        if (!allowedDomains.includes(domain)) {
            return { valid: false, message: "Domain email tidak diizinkan. Gunakan @gmail.com, @ymail.com, @yahoo.com, atau @binus.ac.id." };
        }

        return { valid: true, message: "" };
    }

    // --- Penanganan Pengiriman Formulir Pendaftaran ---
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Mengambil nilai dari input formulir
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

        // --- Proses Validasi Input ---
        if (!nama || isNaN(usia) || !gender || !email || !password || !konfirmasiPassword) {
            showPopup("Semua kolom wajib diisi.", false);
            return;
        }

        if (usia < 17 || usia > 100) {
            showPopup("Usia harus antara 17 sampai 100 tahun.", false);
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            showPopup(emailValidation.message, false);
            return;
        }

        // Mengambil pengguna yang sudah ada untuk memeriksa keunikan email
        const existingUsers = await fetchUsers();
        if (existingUsers.find(user => user.email === email)) {
            showPopup("Email ini sudah terdaftar. Silakan gunakan email lain.", false);
            return;
        }

        if (password.length < 6) {
            showPopup("Kata sandi harus minimal 6 karakter.", false);
            return;
        }

        if (password !== konfirmasiPassword) {
            showPopup("Konfirmasi kata sandi tidak cocok.", false);
            return;
        }

        if (!termsChecked) {
            showPopup("Anda harus menyetujui syarat dan ketentuan.", false);
            return;
        }

        // --- Pembuatan Data Pengguna Baru (Simulasi) ---
        const newUserId = generateUserId(existingUsers);
        const newUserForDb = {
            user_id: newUserId,
            name: nama,
            email: email,
            password_hash: `simulasi_hash_untuk_${password}`, // Simulasi hash kata sandi
            age: usia,
            gender: gender,
            image_url: "assets/user/default_profile_nav.png"
        };

        // Data pengguna yang disimpan di localStorage untuk kemudahan login
        const userForLocalStorage = {
            user_id: newUserId,
            nama: nama,
            email: email,
            password: password,
        };
        localStorage.setItem("registeredUser", JSON.stringify(userForLocalStorage));

        // --- Notifikasi dan Pengalihan Halaman ---
        showPopup("Akun Anda berhasil dibuat!", true, "Mengalihkan ke halaman login...", true);
        setTimeout(() => {
            window.location.href = "login.html";
        }, 3000);
    });
});