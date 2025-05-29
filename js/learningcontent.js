document.addEventListener('DOMContentLoaded', async function () {
    // --- Variabel Global & Selektor DOM ---
    const JSON_BASE_PATH = './json/';

    const courseMainTitleEl = document.getElementById('course-main-title');
    const currentLessonTitleEl = document.getElementById('current-lesson-title');
    const videoPlayerIframe = document.getElementById('lesson-video-player');
    const lessonTextContentEl = document.getElementById('lesson-text-content');
    const moduleNavListContainer = document.getElementById('course-module-nav-list');
    const prevLessonBtn = document.getElementById('prev-lesson-btn');
    const nextLessonBtn = document.getElementById('next-lesson-btn');

    let currentCourseData = null;
    let currentModuleData = null;
    let currentLessonData = null;
    let allModulesForCourse = [];
    let allLessonsForCourse = []; // Daftar semua materi (flattened) untuk navigasi
    let loggedInUser = null;

    // --- Fungsi Utilitas Pengambilan Data & Parameter URL ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status} untuk ${fileName}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Tidak dapat mengambil ${fileName}:`, error);
            return null;
        }
    }

    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            courseId: urlParams.get('courseId'),
            moduleId: urlParams.get('moduleId'),
            lessonId: urlParams.get('lessonId')
        };
    }

    // --- Fungsi Utama Logika Halaman Pembelajaran ---

    // Fungsi untuk menandai kursus selesai dan update progres di localStorage
    async function markCourseAsCompleted(courseId, userId) {
        if (!userId || !courseId) {
            console.warn("LearningContent: User ID atau Course ID kosong, tidak dapat menandai kursus selesai.");
            return;
        }
        console.log(`LearningContent: Menandai kursus ${courseId} selesai untuk pengguna ${userId}`);

        let simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${userId}`);
        let simulatedEnrollments = [];
        try {
            simulatedEnrollments = simulatedEnrollmentsString ? JSON.parse(simulatedEnrollmentsString) : [];
        } catch (e) {
            console.error("LearningContent: Error memparsing simulated_enrollments saat memperbarui status penyelesaian", e);
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
            console.log("LearningContent: Membuat entri simulated_enrollment baru dengan progres 100% untuk kursus:", courseId);
        }

        if (enrollmentUpdatedOrCreated) {
            localStorage.setItem(`simulated_enrollments_${userId}`, JSON.stringify(simulatedEnrollments));
        }
    }

    // *** NEW FUNCTION: Fungsi untuk memperbarui progres kursus ***
    async function updateProgress(courseId, userId) {
        if (!userId || !courseId || !currentLessonData || !allLessonsForCourse || allLessonsForCourse.length === 0) {
            console.warn("LearningContent: Data tidak lengkap untuk memperbarui progres.");
            return;
        }

        const currentIndex = allLessonsForCourse.findIndex(l => l.lesson_id === currentLessonData.lesson_id && l.module_id === currentLessonData.module_id);
        const totalLessons = allLessonsForCourse.length;

        if (currentIndex === -1) {
            console.warn("LearningContent: Materi saat ini tidak ditemukan, tidak dapat memperbarui progres.");
            return;
        }

        // Hitung progres berdasarkan materi saat ini
        let progressPercentage = Math.round(((currentIndex + 1) / totalLessons) * 100);

        let simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${userId}`);
        let simulatedEnrollments = [];
        try {
            simulatedEnrollments = simulatedEnrollmentsString ? JSON.parse(simulatedEnrollmentsString) : [];
        } catch (e) {
            console.error("LearningContent: Error memparsing simulated_enrollments saat memperbarui progres", e);
            simulatedEnrollments = [];
        }

        const enrollmentIndex = simulatedEnrollments.findIndex(e => e.course_id === courseId && e.user_id === userId);

        if (enrollmentIndex > -1) {
            // Hanya update jika progres saat ini < 100% DAN progres baru lebih tinggi
            if (simulatedEnrollments[enrollmentIndex].progress_percentage < 100 &&
                simulatedEnrollments[enrollmentIndex].progress_percentage < progressPercentage) {
                simulatedEnrollments[enrollmentIndex].progress_percentage = progressPercentage;
                simulatedEnrollments[enrollmentIndex].completion_date = null; // Hapus tgl selesai jika belum 100%
                localStorage.setItem(`simulated_enrollments_${userId}`, JSON.stringify(simulatedEnrollments));
                console.log(`LearningContent: Progres diperbarui menjadi ${progressPercentage}% untuk kursus:`, courseId);
            }
        } else {
            // Jika belum ada, buat entri baru (seharusnya jarang terjadi jika akses sudah ada)
            const baseEnrollments = await fetchData('enrollments.json') || [];
            const baseEnrollment = baseEnrollments.find(e => e.user_id === userId && e.course_id === courseId);

            const newEnrollment = {
                enrollment_id: baseEnrollment ? baseEnrollment.enrollment_id : `sim_prog_${userId}_${courseId}_${Date.now()}`,
                user_id: userId,
                course_id: courseId,
                enrollment_date: baseEnrollment ? baseEnrollment.enrollment_date : new Date().toISOString(),
                progress_percentage: progressPercentage,
                completion_date: null
            };
            simulatedEnrollments.push(newEnrollment);
            localStorage.setItem(`simulated_enrollments_${userId}`, JSON.stringify(simulatedEnrollments));
            console.log(`LearningContent: Membuat entri simulated_enrollment baru dengan progres ${progressPercentage}% untuk kursus:`, courseId);
        }
    }


    // Fungsi untuk memperbarui tombol navigasi materi (Sebelumnya/Berikutnya/Selesai)
    function updateNavigationButtons() {
        if (!prevLessonBtn || !nextLessonBtn || !currentLessonData || !currentCourseData || !loggedInUser || !allLessonsForCourse || allLessonsForCourse.length === 0) {
            if (prevLessonBtn) prevLessonBtn.disabled = true;
            if (nextLessonBtn) nextLessonBtn.disabled = true;
            console.warn("LearningContent: Data tidak lengkap untuk memperbarui tombol navigasi.");
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
                if (loggedInUser && loggedInUser.user_id && currentCourseData && currentCourseData.course_id) {
                    await markCourseAsCompleted(currentCourseData.course_id, loggedInUser.user_id);
                    // *** MODIFICATION: Tampilkan popup sebelum redirect ***
                    showPopup(`Selamat! Anda telah menyelesaikan kursus "${currentCourseData.title}".\nProgress Anda: 100%`, true);
                    setTimeout(() => window.location.href = `coursedetails.html?id=${currentCourseData.course_id}`, 3000);
                    // Arahkan ke detail kursus setelah selesai
                    ;
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

    // Fungsi untuk Menampilkan Konten Materi (Video/Teks)
    function displayLessonContent() {
        if (!currentLessonData) {
            console.error("LearningContent: Tidak ada data materi saat ini untuk ditampilkan.");
            if (videoPlayerIframe && videoPlayerIframe.parentElement) {
                videoPlayerIframe.style.display = 'none';
                videoPlayerIframe.parentElement.style.display = 'none';
            }
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = '<p>Materi tidak ditemukan atau Anda tidak memiliki akses.</p>';
                lessonTextContentEl.style.display = 'block';
            }
            if (currentLessonTitleEl) currentLessonTitleEl.textContent = "Materi Tidak Tersedia";
            updateNavigationButtons();
            return;
        }

        if (courseMainTitleEl && currentCourseData) courseMainTitleEl.textContent = currentCourseData.title || "Judul Kursus";
        if (currentLessonTitleEl) currentLessonTitleEl.textContent = currentLessonData.lesson_title || "Judul Materi";

        if (videoPlayerIframe && videoPlayerIframe.parentElement) {
            videoPlayerIframe.style.display = 'none';
            videoPlayerIframe.parentElement.style.display = 'none';
        }
        if (lessonTextContentEl) lessonTextContentEl.style.display = 'none';

        if (currentLessonData.lesson_type === 'video' && currentLessonData.content_url) {
            if (videoPlayerIframe && videoPlayerIframe.parentElement) {
                // Perbaikan URL YouTube: Asumsi content_url adalah Video ID
                videoPlayerIframe.src = `https://www.youtube.com/embed/${currentLessonData.content_url}`; // Menggunakan embed URL yang benar
                videoPlayerIframe.style.display = 'block';
                videoPlayerIframe.parentElement.style.display = 'block';
            }
        } else if (currentLessonData.lesson_type === 'text' && currentLessonData.text_content) {
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = currentLessonData.text_content;
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

    // Fungsi untuk Menampilkan Navigasi Modul & Materi di Sidebar
    function renderModuleNavigation() {
        if (!moduleNavListContainer || !allModulesForCourse || !currentCourseData) {
            console.warn("LearningContent: Kontainer navigasi modul atau data kursus/modul hilang.");
            if (moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Gagal memuat daftar materi.</p>"
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
                moduleNavListContainer.querySelectorAll('.course-module-item-button.active').forEach(activeBtn => {
                    if (activeBtn !== this) {
                        activeBtn.classList.remove("active");
                        activeBtn.nextElementSibling.style.maxHeight = null;
                    }
                });
                this.classList.toggle("active", !isActive);
                this.nextElementSibling.style.maxHeight = !isActive ? this.nextElementSibling.scrollHeight + "px" : null;
            });
            if (currentModuleData && module.module_id === currentModuleData.module_id) {
                button.classList.add('active');
                contentDiv.style.maxHeight = contentDiv.scrollHeight + "px";
            }
        });
        highlightActiveLesson();
    }

    // Fungsi untuk Menandai Materi Aktif di Sidebar
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

    // Fungsi untuk Memeriksa Akses Pengguna ke Kursus
    async function checkAccess(courseId) {
        const loggedInUserString = localStorage.getItem('loggedInUser');
        if (!loggedInUserString) {
            if (typeof showPopup === 'function') {
                showPopup("Anda harus login untuk mengakses materi ini.", false, "Anda akan diarahkan ke halaman login.", true);
                setTimeout(() => window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`, 3000);
            } else {
                alert("Anda harus login untuk mengakses materi ini.");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
            return false;
        }
        try {
            loggedInUser = JSON.parse(loggedInUserString);
            if (!loggedInUser || !loggedInUser.user_id) throw new Error("Data pengguna tidak valid");
        } catch (e) {
            console.error("LearningContent: Gagal memparsing loggedInUser atau user_id tidak ada.", e);
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
                    return true;
                }
            } catch (e) { console.error("Error memparsing status paket pengguna dari localStorage:", e); }
        }

        const enrollments = await fetchData('enrollments.json') || [];
        const isEnrolled = enrollments.some(e => e.user_id === loggedInUser.user_id && e.course_id === courseId);
        if (isEnrolled) return true;

        const simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`);
        if (simulatedEnrollmentsString) {
            try {
                const simulatedEnrollments = JSON.parse(simulatedEnrollmentsString);
                if (simulatedEnrollments.some(e => e.user_id === loggedInUser.user_id && e.course_id === courseId)) {
                    return true;
                }
            } catch (e) { console.error("Error memparsing pendaftaran tersimulasi:", e); }
        }

        if (typeof showPopup === 'function') {
            showPopup("Anda belum memiliki akses ke kursus ini.", false, "Anda akan diarahkan ke detail kursus.", true);
            setTimeout(() => window.location.href = `coursedetails.html?id=${courseId}`, 3000);
        } else {
            alert("Anda belum memiliki akses ke kursus ini.");
            window.location.href = `coursedetails.html?id=${courseId}`;
        }
        return false;
    }

    // --- Fungsi Inisialisasi Utama Halaman Pembelajaran ---
    async function initLearningPage() {
        const params = getUrlParams();
        if (!params.courseId || !params.moduleId || !params.lessonId) {
            console.error("LearningContent: Parameter URL tidak lengkap (courseId, moduleId, atau lessonId). Pastikan URL sudah benar.");
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Error: Informasi Materi Tidak Lengkap";
            if (moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Parameter tidak lengkap. Tidak dapat memuat materi.</p>";
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = "<p>Parameter URL tidak lengkap. Silakan kembali dan pilih materi dari halaman detail kursus.</p>";
                lessonTextContentEl.style.display = 'block';
            }
            if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
            updateNavigationButtons();
            return;
        }

        const hasAccess = await checkAccess(params.courseId);
        if (!hasAccess) {
            console.log("LearningContent: Akses ditolak. Inisialisasi halaman dihentikan.");
            if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
            if (lessonTextContentEl) lessonTextContentEl.style.display = 'none';
            if (moduleNavListContainer) moduleNavListContainer.innerHTML = '<p>Akses ditolak. Silakan periksa status langganan atau pembelian Anda.</p>';
            if (currentLessonTitleEl) currentLessonTitleEl.textContent = "Akses Ditolak";
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Akses Ditolak";
            updateNavigationButtons();
            return;
        }

        const [courses, modules, lessons] = await Promise.all([
            fetchData('courses.json'),
            fetchData('modules.json'),
            fetchData('lessons.json')
        ]);

        if (!courses || !modules || !lessons) {
            console.error("LearningContent: Gagal memuat data penting (kursus, modul, atau materi). Periksa koneksi dan file JSON.");
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Gagal Memuat Data";
            return;
        }

        currentCourseData = courses.find(c => c.course_id === params.courseId);
        if (!currentCourseData) {
            console.error(`LearningContent: Data kursus tidak ditemukan untuk ID: ${params.courseId}`);
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Kursus Tidak Ditemukan";
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
                allLessonsForCourse.push({ ...les, module_id: mod.module_id });
            });
        });

        currentLessonData = allLessonsForCourse.find(l => l.lesson_id === params.lessonId && l.module_id === params.moduleId);
        currentModuleData = allModulesForCourse.find(m => m.module_id === params.moduleId);

        // *** MODIFICATION: Panggil updateProgress setelah data dimuat ***
        if (loggedInUser && loggedInUser.user_id && currentCourseData && currentLessonData && allLessonsForCourse.length > 0) {
            await updateProgress(currentCourseData.course_id, loggedInUser.user_id);
        }

        if (!currentLessonData) {
            console.warn(`LearningContent: Data materi spesifik tidak ditemukan untuk lessonId: ${params.lessonId} di moduleId: ${params.moduleId}.`);
            if (allLessonsForCourse.length > 0) {
                console.warn("LearningContent: Mengarahkan ke materi pertama yang tersedia di kursus ini sebagai fallback.");
                const firstLesson = allLessonsForCourse[0];
                window.location.href = `learningcontent.html?courseId=${params.courseId}&moduleId=${firstLesson.module_id}&lessonId=${firstLesson.lesson_id}`;
                return;
            } else {
                console.error("LearningContent: Tidak ada materi sama sekali di kursus ini untuk ditampilkan.");
                if (courseMainTitleEl && currentCourseData) courseMainTitleEl.textContent = currentCourseData.title || "Judul Kursus";
                if (currentLessonTitleEl) currentLessonTitleEl.textContent = "Tidak Ada Materi";
                if (lessonTextContentEl) {
                    lessonTextContentEl.innerHTML = "<p>Kursus ini belum memiliki materi pembelajaran.</p>";
                    lessonTextContentEl.style.display = 'block';
                }
                if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
                if (moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Tidak ada materi.</p>";
                updateNavigationButtons();
                return;
            }
        }

        renderModuleNavigation();
        displayLessonContent();
    }

    // --- Inisialisasi Halaman Pembelajaran ---
    initLearningPage();
});