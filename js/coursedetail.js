document.addEventListener('DOMContentLoaded', async function () {
    const JSON_BASE_PATH = './json/';

    // --- DOM Elements ---
    const detailCardContainer = document.getElementById('detail-card-course-container');
    const coursePictImg = document.querySelector('#course-detail-pict img');
    const courseTitleEl = document.getElementById('course-detail-title');
    const courseAuthorEl = document.getElementById('course-detail-author');
    const courseDescriptionEl = document.getElementById('course-detail-description');
    const participantCountEl = document.getElementById('course-detail-participant-count');
    const ratingAverageEl = document.getElementById('course-detail-rating-average');
    const starsContainerEl = document.getElementById('course-detail-stars');
    const reviewCountEl = document.getElementById('course-detail-review-count');
    const mulaiBelajarButton = document.getElementById('mulai-belajar-button');

    const courseInfoTextEl = document.getElementById('course-detail-information-text');
    const courseRequirementsTextEl = document.getElementById('course-detail-requirements-text');
    const modulesListContainer = document.getElementById('course-modules-list');
    const reviewsListContainer = document.getElementById('course-reviews-list');

    let localBaseEnrollments = []; // To store enrollments from enrollments.json

    // --- Helper: Fetch Data ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${fileName}`);
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch ${fileName}:`, error);
            return null;
        }
    }

    // --- Get Course ID from URL ---
    function getCourseIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    // --- Rendering Logic ---
    function renderCourseDetails(course, authorName, reviewsForCourse, modulesForCourse) {
        if (!course) {
            console.error("renderCourseDetails called with no course data.");
            if (detailCardContainer) detailCardContainer.innerHTML = "<p>Detail kursus tidak ditemukan atau gagal dimuat.</p>";
            if (courseInfoTextEl) courseInfoTextEl.textContent = "Informasi tidak tersedia.";
            if (courseRequirementsTextEl) courseRequirementsTextEl.textContent = "Informasi tidak tersedia.";
            if (modulesListContainer) modulesListContainer.innerHTML = "<p>Modul tidak tersedia.</p>";
            if (reviewsListContainer) reviewsListContainer.innerHTML = "<p>Ulasan tidak tersedia.</p>";
            if (mulaiBelajarButton) mulaiBelajarButton.classList.add('disabled');
            return;
        }

        console.log("Rendering details for course:", course.title);

        if (coursePictImg) {
            coursePictImg.src = course.image_banner_url || `https://placehold.co/300x169/EAEAEA/B0B0B0?text=${encodeURIComponent(course.title || 'Kursus')}`;
            coursePictImg.alt = course.title || 'Gambar Kursus';
            coursePictImg.onerror = function () { this.src = 'https://placehold.co/300x169/EAEAEA/B0B0B0?text=Error'; this.alt = 'Gambar tidak tersedia'; };
        } else { console.warn("coursePictImg element not found."); }

        if (courseTitleEl) courseTitleEl.textContent = course.title || 'Judul Tidak Tersedia';
        else { console.warn("courseTitleEl element not found."); }

        if (courseAuthorEl) courseAuthorEl.textContent = `oleh ${authorName || 'Pengajar Ahli'}`;
        else { console.warn("courseAuthorEl element not found."); }

        if (courseDescriptionEl) courseDescriptionEl.textContent = course.description_long || course.description_short || 'Deskripsi tidak tersedia.';
        else { console.warn("courseDescriptionEl element not found."); }

        if (participantCountEl) participantCountEl.textContent = (course.participant_count || 0).toLocaleString('id-ID');
        else { console.warn("participantCountEl element not found."); }

        if (ratingAverageEl) ratingAverageEl.textContent = course.rating_average ? course.rating_average.toFixed(1) : 'N/A';
        else { console.warn("ratingAverageEl element not found."); }

        if (starsContainerEl) {
            starsContainerEl.innerHTML = '';
            const rating = course.rating_average ? Math.round(course.rating_average * 2) / 2 : 0;
            for (let i = 1; i <= 5; i++) {
                const starImg = document.createElement('img');
                starImg.src = `assets/rating_${rating >= i ? 'full' : (rating >= i - 0.5 ? 'half' : 'blank')}.png`;
                starImg.alt = 'Rating Star';
                starsContainerEl.appendChild(starImg);
            }
        } else { console.warn("starsContainerEl element not found."); }

        if (reviewCountEl) reviewCountEl.textContent = `${reviewsForCourse ? reviewsForCourse.length : 0} Ulasan`;
        else { console.warn("reviewCountEl element not found."); }

        if (courseInfoTextEl) courseInfoTextEl.textContent = course.information_details || 'Informasi detail tidak tersedia.';
        else { console.warn("courseInfoTextEl element not found."); }

        if (courseRequirementsTextEl) courseRequirementsTextEl.textContent = course.requirements || 'Tidak ada persyaratan khusus.';
        else { console.warn("courseRequirementsTextEl element not found."); }

        renderModules(modulesForCourse, course.course_id);
        renderReviews(reviewsForCourse);
        updateMulaiButtonState(course.course_id); // This will also attach the click listener
    }

    function renderModules(modules, courseId) {
        if (!modulesListContainer) { console.warn("modulesListContainer element not found."); return; }
        if (!modules || modules.length === 0) {
            modulesListContainer.innerHTML = '<p>Belum ada modul untuk kursus ini.</p>';
            return;
        }
        modulesListContainer.innerHTML = '';

        modules.sort((a, b) => (a.order || 0) - (b.order || 0));

        modules.forEach(module => {
            const moduleItemDiv = document.createElement('div');
            moduleItemDiv.className = 'course-module-item';
            const button = document.createElement('button');
            button.className = 'course-module-item-button';
            button.textContent = module.module_title || 'Judul Modul Tidak Diketahui';
            const contentDiv = document.createElement('div');
            contentDiv.className = 'course-module-item-content';

            if (module.lessons && module.lessons.length > 0) {
                module.lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
                module.lessons.forEach(lesson => {
                    const lessonLink = document.createElement('a');
                    lessonLink.href = `learningcontent.html?courseId=${courseId}&moduleId=${module.module_id}&lessonId=${lesson.lesson_id}`;
                    lessonLink.textContent = lesson.lesson_title || 'Judul Materi Tidak Diketahui';
                    contentDiv.appendChild(lessonLink);
                });
            } else {
                contentDiv.innerHTML = '<p>Belum ada materi di modul ini.</p>';
            }
            moduleItemDiv.appendChild(button);
            moduleItemDiv.appendChild(contentDiv);
            modulesListContainer.appendChild(moduleItemDiv);

            button.addEventListener("click", function () {
                const isActive = this.classList.contains("active");
                modulesListContainer.querySelectorAll('.course-module-item-button.active').forEach(activeBtn => {
                    if (activeBtn !== this) {
                        activeBtn.classList.remove("active");
                        activeBtn.nextElementSibling.style.maxHeight = null;
                    }
                });
                if (!isActive) {
                    this.classList.add("active");
                    this.nextElementSibling.style.maxHeight = this.nextElementSibling.scrollHeight + "px";
                } else {
                    this.classList.remove("active");
                    this.nextElementSibling.style.maxHeight = null;
                }
            });
        });
    }

    async function renderReviews(reviews) {
        if (!reviewsListContainer) { console.warn("reviewsListContainer element not found."); return; }
        if (!reviews || reviews.length === 0) {
            reviewsListContainer.innerHTML = '<p>Belum ada ulasan untuk kursus ini.</p>';
            return;
        }
        reviewsListContainer.innerHTML = '';
        const usersData = await fetchData('users.json') || [];
        reviews.forEach(review => {
            const reviewer = usersData.find(u => u.user_id === review.user_id);
            const reviewerName = reviewer ? reviewer.name : 'Pengguna Anonim';
            const reviewerImage = reviewer ? (reviewer.image_url || 'assets/default_profile.png') : 'assets/default_profile.png';
            const reviewCard = document.createElement('div');
            reviewCard.className = 'course-review-card';
            let starsHTML = '';
            const rating = review.rating ? Math.round(review.rating * 2) / 2 : 0;
            for (let i = 1; i <= 5; i++) {
                starsHTML += `<img src="assets/rating_${rating >= i ? 'full' : (rating >= i - 0.5 ? 'half' : 'blank')}.png" alt="Rating Star">`;
            }
            let reviewTime = 'Beberapa waktu lalu';
            if (review.timestamp) {
                try {
                    reviewTime = new Date(review.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                } catch (e) { console.warn("Error parsing review timestamp:", review.timestamp); }
            }
            reviewCard.innerHTML = `
                <img src="${reviewerImage}" alt="Foto profil ${reviewerName}" class="profile" onerror="this.src='assets/default_profile.png'; this.alt='Avatar Default';">
                <div class="course-review-content">
                    <div class="course-review-meta"><h3>${reviewerName}</h3><h4>${reviewTime}</h4></div>
                    <div class="course-review-detail"><div class="course-star">${starsHTML}</div><div class="course-review-description"><p>${review.comment || 'Tidak ada komentar.'}</p></div></div>
                </div>`;
            reviewsListContainer.appendChild(reviewCard);
        });
    }

    async function updateMulaiButtonState(courseId) {
        if (!mulaiBelajarButton || !courseId) {
            console.warn("Tombol 'Mulai Belajar' atau ID Kursus tidak ditemukan untuk pembaruan status.");
            if (mulaiBelajarButton) {
                mulaiBelajarButton.classList.add('disabled');
                mulaiBelajarButton.textContent = 'Informasi Tidak Lengkap';
                mulaiBelajarButton.href = '#';
            }
            return;
        }
        console.log("CourseDetail: Memperbarui status tombol 'Mulai Belajar' untuk courseId:", courseId);

        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const userPlanStatus = JSON.parse(localStorage.getItem('userPlanStatus'));

        let hasAccess = false;
        if (loggedInUser && loggedInUser.user_id) {
            console.log("CourseDetail: Pengguna login:", loggedInUser.user_id);
            if (userPlanStatus && userPlanStatus.active === true && userPlanStatus.user_id === loggedInUser.user_id) {
                console.log("CourseDetail: Pengguna memiliki paket aktif:", userPlanStatus.planId);
                if (userPlanStatus.grantsAccessToAll) { // Check if the plan grants all access
                    hasAccess = true;
                    console.log("CourseDetail: Paket memberikan akses ke semua kursus.");
                } else {
                    // Here you could add logic to check if userPlanStatus.planId specifically includes this courseId
                    // For now, if not grantsAccessToAll, we'll fall back to checking enrollments.json
                    console.log("CourseDetail: Paket tidak memberikan akses ke semua kursus, cek enrollment spesifik.");
                    const userEnrollments = await fetchData('enrollments.json') || [];
                    const enrollment = userEnrollments.find(enr => enr.user_id === loggedInUser.user_id && enr.course_id === courseId);
                    if (enrollment) {
                        console.log("CourseDetail: Pengguna terdaftar di kursus ini secara spesifik.");
                        hasAccess = true;
                    }
                }
            }
            if (!hasAccess) { // If no active plan or plan doesn't cover it, check direct enrollments
                const userEnrollments = await fetchData('enrollments.json') || []; // Use localBaseEnrollments if already fetched
                const enrollment = userEnrollments.find(enr => enr.user_id === loggedInUser.user_id && enr.course_id === courseId);
                if (enrollment) {
                    console.log("CourseDetail: Pengguna terdaftar di kursus ini (fallback check).");
                    hasAccess = true;
                } else {
                    console.log("CourseDetail: Pengguna tidak memiliki paket aktif yang valid dan tidak terdaftar di kursus ini.");
                }
            }
        } else {
            console.log("CourseDetail: Tidak ada pengguna yang login.");
        }

        if (hasAccess) {
            console.log("CourseDetail: Pengguna memiliki akses. Mengaktifkan tombol 'Mulai Belajar'.");
            mulaiBelajarButton.classList.remove('disabled');
            mulaiBelajarButton.textContent = 'Mulai Belajar';

            const modulesForThisCourse = (await fetchData('modules.json') || []).filter(m => m.course_id === courseId).sort((a, b) => (a.order || 0) - (b.order || 0));
            let firstLessonLink = `learningcontent.html?courseId=${courseId}`; // Fallback link

            if (modulesForThisCourse.length > 0) {
                const firstModuleId = modulesForThisCourse[0].module_id;
                const lessonsForFirstModule = (await fetchData('lessons.json') || []).filter(l => l.module_id === firstModuleId).sort((a, b) => (a.order || 0) - (b.order || 0));
                if (lessonsForFirstModule.length > 0) {
                    firstLessonLink = `learningcontent.html?courseId=${courseId}&moduleId=${firstModuleId}&lessonId=${lessonsForFirstModule[0].lesson_id}`;
                } else {
                    console.warn("CourseDetail: Modul pertama tidak memiliki pelajaran.");
                }
            } else {
                console.warn("CourseDetail: Kursus tidak memiliki modul.");
            }
            mulaiBelajarButton.href = firstLessonLink;

            // Add click listener to simulate enrollment if not already explicitly enrolled
            mulaiBelajarButton.onclick = async (e) => {
                // e.preventDefault(); // Prevent navigation if we do more async stuff before redirect
                console.log("CourseDetail: Tombol 'Mulai Belajar' diklik oleh pengguna dengan akses.");

                const currentEnrollments = await fetchData('enrollments.json') || [];
                const existingEnrollment = currentEnrollments.find(enr => enr.user_id === loggedInUser.user_id && enr.course_id === courseId);

                let simulatedEnrollments = JSON.parse(localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`)) || [];
                const existingSimulatedEnrollment = simulatedEnrollments.find(enr => enr.course_id === courseId);

                if (!existingEnrollment && !existingSimulatedEnrollment) {
                    console.log("CourseDetail: Membuat catatan enrollment simulasi karena belum ada.");
                    const newEnrollment = {
                        enrollment_id: `sim_enr_${loggedInUser.user_id}_${courseId}_${Date.now()}`,
                        user_id: loggedInUser.user_id,
                        course_id: courseId,
                        enrollment_date: new Date().toISOString(),
                        progress_percentage: 1, // Start with 1% progress
                        completion_date: null
                    };
                    simulatedEnrollments.push(newEnrollment);
                    localStorage.setItem(`simulated_enrollments_${loggedInUser.user_id}`, JSON.stringify(simulatedEnrollments));
                    console.log("CourseDetail: Enrollment simulasi disimpan ke localStorage:", newEnrollment);
                } else {
                    console.log("CourseDetail: Pengguna sudah memiliki catatan enrollment (JSON atau simulasi) untuk kursus ini.");
                }
                window.location.href = firstLessonLink; // Proceed to learning content
            };

        } else {
            console.log("CourseDetail: Pengguna tidak memiliki akses. Menonaktifkan tombol 'Mulai Belajar' / mengarahkan ke harga.");
            mulaiBelajarButton.classList.add('disabled');
            mulaiBelajarButton.textContent = 'Beli Akses / Gabung Paket';
            mulaiBelajarButton.href = `pricing.html?courseId=${courseId}`;
            mulaiBelajarButton.onclick = null; // Remove any previous click listener
        }
    }

    async function initCourseDetailPage() {
        const courseId = getCourseIdFromURL();
        if (!courseId) {
            console.error("ID Kursus tidak ditemukan di URL.");
            if (detailCardContainer) detailCardContainer.innerHTML = "<h1>ID Kursus tidak valid.</h1>";
            if (mulaiBelajarButton) {
                mulaiBelajarButton.textContent = 'Kursus Tidak Valid';
                mulaiBelajarButton.classList.add('disabled');
                mulaiBelajarButton.href = '#';
            }
            return;
        }

        console.log("Attempting to load details for course ID:", courseId);

        const [allCourses, allUsers, allModules, allLessons, allReviews, fetchedEnrollments] = await Promise.all([
            fetchData('courses.json'),
            fetchData('users.json'),
            fetchData('modules.json'),
            fetchData('lessons.json'),
            fetchData('reviews.json'),
            fetchData('enrollments.json') // Fetch base enrollments once
        ]);

        localBaseEnrollments = fetchedEnrollments || []; // Store for use in updateMulaiButtonState

        if (!allCourses || !allUsers) {
            console.error("Gagal memuat data JSON penting (courses atau users).");
            if (detailCardContainer) detailCardContainer.innerHTML = "<p>Gagal memuat data kursus.</p>";
            return;
        }

        const currentCourse = allCourses.find(c => c.course_id === courseId);
        if (!currentCourse) {
            console.error(`Kursus dengan ID "${courseId}" tidak ditemukan.`);
            if (detailCardContainer) detailCardContainer.innerHTML = `<h1>Kursus tidak ditemukan.</h1>`;
            if (mulaiBelajarButton) {
                mulaiBelajarButton.textContent = 'Kursus Tidak Ditemukan';
                mulaiBelajarButton.classList.add('disabled');
                mulaiBelajarButton.href = '#';
            }
            return;
        }

        const author = allUsers.find(u => u.user_id === currentCourse.author_id);
        const authorName = author ? author.name : 'Pengajar Ahli';
        const modulesForCourse = allModules ? allModules.filter(m => m.course_id === courseId).map(mod => ({
            ...mod,
            lessons: allLessons ? allLessons.filter(l => l.module_id === mod.module_id) : []
        })) : [];
        const reviewsForCourse = allReviews ? allReviews.filter(r => r.course_id === courseId) : [];

        renderCourseDetails(currentCourse, authorName, reviewsForCourse, modulesForCourse);
    }

    initCourseDetailPage();
});
