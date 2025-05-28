function showPopup(message, isSuccess, redirectMessage = '', showLoader = false) {
    const overlay = document.getElementById('popup-overlay');
    const box = document.getElementById('popup-box');
    const image = document.getElementById('popup-image');
    const title = document.getElementById('popup-title');
    const messageEl = document.getElementById('popup-message');
    const redirectMsgEl = document.getElementById('popup-redirect-message');
    const loader = document.getElementById('popup-loader');
    const okBtn = document.getElementById('popup-ok-btn');

    if (!overlay || !box || !image || !title || !messageEl || !redirectMsgEl || !loader || !okBtn) {
        console.error("Popup elements not found on the current page.");
        alert(message + (redirectMessage ? `\n${redirectMessage}` : ''));
        return;
    }

    if (isSuccess) {
        image.src = './assets/icon/check.png';
        image.alt = 'Success';
        title.textContent = 'Berhasil!';
    } else {
        image.src = './assets/icon/warning.png';
        image.alt = 'Error';
        title.textContent = 'Terjadi Kesalahan';
    }
    image.onerror = function () {
        console.warn("Popup icon image not found at: " + this.src);
        this.alt = 'Ikon tidak tersedia';
    };

    messageEl.textContent = message;

    if (redirectMessage) {
        redirectMsgEl.textContent = redirectMessage;
        redirectMsgEl.style.display = 'block';
    } else {
        redirectMsgEl.style.display = 'none';
    }

    loader.style.display = showLoader ? 'block' : 'none';
    okBtn.style.display = showLoader ? 'none' : 'inline-block';

    overlay.classList.add('active');
    box.classList.add('active');
}

function closePopup() {
    const overlay = document.getElementById('popup-overlay');
    const box = document.getElementById('popup-box');

    if (overlay && box) {
        overlay.classList.remove('active');
        box.classList.remove('active');
    } else {
        console.error("Could not close popup: overlay or box element not found.");
    }
}

function updateNavbarState() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const authLink = document.getElementById('auth-link');
    const userDropdownContainer = document.getElementById('user-dropdown-container');
    const userNavName = document.getElementById('user-nav-name');
    const userNavAvatar = document.getElementById('user-nav-avatar');
    const logoutLink = document.getElementById('logout-link');

    if (loggedInUser && loggedInUser.user_id) {
        if (authLink) {
            authLink.style.display = 'none';
        }
        if (userDropdownContainer) {
            userDropdownContainer.style.display = 'inline-block';
        }
        if (userNavName) {
            userNavName.textContent = loggedInUser.name ? loggedInUser.name.split(' ')[0] : 'User';
        }
        if (userNavAvatar) {
            userNavAvatar.src = loggedInUser.image_url || 'assets/user/default_profile_nav.png';
            userNavAvatar.alt = loggedInUser.name ? `Avatar ${loggedInUser.name}` : 'User Avatar';
            userNavAvatar.onerror = function () {
                this.src = 'assets/user/default_profile_nav.png';
                this.alt = 'Default Avatar';
                console.warn("User nav avatar failed to load, using default.");
            };
        }
        if (logoutLink && !logoutLink.dataset.listenerAttached) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('userPlanStatus');
                localStorage.removeItem('rememberedEmail');
                updateNavbarState();
                if (typeof showPopup === 'function') {
                    showPopup("Anda telah berhasil logout.", true, "Mengalihkan ke Beranda...", true);
                } else {
                    alert("Anda telah berhasil logout.");
                }
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
            });
            logoutLink.dataset.listenerAttached = 'true';
        }
    } else {
        if (authLink) {
            authLink.style.display = 'inline-block';
        }
        if (userDropdownContainer) {
            userDropdownContainer.style.display = 'none';
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const okBtn = document.getElementById("popup-ok-btn");
    if (okBtn) {
        okBtn.addEventListener("click", closePopup);
    }
    updateNavbarState();

    const tombol = document.querySelector('.tombol');
    const menu = document.querySelector('.menu');

    if (tombol && menu) {
        tombol.addEventListener('click', () => {
            menu.classList.toggle('menu-open');
        });
    } else {
        console.warn("Tombol (.tombol) atau menu (.menu) tidak ditemukan untuk fungsionalitas hamburger.");
    }
});