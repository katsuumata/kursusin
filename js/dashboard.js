document.addEventListener("DOMContentLoaded", async function () {
    // --- Variabel Global & Selektor DOM ---
    const JSON_BASE_PATH = './json/';

    const profileAvatarEl = document.getElementById('profile-avatar');
    const profileNameEl = document.getElementById('profile-name');
    const profileEmailEl = document.getElementById('profile-email');

    const pelatihanSelesaiCircle = document.getElementById('pelatihan-selesai-circle');
    const pelatihanSelesaiText = document.getElementById('pelatihan-selesai-text');
    const pelatihanAktifCircle = document.getElementById('pelatihan-aktif-circle');
    const pelatihanAktifCountText = document.getElementById('pelatihan-aktif-count-text');

    const welcomeMessageEl = document.getElementById('welcome-message');
    const sertifikatMessageEl = document.getElementById('sertifikat-message');
    const myCoursesTitleEl = document.getElementById('my-courses-title');
    const courseContainer = document.getElementById('courseContainer');
    const seeMoreCoursesContainer = document.getElementById('see-more-courses-container');
    const seeMoreCoursesButton = document.getElementById('see-more-courses-button');
    const upgradePlanLink = document.getElementById('upgrade-plan-link');

    let loggedInUser = null;
    let allCoursesData = [];
    let allUsersData = [];
    let userEnrollmentsData = [];
    let allModulesForCourse = [];
    let enrolledCoursesDetailsGlobal = [];

    const coursesToShowInitially = 6;

    // --- Fungsi Utilitas Pengambilan Data ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status} untuk ${fileName}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error(`Tidak dapat mengambil atau mem-parsing ${fileName}:`, error);
            return [];
        }
    }

    // --- Fungsi Logika Utama Dashboard ---

    // Fungsi untuk Memeriksa Status Langganan Pengguna
    async function checkUserSubscriptionStatus(userId) {
        if (!userId) return false;
        const userPlanStatusString = localStorage.getItem('userPlanStatus');
        if (userPlanStatusString) {
            try {
                const userPlanStatus = JSON.parse(userPlanStatusString);
                if (userPlanStatus && userPlanStatus.active === true && userPlanStatus.user_id === userId) {
                    console.log("Dashboard: Paket aktif ditemukan di localStorage untuk pengguna:", userId, "ID Paket:", userPlanStatus.planId);
                    return true;
                }
            } catch (e) {
                console.error("Dashboard: Error memparsing userPlanStatus dari localStorage", e);
            }
        }
        console.log("Dashboard: Tidak ada paket aktif di localStorage atau tidak cocok. Memeriksa orders.json untuk pengguna:", userId);
        const orders = await fetchData('orders.json');
        const transactions = await fetchData('transactions.json');
        const userOrder = orders.find(order => order.user_id === userId && order.status === 'completed');
        if (!userOrder) {
            console.log("Dashboard: Tidak ada pesanan selesai yang ditemukan untuk pengguna:", userId);
            return false;
        }
        const successfulTransaction = transactions.find(t => t.order_id === userOrder.order_id && t.status === 'success');
        if (successfulTransaction) {
            console.log("Dashboard: Langganan/pembayaran aktif dikonfirmasi melalui orders.json untuk pengguna:", userId, "ID Pesanan:", userOrder.order_id);
            localStorage.setItem('userPlanStatus', JSON.stringify({
                planId: userOrder.plan_id,
                active: true,
                orderDate: userOrder.order_date,
                orderId: userOrder.order_id,
                user_id: userId
            }));
            return true;
        }
        console.log("Dashboard: Tidak ada transaksi berhasil yang ditemukan untuk pesanan selesai:", userOrder.order_id);
        return false;
    }

    // Fungsi untuk Mengisi Profil Pengguna di Sidebar
    function populateUserProfile() {
        if (loggedInUser) {
            if (profileAvatarEl) {
                profileAvatarEl.src = loggedInUser.image_url || 'assets/user/default_profile_nav.png';
                profileAvatarEl.alt = `Foto Profil ${loggedInUser.name || 'Pengguna'}`;
                profileAvatarEl.onerror = () => { profileAvatarEl.src = 'assets/user/default_profile_nav.png'; };
            }
            if (profileNameEl) profileNameEl.textContent = loggedInUser.name || 'Nama Tidak Tersedia';
            if (profileEmailEl) profileEmailEl.textContent = loggedInUser.email || 'Email Tidak Tersedia';
            if (welcomeMessageEl) welcomeMessageEl.textContent = `Halo ${loggedInUser.name ? loggedInUser.name.split(' ')[0] : 'Bapak'}, Selamat Datang Kembali!`;
        }
    }

    // Fungsi untuk Mengisi Data Performa di Sidebar
    function populatePerformance() {
        const completedCoursesCount = userEnrollmentsData.filter(e => e.progress_percentage === 100).length;
        const totalEnrolledCount = userEnrollmentsData.length;

        if (pelatihanSelesaiText) {
            pelatihanSelesaiText.textContent = `${completedCoursesCount}/${totalEnrolledCount}`;
        }
        if (pelatihanSelesaiCircle) {
            const progressValue = totalEnrolledCount > 0 ? (completedCoursesCount / totalEnrolledCount) * 100 : 0;
            pelatihanSelesaiCircle.style.setProperty('--value', Math.round(progressValue));
        }

        const activeCoursesCount = userEnrollmentsData.filter(
            e => e.progress_percentage > 0 && e.progress_percentage < 100
        ).length;

        if (pelatihanAktifCountText) {
            pelatihanAktifCountText.textContent = activeCoursesCount;
        }
        if (pelatihanAktifCircle) {
            const activeProgressValue = totalEnrolledCount > 0 ? (activeCoursesCount / totalEnrolledCount) * 100 : 0;
            pelatihanAktifCircle.style.setProperty('--value', Math.round(activeProgressValue));
        }
    }

    // Fungsi untuk Menampilkan Daftar Kursus Pengguna
    function renderUserCourses(showAll = false) {
        if (!courseContainer) {
            console.error("Dashboard: Elemen courseContainer tidak ditemukan.");
            return;
        }
        courseContainer.innerHTML = '';

        if (enrolledCoursesDetailsGlobal.length === 0) {
            courseContainer.innerHTML = `<div class="no-access-message card"><h3>Anda Belum Memulai Pelatihan Apapun</h3><p>Jelajahi katalog pelatihan kami dan mulailah perjalanan belajar Anda!</p><a href="course.html" class="button-primary">Jelajahi Pelatihan</a></div>`;
            if (seeMoreCoursesContainer) {
                seeMoreCoursesContainer.style.display = 'none';
            }
            return;
        }

        const coursesToDisplay = showAll ? enrolledCoursesDetailsGlobal : enrolledCoursesDetailsGlobal.slice(0, coursesToShowInitially);

        coursesToDisplay.forEach(course => {
            const progress = course.progress_percentage || 0;
            const author = allUsersData.find(u => u.user_id === course.author_id);
            const authorName = author ? author.name : 'Pengajar Ahli';

            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <img src="${course.image_thumbnail_url || 'https://placehold.co/300x140/EAEAEA/B0B0B0?text=Kursus'}" alt="${course.title || 'Judul Kursus'}" class="course-thumbnail" onerror="this.src='https://placehold.co/300x140/EAEAEA/B0B0B0?text=Error'; this.alt='Gambar Error';">
                <div class="course-card-content">
                    <h4>${course.title || 'Judul Kursus'}</h4>
                    <small>${authorName}</small>
                    <p class="course-participants-dash">${(course.participant_count || 0).toLocaleString('id-ID')} peserta</p>
                    <div class="progress-bars">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                    <p class="progress-text">Progress: ${progress}%</p>
                </div>
            `;

            card.addEventListener('click', () => {
                if (course.course_id) {
                    window.location.href = `coursedetails.html?id=${course.course_id}`;
                }
            });

            courseContainer.appendChild(card);
        });

        if (seeMoreCoursesContainer) {
            if (!showAll && enrolledCoursesDetailsGlobal.length > coursesToShowInitially) {
                seeMoreCoursesContainer.style.display = 'block';
            } else {
                seeMoreCoursesContainer.style.display = 'none';
            }
        }
    }

    // --- Fungsi Inisialisasi Utama Halaman Dashboard ---
    async function initDashboard() {
        const loggedInUserString = localStorage.getItem("loggedInUser");
        if (!loggedInUserString) {
            console.warn("Dashboard: Tidak ada loggedInUser yang ditemukan. Mengalihkan ke halaman login.");
            window.location.href = "login.html?redirect=dashboard.html";
            return;
        }
        try {
            loggedInUser = JSON.parse(loggedInUserString);
            if (!loggedInUser || !loggedInUser.user_id) throw new Error("Data pengguna tidak valid di localStorage");
        } catch (e) {
            console.error("Dashboard: Error memparsing loggedInUser dari localStorage. Mengalihkan ke halaman login.", e);
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html?redirect=dashboard.html";
            return;
        }

        populateUserProfile();

        const hasPaidOrSubscribed = await checkUserSubscriptionStatus(loggedInUser.user_id);

        if (!hasPaidOrSubscribed) {
            if (myCoursesTitleEl) myCoursesTitleEl.textContent = "Akses Pelatihan Anda";
            if (courseContainer) {
                courseContainer.innerHTML = `
                    <div class="no-access-message card">
                        <h3>Anda Belum Memiliki Akses Penuh</h3>
                        <p>Untuk mulai belajar dan mengakses semua pelatihan, silakan pilih paket langganan terlebih dahulu.</p>
                        <a href="pricing.html" class="button-primary">Lihat Paket Harga</a>
                    </div>`;
            }
            if (sertifikatMessageEl) sertifikatMessageEl.style.display = 'none';
            if (upgradePlanLink) upgradePlanLink.style.display = 'block';

            if (pelatihanSelesaiText) pelatihanSelesaiText.textContent = "0/0";
            if (pelatihanSelesaiCircle) pelatihanSelesaiCircle.style.setProperty('--value', 0);
            if (pelatihanAktifCountText) pelatihanAktifCountText.textContent = "0";
            if (pelatihanAktifCircle) pelatihanAktifCircle.style.setProperty('--value', 0);

            if (seeMoreCoursesContainer) seeMoreCoursesContainer.style.display = 'none';
            return;
        }

        if (upgradePlanLink) upgradePlanLink.style.display = 'none';
        if (sertifikatMessageEl) sertifikatMessageEl.style.display = 'block';

        const [courses, baseEnrollments, users, modules, lessons] = await Promise.all([
            fetchData('courses.json'),
            fetchData('enrollments.json'),
            fetchData('users.json'),
            fetchData('modules.json'),
            fetchData('lessons.json')
        ]);

        allCoursesData = courses || [];
        allUsersData = users || [];

        allModulesForCourse = (modules || []).map(mod => ({
            ...mod,
            lessons: (lessons || []).filter(l => l.module_id === mod.module_id).sort((a, b) => (a.order || 0) - (b.order || 0))
        })).sort((a, b) => (a.order || 0) - (b.order || 0));

        const simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`);
        let simulatedEnrollments = [];
        if (simulatedEnrollmentsString) {
            try {
                simulatedEnrollments = JSON.parse(simulatedEnrollmentsString);
                if (!Array.isArray(simulatedEnrollments)) simulatedEnrollments = [];
            } catch (e) {
                console.error("Dashboard: Error memparsing simulated_enrollments dari localStorage", e);
                simulatedEnrollments = [];
            }
        }

        const baseUserEnrollments = (baseEnrollments || []).filter(e => e.user_id === loggedInUser.user_id);
        const combinedEnrollments = [...baseUserEnrollments];

        simulatedEnrollments.forEach(simEnr => {
            if (simEnr.user_id === loggedInUser.user_id && !combinedEnrollments.find(enr => enr.course_id === simEnr.course_id)) {
                combinedEnrollments.push(simEnr);
            }
        });
        userEnrollmentsData = combinedEnrollments;

        enrolledCoursesDetailsGlobal = userEnrollmentsData.map(enrollment => {
            const courseInfo = allCoursesData.find(c => c.course_id === enrollment.course_id);
            return courseInfo ? { ...courseInfo, ...enrollment } : null;
        }).filter(course => course);

        populatePerformance();
        renderUserCourses(false);

        if (seeMoreCoursesButton) {
            seeMoreCoursesButton.addEventListener('click', function () {
                renderUserCourses(true);
            });
        }
    }

    // --- Inisialisasi Dashboard ---
    initDashboard();
});