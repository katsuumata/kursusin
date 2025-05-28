document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch pricing plans data from plans.json
    async function fetchPricingPlans() {
        try {
            const response = await fetch('./json/plans.json'); // Assuming plans.json is in a 'json' subdirectory
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const plans = await response.json();
            return plans;
        } catch (error) {
            console.error("Could not fetch pricing plans:", error);
            const container = document.getElementById('pricing-plans-container');
            if (container) {
                container.innerHTML = '<p class="error-message">Maaf, terjadi kesalahan saat memuat paket harga. Silakan coba lagi nanti.</p>';
            }
            return [];
        }
    }

    // Guna mengonversi angka menjadi string dengan pemisah ribuan, tanpa Rp.
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return 'N/A';
        }
        return amount.toLocaleString('id-ID');
    }

    // Render Pricing Plans
    function renderPlans(plans) {
        const container = document.getElementById('pricing-plans-container');
        if (!container) {
            console.error("Pricing plans container tidak ditemukan!");
            return;
        }
        container.innerHTML = ''; // Clear previous content

        if (!plans || plans.length === 0) {
            container.innerHTML = '<p>Saat ini tidak ada paket harga yang tersedia.</p>';
            return;
        }

        plans.forEach(plan => {
            const planElement = document.createElement('div');
            planElement.classList.add('pricing-plan');
            if (plan.popular) {
                planElement.classList.add('popular');
                const popularBadge = document.createElement('div');
                popularBadge.classList.add('popular-badge');
                popularBadge.textContent = 'Paling Populer';
                planElement.appendChild(popularBadge);
            }
            if (plan.discountBadge) {
                const discountBadge = document.createElement('div');
                discountBadge.classList.add('discount-badge');
                discountBadge.textContent = plan.discountBadge;
                planElement.appendChild(discountBadge);
            }

            const icon = document.createElement('img');
            icon.src = plan.icon || 'assets/icon/plan.png';
            icon.alt = plan.name || 'Paket Harga';
            icon.classList.add('plan-icon');
            icon.onerror = function () {
                this.src = 'https://placehold.co/100x100/E0E0E0/B0B0B0?text=Icon';
                this.alt = 'Ikon tidak tersedia';
            };
            planElement.appendChild(icon);

            const title = document.createElement('h2');
            title.innerHTML = plan.name || 'Nama Paket Tidak Tersedia';
            planElement.appendChild(title);

            const priceDiv = document.createElement('div');
            priceDiv.classList.add('price');

            const originalPriceSpan = document.createElement('span');
            originalPriceSpan.classList.add('price-original');
            if (plan.originalPrice) {
                originalPriceSpan.textContent = `Rp. ${formatCurrency(plan.originalPrice)}`;
                originalPriceSpan.classList.add('visible');
            }
            priceDiv.appendChild(originalPriceSpan);

            const currencySpan = document.createElement('span');
            currencySpan.classList.add('price-currency');
            currencySpan.textContent = 'Rp.';
            priceDiv.appendChild(currencySpan);

            const amountSpan = document.createElement('span');
            amountSpan.classList.add('price-amount');
            amountSpan.textContent = formatCurrency(plan.price);
            priceDiv.appendChild(amountSpan);

            const periodSpan = document.createElement('span');
            periodSpan.classList.add('price-period');
            periodSpan.textContent = plan.period || '';
            priceDiv.appendChild(periodSpan);

            planElement.appendChild(priceDiv);

            const featuresList = document.createElement('ul');
            featuresList.classList.add('features-list');
            if (plan.features && Array.isArray(plan.features)) {
                plan.features.forEach(feature => {
                    const listItem = document.createElement('li');
                    listItem.classList.add(feature.type === 'included' ? 'feature-included' : 'feature-excluded');
                    listItem.innerHTML = feature.text || 'Fitur tidak dijelaskan';
                    featuresList.appendChild(listItem);
                });
            }
            planElement.appendChild(featuresList);

            // CTA Button
            const ctaButton = document.createElement('a'); // Tetap sebagai <a> untuk styling
            ctaButton.classList.add('cta-button');
            ctaButton.textContent = 'Beli Paket';
            ctaButton.href = '#'; // Atur href default untuk mencegah navigasi jika JS gagal

            ctaButton.addEventListener('click', function(event) {
                event.preventDefault(); // Selalu cegah aksi default anchor tag

                // Cek status login. Anda mungkin memiliki cara yang lebih baik di global.js
                // Untuk contoh ini, kita akan cek keberadaan token di localStorage atau tampilan elemen navigasi.
                // Asumsi: global.js mengatur tampilan '#user-dropdown-container' saat login
                const userDropdownContainer = document.getElementById('user-dropdown-container');
                let isLoggedIn = false;
                if (userDropdownContainer && userDropdownContainer.style.display !== 'none') {
                    isLoggedIn = true;
                }
                // Alternatif lain, jika Anda menyimpan token:
                // const userToken = localStorage.getItem('userToken');
                // if (userToken) {
                //     isLoggedIn = true;
                // }


                if (isLoggedIn) {
                    // Pengguna sudah login, arahkan ke link paket
                    if (plan.id && plan.ctaLink) {
                        window.location.href = `${plan.ctaLink}?planId=${plan.id}`;
                    } else {
                        console.warn(`Plan ID atau ctaLink tidak ada untuk paket: ${plan.name}. Tidak bisa mengarahkan.`);
                        // Mungkin tampilkan pesan error atau fallback
                        alert('Detail paket tidak tersedia saat ini. Silakan hubungi dukungan.');
                    }
                } else {
                    // Pengguna belum login, arahkan ke halaman register
                    // Pastikan Anda memiliki halaman register.html
                    window.location.href = 'register.html';
                }
            });

            planElement.appendChild(ctaButton);
            container.appendChild(planElement);
        });
    }

    // Main execution: Fetch plans and then render them
    async function initPricingPage() {
        const pricingPlansData = await fetchPricingPlans();
        renderPlans(pricingPlansData);
    }

    // --- MODIFIKASI UNTUK TOMBOL HUBUNGI KAMI ---
    const contactUsButton = document.getElementById('contact-us-popup-trigger');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupImage = document.getElementById('popup-image');
    const popupLoader = document.getElementById('popup-loader');
    const popupRedirectMessage = document.getElementById('popup-redirect-message');
    const popupOkBtn = document.getElementById('popup-ok-btn'); // Kita tetap ambil referensinya untuk memastikan tetap tersembunyi

    // Variabel kontak (pastikan sudah didefinisikan di scope yang benar, seperti sebelumnya)
    const whatsappNumber = '6281234567890'; // GANTI DENGAN NOMOR ANDA
    const whatsappMessage = 'Halo Kursusin, saya ingin bertanya lebih lanjut mengenai layanan Anda.';
    const emailAddress = 'info@kursusin.com'; // GANTI DENGAN EMAIL ANDA
    const emailSubject = 'Pertanyaan Mengenai Kursusin';
    const emailBody = 'Halo Kursusin,\n\nSaya memiliki beberapa pertanyaan:\n\n';

    if (contactUsButton && popupOverlay && popupTitle && popupMessage) { // popupOkBtn tidak wajib ada di sini untuk logika utama
        contactUsButton.addEventListener('click', function (event) {
            event.preventDefault();

            // Atur konten pop-up "Hubungi Kami"
            popupTitle.textContent = 'Hubungi Kami';
            if (popupImage) popupImage.style.display = 'none';
            if (popupLoader) popupLoader.style.display = 'none';
            if (popupRedirectMessage) popupRedirectMessage.style.display = 'none';

            popupMessage.innerHTML = `
                <p>Anda dapat menghubungi kami melalui:</p>
                <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}" target="_blank" class="popup-contact-link">
                    Chat via WhatsApp
                </a>
                <a href="mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}" class="popup-contact-link">
                    Kirim Email
                </a>
            `;

            // Pastikan tombol OK/Tutup bawaan tetap tersembunyi untuk pop-up ini
            if (popupOkBtn) {
                popupOkBtn.style.display = 'none';
                popupOkBtn.onclick = null; // Hapus event handler onclick sebelumnya jika ada
            }
            
            // Tampilkan pop-up dengan menambahkan kelas .active
            popupOverlay.classList.add('active');
        });

        // Tambahkan event listener pada overlay untuk menutup pop-up saat diklik di luarnya
        popupOverlay.addEventListener('click', function (event) {
            // Jika target klik adalah overlay itu sendiri (bagian luar kotak pop-up)
            if (event.target === popupOverlay) {
                popupOverlay.classList.remove('active');
            }
        });

    } else {
        console.error("Salah satu elemen penting untuk pop-up kontak (tombol pemicu, overlay, title, message) tidak ditemukan! Periksa ID di HTML.");
    }

    // --- AKHIR MODIFIKASI UNTUK TOMBOL HUBUNGI KAMI ---

    initPricingPage();

    // // --- Optional: Mobile Menu Toggle (Basic Example) ---
    // const mobileMenuButton = document.querySelector('.tombol');
    // const menuNav = document.querySelector('.menu');

    // if (mobileMenuButton && menuNav) {
    //     mobileMenuButton.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         menuNav.style.display = menuNav.style.display === 'flex' ? 'none' : 'flex';
    //     });
    // }
});