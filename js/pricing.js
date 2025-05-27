document.addEventListener('DOMContentLoaded', function () {
    // Function to fetch pricing plans data from plans.json
    async function fetchPricingPlans() {
        try {
            const response = await fetch('./json/plans.json'); // Assuming plans.json is in a 'data' subdirectory
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const plans = await response.json();
            return plans;
        } catch (error) {
            console.error("Could not fetch pricing plans:", error);
            // Optionally, display an error message to the user on the page
            const container = document.getElementById('pricing-plans-container');
            if (container) {
                container.innerHTML = '<p class="error-message">Maaf, terjadi kesalahan saat memuat paket harga. Silakan coba lagi nanti.</p>';
            }
            return []; // Return an empty array or handle error appropriately
        }
    }

    // Guna mengonversi angka menjadi string dengan pemisah ribuan, tanpa Rp.
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            // console.warn("formatCurrency received invalid value:", amount);
            return 'N/A'; // Return N/A or some placeholder for invalid amounts
        }
        return amount.toLocaleString('id-ID');
    }

    // Render Pricing Plans
    // mengambil data paket harga (plans) dan menampilkannya di dalam elemen HTML
    function renderPlans(plans) {
        const container = document.getElementById('pricing-plans-container');
        if (!container) {
            console.error("Pricing plans container tidak ditemukan!");
            return;
        }
        container.innerHTML = ''; // Clear previous content or loading indicator

        if (!plans || plans.length === 0) {
            // Handle case where no plans are loaded or an error occurred
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

            // Ikon
            const icon = document.createElement('img');
            icon.src = plan.icon || 'assets/default-icon.png'; // Fallback icon
            icon.alt = plan.name || 'Paket Harga';
            icon.classList.add('plan-icon');
            icon.onerror = function () { // Handle broken image links
                this.src = 'https://placehold.co/100x100/E0E0E0/B0B0B0?text=Icon';
                this.alt = 'Ikon tidak tersedia';
            };
            planElement.appendChild(icon);

            // Judul
            const title = document.createElement('h2');
            title.innerHTML = plan.name || 'Nama Paket Tidak Tersedia';
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
            periodSpan.textContent = plan.period || '';
            priceDiv.appendChild(periodSpan);

            planElement.appendChild(priceDiv);

            // Features
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
            const ctaButton = document.createElement('a');
            // Ensure plan.id and plan.ctaLink are valid before constructing href
            if (plan.id && plan.ctaLink) {
                ctaButton.href = `${plan.ctaLink}?planId=${plan.id}`;
            } else {
                ctaButton.href = '#'; // Fallback href
                console.warn(`Plan ID or ctaLink missing for plan: ${plan.name}`);
            }
            ctaButton.classList.add('cta-button');
            ctaButton.textContent = 'Beli Paket';
            planElement.appendChild(ctaButton);

            container.appendChild(planElement);
        });

        // Re-apply the disabling logic after plans are rendered
        // This part seems to disable buttons after rendering.
        // If this is intended for a specific state (e.g., user not logged in),
        // it should ideally be handled with more specific logic.
        // document.querySelectorAll('.cta-button').forEach(button => {
        //     button.classList.add('disabled');
        //     button.removeAttribute('href'); // Removing href makes it non-navigable
        //     button.style.pointerEvents = 'none';
        //     button.style.opacity = '0.5';
        //     // To make it act like a button that can be clicked (e.g., for a popup),
        //     // you might want to add an event listener instead of removing href.
        //     // For now, keeping it as per your original logic of disabling.
        // });
    }

    // Main execution: Fetch plans and then render them
    async function initPricingPage() {
        const pricingPlansData = await fetchPricingPlans();
        renderPlans(pricingPlansData);
    }

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
