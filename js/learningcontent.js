document.addEventListener('DOMContentLoaded', async function () {
    const JSON_BASE_PATH = './json/';

    // DOM Elements
    const courseMainTitleEl = document.getElementById('course-main-title');
    const currentLessonTitleEl = document.getElementById('current-lesson-title');
    const videoPlayerIframe = document.getElementById('lesson-video-player');
    const lessonTextContentEl = document.getElementById('lesson-text-content');
    const moduleNavListContainer = document.getElementById('course-module-nav-list');
    const prevLessonBtn = document.getElementById('prev-lesson-btn');
    const nextLessonBtn = document.getElementById('next-lesson-btn');

    // Variabel level skrip untuk menyimpan data saat ini
    let currentCourseData = null;
    let currentModuleData = null; // Bisa digunakan untuk menandai modul aktif di sidebar
    let currentLessonData = null;
    let allModulesForCourse = []; // Daftar semua modul untuk kursus ini (dengan materi di dalamnya)
    let allLessonsForCourse = []; // Daftar pipih semua materi untuk navigasi mudah
    let loggedInUser = null;      // Data pengguna yang login

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

    // --- Get Parameters from URL ---
    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            courseId: urlParams.get('courseId'),
            moduleId: urlParams.get('moduleId'),
            lessonId: urlParams.get('lessonId')
        };
    }

    // --- Fungsi untuk menandai kursus selesai ---
    async function markCourseAsCompleted(courseId, userId) {
        if (!userId || !courseId) {
            console.warn("LearningContent: User ID atau Course ID kosong, tidak dapat menandai selesai.");
            return;
        }

        console.log(`LearningContent: Menandai kursus ${courseId} selesai untuk pengguna ${userId}`);

        let simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${userId}`);
        let simulatedEnrollments = [];
        try {
            simulatedEnrollments = simulatedEnrollmentsString ? JSON.parse(simulatedEnrollmentsString) : [];
        } catch (e) {
            console.error("LearningContent: Error parsing simulated_enrollments saat update penyelesaian", e);
            simulatedEnrollments = [];
        }

        let enrollmentUpdatedOrCreated = false;
        const enrollmentIndex = simulatedEnrollments.findIndex(e => e.course_id === courseId && e.user_id === userId);

        if (enrollmentIndex > -1) {
            simulatedEnrollments[enrollmentIndex].progress_percentage = 100;
            simulatedEnrollments[enrollmentIndex].completion_date = new Date().toISOString();
            enrollmentUpdatedOrCreated = true;
            console.log("LearningContent: Progres diperbarui menjadi 100% di simulated_enrollments untuk kursus:", courseId);
        } else {
            const baseEnrollments = await fetchData('enrollments.json') || [];
            const baseEnrollment = baseEnrollments.find(e => e.user_id === userId && e.course_id === courseId);

            const newCompletedEnrollment = {
                enrollment_id: baseEnrollment ? baseEnrollment.enrollment_id : `sim_cmplt_${userId}_${courseId}_${Date.now()}`,
                user_id: userId,
                course_id: courseId,
                enrollment_date: baseEnrollment ? baseEnrollment.enrollment_date : new Date().toISOString(),
                progress_percentage: 100,
                completion_date: new Date().toISOString()
            };
            simulatedEnrollments.push(newCompletedEnrollment);
            enrollmentUpdatedOrCreated = true;
            console.log("LearningContent: Membuat entri simulated_enrollment baru sebagai 100% untuk kursus:", courseId);
        }
        
        if (enrollmentUpdatedOrCreated) {
            localStorage.setItem(`simulated_enrollments_${userId}`, JSON.stringify(simulatedEnrollments));
        }
    }

    // --- Fungsi untuk memperbarui tombol navigasi ---
    function updateNavigationButtons() {
        if (!prevLessonBtn || !nextLessonBtn || !currentLessonData || !currentCourseData || !loggedInUser || !allLessonsForCourse || allLessonsForCourse.length === 0) {
            if(prevLessonBtn) prevLessonBtn.disabled = true;
            if(nextLessonBtn) nextLessonBtn.disabled = true;
            console.warn("LearningContent: Data tidak lengkap untuk update tombol navigasi.");
            return;
        }

        const currentIndex = allLessonsForCourse.findIndex(l => l.lesson_id === currentLessonData.lesson_id && l.module_id === currentLessonData.module_id);

        if (currentIndex === -1) {
            console.warn("LearningContent: Materi saat ini tidak ditemukan dalam daftar materi untuk navigasi.");
            prevLessonBtn.disabled = true;
            nextLessonBtn.disabled = true;
            return;
        }

        prevLessonBtn.disabled = currentIndex === 0;
        if (!prevLessonBtn.disabled) {
            const prevLesson = allLessonsForCourse[currentIndex - 1];
            prevLessonBtn.onclick = () => {
                window.location.href = `learningcontent.html?courseId=${currentCourseData.course_id}&moduleId=${prevLesson.module_id}&lessonId=${prevLesson.lesson_id}`;
            };
        } else {
            prevLessonBtn.onclick = null;
        }

        if (currentIndex === allLessonsForCourse.length - 1) { // Materi terakhir
            nextLessonBtn.textContent = 'Selesai';
            nextLessonBtn.disabled = false;
            nextLessonBtn.onclick = async () => {
                if (loggedInUser.user_id && currentCourseData.course_id) {
                    await markCourseAsCompleted(currentCourseData.course_id, loggedInUser.user_id);
                    window.location.href = `coursedetails.html?id=${currentCourseData.course_id}`;
                } else {
                    console.error("LearningContent: Tidak bisa menandai kursus sebagai selesai. Data pengguna atau kursus tidak ada.");
                    if (currentCourseData && currentCourseData.course_id) {
                         window.location.href = `coursedetails.html?id=${currentCourseData.course_id}`;
                    } else {
                        window.location.href = 'course.html'; // Fallback aman
                    }
                }
            };
        } else { // Bukan materi terakhir
            nextLessonBtn.textContent = 'Berikutnya';
            nextLessonBtn.disabled = false;
            const nextLesson = allLessonsForCourse[currentIndex + 1];
            nextLessonBtn.onclick = () => {
                window.location.href = `learningcontent.html?courseId=${currentCourseData.course_id}&moduleId=${nextLesson.module_id}&lessonId=${nextLesson.lesson_id}`;
            };
        }
    }
    
    // --- Render Page Content ---
    function displayLessonContent() {
        if (!currentLessonData) {
            console.error("LearningContent: Tidak ada data materi saat ini untuk ditampilkan.");
            if (videoPlayerIframe && videoPlayerIframe.parentElement) {
                videoPlayerIframe.style.display = 'none';
                videoPlayerIframe.parentElement.style.display = 'none'; // Sembunyikan wrapper juga
            }
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = '<p>Materi tidak ditemukan atau Anda tidak memiliki akses.</p>';
                lessonTextContentEl.style.display = 'block';
            }
            if (currentLessonTitleEl) currentLessonTitleEl.textContent = "Materi Tidak Tersedia";
            updateNavigationButtons(); // Tetap update tombol agar disable jika perlu
            return;
        }

        if (courseMainTitleEl && currentCourseData) courseMainTitleEl.textContent = currentCourseData.title || "Judul Kursus";
        if (currentLessonTitleEl) currentLessonTitleEl.textContent = currentLessonData.lesson_title || "Judul Materi";

        // Sembunyikan semua tipe konten dulu
        if (videoPlayerIframe && videoPlayerIframe.parentElement) {
            videoPlayerIframe.style.display = 'none';
            videoPlayerIframe.parentElement.style.display = 'none';
        }
        if (lessonTextContentEl) lessonTextContentEl.style.display = 'none';

        if (currentLessonData.lesson_type === 'video' && currentLessonData.content_url) {
            if (videoPlayerIframe && videoPlayerIframe.parentElement) {
                // Pastikan URL YouTube yang benar terbentuk
                // Contoh jika content_url adalah ID video YouTube:
                videoPlayerIframe.src = `https://www.youtube.com/embed/${currentLessonData.content_url}`;
                // Jika content_url adalah URL lengkap, langsung gunakan:
                // videoPlayerIframe.src = currentLessonData.content_url;
                videoPlayerIframe.style.display = 'block';
                videoPlayerIframe.parentElement.style.display = 'block';
            }
        } else if (currentLessonData.lesson_type === 'text' && currentLessonData.text_content) {
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = currentLessonData.text_content; // Langsung render HTML jika ada
                lessonTextContentEl.style.display = 'block';
            }
        } else {
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = '<p>Tipe konten tidak didukung atau konten tidak ditemukan.</p>';
                lessonTextContentEl.style.display = 'block';
            }
            console.warn("LearningContent: Tipe materi tidak didukung atau URL/konten teks hilang untuk materi:", currentLessonData.lesson_id);
        }
        updateNavigationButtons();
        highlightActiveLesson();
    }

    function renderModuleNavigation() {
        if (!moduleNavListContainer || !allModulesForCourse || !currentCourseData) {
            console.warn("LearningContent: Kontainer navigasi modul atau data kursus/modul hilang.");
            if(moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Gagal memuat daftar materi.</p>"
            return;
        }
        moduleNavListContainer.innerHTML = '';

        allModulesForCourse.forEach(module => {
            const moduleItemDiv = document.createElement('div');
            moduleItemDiv.className = 'course-module-item';
            const button = document.createElement('button');
            button.className = 'course-module-item-button';
            button.textContent = module.module_title || 'Judul Modul';
            button.dataset.moduleId = module.module_id;
            const contentDiv = document.createElement('div');
            contentDiv.className = 'course-module-item-content';

            if (module.lessons && module.lessons.length > 0) {
                module.lessons.forEach(lesson => {
                    const lessonLink = document.createElement('a');
                    lessonLink.href = `learningcontent.html?courseId=${currentCourseData.course_id}&moduleId=${module.module_id}&lessonId=${lesson.lesson_id}`;
                    lessonLink.textContent = lesson.lesson_title || 'Judul Materi';
                    lessonLink.dataset.lessonId = lesson.lesson_id;
                    contentDiv.appendChild(lessonLink);
                });
            } else {
                contentDiv.innerHTML = '<p>Tidak ada materi dalam modul ini.</p>';
            }
            moduleItemDiv.appendChild(button);
            moduleItemDiv.appendChild(contentDiv);
            moduleNavListContainer.appendChild(moduleItemDiv);

            button.addEventListener("click", function () {
                const isActive = this.classList.contains("active");
                // Tutup semua item lain jika ada yang terbuka (opsional, bisa juga membolehkan multiple open)
                moduleNavListContainer.querySelectorAll('.course-module-item-button.active').forEach(activeBtn => {
                    if (activeBtn !== this) {
                        activeBtn.classList.remove("active");
                        activeBtn.nextElementSibling.style.maxHeight = null;
                    }
                });
                // Toggle item saat ini
                this.classList.toggle("active", !isActive);
                this.nextElementSibling.style.maxHeight = !isActive ? this.nextElementSibling.scrollHeight + "px" : null;
            });
            // Buka modul aktif saat halaman dimuat
            if (currentModuleData && module.module_id === currentModuleData.module_id) {
                button.classList.add('active');
                contentDiv.style.maxHeight = contentDiv.scrollHeight + "px";
            }
        });
        highlightActiveLesson(); // Panggil setelah semua link dibuat
    }

    function highlightActiveLesson() {
        if (!moduleNavListContainer || !currentLessonData) return;
        moduleNavListContainer.querySelectorAll('a').forEach(link => {
            link.classList.remove('active-lesson');
            const linkModuleId = link.href.split('moduleId=')[1]?.split('&')[0];
            if (link.dataset.lessonId === currentLessonData.lesson_id && linkModuleId === currentLessonData.module_id) {
                link.classList.add('active-lesson');
            }
        });
    }
    
    async function checkAccess(courseId) {
        const loggedInUserString = localStorage.getItem('loggedInUser');
        if (!loggedInUserString) {
            if (typeof showPopup === 'function') { // Asumsi showPopup dari global.js
                showPopup("Anda harus login untuk mengakses materi ini.", false, "Anda akan diarahkan ke halaman login.", true);
                setTimeout(() => window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`, 3000);
            } else {
                alert("Anda harus login untuk mengakses materi ini.");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
            return false;
        }
        try {
            loggedInUser = JSON.parse(loggedInUserString); // Set variabel global loggedInUser
            if (!loggedInUser || !loggedInUser.user_id) throw new Error("User data invalid");
        } catch (e) {
            console.error("LearningContent: Gagal parse loggedInUser atau user_id tidak ada.", e);
            if (typeof showPopup === 'function') {
                showPopup("Sesi login Anda tidak valid. Silakan login kembali.", false, "Anda akan diarahkan ke halaman login.", true);
                setTimeout(() => window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`, 3000);
            } else {
                alert("Sesi login Anda tidak valid. Silakan login kembali.");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
            return false;
        }

        const userPlanStatusString = localStorage.getItem('userPlanStatus');
        if (userPlanStatusString) {
            try {
                const userPlanStatus = JSON.parse(userPlanStatusString);
                if (userPlanStatus && userPlanStatus.active === true && userPlanStatus.user_id === loggedInUser.user_id) {
                    return true; // Punya paket aktif
                }
            } catch (e) { /* console.error */ }
        }

        const enrollments = await fetchData('enrollments.json') || [];
        const isEnrolled = enrollments.some(e => e.user_id === loggedInUser.user_id && e.course_id === courseId);
        if (isEnrolled) return true; // Terdaftar langsung

        // Cek juga simulated enrollments
        const simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`);
        if (simulatedEnrollmentsString) {
            try {
                const simulatedEnrollments = JSON.parse(simulatedEnrollmentsString);
                if (simulatedEnrollments.some(e => e.user_id === loggedInUser.user_id && e.course_id === courseId)) {
                    return true; // Ada simulated enrollment (dianggap punya akses)
                }
            } catch (e) { /* console.error */ }
        }
        
        // Jika tidak ada akses
        if (typeof showPopup === 'function') {
            showPopup("Anda belum memiliki akses ke kursus ini.", false, "Anda akan diarahkan ke detail kursus.", true);
            setTimeout(() => window.location.href = `coursedetails.html?id=${courseId}`, 3000);
        } else {
            alert("Anda belum memiliki akses ke kursus ini.");
            window.location.href = `coursedetails.html?id=${courseId}`;
        }
        return false;
    }

    // --- Initialization ---
    async function initLearningPage() {
        const params = getUrlParams();
        if (!params.courseId || !params.moduleId || !params.lessonId) {
            console.error("LearningContent: Parameter URL tidak lengkap (courseId, moduleId, atau lessonId).");
            if(courseMainTitleEl) courseMainTitleEl.textContent = "Error: Informasi Materi Tidak Lengkap";
            if(moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Parameter tidak lengkap.</p>";
            if(lessonTextContentEl) lessonTextContentEl.innerHTML = "<p>Parameter tidak lengkap.</p>";
            if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
            updateNavigationButtons(); // Disable tombol
            return;
        }

        const hasAccess = await checkAccess(params.courseId); // Ini juga set loggedInUser global
        if (!hasAccess) {
            console.log("LearningContent: Akses ditolak. Inisialisasi halaman dihentikan.");
            if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
            if (lessonTextContentEl) lessonTextContentEl.style.display = 'none';
            if (moduleNavListContainer) moduleNavListContainer.innerHTML = '<p>Akses ditolak. Silakan periksa status langganan atau pembelian Anda.</p>';
            if (currentLessonTitleEl) currentLessonTitleEl.textContent = "Akses Ditolak";
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Akses Ditolak";
            updateNavigationButtons(); // Disable tombol
            return;
        }

        const [courses, modules, lessons] = await Promise.all([
            fetchData('courses.json'),
            fetchData('modules.json'),
            fetchData('lessons.json')
        ]);

        if (!courses || !modules || !lessons) {
            console.error("LearningContent: Gagal memuat data penting (kursus, modul, atau materi).");
            if(courseMainTitleEl) courseMainTitleEl.textContent = "Gagal Memuat Data";
            return;
        }

        currentCourseData = courses.find(c => c.course_id === params.courseId);
        if (!currentCourseData) {
            console.error(`LearningContent: Data kursus tidak ditemukan untuk ID: ${params.courseId}`);
            if(courseMainTitleEl) courseMainTitleEl.textContent = "Kursus Tidak Ditemukan";
            return;
        }

        allModulesForCourse = modules.filter(m => m.course_id === params.courseId)
            .map(mod => ({
                ...mod,
                lessons: lessons.filter(l => l.module_id === mod.module_id).sort((a, b) => (a.order || 0) - (b.order || 0))
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        allLessonsForCourse = [];
        allModulesForCourse.forEach(mod => {
            mod.lessons.forEach(les => {
                allLessonsForCourse.push({ ...les, module_id: mod.module_id }); // Tambahkan module_id untuk navigasi
            });
        });
        // allLessonsForCourse sudah implisit terurut karena allModulesForCourse dan lessons di dalamnya sudah diurutkan

        currentLessonData = allLessonsForCourse.find(l => l.lesson_id === params.lessonId && l.module_id === params.moduleId);
        currentModuleData = allModulesForCourse.find(m => m.module_id === params.moduleId); // Untuk membuka accordion

        if (!currentLessonData) {
            console.warn(`LearningContent: Data materi tidak ditemukan untuk lessonId: ${params.lessonId} di moduleId: ${params.moduleId}.`);
            if (allLessonsForCourse.length > 0) {
                console.warn("LearningContent: Mengarahkan ke materi pertama yang tersedia di kursus ini.");
                const firstLesson = allLessonsForCourse[0];
                // Redirect ke URL materi pertama
                window.location.href = `learningcontent.html?courseId=${params.courseId}&moduleId=${firstLesson.module_id}&lessonId=${firstLesson.lesson_id}`;
                return; // Hentikan eksekusi lebih lanjut karena akan ada redirect
            } else {
                console.error("LearningContent: Tidak ada materi sama sekali di kursus ini.");
                // Tampilkan pesan error di UI
                if(courseMainTitleEl && currentCourseData) courseMainTitleEl.textContent = currentCourseData.title || "Judul Kursus";
                if(currentLessonTitleEl) currentLessonTitleEl.textContent = "Tidak Ada Materi";
                if(lessonTextContentEl) {
                    lessonTextContentEl.innerHTML = "<p>Kursus ini belum memiliki materi pembelajaran.</p>";
                    lessonTextContentEl.style.display = 'block';
                }
                if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
                if(moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Tidak ada materi.</p>";
                updateNavigationButtons(); // Disable tombol
                return;
            }
        }
        
        renderModuleNavigation(); // Render navigasi modul dulu agar materi aktif bisa di-highlight
        displayLessonContent(); // Kemudian tampilkan konten materi (termasuk update tombol & highlight)
    }

    initLearningPage();
});