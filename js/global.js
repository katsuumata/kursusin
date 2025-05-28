// Pop Up Handler
function showPopup(message, isSuccess, redirectMessage = '', showLoader = false) {
    const overlay = document.getElementById('popup-overlay');
    const box = document.getElementById('popup-box');
    const image = document.getElementById('popup-image');
    const title = document.getElementById('popup-title');
    const messageEl = document.getElementById('popup-message');
    const redirectMsgEl = document.getElementById('popup-redirect-message');
    const loader = document.getElementById('popup-loader');
    const okBtn = document.getElementById('popup-ok-btn');

    // Ensure all essential popup elements exist before proceeding
    if (!overlay || !box || !image || !title || !messageEl || !redirectMsgEl || !loader || !okBtn) {
        console.error("Popup elements (or one of their IDs: popup-overlay, popup-box, popup-image, popup-title, popup-message, popup-redirect-message, popup-loader, popup-ok-btn) not found on the current page. Please ensure the HTML structure for the popup is correct.");
        // Fallback to a simple alert if popup elements are missing
        alert(message + (redirectMessage ? `\n${redirectMessage}` : ''));
        return;
    }

    // Setup icon and title
    if (isSuccess) {
        image.src = './assets/icon/check.png'; // Ensure this path is correct relative to HTML file
        image.alt = 'Success';
        title.textContent = 'Berhasil!';
    } else {
        image.src = './assets/icon/warning.png'; // Ensure this path is correct relative to HTML file
        image.alt = 'Error';
        title.textContent = 'Terjadi Kesalahan';
    }
    image.onerror = function () { // Add onerror to handle missing images
        console.warn("Popup icon image not found at: " + this.src + ". Check asset paths. Using placeholder or hiding.");
        this.alt = 'Ikon tidak tersedia';
        // Example: Hide broken image icon
        // this.style.display = 'none'; 
        // Or use a placeholder
        // this.src = 'https://placehold.co/80x80/EAEAEA/B0B0B0?text=Icon';
    };

    messageEl.textContent = message;

    // Redirect message
    if (redirectMessage) {
        redirectMsgEl.textContent = redirectMessage;
        redirectMsgEl.style.display = 'block';
    } else {
        redirectMsgEl.style.display = 'none';
    }

    // Show loader or OK button
    loader.style.display = showLoader ? 'block' : 'none';
    okBtn.style.display = showLoader ? 'none' : 'inline-block'; // Show OK button if not loading

    // Activate popup
    overlay.classList.add('active');
    box.classList.add('active'); // Ensure CSS makes .popup-box display:block or flex when .active
}

function closePopup() {
    const overlay = document.getElementById('popup-overlay');
    const box = document.getElementById('popup-box');

    if (overlay && box) { // Check if elements exist
        overlay.classList.remove('active');
        box.classList.remove('active');
    } else {
        console.error("Could not close popup: overlay or box element not found on the current page.");
    }
}

// --- Dynamic Navbar Logic ---
function updateNavbarState() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const authLink = document.getElementById('auth-link'); // The "MASUK" link
    const userDropdownContainer = document.getElementById('user-dropdown-container');
    const userNavName = document.getElementById('user-nav-name');
    const userNavAvatar = document.getElementById('user-nav-avatar');
    const logoutLink = document.getElementById('logout-link');

    // console.log("Global.js: Updating navbar. LoggedInUser:", loggedInUser);

    if (loggedInUser && loggedInUser.user_id) {
        // User is logged in
        if (authLink) {
            authLink.style.display = 'none';
        } else {
            // console.warn("Navbar element #auth-link not found.");
        }

        if (userDropdownContainer) {
            userDropdownContainer.style.display = 'inline-block'; // Or 'flex' if it's a flex item in your CSS
        } else {
            // console.warn("Navbar element #user-dropdown-container not found.");
        }

        if (userNavName) {
            userNavName.textContent = loggedInUser.name ? loggedInUser.name.split(' ')[0] : 'User'; // Show first name
        } else {
            // console.warn("Navbar element #user-nav-name not found.");
        }

        if (userNavAvatar) {
            userNavAvatar.src = loggedInUser.image_url || 'assets/user/default_profile_nav.png'; // Provide a default nav avatar
            userNavAvatar.alt = loggedInUser.name ? `Avatar ${loggedInUser.name}` : 'User Avatar';
            userNavAvatar.onerror = function () {
                this.src = 'assets/user/default_profile_nav.png';
                this.alt = 'Default Avatar';
                console.warn("User nav avatar failed to load, using default.");
            };
        } else {
            // console.warn("Navbar element #user-nav-avatar not found.");
        }

        if (logoutLink && !logoutLink.dataset.listenerAttached) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Global.js: Logout link clicked.");
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('userPlanStatus'); // Also clear plan status if you have one
                localStorage.removeItem('rememberedEmail'); // Optional: clear remembered email on logout
                // Add any other localStorage items to clear on logout (e.g., 'selectedCart')
                // localStorage.removeItem('selectedCart');

                updateNavbarState(); // Re-render navbar for logged-out state

                // Use the showPopup function if available
                if (typeof showPopup === 'function') {
                    showPopup("Anda telah berhasil logout.", true, "Mengalihkan ke Beranda...", true);
                } else {
                    alert("Anda telah berhasil logout."); // Fallback
                }

                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
            });
            logoutLink.dataset.listenerAttached = 'true'; // Prevent adding multiple listeners
        } else if (!logoutLink) {
            // console.warn("Navbar element #logout-link not found.");
        }

    } else {
        // User is logged out
        if (authLink) {
            authLink.style.display = 'inline-block'; // Or 'flex'
        } else {
            // console.warn("Navbar element #auth-link not found.");
        }
        if (userDropdownContainer) {
            userDropdownContainer.style.display = 'none';
        } else {
            // console.warn("Navbar element #user-dropdown-container not found.");
        }
    }
}


document.addEventListener("DOMContentLoaded", function () {
    // Initialize popup close button if it exists on the page
    const okBtn = document.getElementById("popup-ok-btn");
    if (okBtn) {
        okBtn.addEventListener("click", closePopup);
    }
    // It's okay if okBtn is not on every page, so a warning might be too noisy here.
    // else { console.warn("Popup OK button ('popup-ok-btn') not found on this page."); }

    // Initialize Navbar State on every page load
    updateNavbarState();
});
