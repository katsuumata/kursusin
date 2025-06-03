// Fungsi Navigasi Tambahan
function kembali() {
    if (typeof showPopup === 'function') {
        showPopup("Anda akan kembali ke halaman sebelumnya...", true, "", true);
        setTimeout(() => {
            window.history.back();
        }, 1500);
    } else {
        window.history.back();
    }
}

// Event Listener Utama
document.addEventListener('DOMContentLoaded', async function () {

    // --- Pengambilan dan Validasi Data Paket Harga ---
    async function fetchCartPricingPlans() {
        try {
            const response = await fetch('./json/plans.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const plans = await response.json();
            return plans;
        } catch (error) {
            console.error("Tidak dapat mengambil data paket harga untuk keranjang:", error);
            const cartTableBody = document.querySelector('.cart-table tbody');
            if (cartTableBody) {
                cartTableBody.innerHTML = '<tr><td colspan="5" class="empty-cart-message error-message">Maaf, terjadi kesalahan saat memuat data paket.</td></tr>';
            }
            const checkoutButton = document.querySelector('.checkout-button');
            if (checkoutButton) {
                checkoutButton.disabled = true;
                checkoutButton.classList.add('disabled');
            }
            return [];
        }
    }

    const pricingPlansData = await fetchCartPricingPlans();

    // --- Seleksi Elemen DOM Utama untuk Keranjang ---
    const cartTableBody = document.querySelector('.cart-table tbody');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.querySelector('.checkout-button');

    // --- Fungsi Utilitas ---
    function formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return 'Rp -';
        }
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    // --- Logika Utama Pengelolaan Keranjang Belanja ---
    // Fungsi untuk menambahkan paket ke tampilan keranjang
    function addPlanToCart(plan) {
        if (!cartTableBody || !plan) {
            console.error("Elemen tabel keranjang atau data paket tidak ditemukan untuk fungsi addPlanToCart.");
            if (cartTableBody) {
                cartTableBody.innerHTML = '<tr><td colspan="5" class="empty-cart-message">Detail paket tidak ditemukan.</td></tr>';
            }
            return;
        }
        cartTableBody.innerHTML = '';

        const itemRow = document.createElement('tr');
        itemRow.classList.add('cart-item');
        itemRow.setAttribute('data-price', plan.price);
        itemRow.setAttribute('data-plan-id', plan.id);

        const productCell = document.createElement('td');
        productCell.classList.add('product-details');
        // PENTING: Anda mungkin ingin menambahkan data-label di sini jika diperlukan di mobile
        // productCell.setAttribute('data-label', 'Produk'); 
        const planIconSrc = plan.icon || 'https://placehold.co/60x60/E0E0E0/B0B0B0?text=Icon';
        productCell.innerHTML = `
            <div class="cart-item-info">
                <img src="${planIconSrc}" alt="${plan.name || 'Paket'}" class="cart-item-icon" onerror="this.src='https://placehold.co/60x60/E0E0E0/B0B0B0?text=Icon'; this.alt='Ikon error';">
                <span class="cart-item-name">${plan.name || 'Nama Paket Tidak Tersedia'}</span>
            </div>
        `;
        itemRow.appendChild(productCell);

        const priceCell = document.createElement('td');
        priceCell.classList.add('item-price');
        priceCell.setAttribute('data-label', 'Harga'); // DATA-LABEL DITAMBAHKAN
        priceCell.textContent = formatCurrency(plan.price);
        itemRow.appendChild(priceCell);

        const quantityCell = document.createElement('td');
        quantityCell.classList.add('item-quantity-cell');
        quantityCell.setAttribute('data-label', 'Jumlah'); // DATA-LABEL DITAMBAHKAN
        quantityCell.innerHTML = `
            <input type="number" class="quantity-input" value="1" min="1" readonly>
        `;
        itemRow.appendChild(quantityCell);

        const subtotalCell = document.createElement('td');
        subtotalCell.classList.add('item-subtotal');
        subtotalCell.setAttribute('data-label', 'Subtotal'); // DATA-LABEL DITAMBAHKAN
        subtotalCell.textContent = formatCurrency(plan.price);
        itemRow.appendChild(subtotalCell);

        const removeCell = document.createElement('td');
        removeCell.classList.add('item-remove-cell');
        // Tidak perlu data-label untuk tombol hapus, karena biasanya hanya ikon
        removeCell.innerHTML = `<button class="remove-item-btn" aria-label="Hapus ${plan.name || 'Paket'}">&times;</button>`;
        itemRow.appendChild(removeCell);

        cartTableBody.appendChild(itemRow);
    }

    // Fungsi untuk memperbarui total harga di keranjang
    function updateCartTotals() {
        if (!cartTableBody || !cartSubtotalElement || !cartTotalElement) {
            console.error("Satu atau lebih elemen total keranjang tidak ditemukan.");
            return;
        }

        const itemRows = cartTableBody.querySelectorAll('.cart-item');
        let total = 0;

        if (itemRows.length > 0) {
            const planRow = itemRows[0]; // Asumsi hanya satu item karena input quantity readonly
            const price = parseFloat(planRow.getAttribute('data-price'));
            if (!isNaN(price)) {
                total = price;
            }
            const subtotalElement = planRow.querySelector('.item-subtotal');
            if (subtotalElement) subtotalElement.textContent = formatCurrency(total);
        }

        cartSubtotalElement.textContent = formatCurrency(total);
        cartTotalElement.textContent = formatCurrency(total);

        if (checkoutButton) {
            if (itemRows.length === 0) {
                cartTableBody.innerHTML = '<tr><td colspan="5" class="empty-cart-message">Keranjang Anda kosong. <a href="pricing.html"><br>Silakan pilih paket terlebih dahulu</a></td></tr>';
                checkoutButton.disabled = true;
                checkoutButton.classList.add('disabled');
                checkoutButton.classList.remove('enabled');
            } else {
                checkoutButton.disabled = false;
                checkoutButton.classList.remove('disabled');
                checkoutButton.classList.add('enabled');
            }
        }
    }

    // Fungsi untuk menghapus item dari keranjang
    function removeItemFromCart(event) {
        const button = event.target;
        const itemRow = button.closest('tr.cart-item');
        if (itemRow) {
            itemRow.remove();
            localStorage.removeItem('selectedCart');
            updateCartTotals();
            if (typeof showPopup === 'function') {
                showPopup("Paket telah dihapus dari keranjang.", true);
            }
        }
    }

    // Menambahkan event listener untuk tombol hapus item
    if (cartTableBody) {
        cartTableBody.addEventListener('click', function (event) {
            if (event.target.classList.contains('remove-item-btn')) {
                removeItemFromCart(event);
            }
        });
    }

    // Fungsi untuk menyimpan data keranjang ke Local Storage
    function saveCartToStorage(plan) {
        if (!plan || typeof plan !== 'object' || !plan.id) {
            localStorage.removeItem('selectedCart'); // Hapus jika plan tidak valid
            return;
        }
        const cartData = {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            period: plan.period,
            icon: plan.icon,
            total: plan.price // Karena quantity diasumsikan 1
        };
        localStorage.setItem('selectedCart', JSON.stringify(cartData));
    }

    // --- Inisialisasi Keranjang Belanja ---
    const urlParams = new URLSearchParams(window.location.search);
    const selectedPlanIdFromUrl = urlParams.get('planId');
    let selectedPlan = null;

    if (selectedPlanIdFromUrl && pricingPlansData.length > 0) {
        selectedPlan = pricingPlansData.find(plan => plan.id === selectedPlanIdFromUrl);
        if (selectedPlan) {
            addPlanToCart(selectedPlan);
            saveCartToStorage(selectedPlan);
        } else {
            console.warn(`Plan dengan ID "${selectedPlanIdFromUrl}" dari URL tidak ditemukan di data paket.`);
            localStorage.removeItem('selectedCart');
        }
    } else {
        const storedCartData = localStorage.getItem('selectedCart');
        if (storedCartData) {
            try {
                const parsedCartData = JSON.parse(storedCartData);
                if (pricingPlansData.length > 0 && parsedCartData.id) { // Pastikan id ada di parsedCartData
                    selectedPlan = pricingPlansData.find(plan => plan.id === parsedCartData.id);
                    if (selectedPlan) {
                        // Validasi data dari Local Storage dengan data terbaru dari plans.json
                        if (selectedPlan.price === parsedCartData.price && selectedPlan.name === parsedCartData.name) {
                            addPlanToCart(selectedPlan);
                        } else {
                            console.warn("Data paket di Local Storage berbeda dengan data terbaru. Menggunakan data terbaru.");
                            addPlanToCart(selectedPlan); 
                            saveCartToStorage(selectedPlan); 
                        }
                    } else {
                        console.warn(`Plan dengan ID "${parsedCartData.id}" dari Local Storage tidak ditemukan di data paket.`);
                        localStorage.removeItem('selectedCart');
                    }
                } else {
                     localStorage.removeItem('selectedCart'); // Jika tidak ada data paket atau id tidak ada
                }
            } catch (e) {
                console.error("Error memuat data keranjang dari Local Storage:", e);
                localStorage.removeItem('selectedCart');
            }
        }
    }
    updateCartTotals();
});