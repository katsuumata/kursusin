document.addEventListener('DOMContentLoaded', function () {
    //Data Definition
    const pricingPlansData = [
        {
            id: "paket-3bln",
            name: "Paket Akses 3 Bulan",
            price: 599000,
            originalPrice: null,
            period: "/3 bln",
            icon: "assets/3d/3d-casual-life-man-wondering-holding-phone.png",
            features: [
                { text: "Tutorial bersih-bersih & perawatan rumah", type: "included" },
                { text: "Akses modul selama 3 bulan", type: "included" },
                { text: "64+ video pelatihan", type: "included" },
                { text: "8 Jalur Pembelajaran <i>(Learning Path)</i> Rumah Tangga", type: "included" },
                { text: "Sertifikat penyelesaian", type: "included" },
                { text: "4 Sesi Live Webinar", type: "excluded" },
                { text: "E-book panduan", type: "excluded" },
                { text: "Kelas pelatihan onsite gratis", type: "excluded" }
            ],
            popular: false,
            discountBadge: null,
            ctaLink: "./cart.html"
        },
        {
            id: "paket-6bln",
            name: "Paket Akses 6 Bulan",
            price: 999000,
            originalPrice: 1198000,
            period: "/6 bln",
            icon: "assets/3d/3d-casual-life-man-wondering-holding-phone.png",
            features: [
                { text: "Tutorial bersih-bersih & perawatan rumah", type: "included" },
                { text: "Pendampingan mentor rumah tangga", type: "included" },
                { text: "Akses konten selama 6 bulan", type: "included" },
                { text: "72+ video pelatihan", type: "included" },
                { text: "12 Jalur Pembelajaran <i>(Learning Path)</i> Rumah Tangga", type: "included" },
                { text: "Sertifikat penyelesaian", type: "included" },
                { text: "4 Sesi Live Webinar", type: "included" },
                { text: "E-book panduan", type: "included" },
                { text: "Kelas pelatihan onsite gratis", type: "excluded" }
            ],
            popular: true,
            discountBadge: "Hemat 17%",
            ctaLink: "./cart.html"
        },
        {
            id: "paket-12bln",
            name: "Paket Akses 12 Bulan",
            price: 1299000,
            originalPrice: 2396000,
            period: "/thn",
            icon: "assets/3d/3d-casual-life-man-wondering-holding-phone.png",
            features: [
                { text: "Tutorial bersih-bersih & perawatan rumah", type: "included" },
                { text: "Akses modul belajar kapan saja", type: "included" },
                { text: "Pendampingan mentor rumah tangga", type: "included" },
                { text: "Akses konten selama 12 bulan", type: "included" },
                { text: "84+ video pelatihan", type: "included" },
                { text: "15 Jalur Pembelajaran <i>(Learning Path)</i> Rumah Tangga", type: "included" },
                { text: "Sertifikat penyelesaian", type: "included" },
                { text: "12 Sesi Live Webinar", type: "included" },
                { text: "E-book panduan", type: "included" },
                { text: "Kelas pelatihan onsite gratis", type: "included" }
            ],
            popular: false,
            discountBadge: "Hemat 45%",
            ctaLink: "./cart.html"
        }
    ];
    // Guna mengonversi angka menjadi string dengan pemisah ribuan, tanpa Rp.
    function formatCurrency(amount) {
        return amount.toLocaleString('id-ID');
    }

    // Render Pricing Plans
    //mengambil data paket harga (plans) dan menampilkannya di dalam elemen HTML
    function renderPlans(plans) {
        const container = document.getElementById('pricing-plans-container');
        if (!container) {
            console.error("Pricing plans container tidak ditemukan!");
            return;
        }
        container.innerHTML = '';

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

            // Ikon
            const icon = document.createElement('img');
            icon.src = plan.icon;
            icon.alt = plan.name;
            icon.classList.add('plan-icon');
            planElement.appendChild(icon);

            // Judul
            const title = document.createElement('h2');
            title.innerHTML = plan.name;
            planElement.appendChild(title);

            // harga
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
            periodSpan.textContent = plan.period;
            priceDiv.appendChild(periodSpan);

            planElement.appendChild(priceDiv);

            // Features
            const featuresList = document.createElement('ul');
            featuresList.classList.add('features-list');
            plan.features.forEach(feature => {
                const listItem = document.createElement('li');
                listItem.classList.add(feature.type === 'included' ? 'feature-included' : 'feature-excluded');
                listItem.innerHTML = feature.text;
                featuresList.appendChild(listItem);
            });
            planElement.appendChild(featuresList);

            // CTA Button
            const ctaButton = document.createElement('a');
            ctaButton.href = `${plan.ctaLink}?planId=${plan.id}`;
            ctaButton.classList.add('cta-button');
            ctaButton.textContent = 'Beli Paket';
            planElement.appendChild(ctaButton);

            container.appendChild(planElement);
        });
    }

    renderPlans(pricingPlansData);

    // document.querySelectorAll('.cta-button').forEach(button => {
    //     button.classList.add('disabled');
    //     button.removeAttribute('href');
    //     button.style.pointerEvents = 'none';
    //     button.style.opacity = '0.5';
    // });

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