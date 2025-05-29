// Function to go back in history, using showPopup if available
function kembali() {
    if (typeof showPopup === 'function') {
        showPopup("Anda akan kembali ke halaman sebelumnya...", true, "Mengalihkan...", true);
        setTimeout(() => {
            window.history.back();
        }, 1500);
    } else {
        window.history.back();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Mendapatkan data keranjang dan informasi pengguna dari localStorage
    const storedCart = localStorage.getItem('selectedCart');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    // --- Proses Inisialisasi dan Validasi Keranjang ---
    if (storedCart) {
        try {
            const cartData = JSON.parse(storedCart);

            // Memvalidasi kelengkapan data keranjang
            if (cartData && typeof cartData.price === 'number' && typeof cartData.total === 'number' && cartData.id) {

                // Mengisi detail ringkasan pesanan
                const planNameEl = document.getElementById('checkout-plan-name');
                const planPriceEl = document.getElementById('checkout-plan-price');
                const totalPriceEl = document.getElementById('checkout-total-price');

                if (planNameEl) planNameEl.textContent = cartData.name || 'Nama Paket Tidak Tersedia';
                if (planPriceEl) planPriceEl.textContent = formatCurrency(cartData.price);
                if (totalPriceEl) totalPriceEl.textContent = formatCurrency(cartData.total);
                else console.error("Halaman Checkout: Elemen dengan ID 'checkout-total-price' TIDAK DITEMUKAN!");

                // Mengisi informasi pengguna jika sudah login
                if (loggedInUser) {
                    const fullNameInput = document.getElementById('checkout-name');
                    const emailInput = document.getElementById('checkout-email');
                    if (fullNameInput && loggedInUser.name) fullNameInput.value = loggedInUser.name;
                    if (emailInput && loggedInUser.email) emailInput.value = loggedInUser.email;
                }

                // --- Penanganan Tombol Checkout ---
                const checkoutForm = document.getElementById('checkout-form');
                const checkoutButton = document.querySelector('.checkout-button');

                if (checkoutButton && checkoutForm) {
                    checkoutButton.addEventListener('click', async function (event) {
                        event.preventDefault();

                        // Memeriksa status login pengguna
                        if (!loggedInUser || !loggedInUser.user_id) {
                            if (typeof showPopup === 'function') {
                                showPopup("Anda harus login untuk melakukan checkout.", false, "Mengalihkan ke halaman login...", true);
                            } else {
                                alert("Anda harus login untuk melakukan checkout.");
                            }
                            setTimeout(() => {
                                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
                            }, 3000);
                            return;
                        }

                        // Mendapatkan nilai dari formulir pembayaran
                        const fullNameEl = document.getElementById('checkout-name');
                        const emailEl = document.getElementById('checkout-email');
                        const phoneEl = document.getElementById('checkout-phone');
                        const paymentMethodEl = document.getElementById('checkout-payment-method');

                        const fullName = fullNameEl ? fullNameEl.value.trim() : "";
                        const email = emailEl ? emailEl.value.trim() : "";
                        const phone = phoneEl ? phoneEl.value.trim() : "";
                        const paymentMethod = paymentMethodEl ? paymentMethodEl.value : "";

                        // Validasi input formulir
                        if (!fullName || !email || !phone || !paymentMethod) {
                            if (typeof showPopup === 'function') {
                                showPopup("Harap lengkapi semua informasi pembayaran.", false);
                            } else {
                                alert("Harap lengkapi semua informasi pembayaran.");
                            }
                            return;
                        }

                        // --- Pembuatan Data Pesanan dan Transaksi (Simulasi) ---
                        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                        const transactionId = `trx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                        const currentDate = new Date().toISOString();

                        const newOrder = {
                            order_id: orderId,
                            user_id: loggedInUser.user_id,
                            plan_id: cartData.id,
                            course_id: null,
                            order_date: currentDate,
                            total_amount: cartData.total,
                            status: "completed",
                            coupon_code: document.querySelector('.coupon-input') ? document.querySelector('.coupon-input').value.trim() : null
                        };

                        const newTransaction = {
                            transaction_id: transactionId,
                            order_id: orderId,
                            payment_method: paymentMethod,
                            status: "success",
                            transaction_date: currentDate,
                            payment_details_id: `sim_pay_${transactionId}`
                        };

                        // Menentukan apakah paket memberikan akses penuh
                        let grantsAllAccess = false;
                        if (newOrder.plan_id === "paket-6bln" || newOrder.plan_id === "paket-12bln") {
                            grantsAllAccess = true;
                        }

                        // Menyimpan status paket pengguna ke localStorage
                        localStorage.setItem('userPlanStatus', JSON.stringify({
                            planId: newOrder.plan_id,
                            active: true,
                            orderDate: newOrder.order_date,
                            orderId: newOrder.order_id,
                            user_id: loggedInUser.user_id,
                            grantsAccessToAll: grantsAllAccess
                        }));

                        // --- Simulasi Pembuatan Pendaftaran Kursus ---
                        const enrollmentsToCreate = [];
                        if (grantsAllAccess) {
                            // Contoh: Otomatis mendaftarkan ke beberapa kursus awal untuk paket akses penuh
                            const exampleCoursesForAllAccess = ["course001", "course009"];
                            exampleCoursesForAllAccess.forEach(courseId => {
                                enrollmentsToCreate.push({
                                    enrollment_id: `enr_${loggedInUser.user_id}_${courseId}_${Date.now()}`,
                                    user_id: loggedInUser.user_id,
                                    course_id: courseId,
                                    enrollment_date: currentDate,
                                    progress_percentage: 0,
                                    completion_date: null
                                });
                            });
                        } else if (newOrder.plan_id === "paket-3bln") {
                            // Contoh: Paket 3 bulan mungkin memberikan akses ke beberapa kursus tertentu
                            const coursesFor3MonthPlan = ["course001", "course002", "course003"];
                            coursesFor3MonthPlan.forEach(courseId => {
                                enrollmentsToCreate.push({
                                    enrollment_id: `enr_${loggedInUser.user_id}_${courseId}_${Date.now()}`,
                                    user_id: loggedInUser.user_id,
                                    course_id: courseId,
                                    enrollment_date: currentDate,
                                    progress_percentage: 0,
                                    completion_date: null
                                });
                            });
                        }

                        // --- Notifikasi dan Pengalihan Setelah Checkout ---
                        if (typeof showPopup === 'function') {
                            showPopup(
                                "Checkout berhasil! Terima kasih atas pesanan Anda.",
                                true,
                                "Anda akan diarahkan ke dashboard dalam 5 detik.",
                                true
                            );
                        } else {
                            alert("Checkout berhasil! Terima kasih atas pesanan Anda.");
                        }

                        // Membersihkan keranjang setelah checkout
                        localStorage.removeItem('selectedCart');

                        // Mengalihkan ke halaman dashboard
                        setTimeout(function () {
                            window.location.href = "dashboard.html";
                        }, 5000);
                    });
                } else {
                    if (!checkoutForm) console.error("Halaman Checkout: Formulir dengan ID 'checkout-form' TIDAK DITEMUKAN!");
                    if (!checkoutButton) console.error("Halaman Checkout: Tombol dengan class '.checkout-button' TIDAK DITEMUKAN!");
                }

            } else {
                // Menangani data keranjang yang tidak valid
                if (typeof showPopup === 'function') {
                    showPopup("Data keranjang tidak valid.", false, "Silakan pilih ulang paket dari halaman harga.", true);
                } else {
                    alert("Data keranjang tidak valid. Silakan pilih ulang paket.");
                }
                setTimeout(() => {
                    window.location.href = "pricing.html";
                }, 3000);
            }
        } catch (error) {
            // Menangani kesalahan saat memproses data keranjang
            if (typeof showPopup === 'function') {
                showPopup("Terjadi kesalahan saat memuat detail pesanan.", false, "Silakan coba lagi dari halaman harga.", true);
            } else {
                alert("Terjadi kesalahan saat memuat detail pesanan. Silakan coba lagi.");
            }
            localStorage.removeItem('selectedCart');
            setTimeout(() => {
                window.location.href = "pricing.html";
            }, 3000);
        }
    } else {
        // Menangani keranjang yang kosong
        if (typeof showPopup === 'function') {
            showPopup("Keranjang Anda kosong.", false, "Silakan pilih paket terlebih dahulu.", true);
        } else {
            alert("Keranjang Anda kosong. Silakan pilih paket terlebih dahulu.");
        }
        setTimeout(() => {
            window.location.href = "pricing.html";
        }, 3000);
    }
});

// Fungsi untuk memformat mata uang ke Rupiah
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'Rp -';
    }
    return 'Rp ' + amount.toLocaleString('id-ID');
}