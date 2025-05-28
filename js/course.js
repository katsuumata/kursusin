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


    let allCourses = [];
    let allUsers = [];
    let allCategories = [];
    let displayedCourses = [];
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

    // --- Rendering Logic ---
    function renderCourses() {
        if (!courseListContainer) {
            console.error("Course list container not found.");
            return;
        }
        // Apply filters and search
        let filtered = [...allCourses];

        // Search
        if (currentFilters.searchTerm) {
            const searchTermLower = currentFilters.searchTerm.toLowerCase();
            filtered = filtered.filter(course =>
                (course.title && course.title.toLowerCase().includes(searchTermLower)) ||
                (allUsers.find(u => u.user_id === course.author_id)?.name.toLowerCase().includes(searchTermLower))
            );
        }

        // Category Filter
        if (currentFilters.category) {
            filtered = filtered.filter(course => course.category_id === currentFilters.category);
        }

        // Rating Filter
        if (currentFilters.minRating > 0) {
            filtered = filtered.filter(course => (course.rating_average || 0) >= currentFilters.minRating);
        }

        // Sorting
        switch (currentFilters.sortBy) {
            case 'popular':
                filtered.sort((a, b) => (b.participant_count || 0) - (a.participant_count || 0));
                break;
            case 'newest': // Assuming higher course_id or a date field means newer
                filtered.sort((a, b) => {
                    const idA = parseInt(a.course_id.replace(/[^0-9]/g, ''), 10) || 0;
                    const idB = parseInt(b.course_id.replace(/[^0-9]/g, ''), 10) || 0;
                    return idB - idA;
                });
                break;
            case 'rating':
                filtered.sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0));
                break;
            // Default 'relevance' (no specific sort beyond search/filter order for now)
        }


        displayedCourses = filtered;
        updateDisplayedCourseCount();

        const startIndex = 0; // For "Lihat Lainnya", we always add to existing
        const endIndex = currentPage * itemsPerPage;
        const coursesToRender = displayedCourses.slice(startIndex, endIndex);

        if (currentPage === 1) {
            courseListContainer.innerHTML = ''; // Clear only on first load or filter change
        }

        if (coursesToRender.length === 0 && currentPage === 1) {
            courseListContainer.innerHTML = '<p class="empty-course-message">Tidak ada pelatihan yang cocok dengan kriteria Anda.</p>';
        }

        coursesToRender.forEach((course, index) => {
            // Only append new items if it's not the first page load for these items
            if (index >= (currentPage - 1) * itemsPerPage || currentPage === 1 && index < itemsPerPage) {
                const courseDiv = document.createElement('div');
                courseDiv.className = 'course-item';

                let starsHTML = '';
                const rating = course.rating_average ? Math.round(course.rating_average * 2) / 2 : 0;
                for (let i = 1; i <= 5; i++) {
                    starsHTML += `<img src="assets/icon/rating_${rating >= i ? 'full' : (rating >= i - 0.5 ? 'half' : 'blank')}.png" alt="Rating Star">`;
                }

                const author = allUsers.find(u => u.user_id === course.author_id);
                const authorName = author ? author.name : 'Pengajar Ahli';
                const thumbnailUrl = course.image_thumbnail_url || `https://placehold.co/235x132/E0E0E0/B0B0B0?text=${encodeURIComponent(course.title || 'Kursus')}`;

                courseDiv.innerHTML = `
                    <div class="course-pict">
                        <img src="${thumbnailUrl}" alt="${course.title || 'Gambar Kursus'}" onerror="this.src='https://placehold.co/235x132/EAEAEA/B0B0B0?text=Error'; this.alt='Gambar tidak tersedia';">
                    </div>
                    <div class="course-content">
                        <h4 class="course-tittle">${course.title || 'Judul Kursus'}</h4>
                        <h6 class="course-author">${authorName}</h6>
                        <div class="course-rating">
                            <div class="course-star">${starsHTML}</div>
                            <div class="course-point"><p>${course.rating_average ? course.rating_average.toFixed(1) : 'N/A'}</p></div>
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
                    lihatButton.disabled = true;
                }
                courseListContainer.appendChild(courseDiv);
            }
        });

        // Show/hide "Lihat Lainnya" button
        if (seeMoreContainer && seeMoreButton) {
            if (endIndex >= displayedCourses.length) {
                seeMoreContainer.style.display = 'none';
            } else {
                seeMoreContainer.style.display = 'block';
            }
        }
    }

    function populateFilterCategories() {
        if (!filterCategorySelect || !allCategories || allCategories.length === 0) return;
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.name;
            filterCategorySelect.appendChild(option);
        });
    }

    function updateDisplayedCourseCount() {
        if (infoPelatihanCount) {
            infoPelatihanCount.textContent = `Menampilkan total ${displayedCourses.length} pelatihan`;
        }
    }

    // --- Event Listeners ---
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentFilters.searchTerm = this.value;
            currentPage = 1; // Reset to first page on new search
            renderCourses();
        });
    }

    if (filterButton && filterPopup && closeFilterBtn) {
        filterButton.addEventListener('click', () => {
            filterPopup.style.display = 'flex'; // Show popup
            setTimeout(() => filterPopup.classList.add('visible'), 10); // Trigger transition
        });
        closeFilterBtn.addEventListener('click', () => {
            filterPopup.classList.remove('visible');
            setTimeout(() => filterPopup.style.display = 'none', 300); // Hide after transition
        });
        window.addEventListener('click', (event) => { // Close on outside click
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
            currentPage = 1; // Reset to first page
            renderCourses();
            filterPopup.classList.remove('visible'); // Hide popup
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
            currentPage = 1;
            renderCourses();
        });
    }

    if (seeMoreButton) {
        seeMoreButton.addEventListener('click', function () {
            currentPage++;
            renderCourses(); // This will append new items
        });
    }

    // --- Initialization ---
    async function initCoursePage() {
        const [courses, users, categories] = await Promise.all([
            fetchData('courses.json'),
            fetchData('users.json'),
            fetchData('categories.json')
        ]);

        allCourses = courses;
        allUsers = users;
        allCategories = categories;

        populateFilterCategories(); // Populate filter dropdown
        renderCourses(); // Initial render
    }

    initCoursePage();
});
