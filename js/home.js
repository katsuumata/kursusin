document.addEventListener('DOMContentLoaded', function () {
    const JSON_BASE_PATH = './json/'; // Path to your JSON data folder

    // --- Data Fetching Functions ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch ${fileName}:`, error);
            // Display error on page or use fallback data
            const errorTarget = document.getElementById(fileName.split('.')[0] + '-list') || // e.g. new-courses-list
                document.getElementById(fileName.split('.')[0] + '-container'); // e.g. category-list-container
            if (errorTarget) {
                errorTarget.innerHTML = `<p class="error-message">Gagal memuat data untuk bagian ini. Silakan coba lagi nanti.</p>`;
            }
            return []; // Return empty array on error to prevent script breakage
        }
    }

    // --- Rendering Functions ---

    // Render Categories
    function renderCategories(categories) {
        const container = document.getElementById('category-list-container');
        if (!container) {
            console.warn("Element with ID 'category-list-container' not found.");
            return;
        }
        if (!categories || categories.length === 0) {
            container.innerHTML = '<p>Kategori tidak tersedia saat ini.</p>';
            return;
        }
        container.innerHTML = ''; // Clear existing

        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            // Ensure category.icon_url exists in your categories.json
            const iconUrl = category.icon_url || 'https://placehold.co/60x60/E0E0E0/B0B0B0?text=Icon';
            categoryDiv.innerHTML = `
                <div class="category-box">
                    <div class="category-img">
                        <img src="${iconUrl}" alt="${category.name || 'Kategori'}">
                    </div>
                </div>
                <div class="category-text">
                    <p>${category.name || 'Tanpa Nama'}</p>
                </div>
            `;
            categoryDiv.addEventListener('click', () => {
                // Navigate to a page showing courses for this category
                if (category.category_id) {
                    window.location.href = `course.html?category=${category.category_id}`;
                } else {
                    console.warn("Category ID missing for category:", category.name);
                }
            });
            container.appendChild(categoryDiv);
        });
    }

    // Render Category Cards
    function renderCategoryCards(cards) {
        const container = document.getElementById('category-card-container');
        if (!container) {
            console.warn("Element with ID 'category-card-container' not found.");
            return;
        }
        if (!cards || cards.length === 0) {
            container.innerHTML = '<p>Informasi kartu kategori tidak tersedia.</p>';
            return;
        }
        container.innerHTML = '';

        cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'cat-card-content';
            const imageUrl = card.image_url || 'https://placehold.co/150x165/E0E0E0/B0B0B0?text=Gambar';
            const arrowIconUrl = card.arrow_icon_url || 'assets/right-arrow.png'; // Default if not provided

            cardDiv.innerHTML = `
                <div class="cat-card-pict">
                    <img src="${imageUrl}" alt="${card.title || 'Kartu Kategori'}">
                </div>
                <div class="cat-card-text">
                    <h3>${card.title || 'Judul Kartu'}</h3>
                    <p>${card.description || 'Deskripsi tidak tersedia.'}</p>
                    <a href="${card.link_url || '#'}" class="cat-card-link" aria-label="Pelajari lebih lanjut tentang ${card.title || 'kartu ini'}">
                        <div class="cat-card-arrow">
                            <img src="${arrowIconUrl}" alt="Lihat detail">
                        </div>
                    </a>
                </div>
            `;
            container.appendChild(cardDiv);
        });
    }

    // Render Courses (Generic for New and Popular)
    function renderCourses(courses, containerId, allUsersData, maxItems = 5) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Element with ID '${containerId}' not found.`);
            return;
        }
        if (!courses || courses.length === 0) {
            container.innerHTML = '<p>Tidak ada pelatihan yang tersedia di bagian ini.</p>';
            return;
        }
        container.innerHTML = ''; // Clear existing

        const coursesToDisplay = courses.slice(0, maxItems);

        coursesToDisplay.forEach(course => {
            const courseDiv = document.createElement('div');
            courseDiv.className = 'course-item';

            let starsHTML = '';
            const rating = course.rating_average ? Math.round(course.rating_average * 2) / 2 : 0;
            for (let i = 1; i <= 5; i++) {
                if (rating >= i) {
                    starsHTML += '<img src="assets/rating_full.png" alt="Full Star">';
                } else if (rating >= i - 0.5) {
                    starsHTML += '<img src="assets/rating_half.png" alt="Half Star">';
                } else {
                    starsHTML += '<img src="assets/rating_blank.png" alt="Empty Star">';
                }
            }

            const author = allUsersData.find(u => u.user_id === course.author_id);
            const authorName = author ? author.name : 'Pengajar Ahli';
            const thumbnailUrl = course.image_thumbnail_url || `https://placehold.co/235x132/E0E0E0/B0B0B0?text=${encodeURIComponent(course.title || 'Kursus')}`;

            courseDiv.innerHTML = `
                <div class="course-pict">
                    <img src="${thumbnailUrl}" alt="${course.title || 'Gambar Kursus'}">
                </div>
                <div class="course-content">
                    <h4 class="course-tittle">${course.title || 'Judul Kursus'}</h4>
                    <h6 class="course-author">${authorName}</h6>
                    <div class="course-rating">
                        <div class="course-star">
                            ${starsHTML}
                        </div>
                        <div class="course-point">
                            <p>${course.rating_average ? course.rating_average.toFixed(1) : 'N/A'}</p>
                        </div>
                    </div>
                    <h6 class="course-participant">${course.participant_count ? course.participant_count.toLocaleString('id-ID') : 'Banyak'} peserta</h6>
                    <button class="lihat" data-course-id="${course.course_id || ''}">Lihat</button>
                </div>
            `;
            const lihatButton = courseDiv.querySelector('.lihat');
            if (course.course_id) {
                lihatButton.addEventListener('click', function () {
                    window.location.href = `coursedetails.html?id=${this.dataset.courseId}`;
                });
            } else {
                lihatButton.disabled = true; // Disable if no course_id
            }
            container.appendChild(courseDiv);
        });
    }

    // --- Slideshow/Carousel Logic ---
    function setupCarousel(carouselContainerSelector) {
        const section = document.querySelector(carouselContainerSelector);
        if (!section) {
            console.warn(`Carousel container "${carouselContainerSelector}" not found.`);
            return;
        }

        const list = section.querySelector('.list-new-course');
        const prevButton = section.querySelector('.kekiri');
        const nextButton = section.querySelector('.kekanan');

        if (!list || !prevButton || !nextButton) {
            console.warn(`One or more carousel elements missing within "${carouselContainerSelector}".`);
            return;
        }

        const scrollAmount = () => {
            const firstItem = list.querySelector('.course-item');
            // Ensure CSS for .course-item includes gap or margin for accurate scroll
            return firstItem ? firstItem.offsetWidth + parseFloat(getComputedStyle(list).gap || '0px') : 250;
        };

        prevButton.addEventListener('click', (e) => {
            e.preventDefault();
            list.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
        });

        nextButton.addEventListener('click', (e) => {
            e.preventDefault();
            list.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
        });
    }

    const bannerImage = document.getElementById('main-banner-image');
    const bannerSources = [
        "assets/Banner.png",
        "assets/Banner2.png",
        "assets/Banner3.png"
    ];
    let currentBannerIndex = 0;

    if (bannerImage) {
        const prevBanner = document.querySelector('.banner-slideshow .prev');
        const nextBanner = document.querySelector('.banner-slideshow .next');

        function showBanner(index) {
            if (bannerSources.length > 0 && bannerSources[index]) {
                bannerImage.src = bannerSources[index];
                bannerImage.alt = `Banner ${index + 1}`;
            } else if (bannerSources.length > 0) { // Fallback to first if index is bad
                bannerImage.src = bannerSources[0];
                bannerImage.alt = `Banner 1`;
            }
        }
        bannerImage.onerror = function () {
            console.warn("Banner image not found at: " + this.src);
            this.src = 'https://placehold.co/1020x300/EAEAEA/B0B0B0?text=Banner+Promosi'; // Placeholder
            this.alt = 'Banner promosi tidak tersedia';
        };


        if (prevBanner && nextBanner && bannerSources.length > 0) {
            prevBanner.addEventListener('click', (e) => {
                e.preventDefault();
                currentBannerIndex = (currentBannerIndex - 1 + bannerSources.length) % bannerSources.length;
                showBanner(currentBannerIndex);
            });
            nextBanner.addEventListener('click', (e) => {
                e.preventDefault();
                currentBannerIndex = (currentBannerIndex + 1) % bannerSources.length;
                showBanner(currentBannerIndex);
            });
            showBanner(0);
        } else if (bannerSources.length === 0) {
            console.warn("No banner sources defined for slideshow.");
            bannerImage.src = 'https://placehold.co/1020x300/EAEAEA/B0B0B0?text=Selamat+Datang';
            bannerImage.alt = 'Selamat Datang';
        }
    }


    // --- Main Initialization ---
    async function initHomePage() {
        console.log("Initializing homepage content...");
        const [categoriesData, coursesData, categoryCardsData, usersData] = await Promise.all([
            fetchData('categories.json'),
            fetchData('courses.json'),
            fetchData('category_cards.json'),
            fetchData('users.json')
        ]);

        console.log("Fetched categories:", categoriesData);
        console.log("Fetched courses:", coursesData);
        console.log("Fetched category cards:", categoryCardsData);
        console.log("Fetched users:", usersData);

        renderCategories(categoriesData);
        renderCategoryCards(categoryCardsData);

        // Sort courses: Newest first (assuming higher ID or a date field means newer)
        // If coursesData has a 'created_at' or 'publish_date', sort by that.
        // For now, using course_id as a proxy if it's somewhat sequential.
        const sortedNewCourses = [...coursesData].sort((a, b) => {
            // Example: if course_id is like "course010", "course009"
            const idA = parseInt(a.course_id.replace(/[^0-9]/g, ''), 10) || 0;
            const idB = parseInt(b.course_id.replace(/[^0-9]/g, ''), 10) || 0;
            return idB - idA; // Higher numeric part of ID first
        });
        renderCourses(sortedNewCourses, 'new-courses-list', usersData, 5);

        const sortedPopularCourses = [...coursesData].sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0));
        renderCourses(sortedPopularCourses, 'popular-courses-list', usersData, 5);

        setupCarousel('.pelatihan-baru');
        setupCarousel('.pelatihan-populer');

        console.log("Homepage content initialization complete.");
    }

    initHomePage();
});
