// Function to go back in history, potentially with a popup
function kembali() {
    // Assuming showPopup is globally available from global.js
    if (typeof showPopup === 'function') {
        showPopup("Anda akan kembali ke halaman sebelumnya...", true, "", true);
        setTimeout(() => {
            window.history.back();
        }, 1500); // Reduced timeout for quicker navigation
    } else {
        window.history.back(); // Fallback if showPopup is not defined
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Function to fetch pricing plans data from plans.json
    async function fetchCartPricingPlans() {
        try {
            // Assuming plans.json is in a 'data' subdirectory relative to the HTML file
            const response = await fetch('./json/plans.json'); // Corrected path from user's latest code
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const plans = await response.json();
            return plans;
        } catch (error) {
            console.error("Could not fetch pricing plans for cart:", error);
            const cartTableBody = document.querySelector('.cart-table tbody');
            if (cartTableBody) {
                cartTableBody.innerHTML = '<tr><td colspan="5" class="empty-cart-message error-message">Maaf, terjadi kesalahan saat memuat data paket.</td></tr>';
            }
            // Disable checkout if plans can't be loaded
            const checkoutButton = document.querySelector('.checkout-button');
            if (checkoutButton) {
                checkoutButton.disabled = true;
                // CSS class 'disabled' should handle styling for opacity and cursor
                checkoutButton.classList.add('disabled');
            }
            return []; // Return an empty array to prevent further errors
        }
    }

    // Fetch the pricing plans data
    const pricingPlansData = await fetchCartPricingPlans();

    const cartTableBody = document.querySelector('.cart-table tbody');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.querySelector('.checkout-button');

    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return 'Rp -';
        }
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    function addPlanToCart(plan) {
        if (!cartTableBody || !plan) {
            console.error("Cart table body or plan data is missing for addPlanToCart.");
            if (cartTableBody) {
                cartTableBody.innerHTML = '<tr><td colspan="5" class="empty-cart-message">Detail paket tidak ditemukan.</td></tr>';
            }
            return;
        }
        cartTableBody.innerHTML = ''; // Clear any previous message like "cart empty"

        const itemRow = document.createElement('tr');
        itemRow.classList.add('cart-item');
        itemRow.setAttribute('data-price', plan.price);
        itemRow.setAttribute('data-plan-id', plan.id);

        const productCell = document.createElement('td');
        productCell.classList.add('product-details');
        const planIconSrc = plan.icon || 'https://placehold.co/60x60/E0E0E0/B0B0B0?text=Icon';
        // Inline styles for image and input are removed. These should be in cart.css
        // e.g., .product-details img { width:60px; height:auto; border-radius:5px; }
        // e.g., .quantity-input { width:50px; text-align:center; background-color:#eee; border:1px solid #ccc; border-radius:4px; padding:5px; }
        productCell.innerHTML = `
            <div class="cart-item-info">
                <img src="${planIconSrc}" alt="${plan.name || 'Paket'}" class="cart-item-icon" onerror="this.src='https://placehold.co/60x60/E0E0E0/B0B0B0?text=Icon'; this.alt='Ikon error';">
                <span class="cart-item-name">${plan.name || 'Nama Paket Tidak Tersedia'}</span>
            </div>
        `;
        itemRow.appendChild(productCell);

        const priceCell = document.createElement('td');
        priceCell.classList.add('item-price');
        priceCell.textContent = formatCurrency(plan.price);
        itemRow.appendChild(priceCell);

        const quantityCell = document.createElement('td');
        quantityCell.classList.add('item-quantity-cell');
        // Quantity is fixed to 1 and readonly as per current design
        quantityCell.innerHTML = `
            <input type="number" class="quantity-input" value="1" min="1" readonly>
        `;
        itemRow.appendChild(quantityCell);

        const subtotalCell = document.createElement('td');
        subtotalCell.classList.add('item-subtotal');
        subtotalCell.textContent = formatCurrency(plan.price); // Since quantity is 1
        itemRow.appendChild(subtotalCell);

        const removeCell = document.createElement('td');
        removeCell.classList.add('item-remove-cell');
        removeCell.innerHTML = `<button class="remove-item-btn" aria-label="Remove ${plan.name || 'Paket'}">&times;</button>`;
        itemRow.appendChild(removeCell);

        cartTableBody.appendChild(itemRow);
    }

    function updateCartTotals() {
        if (!cartTableBody || !cartSubtotalElement || !cartTotalElement) {
            console.error("One or more cart total elements are missing.");
            return;
        }

        const itemRows = cartTableBody.querySelectorAll('.cart-item');
        let total = 0;

        if (itemRows.length > 0) {
            const planRow = itemRows[0];
            const price = parseFloat(planRow.getAttribute('data-price'));
            if (!isNaN(price)) {
                total = price;
            }
            const subtotalElement = planRow.querySelector('.item-subtotal');
            if (subtotalElement) subtotalElement.textContent = formatCurrency(total);
        }

        cartSubtotalElement.textContent = formatCurrency(total);
        cartTotalElement.textContent = formatCurrency(total);

        if (checkoutButton) { // Ensure checkoutButton exists
            if (itemRows.length === 0) {
                cartTableBody.innerHTML = '<tr><td colspan="5" class="empty-cart-message">Keranjang Anda kosong. <a href="pricing.html"><br>Silakan pilih paket terlebih dahulu</a></td></tr>';
                checkoutButton.disabled = true;
                checkoutButton.classList.add('disabled'); // Add class for styling
                checkoutButton.classList.remove('enabled'); // Optional: remove enabled class
            } else {
                checkoutButton.disabled = false;
                checkoutButton.classList.remove('disabled'); // Remove class
                checkoutButton.classList.add('enabled'); // Optional: add enabled class for specific styling
            }
        }
    }

    function removeItemFromCart(event) {
        const button = event.target;
        const itemRow = button.closest('tr.cart-item');
        if (itemRow) {
            itemRow.remove();
            localStorage.removeItem('selectedCart');
            updateCartTotals();
        }
    }

    if (cartTableBody) {
        cartTableBody.addEventListener('click', function (event) {
            if (event.target.classList.contains('remove-item-btn')) {
                removeItemFromCart(event);
            }
        });
    }

    function saveCartToStorage(plan) {
        if (!plan || typeof plan !== 'object' || !plan.id) {
            localStorage.removeItem('selectedCart');
            return;
        }
        const cartData = {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            period: plan.period,
            icon: plan.icon,
            total: plan.price
        };
        localStorage.setItem('selectedCart', JSON.stringify(cartData));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const selectedPlanId = urlParams.get('planId');
    let selectedPlan = null;

    if (selectedPlanId && pricingPlansData.length > 0) {
        selectedPlan = pricingPlansData.find(plan => plan.id === selectedPlanId);
    }

    if (selectedPlan) {
        addPlanToCart(selectedPlan);
        saveCartToStorage(selectedPlan);
    } else {
        const storedCartData = localStorage.getItem('selectedCart');
        if (storedCartData) {
            try {
                const parsedCartData = JSON.parse(storedCartData);
                if (pricingPlansData.length > 0) { // Ensure pricingPlansData is loaded
                    selectedPlan = pricingPlansData.find(plan => plan.id === parsedCartData.id);
                    if (selectedPlan) {
                        addPlanToCart(selectedPlan);
                        // No need to save again if it's already from localStorage and valid
                    } else {
                        localStorage.removeItem('selectedCart');
                    }
                }
            } catch (e) {
                console.error("Error parsing stored cart data:", e);
                localStorage.removeItem('selectedCart');
            }
        }
    }
    updateCartTotals();
});
