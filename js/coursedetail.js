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

    // Elemen untuk form ulasan
    const submitReviewContainer = document.getElementById('submit-review-container');
    const reviewForm = document.getElementById('review-form');
    const submitReviewButton = document.getElementById('submit-review-button');
    const reviewCommentTextarea = document.getElementById('review-comment');
    const reviewSubmissionMessageEl = document.getElementById('review-submission-message');

    // Variabel level skrip
    let currentCourseData = null;
    let loggedInUser = null;
    let userSubmittedReviews = []; // Cache untuk ulasan dari localStorage (diisi saat init)
    let localBaseEnrollments = []; // Cache untuk enrollments.json (diisi saat init)
    let baseReviewsCache = []; // Cache untuk reviews.json (diisi saat init)

    // --- Helper: Fetch Data ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status} for ${fileName}`);
                return null; // Kembalikan null agar bisa dicek eksplisit
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch ${fileName}:`, error);
            return null;
        }
    }

    function getCourseIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async function checkCourseCompletionAndReviewStatus(courseId, userId) {
        let isCompleted = false;
        let userEnrollment = (localBaseEnrollments || []).find(e => e.user_id === userId && e.course_id === courseId);

        const simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${userId}`);
        if (simulatedEnrollmentsString) {
            try {
                const simulatedEnrollments = JSON.parse(simulatedEnrollmentsString);
                const simulatedEnrollmentForCourse = simulatedEnrollments.find(e => e.user_id === userId && e.course_id === courseId);
                if (simulatedEnrollmentForCourse) {
                    userEnrollment = { ...userEnrollment, ...simulatedEnrollmentForCourse };
                }
            } catch (e) { console.error("Error parsing simulated enrollments for review check:", e); }
        }

        if (userEnrollment && userEnrollment.progress_percentage === 100) {
            isCompleted = true;
        }
        // userSubmittedReviews sudah di-cache secara global
        const hasReviewed = userSubmittedReviews.some(r => r.user_id === userId && r.course_id === courseId);
        return { isCompleted, hasReviewed };
    }

    function updateRatingDisplay(reviewsForThisCourse) {
        if (!reviewsForThisCourse) return;
        const totalRating = reviewsForThisCourse.reduce((sum, review) => sum + (parseFloat(review.rating) || 0), 0);
        const avgRating = reviewsForThisCourse.length > 0 ? (totalRating / reviewsForThisCourse.length) : 0;

        if (ratingAverageEl) ratingAverageEl.textContent = avgRating > 0 ? avgRating.toFixed(1) : 'N/A';
        if (starsContainerEl) {
            starsContainerEl.innerHTML = '';
            const ratingVisual = avgRating > 0 ? Math.round(avgRating * 2) / 2 : 0;
            for (let i = 1; i <= 5; i++) {
                const starImg = document.createElement('img');
                starImg.src = `assets/icon/rating_${ratingVisual >= i ? 'full' : (ratingVisual >= i - 0.5 ? 'half' : 'blank')}.png`;
                starImg.alt = 'Rating Star';
                starsContainerEl.appendChild(starImg);
            }
        }
        if (reviewCountEl) reviewCountEl.textContent = `${reviewsForThisCourse.length} Ulasan`;
    }

    async function updateMulaiButtonState(courseId) {
        if (!mulaiBelajarButton || !courseId) {
            if (mulaiBelajarButton) {
                mulaiBelajarButton.classList.add('disabled');
                mulaiBelajarButton.textContent = 'Informasi Tidak Lengkap';
                mulaiBelajarButton.href = '#';
            }
            return;
        }
        // loggedInUser sudah di-set di initCourseDetailPage
        let isCourseStarted = false;
        if (loggedInUser && loggedInUser.user_id) {
            let userEnrollmentRecord = (localBaseEnrollments || []).find(enr => enr.user_id === loggedInUser.user_id && enr.course_id === courseId);
            const simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`);
            if (simulatedEnrollmentsString) {
                try {
                    const simulatedEnrollments = JSON.parse(simulatedEnrollmentsString);
                    const simulatedRecord = simulatedEnrollments.find(enr => enr.course_id === courseId);
                    if (simulatedRecord) userEnrollmentRecord = { ...userEnrollmentRecord, ...simulatedRecord };
                } catch (e) { /* console.error */ }
            }
            if (userEnrollmentRecord) isCourseStarted = true;
        }

        let hasGeneralPlanAccess = false;
        if (loggedInUser && loggedInUser.user_id) {
            const userPlanStatusString = localStorage.getItem('userPlanStatus');
            if (userPlanStatusString) {
                try {
                    const userPlanStatus = JSON.parse(userPlanStatusString);
                    if (userPlanStatus && userPlanStatus.active === true && userPlanStatus.user_id === loggedInUser.user_id) {
                        hasGeneralPlanAccess = true;
                    }
                } catch (e) { /* console.error */ }
            }
        }

        const modulesData = await fetchData('modules.json') || [];
        const lessonsData = await fetchData('lessons.json') || [];
        const modulesForThisCourse = modulesData.filter(m => m.course_id === courseId).sort((a, b) => (a.order || 0) - (b.order || 0));
        let firstLessonLink = `learningcontent.html?courseId=${courseId}`;
        for (const module of modulesForThisCourse) {
            const lessonsForModule = lessonsData.filter(l => l.module_id === module.module_id).sort((a, b) => (a.order || 0) - (b.order || 0));
            if (lessonsForModule.length > 0) {
                firstLessonLink = `learningcontent.html?courseId=${courseId}&moduleId=${module.module_id}&lessonId=${lessonsForModule[0].lesson_id}`;
                break;
            }
        }

        mulaiBelajarButton.classList.remove('disabled');
        if (loggedInUser && loggedInUser.user_id) {
            mulaiBelajarButton.href = firstLessonLink;
            if (isCourseStarted) {
                mulaiBelajarButton.textContent = 'Lanjutkan';
                mulaiBelajarButton.onclick = () => { window.location.href = firstLessonLink; };
            } else if (hasGeneralPlanAccess) {
                mulaiBelajarButton.textContent = 'Mulai Belajar';
                mulaiBelajarButton.onclick = async (e) => {
                    e.preventDefault();
                    let simulatedEnrollments = JSON.parse(localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`)) || [];
                    if (!simulatedEnrollments.find(enr => enr.course_id === courseId)) {
                        const newEnrollment = { enrollment_id: `sim_enr_${loggedInUser.user_id}_${courseId}_${Date.now()}`, user_id: loggedInUser.user_id, course_id: courseId, enrollment_date: new Date().toISOString(), progress_percentage: 1, completion_date: null };
                        simulatedEnrollments.push(newEnrollment);
                        localStorage.setItem(`simulated_enrollments_${loggedInUser.user_id}`, JSON.stringify(simulatedEnrollments));
                    }
                    window.location.href = firstLessonLink;
                };
            } else {
                mulaiBelajarButton.textContent = 'Beli Akses / Gabung Paket';
                mulaiBelajarButton.href = `pricing.html?courseId=${courseId}`;
                mulaiBelajarButton.onclick = null;
            }
        } else {
            mulaiBelajarButton.textContent = 'Mulai Belajar';
            mulaiBelajarButton.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            mulaiBelajarButton.onclick = null;
        }
    }

    function renderModules(modules, courseId) {
        if (!modulesListContainer) return;
        modulesListContainer.innerHTML = (!modules || modules.length === 0) ? '<p>Belum ada modul untuk kursus ini.</p>' : '';
        if (!modules || modules.length === 0) return;
        modules.forEach(module => {
            const moduleItemDiv = document.createElement('div');
            moduleItemDiv.className = 'course-module-item';
            const button = document.createElement('button');
            button.className = 'course-module-item-button';
            button.textContent = module.module_title || 'Judul Modul';
            const contentDiv = document.createElement('div');
            contentDiv.className = 'course-module-item-content';
            if (module.lessons && module.lessons.length > 0) {
                module.lessons.forEach(lesson => {
                    const lessonLink = document.createElement('a');
                    lessonLink.href = `learningcontent.html?courseId=${courseId}&moduleId=${module.module_id}&lessonId=${lesson.lesson_id}`;
                    lessonLink.textContent = lesson.lesson_title || 'Judul Materi';
                    contentDiv.appendChild(lessonLink);
                });
            } else { contentDiv.innerHTML = '<p>Belum ada materi di modul ini.</p>'; }
            moduleItemDiv.appendChild(button);
            moduleItemDiv.appendChild(contentDiv);
            modulesListContainer.appendChild(moduleItemDiv);
            button.addEventListener("click", function () {
                const isActive = this.classList.contains("active");
                modulesListContainer.querySelectorAll('.course-module-item-button.active').forEach(activeBtn => {
                    if (activeBtn !== this) { activeBtn.classList.remove("active"); activeBtn.nextElementSibling.style.maxHeight = null; }
                });
                this.classList.toggle("active", !isActive);
                this.nextElementSibling.style.maxHeight = !isActive ? this.nextElementSibling.scrollHeight + "px" : null;
            });
        });
    }

    async function renderReviews() {
        if (!reviewsListContainer || !currentCourseData) {
            if (reviewsListContainer) reviewsListContainer.innerHTML = '<p>Memuat ulasan...</p>';
            return;
        }
        const courseId = currentCourseData.course_id;
        const courseSpecificBaseReviews = (baseReviewsCache || []).filter(r => r.course_id === courseId);
        const courseSpecificUserReviews = userSubmittedReviews.filter(r => r.course_id === courseId);

        let displayableReviews = [...courseSpecificBaseReviews];
        courseSpecificUserReviews.forEach(lsReview => {
            const existingIndex = displayableReviews.findIndex(br => br.user_id === lsReview.user_id /* && br.course_id === lsReview.course_id */); // course_id sudah difilter
            if (existingIndex > -1) {
                displayableReviews[existingIndex] = lsReview; // Update dengan ulasan dari localStorage jika user sama
            } else {
                displayableReviews.push(lsReview); // Tambah ulasan baru dari user
            }
        });
        displayableReviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        updateRatingDisplay(displayableReviews); // Update summary rating di kartu utama

        if (displayableReviews.length === 0) {
            reviewsListContainer.innerHTML = '<p>Belum ada ulasan untuk kursus ini.</p>';
            return;
        }
        reviewsListContainer.innerHTML = '';
        const usersData = await fetchData('users.json') || [];
        displayableReviews.forEach(review => {
            const reviewer = usersData.find(u => u.user_id === review.user_id);
            const reviewerName = reviewer ? reviewer.name : 'Pengguna Anonim';
            const reviewerImage = reviewer ? (reviewer.image_url || 'assets/user/default_profile_nav.png') : 'assets/user/default_profile_nav.png';
            const reviewCard = document.createElement('div');
            reviewCard.className = 'course-review-card';
            let starsHTML = '';
            const rating = review.rating ? Math.round(parseFloat(review.rating) * 2) / 2 : 0;
            for (let i = 1; i <= 5; i++) {
                starsHTML += `<img src="assets/icon/rating_${rating >= i ? 'full' : (rating >= i - 0.5 ? 'half' : 'blank')}.png" alt="Rating Star">`;
            }
            let reviewTime = 'Beberapa waktu lalu';
            if (review.timestamp) {
                try { reviewTime = new Date(review.timestamp).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { /* ignore */ }
            }
            reviewCard.innerHTML = `
                <img src="${reviewerImage}" alt="Foto profil ${reviewerName}" class="profile" onerror="this.src='assets/user/default_profile_nav.png'; this.alt='Avatar Default';">
                <div class="course-review-content">
                    <div class="course-review-meta"><h3>${reviewerName}</h3><h4>${reviewTime}</h4></div>
                    <div class="course-review-detail"><div class="course-star">${starsHTML}</div><div class="course-review-description"><p>${review.comment || 'Tidak ada komentar.'}</p></div></div>
                </div>`;
            reviewsListContainer.appendChild(reviewCard);
        });
    }

    function renderCourseDetails(course, authorName, modulesForCourse) {
        if (!course) {
            if (detailCardContainer) detailCardContainer.innerHTML = "<p>Detail kursus tidak ditemukan.</p>";
            if (mulaiBelajarButton) { mulaiBelajarButton.classList.add('disabled'); mulaiBelajarButton.textContent = "Error"; }
            [courseInfoTextEl, courseRequirementsTextEl, modulesListContainer, reviewsListContainer, submitReviewContainer].forEach(el => {
                if (el) { el.innerHTML = '<p>Informasi tidak tersedia.</p>'; if (el.parentElement && el.parentElement.tagName === 'SECTION') el.parentElement.style.display = 'none'; }
            });
            return;
        }
        currentCourseData = course; // Set variabel global

        if (coursePictImg) {
            coursePictImg.src = course.image_banner_url || `https://placehold.co/300x169/EAEAEA/B0B0B0?text=${encodeURIComponent(course.title || 'Kursus')}`;
            coursePictImg.alt = course.title || 'Gambar Kursus';
            coursePictImg.onerror = function () { this.src = 'https://placehold.co/300x169/EAEAEA/B0B0B0?text=Error'; this.alt = 'Gambar tidak tersedia'; };
        }
        if (courseTitleEl) courseTitleEl.textContent = course.title || 'Judul Tidak Tersedia';
        if (courseAuthorEl) courseAuthorEl.textContent = `oleh ${authorName || 'Pengajar Ahli'}`;
        if (courseDescriptionEl) courseDescriptionEl.textContent = course.description_long || course.description_short || 'Deskripsi tidak tersedia.';
        if (participantCountEl) participantCountEl.textContent = (course.participant_count || 0).toLocaleString('id-ID');

        if (courseInfoTextEl) courseInfoTextEl.textContent = course.information_details || 'Informasi detail tidak tersedia.';
        if (courseRequirementsTextEl) courseRequirementsTextEl.textContent = course.requirements || 'Tidak ada persyaratan khusus.';

        renderModules(modulesForCourse, course.course_id);
        renderReviews(); // renderReviews akan memanggil updateRatingDisplay secara internal
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (!loggedInUser || !loggedInUser.user_id || !currentCourseData || !currentCourseData.course_id) {
                reviewSubmissionMessageEl.textContent = "Silakan login untuk memberi ulasan.";
                reviewSubmissionMessageEl.className = 'error';
                reviewSubmissionMessageEl.style.display = 'block';
                return;
            }

            const ratingSelected = reviewForm.querySelector('input[name="rating"]:checked');
            const rating = ratingSelected ? parseInt(ratingSelected.value) : null;
            const comment = reviewCommentTextarea.value.trim();

            if (!rating) {
                reviewSubmissionMessageEl.textContent = "Mohon pilih rating bintang.";
                reviewSubmissionMessageEl.className = 'error';
                reviewSubmissionMessageEl.style.display = 'block';
                return;
            }

            const existingReviewIndex = userSubmittedReviews.findIndex(r => r.user_id === loggedInUser.user_id && r.course_id === currentCourseData.course_id);
            let message = "";
            if (existingReviewIndex > -1) {
                userSubmittedReviews[existingReviewIndex].rating = rating;
                userSubmittedReviews[existingReviewIndex].comment = comment;
                userSubmittedReviews[existingReviewIndex].timestamp = new Date().toISOString();
                message = "Ulasan berhasil diperbarui!";
            } else {
                const newReview = {
                    review_id: `rev_user_${loggedInUser.user_id}_${currentCourseData.course_id}_${Date.now()}`,
                    course_id: currentCourseData.course_id,
                    user_id: loggedInUser.user_id,
                    rating: rating,
                    comment: comment,
                    timestamp: new Date().toISOString()
                };
                userSubmittedReviews.push(newReview);
                message = "Ulasan berhasil dikirim! Terima kasih.";
            }
            localStorage.setItem('user_submitted_reviews', JSON.stringify(userSubmittedReviews));

            reviewSubmissionMessageEl.textContent = message;
            reviewSubmissionMessageEl.className = 'success';
            reviewSubmissionMessageEl.style.display = 'block';

            if (submitReviewButton) submitReviewButton.textContent = "Perbarui Ulasan"; // Tombol tetap "Perbarui"
            // Form tidak disembunyikan agar bisa edit lagi

            await renderReviews(); // Render ulang daftar ulasan (ini juga update rating summary)
        });
    }

    async function initCourseDetailPage() {
        const courseId = getCourseIdFromURL();
        if (!courseId) {
            if (detailCardContainer) detailCardContainer.innerHTML = "<h1>ID Kursus tidak valid atau tidak ditemukan.</h1>";
            if (mulaiBelajarButton) { mulaiBelajarButton.textContent = 'Error'; mulaiBelajarButton.classList.add('disabled'); }
            return;
        }

        const loggedInUserString = localStorage.getItem('loggedInUser');
        if (loggedInUserString) {
            try { loggedInUser = JSON.parse(loggedInUserString); } catch (e) { loggedInUser = null; }
        }
        userSubmittedReviews = JSON.parse(localStorage.getItem('user_submitted_reviews')) || [];
        localBaseEnrollments = await fetchData('enrollments.json') || [];
        baseReviewsCache = await fetchData('reviews.json') || []; // Fetch dan cache reviews.json
        localStorage.setItem('reviews_base_cache', JSON.stringify(baseReviewsCache));


        const [allCourses, allUsers, allModules, allLessons] = await Promise.all([
            fetchData('courses.json'),
            fetchData('users.json'),
            fetchData('modules.json'),
            fetchData('lessons.json'),
            // baseReviews sudah di-fetch di atas
        ]);

        if (!allCourses || !allUsers) {
            if (detailCardContainer) detailCardContainer.innerHTML = "<p>Gagal memuat data kursus atau pengguna.</p>"; return;
        }
        const currentCourse = allCourses.find(c => c.course_id === courseId);
        if (!currentCourse) {
            if (detailCardContainer) detailCardContainer.innerHTML = `<h1>Kursus dengan ID "${courseId}" tidak ditemukan.</h1>`;
            if (mulaiBelajarButton) { mulaiBelajarButton.textContent = 'Kursus Tidak Ada'; mulaiBelajarButton.classList.add('disabled'); }
            return;
        }
        currentCourseData = currentCourse;

        const author = allUsers.find(u => u.user_id === currentCourse.author_id);
        const authorName = author ? author.name : 'Pengajar Ahli';
        const modulesForCourse = (allModules || []).filter(m => m.course_id === courseId).map(mod => ({
            ...mod,
            lessons: (allLessons || []).filter(l => l.module_id === mod.module_id).sort((a, b) => (a.order || 0) - (b.order || 0))
        })).sort((a, b) => (a.order || 0) - (b.order || 0));

        renderCourseDetails(currentCourse, authorName, modulesForCourse);
        await updateMulaiButtonState(currentCourse.course_id);

        if (loggedInUser && loggedInUser.user_id && currentCourseData && submitReviewContainer) {
            const { isCompleted, hasReviewed } = await checkCourseCompletionAndReviewStatus(currentCourseData.course_id, loggedInUser.user_id);
            const reviewSectionTitle = submitReviewContainer.querySelector('h2');
            if (!reviewSectionTitle) return; // Guard clause

            if (isCompleted) {
                submitReviewContainer.style.display = 'block';
                if (reviewForm) reviewForm.style.display = 'block'; // Selalu tampilkan form jika sudah selesai
                if (reviewSubmissionMessageEl) reviewSubmissionMessageEl.style.display = 'none'; // Sembunyikan pesan awal

                if (hasReviewed) {
                    reviewSectionTitle.textContent = "Edit Ulasan Anda";
                    if (submitReviewButton) submitReviewButton.textContent = "Perbarui Ulasan";
                    const existingReview = userSubmittedReviews.find(r => r.user_id === loggedInUser.user_id && r.course_id === currentCourseData.course_id);
                    if (existingReview && reviewForm) {
                        const starInput = reviewForm.querySelector(`.star-rating-input input[name="rating"][value="${existingReview.rating}"]`);
                        if (starInput) starInput.checked = true;
                        if (reviewCommentTextarea) reviewCommentTextarea.value = existingReview.comment;
                    }
                } else {
                    reviewSectionTitle.textContent = "Tulis Ulasan Anda";
                    if (submitReviewButton) submitReviewButton.textContent = "Kirim Ulasan";
                    if (reviewForm) reviewForm.reset();
                }
            } else {
                submitReviewContainer.style.display = 'block';
                if (reviewForm) reviewForm.style.display = 'none';
                reviewSectionTitle.textContent = "Ulasan Pelatihan";
                if (reviewSubmissionMessageEl) {
                    reviewSubmissionMessageEl.textContent = "Selesaikan pelatihan ini untuk memberikan ulasan.";
                    reviewSubmissionMessageEl.className = '';
                    reviewSubmissionMessageEl.style.display = 'block';
                }
            }
        } else if (submitReviewContainer) {
            submitReviewContainer.style.display = 'none';
        }
    }

    initCourseDetailPage();
});