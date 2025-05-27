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

    let currentCourseData = null;
    let currentModuleData = null;
    let currentLessonData = null;
    let allModulesForCourse = [];
    let allLessonsForCourse = []; // Flattened list of lessons

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

    // --- Get Parameters from URL ---
    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            courseId: urlParams.get('courseId'),
            moduleId: urlParams.get('moduleId'),
            lessonId: urlParams.get('lessonId')
        };
    }

    // --- Render Page Content ---
    function displayLessonContent() {
        if (!currentLessonData) {
            console.error("LearningContent: No current lesson data to display after all checks.");
            if (videoPlayerIframe && videoPlayerIframe.parentElement) {
                videoPlayerIframe.style.display = 'none';
                videoPlayerIframe.parentElement.style.display = 'none';
            }
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = '<p>Materi tidak ditemukan atau Anda tidak memiliki akses.</p>';
                lessonTextContentEl.style.display = 'block';
            }
            if (currentLessonTitleEl) currentLessonTitleEl.textContent = "Materi Tidak Tersedia";
            return;
        }

        if (courseMainTitleEl && currentCourseData) courseMainTitleEl.textContent = currentCourseData.title || "Judul Kursus";
        if (currentLessonTitleEl) currentLessonTitleEl.textContent = currentLessonData.lesson_title || "Judul Materi";

        // Default to hiding both content types
        if (videoPlayerIframe && videoPlayerIframe.parentElement) {
            videoPlayerIframe.style.display = 'none';
            videoPlayerIframe.parentElement.style.display = 'none';
        }
        if (lessonTextContentEl) lessonTextContentEl.style.display = 'none';

        if (currentLessonData.lesson_type === 'video' && currentLessonData.content_url) {
            if (videoPlayerIframe && videoPlayerIframe.parentElement) {
                videoPlayerIframe.src = `https://www.youtube.com/embed/${currentLessonData.content_url}`;
                videoPlayerIframe.style.display = 'block';
                videoPlayerIframe.parentElement.style.display = 'block';
            }
        } else if (currentLessonData.lesson_type === 'text') {
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = `<p>${currentLessonData.text_content || "Konten teks untuk materi ini akan segera tersedia."}</p>`;
                lessonTextContentEl.style.display = 'block';
            }
        } else {
            if (lessonTextContentEl) {
                lessonTextContentEl.innerHTML = '<p>Tipe konten tidak didukung atau URL konten tidak ditemukan.</p>';
                lessonTextContentEl.style.display = 'block';
            }
            console.warn("LearningContent: Unsupported lesson type or missing content_url/text_content for lesson:", currentLessonData.lesson_id);
        }
        updateNavigationButtons();
        highlightActiveLesson();
    }

    function renderModuleNavigation() {
        if (!moduleNavListContainer || !allModulesForCourse) {
            console.warn("LearningContent: Module navigation container or data missing.");
            return;
        }
        moduleNavListContainer.innerHTML = '';

        allModulesForCourse.sort((a, b) => (a.order || 0) - (b.order || 0));

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
                module.lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
                module.lessons.forEach(lesson => {
                    const lessonLink = document.createElement('a');
                    lessonLink.href = `learningcontent.html?courseId=${currentCourseData.course_id}&moduleId=${module.module_id}&lessonId=${lesson.lesson_id}`;
                    lessonLink.textContent = lesson.lesson_title || 'Judul Materi';
                    lessonLink.dataset.lessonId = lesson.lesson_id;
                    if (currentLessonData && lesson.lesson_id === currentLessonData.lesson_id && module.module_id === currentLessonData.module_id) {
                        lessonLink.classList.add('active-lesson');
                    }
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
                if (!isActive) {
                    this.classList.add("active");
                    const currentContent = this.nextElementSibling;
                    currentContent.style.maxHeight = currentContent.scrollHeight + "px";
                }
            });
            if (currentModuleData && module.module_id === currentModuleData.module_id) {
                button.classList.add('active');
                contentDiv.style.maxHeight = contentDiv.scrollHeight + "px";
            }
        });
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

    function updateNavigationButtons() {
        if (!prevLessonBtn || !nextLessonBtn || !currentLessonData || allLessonsForCourse.length === 0) {
            if (prevLessonBtn) prevLessonBtn.disabled = true;
            if (nextLessonBtn) nextLessonBtn.disabled = true;
            return;
        }

        const currentIndex = allLessonsForCourse.findIndex(l => l.lesson_id === currentLessonData.lesson_id && l.module_id === currentLessonData.module_id);

        if (currentIndex === -1) {
            console.warn("LearningContent: Current lesson not found in allLessonsForCourse array for navigation.");
            prevLessonBtn.disabled = true;
            nextLessonBtn.disabled = true;
            return;
        }

        prevLessonBtn.disabled = currentIndex === 0;
        nextLessonBtn.disabled = currentIndex === allLessonsForCourse.length - 1;

        if (!prevLessonBtn.disabled) {
            const prevLesson = allLessonsForCourse[currentIndex - 1];
            prevLessonBtn.onclick = () => window.location.href = `learningcontent.html?courseId=${currentCourseData.course_id}&moduleId=${prevLesson.module_id}&lessonId=${prevLesson.lesson_id}`;
        }
        if (!nextLessonBtn.disabled) {
            const nextLesson = allLessonsForCourse[currentIndex + 1];
            nextLessonBtn.onclick = () => window.location.href = `learningcontent.html?courseId=${currentCourseData.course_id}&moduleId=${nextLesson.module_id}&lessonId=${nextLesson.lesson_id}`;
        }
    }

    // --- Access Control (Simulation) ---
    async function checkAccess(courseId) {
        const loggedInUserString = localStorage.getItem('loggedInUser');
        console.log("LearningContent: DEBUG checkAccess - Raw 'loggedInUser' from localStorage:", loggedInUserString);
        if (!loggedInUserString) {
            console.warn("LearningContent: DEBUG checkAccess - No 'loggedInUser' found. User not logged in.");
            // ... (redirect logic as before)
            if (typeof showPopup === 'function') {
                showPopup("Anda harus login untuk mengakses materi ini.", false, "Anda akan diarahkan ke halaman login.", true);
                setTimeout(() => window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`, 3000);
            } else {
                alert("Anda harus login untuk mengakses materi ini.");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
            return false;
        }

        let loggedInUser;
        try {
            loggedInUser = JSON.parse(loggedInUserString);
        } catch (e) {
            console.error("LearningContent: DEBUG checkAccess - Failed to parse 'loggedInUser' from localStorage.", e);
            // ... (redirect logic as before)
            if (typeof showPopup === 'function') {
                showPopup("Sesi login Anda tidak valid. Silakan login kembali.", false, "Anda akan diarahkan ke halaman login.", true);
                setTimeout(() => window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`, 3000);
            } else {
                alert("Sesi login Anda tidak valid. Silakan login kembali.");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
            return false;
        }

        if (!loggedInUser || !loggedInUser.user_id) {
            console.warn("LearningContent: DEBUG checkAccess - Parsed 'loggedInUser' is invalid or missing user_id.", loggedInUser);
            // ... (redirect logic as before)
            if (typeof showPopup === 'function') {
                showPopup("Sesi login Anda tidak valid. Silakan login kembali.", false, "Anda akan diarahkan ke halaman login.", true);
                setTimeout(() => window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`, 3000);
            } else {
                alert("Sesi login Anda tidak valid. Silakan login kembali.");
                window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
            }
            return false;
        }
        console.log("LearningContent: DEBUG checkAccess - Parsed loggedInUser:", loggedInUser);

        // Check 1: Active Plan from localStorage (set by checkout.js)
        const userPlanStatusString = localStorage.getItem('userPlanStatus');
        console.log("LearningContent: DEBUG checkAccess - Raw 'userPlanStatus' from localStorage:", userPlanStatusString);
        if (userPlanStatusString) {
            let userPlanStatus;
            try {
                userPlanStatus = JSON.parse(userPlanStatusString);
            } catch (e) {
                console.error("LearningContent: DEBUG checkAccess - Failed to parse 'userPlanStatus' from localStorage.", e);
                userPlanStatus = null;
            }

            console.log("LearningContent: DEBUG checkAccess - Parsed userPlanStatus:", userPlanStatus);
            if (userPlanStatus && userPlanStatus.active === true && userPlanStatus.user_id === loggedInUser.user_id) {
                console.log(`LearningContent: DEBUG checkAccess - User ${loggedInUser.user_id} has an active plan (ID: ${userPlanStatus.planId}, OrderID: ${userPlanStatus.orderId}). Access GRANTED to course ${courseId}.`);
                return true;
            } else {
                console.log("LearningContent: DEBUG checkAccess - userPlanStatus found but not active or user_id mismatch.",
                    "Plan active:", userPlanStatus?.active,
                    "Plan user_id:", userPlanStatus?.user_id,
                    "Logged in user_id:", loggedInUser.user_id);
            }
        } else {
            console.log("LearningContent: DEBUG checkAccess - No 'userPlanStatus' found in localStorage.");
        }

        // Check 2: Direct Enrollment from enrollments.json (fallback or for individual course purchases)
        console.log("LearningContent: DEBUG checkAccess - Checking direct enrollments for courseId:", courseId, "and userId:", loggedInUser.user_id);
        const enrollments = await fetchData('enrollments.json') || [];
        const isEnrolled = enrollments.some(e => e.user_id === loggedInUser.user_id && e.course_id === courseId);

        if (isEnrolled) {
            console.log(`LearningContent: DEBUG checkAccess - User ${loggedInUser.user_id} is directly enrolled in course ${courseId}. Access GRANTED.`);
            return true;
        }

        console.warn(`LearningContent: DEBUG checkAccess - User ${loggedInUser.user_id} does NOT have an active plan and is NOT enrolled in course ${courseId}. Access DENIED.`);
        if (typeof showPopup === 'function') {
            showPopup("Anda belum memiliki akses ke kursus ini.", false, "Silakan beli paket atau kursus terlebih dahulu. Anda akan diarahkan ke halaman detail kursus.", true);
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
            console.error("LearningContent: Course ID, Module ID, or Lesson ID not found in URL parameters.");
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Error: Informasi Materi Tidak Lengkap";
            if (moduleNavListContainer) moduleNavListContainer.innerHTML = "<p>Tidak dapat memuat daftar materi karena parameter URL tidak lengkap.</p>";
            if (lessonTextContentEl) lessonTextContentEl.innerHTML = "<p>Tidak dapat memuat materi karena parameter URL tidak lengkap.</p>";
            if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
            return;
        }

        console.log("LearningContent: Initializing page for courseId:", params.courseId, "moduleId:", params.moduleId, "lessonId:", params.lessonId);

        const hasAccess = await checkAccess(params.courseId);
        if (!hasAccess) {
            console.log("LearningContent: Access check failed. Page initialization stopped.");
            if (videoPlayerIframe && videoPlayerIframe.parentElement) videoPlayerIframe.parentElement.style.display = 'none';
            if (lessonTextContentEl) lessonTextContentEl.style.display = 'none';
            if (moduleNavListContainer) moduleNavListContainer.innerHTML = '<p>Akses ditolak. Silakan periksa status langganan Anda.</p>';
            return;
        }

        const [courses, modules, lessons] = await Promise.all([
            fetchData('courses.json'),
            fetchData('modules.json'),
            fetchData('lessons.json')
        ]);

        if (!courses || !modules || !lessons) {
            console.error("LearningContent: Failed to load essential content data (courses, modules, or lessons).");
            if (courseMainTitleEl) courseMainTitleEl.textContent = "Gagal Memuat Data Kursus";
            return;
        }

        currentCourseData = courses.find(c => c.course_id === params.courseId);
        if (!currentCourseData) {
            console.error(`LearningContent: Course data not found for ID: ${params.courseId}`);
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

        if (!currentLessonData) {
            console.warn(`LearningContent: Lesson data not found for lessonId: ${params.lessonId} in moduleId: ${params.moduleId}.`);
            if (allLessonsForCourse.length > 0) {
                currentLessonData = allLessonsForCourse[0];
                console.warn("LearningContent: Defaulting to the first lesson of the course:", currentLessonData);
                if (currentLessonData) {
                    const newUrl = `learningcontent.html?courseId=${params.courseId}&moduleId=${currentLessonData.module_id}&lessonId=${currentLessonData.lesson_id}`;
                    window.history.replaceState({}, '', newUrl);
                }
            } else {
                console.error("LearningContent: No lessons found for this course at all.");
            }
        }

        if (currentLessonData) {
            currentModuleData = allModulesForCourse.find(m => m.module_id === currentLessonData.module_id);
        }

        displayLessonContent();
        renderModuleNavigation();
    }

    initLearningPage();
});
