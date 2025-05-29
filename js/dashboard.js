document.addEventListener("DOMContentLoaded", async function () {
    // --- Global Variables & DOM Selectors ---
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

    // New DOM Selectors for Badges & Completed Courses Modal
    const myBadgesLink = document.getElementById('my-badges-link');
    const myBadgesSection = document.getElementById('my-badges-section');
    const userBadgesContainer = document.getElementById('userBadgesContainer');
    const badgeModal = document.getElementById('badgeModal');
    const modalBadgesContainer = document.getElementById('modalBadgesContainer');
    const badgeModalCloseBtn = document.querySelector('.badge-modal-close');

    const completedCoursesModal = document.getElementById('completedCoursesModal'); // New
    const completedCoursesList = document.getElementById('completedCoursesList');   // New
    const completedCoursesModalCloseBtn = document.querySelector('.completed-courses-modal-close'); // New

    let loggedInUser = null;
    let allCoursesData = [];
    let allUsersData = [];
    let userEnrollmentsData = [];
    let allModulesForCourse = [];
    let enrolledCoursesDetailsGlobal = [];
    let allBadgesData = []; // To store all badges from badges.json
    let userEarnedBadges = []; // To store badges earned by the current user

    const coursesToShowInitially = 6;

    // --- Data Fetching Utility Function ---
    async function fetchData(fileName) {
        try {
            const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status} for ${fileName}`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error(`Tidak dapat mengambil atau mem-parsing ${fileName}:`, error);
            return [];
        }
    }

    // --- Core Dashboard Logic Functions ---

    // Function to Check User Subscription Status
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

    // Function to Populate User Profile in Sidebar
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

    // Function to Populate Performance Data in Sidebar
    function populatePerformance() {
        const completedCoursesCount = userEnrollmentsData.filter(e => e.progress_percentage === 100).length;
        const totalEnrolledCount = userEnrollmentsData.length;

        if (pelatihanSelesaiText) {
            pelatihanSelesaiText.textContent = `${completedCoursesCount}/${totalEnrolledCount}`;
        }
        if (pelatihanSelesaiCircle) {
            const progressValue = totalEnrolledCount > 0 ? (completedCoursesCount / totalEnrolledCount) * 100 : 0;
            pelatihanSelesaiCircle.style.setProperty('--value', Math.round(progressValue));
            // Add click listener to Pelatihan Selesai circle to show completed courses modal
            pelatihanSelesaiCircle.style.cursor = 'pointer'; // Indicate it's clickable
            pelatihanSelesaiCircle.onclick = () => showCompletedCoursesModal(); // NEW
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

    // Function to Render User Courses
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

    // --- Badge System Functions ---

    // Function to calculate and save earned badges
    function calculateAndSaveBadges() {
        if (!loggedInUser || !loggedInUser.user_id) {
            userEarnedBadges = [];
            return;
        }

        const completedCourses = enrolledCoursesDetailsGlobal.filter(e => e.progress_percentage === 100);
        const earnedBadges = new Set(localStorage.getItem(`user_badges_${loggedInUser.user_id}`) ? JSON.parse(localStorage.getItem(`user_badges_${loggedInUser.user_id}`)) : []);

        // Badge 01: Bapak Pembelajar (Menyelesaikan kursus pertama.)
        if (completedCourses.length >= 1) {
            const badge = allBadgesData.find(b => b.badge_id === 'badge01');
            if (badge) earnedBadges.add(badge.badge_id);
        }

        // Badge 02: Bapak Romantis (Menyelesaikan kursus 'Romantisme Ala Bapak'.)
        const romantisCourse = completedCourses.find(c => c.title && c.title.includes('Romantisme Ala Bapak'));
        if (romantisCourse) {
            const badge = allBadgesData.find(b => b.badge_id === 'badge02');
            if (badge) earnedBadges.add(badge.badge_id);
        }

        // Badge 03: Bapak Sehat (Menyelesaikan 2 kursus Kesehatan.)
        const healthCourses = allCoursesData.filter(course => course.category_id === 'kesehatan');
        const completedHealthCourses = completedCourses.filter(enrollment =>
            healthCourses.some(hc => hc.course_id === enrollment.course_id)
        ).length;
        if (completedHealthCourses >= 2) {
            const badge = allBadgesData.find(b => b.badge_id === 'badge03');
            if (badge) earnedBadges.add(badge.badge_id);
        }

        // Badge 04: Bapak Mekanik (Menyelesaikan kursus Otomotif.)
        const automotiveCourse = allCoursesData.find(course => course.category_id === 'otomotif');
        if (automotiveCourse && completedCourses.some(c => c.course_id === automotiveCourse.course_id)) {
            const badge = allBadgesData.find(b => b.badge_id === 'badge04');
            if (badge) earnedBadges.add(badge.badge_id);
        }

        // Badge 05: Master Pancing (Menyelesaikan kursus Mancing.)
        const mancingCourse = allCoursesData.find(course => course.title && course.title.includes('Mancing'));
        if (mancingCourse && completedCourses.some(c => c.course_id === mancingCourse.course_id)) {
            const badge = allBadgesData.find(b => b.badge_id === 'badge05');
            if (badge) earnedBadges.add(badge.badge_id);
        }

        // Category-based badges (badge06 to badge17)
        const categoryBadgeMap = {
            'hubungan': 'badge06', // Pakar Hati
            'kesehatan': 'badge07', // Duta Hidup Sehat
            'asuh_anak': 'badge08', // The Super Parent
            'teknologi': 'badge09', // Sultan Gadget
            'keuangan': 'badge10', // Juragan Finansial
            'otomotif': 'badge11', // Anak Aspal
            'bisnis': 'badge12', // Pawang Cuan
            'hobi': 'badge13', // Jawara Santuy
            'rumah_tangga': 'badge14', // Home Sweet Home Hero
            'kuliner': 'badge15', // Foodie Supreme
            'tukang': 'badge16', // Ahli DIY
            'olahraga': 'badge17' // Sang Juara
        };

        for (const categoryId in categoryBadgeMap) {
            const badgeId = categoryBadgeMap[categoryId];
            const coursesInCategory = allCoursesData.filter(course => course.category_id === categoryId);
            const completedCoursesInCategory = completedCourses.filter(enrollment =>
                coursesInCategory.some(cic => cic.course_id === enrollment.course_id)
            );

            // For category badges, assume completion of at least one course in that category
            if (completedCoursesInCategory.length > 0) {
                const badge = allBadgesData.find(b => b.badge_id === badgeId);
                if (badge) earnedBadges.add(badge.badge_id);
            }
        }

        localStorage.setItem(`user_badges_${loggedInUser.user_id}`, JSON.stringify(Array.from(earnedBadges)));
        userEarnedBadges = Array.from(earnedBadges).map(badgeId => allBadgesData.find(b => b.badge_id === badgeId)).filter(Boolean);
        renderUserBadges(userEarnedBadges, userBadgesContainer);
    }


    // Function to render badges into a container
    // Function to render badges into a container
    function renderUserBadges(badges, containerElement) {
        if (!containerElement) return;
        containerElement.innerHTML = ''; // Clear previous badges

        if (badges.length === 0) {
            containerElement.innerHTML = '<p>Anda belum mendapatkan lencana apapun. Selesaikan pelatihan untuk mendapatkan lencana!</p>';
            return;
        }

        badges.forEach(badge => {
            const badgeCard = document.createElement('div');
            badgeCard.className = 'badge-card';
            // *** MODIFICATION: Tambahkan style cursor: pointer ke img ***
            badgeCard.innerHTML = `
            <img src="${badge.image_url}" alt="${badge.name}" style="cursor: pointer; width: 80px; height: 80px; object-fit: contain;"> 
            <h4>${badge.name}</h4>
            <p>${badge.description}</p>
        `;
            // *** NEW: Dapatkan elemen img dan tambahkan event listener ***
            const badgeImage = badgeCard.querySelector('img');
            if (badgeImage) {
                badgeImage.addEventListener('click', (event) => {
                    event.stopPropagation(); // Hentikan event agar tidak konflik jika ada listener lain
                    showLargeBadgeImage(badge.image_url, badge.name);
                });
            }

            containerElement.appendChild(badgeCard);
        });
    }

    // Function to show the badge modal with earned badges
    function showEarnedBadgesModal() {
        if (!badgeModal || !modalBadgesContainer) {
            console.error("Badge modal elements not found.");
            return;
        }
        renderUserBadges(userEarnedBadges, modalBadgesContainer); // Render badges into the modal
        badgeModal.style.display = 'flex'; // Show the modal
    }

    // Function to hide the badge modal
    function hideBadgeModal() {
        if (badgeModal) {
            badgeModal.style.display = 'none';
        }
    }

    // --- Completed Courses Modal Functions (NEW) ---

    // Function to show the completed courses modal
    function showCompletedCoursesModal() {
        if (!completedCoursesModal || !completedCoursesList) {
            console.error("Completed courses modal elements not found.");
            return;
        }

        completedCoursesList.innerHTML = ''; // Clear previous list

        const completedCourses = enrolledCoursesDetailsGlobal.filter(e => e.progress_percentage === 100);

        if (completedCourses.length === 0) {
            completedCoursesList.innerHTML = '<li>Anda belum menyelesaikan pelatihan apapun.</li>';
        } else {
            completedCourses.forEach(course => {
                const listItem = document.createElement('li');
                listItem.textContent = course.title || 'Judul Kursus Tidak Tersedia';
                completedCoursesList.appendChild(listItem);
            });
        }
        completedCoursesModal.style.display = 'flex'; // Show the modal
    }

    // Function to hide the completed courses modal
    function hideCompletedCoursesModal() {
        if (completedCoursesModal) {
            completedCoursesModal.style.display = 'none';
        }
    }


    // --- Main Dashboard Initialization Function ---
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
            // Hide badge section and modal related elements if no subscription
            if (myBadgesLink) myBadgesLink.style.display = 'none';
            if (myBadgesSection) myBadgesSection.style.display = 'none';
            return;
        }

        if (upgradePlanLink) upgradePlanLink.style.display = 'none';
        if (sertifikatMessageEl) sertifikatMessageEl.style.display = 'block';
        if (myBadgesLink) myBadgesLink.style.display = 'block'; // Show badges link if subscribed

        const [courses, baseEnrollments, users, modules, lessons, badges] = await Promise.all([
            fetchData('courses.json'),
            fetchData('enrollments.json'),
            fetchData('users.json'),
            fetchData('modules.json'),
            fetchData('lessons.json'),
            fetchData('badges.json') // Fetch badges data
        ]);

        allCoursesData = courses || [];
        allUsersData = users || [];
        allBadgesData = badges || []; // Store fetched badges

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

        // *** MODIFICATION: Gunakan Map untuk menggabungkan enrollments, prioritaskan data simulasi (localStorage) ***
        const enrollmentMap = new Map();

        // Tambahkan data dasar terlebih dahulu
        baseUserEnrollments.forEach(enr => {
            enrollmentMap.set(enr.course_id, enr);
        });

        // Tambahkan/Timpa dengan data simulasi
        simulatedEnrollments.forEach(simEnr => {
            if (simEnr.user_id === loggedInUser.user_id) {
                const existingEnr = enrollmentMap.get(simEnr.course_id);
                // Gabungkan: Ambil data simulasi, tapi pertahankan tanggal pendaftaran asli jika ada
                const mergedEnr = {
                    ...existingEnr, // Mulai dengan data dasar (jika ada)
                    ...simEnr       // Timpa dengan data simulasi (progres, tgl selesai)
                };
                enrollmentMap.set(simEnr.course_id, mergedEnr);
            }
        });

        userEnrollmentsData = Array.from(enrollmentMap.values());
        // *** END OF MODIFICATION ***

        enrolledCoursesDetailsGlobal = userEnrollmentsData.map(enrollment => {
            const courseInfo = allCoursesData.find(c => c.course_id === enrollment.course_id);
            return courseInfo ? { ...courseInfo, ...enrollment } : null;
        }).filter(course => course);

        enrolledCoursesDetailsGlobal = userEnrollmentsData.map(enrollment => {
            const courseInfo = allCoursesData.find(c => c.course_id === enrollment.course_id);
            return courseInfo ? { ...courseInfo, ...enrollment } : null;
        }).filter(course => course);

        // Calculate and save badges after all data is loaded and user enrollments are processed
        calculateAndSaveBadges();

        populatePerformance();
        renderUserCourses(false);

        // Event listener for "Lihat Semua Pelatihan Saya" button
        if (seeMoreCoursesButton) {
            seeMoreCoursesButton.addEventListener('click', function () {
                renderUserCourses(true);
            });
        }

        // Event listener for "LENCANA SAYA" link (to show badge modal)
        if (myBadgesLink) {
            myBadgesLink.addEventListener('click', function (event) {
                event.preventDefault();
                showEarnedBadgesModal(); // Now this shows the modal
            });
        }

        if (badgeModalCloseBtn) {
            badgeModalCloseBtn.addEventListener('click', hideBadgeModal);
        }

        // Close badge modal when clicking outside of it
        window.addEventListener('click', function (event) {
            if (event.target === badgeModal) {
                hideBadgeModal();
            }
        });

        // Event listeners for Completed Courses Modal
        if (completedCoursesModalCloseBtn) {
            completedCoursesModalCloseBtn.addEventListener('click', hideCompletedCoursesModal);
        }

        // Close completed courses modal when clicking outside of it
        window.addEventListener('click', function (event) {
            if (event.target === completedCoursesModal) {
                hideCompletedCoursesModal();
            }
        });

        // Ensure course section is visible by default when dashboard loads initially
        const myCoursesSectionTitle = document.getElementById('my-courses-title');
        if (myCoursesSectionTitle) myCoursesSectionTitle.style.display = 'block';
        if (courseContainer) courseContainer.style.display = 'grid'; // Ensure course container is a grid
        // Ensure badge section is hidden by default
        if (myBadgesSection) myBadgesSection.style.display = 'none';

    }
    // --- Large Badge Image Modal Functions (NEW) ---
    let largeBadgeModalEl = null;
    let largeBadgeImageEl = null;
    let largeBadgeCloseBtn = null;

    // Fungsi untuk membuat elemen modal jika belum ada
    function createLargeBadgeModal() {
        if (document.getElementById('largeBadgeModal')) return; // Jangan buat jika sudah ada

        largeBadgeModalEl = document.createElement('div');
        largeBadgeModalEl.id = 'largeBadgeModal';
        // Styling Modal (Overlay)
        largeBadgeModalEl.style.display = 'none'; // Awalnya disembunyikan
        largeBadgeModalEl.style.position = 'fixed';
        largeBadgeModalEl.style.zIndex = '2000'; // Pastikan di atas modal lain
        largeBadgeModalEl.style.left = '0';
        largeBadgeModalEl.style.top = '0';
        largeBadgeModalEl.style.width = '100%';
        largeBadgeModalEl.style.height = '100%';
        largeBadgeModalEl.style.overflow = 'auto';
        largeBadgeModalEl.style.backgroundColor = 'rgba(0,0,0,0.85)';
        largeBadgeModalEl.style.display = 'flex';
        largeBadgeModalEl.style.justifyContent = 'center';
        largeBadgeModalEl.style.alignItems = 'center';
        largeBadgeModalEl.style.transition = 'opacity 0.3s ease'; // Transisi halus (opsional)

        // Tombol Close (X)
        largeBadgeCloseBtn = document.createElement('span');
        largeBadgeCloseBtn.innerHTML = '&times;';
        largeBadgeCloseBtn.style.position = 'absolute';
        largeBadgeCloseBtn.style.top = '20px';
        largeBadgeCloseBtn.style.right = '35px';
        largeBadgeCloseBtn.style.color = '#fff';
        largeBadgeCloseBtn.style.fontSize = '45px';
        largeBadgeCloseBtn.style.fontWeight = 'bold';
        largeBadgeCloseBtn.style.cursor = 'pointer';

        // Elemen Gambar
        largeBadgeImageEl = document.createElement('img');
        largeBadgeImageEl.id = 'largeBadgeImage';
        largeBadgeImageEl.style.maxWidth = '60%'; // Ukuran maksimal gambar
        largeBadgeImageEl.style.maxHeight = '80%';
        largeBadgeImageEl.style.margin = 'auto';
        largeBadgeImageEl.style.display = 'block';
        largeBadgeImageEl.style.border = '3px solid #fff'; // Bingkai (opsional)
        largeBadgeImageEl.style.borderRadius = '5px';   // Sudut (opsional)

        // Tambahkan elemen ke modal dan modal ke body
        largeBadgeModalEl.appendChild(largeBadgeCloseBtn);
        largeBadgeModalEl.appendChild(largeBadgeImageEl);
        document.body.appendChild(largeBadgeModalEl);

        // Tambahkan Event Listener untuk menutup modal
        largeBadgeCloseBtn.onclick = hideLargeBadgeImage;
        largeBadgeModalEl.onclick = function (event) {
            // Tutup jika klik di background (bukan di gambar)
            if (event.target === largeBadgeModalEl) {
                hideLargeBadgeImage();
            }
        };

        largeBadgeModalEl.style.display = 'none'; // Sembunyikan lagi setelah dibuat
    }

    // Fungsi untuk menampilkan modal dengan gambar yang dipilih
    function showLargeBadgeImage(src, alt) {
        if (!largeBadgeModalEl) {
            createLargeBadgeModal(); // Buat modal jika belum ada
        }
        largeBadgeImageEl.src = src;
        largeBadgeImageEl.alt = alt;
        largeBadgeModalEl.style.display = 'flex'; // Tampilkan modal
    }

    // Fungsi untuk menyembunyikan modal
    function hideLargeBadgeImage() {
        if (largeBadgeModalEl) {
            largeBadgeModalEl.style.display = 'none';
        }
    }
    // --- End of Large Badge Image Modal Functions ---
    // --- Initialize Dashboard ---
    initDashboard();
});