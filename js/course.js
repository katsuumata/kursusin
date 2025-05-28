document.addEventListener('DOMContentLoaded', async function () {
    const JSON_BASE_PATH = './json/';
    const courseListContainer = document.getElementById('course-list-container');
    const searchInput = document.getElementById('search-input');
    const filterButton = document.getElementById('filter-button');
    const resetButton = document.getElementById('reset-button');
    const infoPelatihanCount = document.getElementById('info-pelatihan-count');
    const seeMoreButton = document.getElementById('see-more-button');
    const seeMoreContainer = document.getElementById('see-more-container');

    // Filter popup elements
    const filterPopup = document.getElementById('filter-popup');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const filterCategorySelect = document.getElementById('filter-category');
    const filterRatingSelect = document.getElementById('filter-rating');
    const sortBySelect = document.getElementById('sort-by');
    const applyFiltersButton = document.getElementById('apply-filters-button');
    const selectedCategorySpan = document.getElementById('selected-filter-category');


    let allCourses = []; // raw data from courses.json
    let allUsers = []; // raw data from users.json
    let allCategories = []; // raw data form categories.json
    let filteredAndSortedCourses = []; // Result after filter dan sort
    let currentFilters = {
        searchTerm: '',
        category: '',
        minRating: 0,
        sortBy: 'relevance' // relevance, popular, newest, rating
    };
    const itemsPerPage = 12; // Number of courses to show per "page" or load
    let currentPage = 1;

    // --- Fetching Data ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch ${fileName}:`, error);
            if (infoPelatihanCount) infoPelatihanCount.textContent = `Gagal memuat data ${fileName.split('.')[0]}.`;
            return [];
        }
    }

    // --- Course Card Creation ---
    function createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-item';

        const categoryName = allCategories.find(cat => cat.category_id === course.category_id)?.name || 'Lainnya';
        const author = allUsers.find(u => u.user_id === course.author_id);
        const authorName = author ? author.name : 'Pengajar Ahli';

        let starsHTML = '';
        const rating = course.rating_average ? Math.round(course.rating_average * 2) / 2 : 0;
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<img src="assets/icon/rating_${rating >= i ? 'full' : (rating >= i - 0.5 ? 'half' : 'blank')}.png" alt="Rating Star">`;
        }
        const thumbnailUrl = course.image_thumbnail_url || `https://placehold.co/235x132/E0E0E0/B0B0B0?text=${encodeURIComponent(course.title || 'Kursus')}`;

        card.innerHTML = `
            <div class="course-pict">
                <img src="${thumbnailUrl}" alt="${course.title || 'Gambar Kursus'}" onerror="this.src='https://placehold.co/235x132/EAEAEA/B0B0B0?text=Error'; this.alt='Gambar tidak tersedia';">
            </div>
            <div class="course-content">
                <h4 class="course-tittle">${course.title || 'Judul Kursus'}</h4>
                <h6 class="course-author">${authorName}</h6>
                <span class="course-category">${categoryName}</span> <div class="course-rating">
                    <div class="course-star">${starsHTML}</div>
                    <div class="course-point"><p>${course.rating_average ? course.rating_average.toFixed(1) : 'N/A'}</p></div>
                </div>
                <h6 class="course-participant">${course.participant_count ? course.participant_count.toLocaleString('id-ID') : 'Banyak'} peserta</h6>
                <button class="lihat" data-course-id="${course.course_id || ''}">Lihat</button>
            </div>
        `;
        const lihatButton = card.querySelector('.lihat');
        if (course.course_id) {
            lihatButton.addEventListener('click', function () {
                window.location.href = `coursedetails.html?id=${this.dataset.courseId}`;
            });
        } else {
            lihatButton.disabled = true;
        }
        return card;
    }

    // --- Displaying Courses (Pagination) ---
    function displayCoursesInDOM() {
        if (!courseListContainer) {
            console.error("Course list container not found for displaying courses.");
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const coursesToShow = filteredAndSortedCourses.slice(startIndex, endIndex);

        // Hanya clear jika ini halaman pertama atau jika filter baru diterapkan
        if (currentPage === 1) {
            courseListContainer.innerHTML = '';
        }

        if (coursesToShow.length === 0 && currentPage === 1) {
            courseListContainer.innerHTML = '<p class="empty-course-message">Tidak ada pelatihan yang cocok dengan kriteria Anda.</p>';
        } else {
            coursesToShow.forEach(course => {
                courseListContainer.appendChild(createCourseCard(course));
            });
        }

        updateSeeMoreButton();
        updateDisplayedCourseCount();
    }

    // --- Filtering and Sorting Logic ---
    function applyAllFiltersAndSort() {
        let filtered = [...allCourses]; // Mulai dari semua kursus mentah

        // 1. Search Term Filter
        if (currentFilters.searchTerm) {
            const searchTermLower = currentFilters.searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                (course.title && course.title.toLowerCase().includes(searchTermLower)) ||
                (course.description_short && course.description_short.toLowerCase().includes(searchTermLower)) ||
                (allUsers.find(u => u.user_id === course.author_id)?.name.toLowerCase().includes(searchTermLower)) ||
                (allCategories.find(cat => cat.category_id === course.category_id)?.name.toLowerCase().includes(searchTermLower))
            );
        }

        // 2. Category Filter
        if (currentFilters.category) {
            filtered = filtered.filter(course => course.category_id === currentFilters.category);
        }

        // 3. Rating Filter
        if (currentFilters.minRating > 0) {
            filtered = filtered.filter(course => (course.rating_average || 0) >= currentFilters.minRating);
        }

        // 4. Sorting
        switch (currentFilters.sortBy) {
            case 'popular':
                filtered.sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0));
                break;
            case 'newest':
                filtered.sort((a, b) => {
                    const idA = parseInt((a.course_id || "").replace(/[^0-9]/g, ''), 10) || 0;
                    const idB = parseInt((b.course_id || "").replace(/[^0-9]/g, ''), 10) || 0;
                    return idB - idA;
                });
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0));
                break;
            case 'relevance':
            default:
                // Keep original order or default relevance
                break;
        }

        filteredAndSortedCourses = filtered; // Simpan hasil akhir filter dan sort
        currentPage = 1; // Selalu reset ke halaman 1 saat filter/sort berubah
        displayCoursesInDOM(); // Tampilkan halaman pertama dari hasil yang baru
    }

    // --- Update UI Elements ---
    function populateFilterCategories() {
        if (!filterCategorySelect || !allCategories || allCategories.length === 0) return;
        
        filterCategorySelect.innerHTML = '<option value="">Semua Kategori</option>'; 
        
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.name;
            filterCategorySelect.appendChild(option);
        });
    }

    function updateDisplayedCourseCount() {
        if (infoPelatihanCount) {
            infoPelatihanCount.textContent = `Menampilkan total ${filteredAndSortedCourses.length} pelatihan`;
        }
    }

    function updateSeeMoreButton() {
        if (seeMoreContainer && seeMoreButton) {
            if (currentPage * itemsPerPage >= filteredAndSortedCourses.length) {
                seeMoreContainer.style.display = 'none';
            } else {
                seeMoreContainer.style.display = 'block';
            }
        }
    }

    // --- Initialization ---
    async function initCoursePage() {
        // Load all necessary data concurrently
        const [courses, users, categories] = await Promise.all([
            fetchData('courses.json'),
            fetchData('users.json'),
            fetchData('categories.json')
        ]);

        allCourses = courses;
        allUsers = users;
        allCategories = categories;

        // Populate category dropdown in filter popup
        populateFilterCategories();

        // Check URL for initial category filter from index.html
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategoryFilter = urlParams.get('category');

        if (initialCategoryFilter) {
            currentFilters.category = initialCategoryFilter;
            if (filterCategorySelect) {
                filterCategorySelect.value = initialCategoryFilter;
            }

            const selectedCat = allCategories.find(cat => cat.category_id === initialCategoryFilter);
            if (selectedCategorySpan) {
                selectedCategorySpan.textContent = selectedCat ? selectedCat.name : 'Tidak Ditemukan';
            }
        } else {
            if (selectedCategorySpan) {
                selectedCategorySpan.textContent = 'Semua Kategori';
            }
        }

        // Apply all filters and render for the first time
        applyAllFiltersAndSort();
    }

    // --- Event Listeners ---
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentFilters.searchTerm = this.value;
            applyAllFiltersAndSort(); // Panggil fungsi filter dan sort utama
        });
    }

    if (filterButton && filterPopup && closeFilterBtn) {
        filterButton.addEventListener('click', () => {
            filterPopup.style.display = 'flex';
            setTimeout(() => filterPopup.classList.add('visible'), 10);
        });
        closeFilterBtn.addEventListener('click', () => {
            filterPopup.classList.remove('visible');
            setTimeout(() => filterPopup.style.display = 'none', 300);
        });
        window.addEventListener('click', (event) => {
            if (event.target === filterPopup) {
                filterPopup.classList.remove('visible');
                setTimeout(() => filterPopup.style.display = 'none', 300);
            }
        });
    }

    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            currentFilters.category = filterCategorySelect.value;
            currentFilters.minRating = parseFloat(filterRatingSelect.value) || 0;
            currentFilters.sortBy = sortBySelect.value;
            applyAllFiltersAndSort(); // Panggil fungsi filter dan sort utama

            const selectedCat = allCategories.find(cat => cat.category_id === currentFilters.category);
            if (selectedCategorySpan) {
                selectedCategorySpan.textContent = currentFilters.category ? (selectedCat ? selectedCat.name : 'Tidak Ditemukan') : 'Semua Kategori';
            }

            filterPopup.classList.remove('visible');
            setTimeout(() => filterPopup.style.display = 'none', 300);
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function () {
            currentFilters.searchTerm = '';
            currentFilters.category = '';
            currentFilters.minRating = 0;
            currentFilters.sortBy = 'relevance';

            if (searchInput) searchInput.value = '';
            if (filterCategorySelect) filterCategorySelect.value = '';
            if (filterRatingSelect) filterRatingSelect.value = '';
            if (sortBySelect) sortBySelect.value = 'relevance';

            applyAllFiltersAndSort(); // Panggil fungsi filter dan sort utama

            if (selectedCategorySpan) {
                selectedCategorySpan.textContent = "Semua Kategori";
            }
        });
    }

    if (seeMoreButton) {
        seeMoreButton.addEventListener('click', function () {
            currentPage++;
            displayCoursesInDOM(); // Hanya menampilkan lebih banyak, tidak filter/sort ulang
        });
    }

    // Call the main initialization function
    initCoursePage();
});