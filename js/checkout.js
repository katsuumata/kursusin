// Function to go back in history, using showPopup if available
function kembali() {
    if (typeof showPopup === 'function') {
        console.log("Checkout Page: kembali() called. Attempting to show popup.");
        showPopup("Anda akan kembali ke halaman sebelumnya...", true, "Mengalihkan...", true);
        setTimeout(() => {
            console.log("Checkout Page: kembali() - navigating back.");
            window.history.back();
        }, 1500);
    } else {
        console.warn("Checkout Page: kembali() - showPopup function not found, navigating back directly.");
        window.history.back();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const storedCart = localStorage.getItem('selectedCart');
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

    console.log("Checkout Page: DOMContentLoaded. Reading 'selectedCart' from localStorage:", storedCart);
    console.log("Checkout Page: LoggedInUser:", loggedInUser);

    if (storedCart) {
        try {
            const cartData = JSON.parse(storedCart);
            console.log("Checkout Page: 'selectedCart' data after parse:", cartData);

            if (cartData && typeof cartData.price === 'number' && typeof cartData.total === 'number' && cartData.id) {
                console.log("Checkout Page: cartData is valid. Proceeding to populate summary.");

                const planNameEl = document.getElementById('checkout-plan-name');
                const planPriceEl = document.getElementById('checkout-plan-price');
                const totalPriceEl = document.getElementById('checkout-total-price');

                if (planNameEl) planNameEl.textContent = cartData.name || 'Nama Paket Tidak Tersedia';
                else console.warn("Checkout Page: Element with ID 'checkout-plan-name' not found.");

                if (planPriceEl) planPriceEl.textContent = formatCurrency(cartData.price);
                else console.warn("Checkout Page: Element with ID 'checkout-plan-price' not found.");

                if (totalPriceEl) {
                    totalPriceEl.textContent = formatCurrency(cartData.total);
                } else {
                    console.error("Checkout Page: Element with ID 'checkout-total-price' NOT FOUND!");
                }

                if (loggedInUser) {
                    const fullNameInput = document.getElementById('checkout-name');
                    const emailInput = document.getElementById('checkout-email');
                    if (fullNameInput && loggedInUser.name) fullNameInput.value = loggedInUser.name;
                    if (emailInput && loggedInUser.email) emailInput.value = loggedInUser.email;
                }

                const checkoutForm = document.getElementById('checkout-form');
                const checkoutButton = document.querySelector('.checkout-button');

                if (checkoutButton && checkoutForm) {
                    console.log("Checkout Page: Checkout button and form found. Adding event listener.");
                    checkoutButton.addEventListener('click', async function (event) {
                        console.log("Checkout Page: .checkout-button clicked.");
                        event.preventDefault();

                        if (!loggedInUser || !loggedInUser.user_id) {
                            console.warn("Checkout Page: User not logged in. Cannot proceed with checkout.");
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

                        const fullNameEl = document.getElementById('checkout-name');
                        const emailEl = document.getElementById('checkout-email');
                        const phoneEl = document.getElementById('checkout-phone');
                        const paymentMethodEl = document.getElementById('checkout-payment-method');

                        const fullName = fullNameEl ? fullNameEl.value.trim() : "";
                        const email = emailEl ? emailEl.value.trim() : "";
                        const phone = phoneEl ? phoneEl.value.trim() : "";
                        const paymentMethod = paymentMethodEl ? paymentMethodEl.value : "";

                        console.log("Checkout Page: Form values - FullName:", `"${fullName}"`, "Email:", `"${email}"`, "Phone:", `"${phone}"`, "PaymentMethod:", `"${paymentMethod}"`);

                        if (!fullName || !email || !phone || !paymentMethod) {
                            console.warn("Checkout Page: Form validation failed. Missing fields.");
                            if (typeof showPopup === 'function') {
                                showPopup("Harap lengkapi semua informasi pembayaran.", false);
                            } else {
                                alert("Harap lengkapi semua informasi pembayaran.");
                            }
                            return;
                        }

                        console.log("Checkout Page: Form validation passed.");

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

                        console.log("Checkout Page: SIMULATING ORDER CREATION. Data that WOULD be saved to orders.json:", newOrder);
                        console.log("Checkout Page: SIMULATING TRANSACTION CREATION. Data that WOULD be saved to transactions.json:", newTransaction);

                        // Determine if the plan grants all-access
                        let grantsAllAccess = false;
                        if (newOrder.plan_id === "paket-6bln" || newOrder.plan_id === "paket-12bln") {
                            grantsAllAccess = true;
                        }
                        // For "paket-3bln", it might grant access to specific courses or a limited set.
                        // If it also grants all access, add it here. Otherwise, `grantsAllAccess` remains false.

                        localStorage.setItem('userPlanStatus', JSON.stringify({
                            planId: newOrder.plan_id,
                            active: true,
                            orderDate: newOrder.order_date,
                            orderId: newOrder.order_id,
                            user_id: loggedInUser.user_id, // Ensure user_id is stored with plan status
                            grantsAccessToAll: grantsAllAccess // Store all-access status
                        }));
                        console.log("Checkout Page: 'userPlanStatus' saved to localStorage:", localStorage.getItem('userPlanStatus'));

                        // Simulate adding to enrollments.json
                        // If grantsAllAccess is true, individual enrollments might not be strictly necessary for access control
                        // but could be useful for tracking progress on specific courses the user starts.
                        const enrollmentsToCreate = [];
                        if (grantsAllAccess) {
                            // Potentially enroll in a few "starter" or "popular" courses automatically,
                            // or let the user choose from the dashboard.
                            // For now, let's simulate enrolling in a couple if it's an all-access plan.
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
                            // Example: 3 month plan might give access to a specific set, e.g., first 3 courses
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
                        console.log("Checkout Page: SIMULATING ENROLLMENTS. Data that WOULD be added/updated in enrollments.json:", enrollmentsToCreate);
                        // In a real app, you'd POST newOrder, newTransaction, and enrollmentsToCreate to your backend.


                        if (typeof showPopup === 'function') {
                            showPopup(
                                "Checkout berhasil! Terima kasih atas pesanan Anda.",
                                true,
                                "Anda akan diarahkan ke dasbor dalam 5 detik.",
                                true
                            );
                        } else {
                            alert("Checkout berhasil! Terima kasih atas pesanan Anda.");
                        }

                        localStorage.removeItem('selectedCart');
                        console.log("Checkout Page: 'selectedCart' removed from localStorage.");

                        setTimeout(function () {
                            console.log("Checkout Page: Redirecting to dashboard.html");
                            window.location.href = "dashboard.html";
                        }, 5000);
                    });
                } else {
                    if (!checkoutForm) console.error("Checkout Page: Form dengan ID 'checkout-form' NOT FOUND!");
                    if (!checkoutButton) console.error("Checkout Page: Tombol dengan class '.checkout-button' NOT FOUND!");
                }

            } else {
                console.error("Checkout Page: Data keranjang dari localStorage tidak valid atau field penting hilang. CartData:", cartData);
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
            console.error("Checkout Page: Gagal memproses data keranjang dari localStorage:", error);
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
        console.warn("Checkout Page: Keranjang kosong di localStorage. Redirecting to pricing page...");
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

function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'Rp -';
    }
    return 'Rp ' + amount.toLocaleString('id-ID');
}
