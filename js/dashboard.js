document.addEventListener("DOMContentLoaded", async function () {
  const JSON_BASE_PATH = './json/';

  // DOM Elements
  const profileAvatarEl = document.getElementById('profile-avatar');
  const profileNameEl = document.getElementById('profile-name');
  const profileEmailEl = document.getElementById('profile-email');

  const pelatihanSelesaiCircle = document.getElementById('pelatihan-selesai-circle');
  const pelatihanSelesaiText = document.getElementById('pelatihan-selesai-text');
  const lencanaCircle = document.getElementById('lencana-circle');
  const lencanaCountText = document.getElementById('lencana-count-text');

  const welcomeMessageEl = document.getElementById('welcome-message');
  const sertifikatMessageEl = document.getElementById('sertifikat-message');
  const myCoursesTitleEl = document.getElementById('my-courses-title');
  const courseContainer = document.getElementById('courseContainer');
  const seeMoreCoursesContainer = document.getElementById('see-more-courses-container');
  const upgradePlanLink = document.getElementById('upgrade-plan-link');

  let loggedInUser = null;
  let allCoursesData = [];
  let allUsersData = [];
  let userEnrollmentsData = []; // This will be the merged list
  let userEarnedBadgesData = [];
  let allBadgesInfo = [];
  let allModulesForCourse = [];
  const coursesToShowInitially = 6;

  async function fetchData(fileName) {
    try {
      const response = await fetch(`${JSON_BASE_PATH}${fileName}`);
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status} for ${fileName}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error(`Could not fetch or parse ${fileName}:`, error);
      return [];
    }
  }

  async function checkUserSubscriptionStatus(userId) {
    if (!userId) return false;
    const userPlanStatusString = localStorage.getItem('userPlanStatus');
    if (userPlanStatusString) {
      try {
        const userPlanStatus = JSON.parse(userPlanStatusString);
        if (userPlanStatus && userPlanStatus.active === true && userPlanStatus.user_id === userId) {
          console.log("Dashboard: Active plan found in localStorage for user:", userId, "Plan ID:", userPlanStatus.planId);
          return true;
        }
      } catch (e) {
        console.error("Dashboard: Error parsing userPlanStatus from localStorage", e);
      }
    }
    console.log("Dashboard: No active plan in localStorage or mismatch. Checking orders.json for user:", userId);
    const orders = await fetchData('orders.json');
    const transactions = await fetchData('transactions.json');
    const userOrder = orders.find(order => order.user_id === userId && order.status === 'completed');
    if (!userOrder) {
      console.log("Dashboard: No completed orders found for user:", userId);
      return false;
    }
    const successfulTransaction = transactions.find(t => t.order_id === userOrder.order_id && t.status === 'success');
    if (successfulTransaction) {
      console.log("Dashboard: Active subscription/payment confirmed via orders.json for user:", userId, "Order ID:", userOrder.order_id);
      localStorage.setItem('userPlanStatus', JSON.stringify({
        planId: userOrder.plan_id,
        active: true,
        orderDate: userOrder.order_date,
        orderId: userOrder.order_id,
        user_id: userId
      }));
      return true;
    }
    console.log("Dashboard: No successful transaction found for completed order:", userOrder.order_id);
    return false;
  }

  function populateUserProfile() {
    if (loggedInUser) {
      if (profileAvatarEl) {
        profileAvatarEl.src = loggedInUser.image_url || 'assets/default_profile.png';
        profileAvatarEl.alt = `Foto Profil ${loggedInUser.name || 'Pengguna'}`;
        profileAvatarEl.onerror = () => { profileAvatarEl.src = 'assets/default_profile.png'; };
      }
      if (profileNameEl) profileNameEl.textContent = loggedInUser.name || 'Nama Tidak Tersedia';
      if (profileEmailEl) profileEmailEl.textContent = loggedInUser.email || 'Email Tidak Tersedia';
      if (welcomeMessageEl) welcomeMessageEl.textContent = `Halo ${loggedInUser.name ? loggedInUser.name.split(' ')[0] : 'Bapak'}, Selamat Datang Kembali!`;
    }
  }

  function populatePerformance() {
    const completedCoursesCount = userEnrollmentsData.filter(e => e.progress_percentage === 100).length;
    const totalEnrolledCount = userEnrollmentsData.length;

    if (pelatihanSelesaiText) pelatihanSelesaiText.textContent = `${completedCoursesCount}/${totalEnrolledCount}`;
    if (pelatihanSelesaiCircle) {
      const progressValue = totalEnrolledCount > 0 ? (completedCoursesCount / totalEnrolledCount) * 100 : 0;
      pelatihanSelesaiCircle.style.setProperty('--value', Math.round(progressValue));
    }

    if (lencanaCountText) lencanaCountText.textContent = userEarnedBadgesData.length;
    if (lencanaCircle && allBadgesInfo.length > 0) {
      const badgeProgress = allBadgesInfo.length > 0 ? (userEarnedBadgesData.length / allBadgesInfo.length) * 100 : (userEarnedBadgesData.length > 0 ? 100 : 0);
      lencanaCircle.style.setProperty('--value', Math.round(badgeProgress));
    } else if (lencanaCircle) {
      lencanaCircle.style.setProperty('--value', userEarnedBadgesData.length > 0 ? 100 : 0);
    }
  }

  function renderUserCourses() {
    if (!courseContainer) {
      console.error("Dashboard: courseContainer element not found.");
      return;
    }
    courseContainer.innerHTML = '';

    // Use the merged userEnrollmentsData
    const enrolledCoursesDetails = userEnrollmentsData.map(enrollment => {
      const courseInfo = allCoursesData.find(c => c.course_id === enrollment.course_id);
      return courseInfo ? { ...courseInfo, ...enrollment } : null;
    }).filter(course => course);

    if (enrolledCoursesDetails.length === 0) {
      // This message will show if user has a plan but hasn't "started" any courses via coursedetail.js
      // OR if the plan doesn't auto-enroll and no courses were manually started.
      courseContainer.innerHTML = `<div class="no-access-message card"><h3>Anda Belum Memulai Pelatihan Apapun</h3><p>Jelajahi katalog pelatihan kami dan mulailah perjalanan belajar Anda!</p><a href="course.html" class="button-primary">Jelajahi Pelatihan</a></div>`;
      if (seeMoreCoursesContainer) seeMoreCoursesContainer.style.display = 'none';
      return;
    }

    enrolledCoursesDetails.slice(0, coursesToShowInitially).forEach(course => {
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
          // Find the first module and first lesson for this course to construct the learning content URL
          const courseModules = allModulesForCourse.filter(m => m.course_id === course.course_id);
          if (courseModules.length > 0 && courseModules[0].lessons && courseModules[0].lessons.length > 0) {
            window.location.href = `learningcontent.html?courseId=${course.course_id}&moduleId=${courseModules[0].module_id}&lessonId=${courseModules[0].lessons[0].lesson_id}`;
          } else {
            // Fallback to course details if no lessons found (should ideally not happen for an enrolled course)
            window.location.href = `coursedetails.html?id=${course.course_id}`;
          }
        }
      });
      courseContainer.appendChild(card);
    });

    if (seeMoreCoursesContainer && document.getElementById('see-more-courses-button')) {
      if (enrolledCoursesDetails.length > coursesToShowInitially) {
        seeMoreCoursesContainer.style.display = 'block';
        // TODO: Implement 'Lihat Semua Pelatihan Saya' button functionality
      } else {
        seeMoreCoursesContainer.style.display = 'none';
      }
    }
  }

  async function initDashboard() {
    const loggedInUserString = localStorage.getItem("loggedInUser");
    if (!loggedInUserString) {
      console.warn("Dashboard: No loggedInUser found. Redirecting to login.");
      window.location.href = "login.html?redirect=dashboard.html";
      return;
    }
    try {
      loggedInUser = JSON.parse(loggedInUserString);
      if (!loggedInUser || !loggedInUser.user_id) throw new Error("Invalid user data in localStorage");
    } catch (e) {
      console.error("Dashboard: Error parsing loggedInUser from localStorage. Redirecting to login.", e);
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html?redirect=dashboard.html";
      return;
    }

    populateUserProfile(); // Populate profile info early

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
      if (lencanaCountText) lencanaCountText.textContent = "0";
      if (lencanaCircle) lencanaCircle.style.setProperty('--value', 0);
      if (seeMoreCoursesContainer) seeMoreCoursesContainer.style.display = 'none';
      return;
    }

    if (upgradePlanLink) upgradePlanLink.style.display = 'none';
    if (sertifikatMessageEl) sertifikatMessageEl.style.display = 'block';

    const [courses, baseEnrollments, badges, userBadgesList, users, modules, lessons] = await Promise.all([
      fetchData('courses.json'),
      fetchData('enrollments.json'), // Base enrollments from "DB"
      fetchData('badges.json'),
      fetchData('user_badges.json'),
      fetchData('users.json'),
      fetchData('modules.json'),
      fetchData('lessons.json')
    ]);

    allCoursesData = courses;
    allUsersData = users;
    allBadgesInfo = badges;

    // Merge base enrollments with simulated ones from localStorage
    const simulatedEnrollmentsString = localStorage.getItem(`simulated_enrollments_${loggedInUser.user_id}`);
    let simulatedEnrollments = [];
    if (simulatedEnrollmentsString) {
      try {
        simulatedEnrollments = JSON.parse(simulatedEnrollmentsString);
        if (!Array.isArray(simulatedEnrollments)) simulatedEnrollments = [];
      } catch (e) {
        console.error("Dashboard: Error parsing simulated_enrollments from localStorage", e);
        simulatedEnrollments = [];
      }
    }
    console.log("Dashboard: Base enrollments from JSON:", baseEnrollments.filter(e => e.user_id === loggedInUser.user_id));
    console.log("Dashboard: Simulated enrollments from localStorage:", simulatedEnrollments);

    const combinedEnrollments = [...baseEnrollments.filter(e => e.user_id === loggedInUser.user_id)];
    simulatedEnrollments.forEach(simEnr => {
      if (simEnr.user_id === loggedInUser.user_id && !combinedEnrollments.find(enr => enr.course_id === simEnr.course_id)) {
        combinedEnrollments.push(simEnr);
      }
      // Could add logic here to update progress if simEnr is more recent than one from baseEnrollments
    });

    userEnrollmentsData = combinedEnrollments;
    console.log("Dashboard: Merged userEnrollmentsData:", userEnrollmentsData);

    userEarnedBadgesData = userBadgesList.filter(ub => ub.user_id === loggedInUser.user_id);

    // Prepare module and lesson data for linking from dashboard course cards
    allModulesForCourse = modules.map(mod => ({
      ...mod,
      lessons: lessons.filter(l => l.module_id === mod.module_id).sort((a, b) => (a.order || 0) - (b.order || 0))
    })).sort((a, b) => (a.order || 0) - (b.order || 0));

    populatePerformance();
    renderUserCourses();
  }

  initDashboard();
});
