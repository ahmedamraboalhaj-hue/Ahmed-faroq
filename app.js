// --- Firebase Configuration ---
// استبدل الإعدادات أدناه من مشروعك في Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAJ2nuoRETpbvkNdlN8PJEWM_MSOobOmcc",
    authDomain: "ahlquraan-29c5b.firebaseapp.com",
    projectId: "ahlquraan-29c5b",
    storageBucket: "ahlquraan-29c5b.firebasestorage.app",
    messagingSenderId: "677127394598",
    appId: "1:677127394598:web:fe439cbd011358dbe95de7",
    measurementId: "G-FPTV6L2S3E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const analytics = firebase.analytics();

const MATH_BRANCHES = ['الكل', 'الجبر', 'الإحصاء', 'حساب المثلثات', 'الهندسة', 'التفاضل والتكامل', 'الاستاتيكا', 'الديناميكا', 'تطبيقية', 'متجهات', 'جبر وإحتمالات', 'تأسيس'];

// Initial Data Structure
let appData = {
    grades: {
        '3mid': {
            title: 'الصف الثالث الإعدادي',
            groups: ['مجموعة 1', 'مجموعة 2'],
            branches: ['الكل', 'جبر وإحتمالات', 'هندسة']
        },
        '1sec': {
            title: 'الصف الأول الثانوي',
            groups: ['مجموعة 1', 'مجموعة 2'],
            branches: ['الكل', 'الجبر', 'الهندسة', 'حساب المثلثات', 'متجهات']
        },
        '2sec': {
            title: 'الصف الثاني الثانوي',
            groups: ['مجموعة 1', 'مجموعة 2'],
            branches: ['الكل', 'الجبر', 'التفاضل والتكامل', 'حساب المثلثات', 'تطبيقية']
        },
        '3sec-sci': {
            title: 'الصف الثالث الثانوي (علمي)',
            groups: ['مجموعة 1', 'مجموعة 2'],
            branches: ['الكل', 'تطبيقية', 'الجبر', 'التفاضل والتكامل', 'حساب المثلثات']
        },
        '3sec-lit': {
            title: 'الصف الثالث الثانوي (أدبي)',
            groups: ['مجموعة 1'],
            branches: ['الكل', 'الجبر', 'التفاضل والتكامل']
        }
    },
    lessons: [],
    packages: [],
    exams: [],
    files: [],
    vouchers: [],
    vouchers: [],
    students: [],
    visits: [],
    competitions: {}, // Stores settings for each grade {gradeId: {...}}
    compRegistrations: [],
    compMatches: []
};


// State
let currentState = {
    selectedGrade: null,
    selectedBranch: 'الكل',
    isAdmin: false,
    managementGrade: '1sec', // Default grade for admin management
    compReg: null,
    currentMatch: null
};

// YouTube Players Management
let ytPlayers = {};
let isYouTubeAPIReady = false;

function onYouTubeIframeAPIReady() {
    isYouTubeAPIReady = true;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
    }, 1000);
    initEventListeners();
    initAntiPiracy(); // Added Anti-Piracy Init
    checkStudentSession();
    initScrollReveal();
});

function initScrollReveal() {
    const observerOptions = {
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    revealElements.forEach(el => observer.observe(el));
}

function checkStudentSession() {
    const session = localStorage.getItem('studentSession');
    if (!session && !currentState.isAdmin) {
        document.getElementById('student-login-modal').style.display = 'flex';
    } else if (session) {
        const student = JSON.parse(session);
        logVisit(student);
        showSecurityWatermark(student);
    }
}

// --- Anti-Piracy & Security System ---
function initAntiPiracy() {
    // 1. Block Context Menu (Right Click)
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 2. Block Common Shortcuts (PrintScreen, Ctrl+P, Ctrl+S, Ctrl+Shift+I, F12)
    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'PrintScreen' ||
            (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u')) || // Print, Save, Source
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) || // DevTools
            e.key === 'F12'
        ) {
            e.preventDefault();
            warnUser('غير مسموح بأخذ لقطات شاشة أو نسخ المحتوى!');
            toggleBlackout(true);
            setTimeout(() => toggleBlackout(false), 2000); // 2s penalty
            return false;
        }
    });

    // 3. Clear Clipboard on Copy Attempt
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        e.clipboardData.setData('text/plain', 'تم مسح المحتوى - حقوق الملكية محفوظة للمنصة.');
    });

    // 4. Detect Screen Width Changes (DevTools open side) - Simple Check
    window.addEventListener('resize', () => {
        if (window.outerWidth - window.innerWidth > 100 || window.outerHeight - window.innerHeight > 100) {
            // Potential DevTools open
        }
    });
}

function showSecurityWatermark(student) {
    // Remove existing if any
    const existing = document.querySelector('.security-watermark');
    if (existing) existing.remove();

    if (!student) return;

    const watermark = document.createElement('div');
    watermark.className = 'security-watermark';
    // Display Name and a unique ID (Phone)
    watermark.innerHTML = `${student.name}<br>${student.phone}`;
    document.body.appendChild(watermark);
    watermark.style.display = 'block';
}

function toggleBlackout(show) {
    let blackout = document.querySelector('.security-blackout');
    if (!blackout) {
        blackout = document.createElement('div');
        blackout.className = 'security-blackout';
        blackout.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h2>تنبيه أمني</h2>
            <p>محاولة تصوير الشاشة أو نسخ المحتوى تعرض حسابك للحظر النهائي.</p>
        `;
        document.body.appendChild(blackout);
    }
    blackout.style.display = show ? 'flex' : 'none';
}

function warnUser(msg) {
    // You could use a custom toast here, but alert is blocking and annoying, which is good for deterrent.
    // However, repeated alerts can be blocked by browser.
    console.warn(msg);
}

async function loadInitialData() {
    try {
        // Real-time listeners for ALL collections so content updates instantly
        db.collection('lessons').onSnapshot(snapshot => {
            appData.lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentState.selectedGrade) renderContent();
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'add-lesson') renderAdminSection('add-lesson');
        });

        db.collection('packages').onSnapshot(snapshot => {
            appData.packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentState.selectedGrade) renderContent();
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'add-package') renderAdminSection('add-package');
        });

        db.collection('exams').onSnapshot(snapshot => {
            appData.exams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentState.selectedGrade) renderContent();
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'add-exam') renderAdminSection('add-exam');
        });

        db.collection('files').onSnapshot(snapshot => {
            appData.files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (currentState.selectedGrade) renderContent();
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'add-file') renderAdminSection('add-file');
        });

        db.collection('vouchers').onSnapshot(snapshot => {
            appData.vouchers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'vouchers') renderAdminSection('vouchers');
        });

        db.collection('students').orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                appData.students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
                if (currentState.isAdmin && (activeSection === 'dashboard' || activeSection === 'students-list')) {
                    renderAdminSection(activeSection);
                }
            });

        db.collection('visits').orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                appData.visits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
                if (currentState.isAdmin && (activeSection === 'dashboard' || activeSection === 'visits-log')) {
                    renderAdminSection(activeSection);
                }
            });

        // Competition Data Listeners (Per Grade)
        db.collection('competition_settings').onSnapshot(snapshot => {
            snapshot.docs.forEach(doc => {
                appData.competitions[doc.id] = doc.data();
            });
            updateCompetitionUI();
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'manage-competition') renderAdminSection('manage-competition');
        });

        // Competition Registrations Listener (For Admin)
        db.collection('competition_registrations').onSnapshot(snapshot => {
            appData.compRegistrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'manage-competition') renderAdminSection('manage-competition');
        });

        // Competition Matches Listener
        db.collection('competition_matches').onSnapshot(snapshot => {
            appData.compMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Student's Match Update
            const session = localStorage.getItem('studentSession');
            if (session) {
                const student = JSON.parse(session);
                const myMatch = appData.compMatches.find(m =>
                    (m.status === 'Waiting' || m.status === 'Playing') &&
                    (m.playerA.id === student.id || m.playerB?.id === student.id) &&
                    m.grade === student.grade
                );
                currentState.currentMatch = myMatch;
            }

            updateCompetitionUI();
            const activeSection = document.querySelector('.admin-nav li.active')?.dataset.section;
            if (currentState.isAdmin && activeSection === 'manage-competition') renderAdminSection('manage-competition');
        });

        // Student's Own Registration Listener
        const session = localStorage.getItem('studentSession');
        if (session) {
            const student = JSON.parse(session);
            db.collection('competition_registrations').doc(student.id).onSnapshot(doc => {
                currentState.compReg = doc.exists ? doc.data() : null;
                updateCompetitionUI();
            });
        }

        // Wait for initial data load before proceeding
        await Promise.all([
            db.collection('lessons').get(),
            db.collection('packages').get(),
            db.collection('exams').get(),
            db.collection('files').get(),
            db.collection('vouchers').get(),
        ]);

    } catch (error) {
        console.error("Error loading data from Firebase:", error);
    }
}

function initEventListeners() {
    const adminBtn = document.getElementById('admin-login-btn');
    const modal = document.getElementById('admin-modal');
    const closeBtn = document.querySelector('.close-modal');

    adminBtn.onclick = () => {
        if (currentState.isAdmin) {
            showAdminDashboard();
        } else {
            modal.style.display = 'flex';
        }
    };
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

    document.getElementById('login-confirm').onclick = checkLogin;

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${target}-tab`).classList.add('active');
        };
    });

    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (menuToggle && navLinks) {
        menuToggle.onclick = () => {
            const isActive = navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (isActive) {
                icon.classList.replace('fa-bars', 'fa-times');
                document.body.style.overflow = 'hidden';
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
                document.body.style.overflow = '';
            }
        };

        navLinks.querySelectorAll('a').forEach(link => {
            link.onclick = () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
                document.body.style.overflow = '';
            };
        });
    }
}

function selectGrade(gradeId) {
    currentState.selectedGrade = gradeId;
    currentState.selectedBranch = 'الكل';
    document.getElementById('grades').classList.add('hidden');
    document.getElementById('content-display').classList.remove('hidden');
    document.getElementById('current-grade-title').textContent = appData.grades[gradeId].title;
    renderBranchSelection();
    renderContent();
    scrollToSection('content-display');
}

function renderBranchSelection() {
    const container = document.getElementById('branch-selection');
    if (!container) return;
    container.innerHTML = '';

    // Get branches for the current grade
    const branches = appData.grades[currentState.selectedGrade]?.branches || MATH_BRANCHES;

    branches.forEach(branch => {
        const btn = document.createElement('button');
        btn.className = `branch-tab-btn ${currentState.selectedBranch === branch ? 'active' : ''}`;
        btn.textContent = branch;
        btn.onclick = () => {
            currentState.selectedBranch = branch;
            renderBranchSelection();
            renderContent();
        };
        container.appendChild(btn);
    });
}


function goBackToGrades() {
    document.getElementById('content-display').classList.add('hidden');
    document.getElementById('grades').classList.remove('hidden');
    currentState.selectedGrade = null;
    currentState.selectedGroup = null;
    scrollToSection('grades');
}

function renderContent() {
    const lessonsList = document.getElementById('lessons-list');
    const packagesList = document.getElementById('packages-list');
    const examsList = document.getElementById('exams-list');
    const filesList = document.getElementById('files-list');

    if (!lessonsList || !packagesList || !examsList || !filesList) return;

    const isSystemUnlocked = localStorage.getItem('isSystemUnlocked') === 'true';

    // Helper for branch filtering
    const branchFilter = (item) => {
        const matchesGrade = item.grade === currentState.selectedGrade;
        const matchesBranch = currentState.selectedBranch === 'الكل' || item.branch === currentState.selectedBranch;
        return matchesGrade && matchesBranch;
    };

    // Lessons
    const filteredLessons = appData.lessons.filter(branchFilter);

    // Check if THIS SPECIFIC GRADE is unlocked
    const isGradeUnlocked = localStorage.getItem(`unlocked_${currentState.selectedGrade}`) === 'true';

    if (filteredLessons.length === 0) {
        lessonsList.innerHTML = '<p class="empty-msg">لا يوجد دروس مضافة في هذا الفرع حالياً</p>';
    } else {
        // Build ALL HTML first, then set innerHTML ONCE, then init players
        let lessonsHTML = '';
        const lessonsToInit = [];

        filteredLessons.forEach(lesson => {
            const wrapperId = `vid-wrapper-${lesson.id}`;
            const playerId = `player-${lesson.id}`;
            if (isGradeUnlocked) {
                lessonsHTML += `
                    <div class="item-card">
                        <div class="video-preview-wrapper" id="${wrapperId}">
                            <div id="${playerId}"></div>
                            <div class="video-overlay-shield total-shield" onclick="togglePlayPause('${lesson.id}')" ondblclick="toggleFullscreen('${wrapperId}')">
                                <div class="play-overlay">
                                    <i class="fas fa-play"></i>
                                </div>
                                <div class="shield-top"></div>
                                <div class="shield-center-top"></div>
                                <div class="shield-bottom-right"></div>
                                <div class="shield-bottom-left"></div>
                                <div class="custom-controls">
                                    <button class="custom-seek-btn" onclick="event.stopPropagation(); seek('${lesson.id}', -10)" title="تراجع 10 ثواني">
                                        <i class="fas fa-undo"></i>
                                    </button>
                                    <div class="progress-container" onclick="event.stopPropagation(); handleSeek(event, '${lesson.id}')">
                                        <div class="progress-bar" id="progress-${lesson.id}"></div>
                                    </div>
                                    <button class="custom-seek-btn" onclick="event.stopPropagation(); seek('${lesson.id}', 10)" title="تقدم 10 ثواني">
                                        <i class="fas fa-redo"></i>
                                    </button>
                                    <button class="custom-fs-btn" title="تكبير الشاشة" onclick="event.stopPropagation(); toggleFullscreen('${wrapperId}')">
                                        <i class="fas fa-expand"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="item-info">
                            <h4>${lesson.title}</h4>
                            <p>${lesson.desc}</p>
                        </div>
                    </div>
                `;
                lessonsToInit.push({ id: lesson.id, url: lesson.url });
            } else {
                lessonsHTML += `
                    <div class="item-card locked-card" style="position: relative;">
                        <div class="video-preview-wrapper" style="background: #121212; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                            <i class="fas fa-lock" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 15px;"></i>
                            <p style="color: white; font-weight: 700; margin-bottom: 15px;">هذا الفيديو محمي بكود تفعيل</p>
                            <div style="display: flex; gap: 10px; width: 80%;">
                                <input type="text" class="voucher-input" placeholder="أدخل الكود هنا" style="flex: 1; padding: 8px; border-radius: 5px; border: 1px solid var(--primary-color); background: #000; color: #fff;">
                                <button class="btn-primary" onclick="checkVoucher(this)">تفعيل</button>
                            </div>
                        </div>
                        <div class="item-info">
                            <h4>${lesson.title}</h4>
                            <p>${lesson.desc}</p>
                        </div>
                    </div>
                `;
            }
        });

        // Set HTML once - this prevents DOM destruction of already-created players
        lessonsList.innerHTML = lessonsHTML;

        // Now init all players after DOM is stable
        lessonsToInit.forEach((lesson, index) => {
            setTimeout(() => initYTPlayer(lesson.id, getYouTubeId(lesson.url)), 200 + index * 100);
        });
    }

    // Packages
    const filteredPackages = appData.packages.filter(branchFilter);
    packagesList.innerHTML = filteredPackages.length ? '' : '<p class="empty-msg">لا يوجد باقات مضافة في هذا الفرع حالياً</p>';

    filteredPackages.forEach(pkg => {
        const isPkgUnlocked = localStorage.getItem(`pkg_unlocked_${pkg.id}`) === 'true';

        const videosHtml = pkg.videos.map((v, idx) => `
            <div class="pkg-video-item ${isPkgUnlocked ? 'unlocked' : 'locked'}" ${isPkgUnlocked ? `onclick="openPackageVideo('${v.url}', '${v.title}')"` : ''}>
                <i class="fas ${isPkgUnlocked ? 'fa-play-circle' : 'fa-lock'}"></i>
                <span>${idx + 1}. ${v.title}</span>
            </div>
        `).join('');

        packagesList.innerHTML += `
            <div class="item-card package-card ${isPkgUnlocked ? 'is-unlocked' : 'is-locked'}">
                <div class="package-badge">${pkg.videos.length} فيديو</div>
                <div class="item-info">
                    <h4>${pkg.title}</h4>
                    <p style="margin-bottom: 15px;">${pkg.desc}</p>
                    <div class="pkg-videos-preview">
                        ${pkg.videos.map(v => {
            const vid = getYouTubeId(v.url);
            return `<img src="https://img.youtube.com/vi/${vid}/mqdefault.jpg" class="pkg-thumb-preview" title="${v.title}">`;
        }).join('')}
                    </div>
                    <div class="pkg-videos-list-names" style="max-height: 100px; overflow-y: auto; margin-bottom: 10px;">
                        ${videosHtml}
                    </div>
                    <div class="pkg-footer">
                        <div class="pkg-price">${isPkgUnlocked ? '<span class="unlocked-text"><i class="fas fa-check-circle"></i> تم التفعيل</span>' : pkg.price + ' ج.م'}</div>
                        ${!isPkgUnlocked ? `
                            <button class="btn-primary" onclick="showSubscriptionInfo('${pkg.title}', '${pkg.price}', '${pkg.id}')">
                                <i class="fas fa-shopping-cart"></i> اشترك الآن
                            </button>
                        ` : `
                            <button class="btn-primary" style="background: var(--gradient-2); color: #000;" onclick="scrollToSection('packages-list')">
                                <i class="fas fa-eye"></i> مشاهدة المحتوى
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    // Exams
    const filteredExams = appData.exams.filter(branchFilter);
    examsList.innerHTML = filteredExams.length ? '' : '<p class="empty-msg">لا يوجد اختبارات مضافة في هذا الفرع حالياً</p>';
    filteredExams.forEach(exam => {
        examsList.innerHTML += `
            <div class="item-card exam-card">
                <div class="item-icon"><i class="fas fa-file-signature"></i></div>
                <div class="item-info">
                    <h4>${exam.title}</h4>
                    <p>${exam.questions.length} سؤال</p>
                    <button class="btn-primary w-100" onclick="startExam('${exam.id}')">بدأ الاختبار</button>
                </div>
            </div>
        `;
    });

    // Files
    const filteredFiles = appData.files.filter(branchFilter);
    filesList.innerHTML = filteredFiles.length ? '' : '<p class="empty-msg">لا يوجد مذكرات مضافة في هذا الفرع حالياً</p>';
    filteredFiles.forEach(file => {
        filesList.innerHTML += `
            <div class="item-card">
                <div class="item-icon" style="height: 150px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05);">
                    <i class="fas fa-file-pdf" style="font-size: 3rem; color: var(--primary-light);"></i>
                </div>
                <div class="item-info">
                    <h4>${file.title}</h4>
                    <p>متوفر الآن للتحميل أو العرض</p>
                    <a href="${file.url}" target="_blank" class="btn-primary w-100" style="text-decoration: none; display: block; text-align: center;">تحميل / عرض</a>
                </div>
            </div>
        `;
    });
}

function getYouTubeId(url) {
    if (!url) return 'dQw4w9WgXcQ';
    url = url.trim();
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'dQw4w9WgXcQ';
}

let currentExamData = null;
let userAnswers = [];

function startExam(id) {
    const exam = appData.exams.find(e => e.id === id);
    if (!exam || !exam.questions || exam.questions.length === 0) return alert('هذا الاختبار لا يحتوي على أسئلة');

    currentExamData = exam;
    userAnswers = new Array(exam.questions.length).fill(null);

    const modal = document.createElement('div');
    modal.id = 'exam-taking-modal';
    modal.className = 'exam-overlay';
    modal.innerHTML = `
        <div class="exam-container glass">
            <div class="exam-header">
                <h3>${exam.title}</h3>
                <span class="close-exam" onclick="closeExam()">&times;</span>
            </div>
            <div id="exam-questions-list"></div>
            <button class="btn-primary w-100" onclick="submitExam()">إنهاء الاختبار</button>
        </div>
    `;
    document.body.appendChild(modal);
    renderExamQuestions();
}

function renderExamQuestions() {
    const list = document.getElementById('exam-questions-list');
    list.innerHTML = '';
    currentExamData.questions.forEach((q, idx) => {
        list.innerHTML += `
            <div class="exam-q-block">
                <p class="q-title">${idx + 1}. ${q.text}</p>
                <div class="exam-options">
                    ${q.opts.map((opt, oIdx) => `
                        <label class="exam-opt">
                            <input type="radio" name="q${idx}" value="${oIdx + 1}" onchange="userAnswers[${idx}] = ${oIdx + 1}">
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });
}

function submitExam() {
    if (userAnswers.some(a => a === null)) {
        if (!confirm('لم تقم بالإجابة على جميع الأسئلة، هل تريد الاستمرار؟')) return;
    }
    let score = 0;
    currentExamData.questions.forEach((q, idx) => {
        if (parseInt(q.correct) === userAnswers[idx]) score++;
    });
    alert(`انتهى الاختبار! درجتك هي: ${score} من ${currentExamData.questions.length}`);
    closeExam();
}

function closeExam() {
    const modal = document.getElementById('exam-taking-modal');
    if (modal) modal.remove();
}

function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function checkLogin() {
    const pass = document.getElementById('admin-password').value;
    if (pass === '010qwe') {
        currentState.isAdmin = true;
        document.getElementById('admin-modal').style.display = 'none';
        showAdminDashboard();
        // Show watermark for Admin too so they can verify the system
        showSecurityWatermark({ name: 'Admin User', phone: '01550366657' });
    } else {
        alert('كلمة المرور غير صحيحة');
    }
}

function showAdminDashboard() {
    const dashboard = document.getElementById('admin-dashboard');
    dashboard.classList.remove('hidden');
    const navItems = document.querySelectorAll('.admin-nav li');
    navItems.forEach(item => {
        item.onclick = () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderAdminSection(item.dataset.section);

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 968) {
                toggleAdminSidebar();
            }
        };
    });
    renderAdminSection('dashboard');
}

function toggleAdminSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    sidebar.classList.toggle('active');
    const icon = document.querySelector('.admin-menu-toggle i');
    if (sidebar.classList.contains('active')) {
        icon.classList.replace('fa-bars', 'fa-times');
    } else {
        icon.classList.replace('fa-times', 'fa-bars');
    }
}

function renderAdminSection(section) {
    const main = document.getElementById('admin-content-area');
    if (section === 'dashboard') {
        const usedVouchers = appData.vouchers.filter(v => v.isUsed);
        const revenue = usedVouchers.length * 50;
        const studentCount = appData.students.length;
        const totalVisits = appData.visits.length;

        main.innerHTML = `
            <h3>لوحة التحكم والإحصائيات 📊</h3>
            
            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(34, 197, 94, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-wallet" style="color: #22c55e; font-size: 1.5rem;"></i>
                    </div>
                    <h4>${revenue} ج.م</h4>
                    <p>إجمالي الإيرادات</p>
                </div>
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(212, 175, 55, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-user-graduate" style="color: var(--primary-light); font-size: 1.5rem;"></i>
                    </div>
                    <h4>${studentCount}</h4>
                    <p>الطلاب المسجلين</p>
                </div>
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-eye" style="color: #3b82f6; font-size: 1.5rem;"></i>
                    </div>
                    <h4>${totalVisits}</h4>
                    <p>إجمالي الزيارات</p>
                </div>
                <div class="stat-item glass">
                    <div class="stat-icon-wrapper" style="width: 50px; height: 50px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <i class="fas fa-file-video" style="color: #6366f1; font-size: 1.5rem;"></i>
                    </div>
                    <h4>${appData.lessons.length}</h4>
                    <p>فيديو تعليمي</p>
                </div>
            </div>

            <!-- Grade Breakdown -->
            <div class="stats-grid" style="margin-top: 30px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                <div class="stat-item glass type-mini">
                    <span style="font-size: 2rem; color: var(--primary-light);">3</span>
                    <h4>${appData.students.filter(s => s.grade === '3mid').length} طالب</h4>
                    <p>الشهادة الإعدادية</p>
                </div>
                <div class="stat-item glass type-mini">
                    <span style="font-size: 2rem; color: #6366f1;">1</span>
                    <h4>${appData.students.filter(s => s.grade === '1sec').length} طالب</h4>
                    <p>أولى ثانوي</p>
                </div>
                <div class="stat-item glass type-mini">
                    <span style="font-size: 2rem; color: #22c55e;">2</span>
                    <h4>${appData.students.filter(s => s.grade === '2sec').length} طالب</h4>
                    <p>تانية ثانوي</p>
                </div>
                <div class="stat-item glass type-mini">
                    <span style="font-size: 2rem; color: #f59e0b;">3</span>
                    <h4>${appData.students.filter(s => s.grade === '3sec').length} طالب</h4>
                    <p>تالتة ثانوي</p>
                </div>
            </div>

            <div class="contact-wrapper" style="margin-top: 30px;">
                <div class="contact-form-container glass">
                    <h4>إحصائيات المتابعة (Engagement) 📈</h4>
                    <div style="margin-top: 20px;">
                        <div class="feature-line">
                            <span>نسبة مشاهدة الفيديوهات:</span>
                            <div style="flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin: 0 15px; position: relative; overflow: hidden;">
                                <div style="width: 85%; height: 100%; background: var(--gradient-1);"></div>
                            </div>
                            <span>85%</span>
                        </div>
                        <div class="feature-line" style="margin-top: 15px;">
                            <span>معدل إكمال الدروس:</span>
                            <div style="flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin: 0 15px; position: relative; overflow: hidden;">
                                <div style="width: 62%; height: 100%; background: #6366f1;"></div>
                            </div>
                            <span>62%</span>
                        </div>
                    </div>
                </div>

                <div class="contact-form-container glass">
                    <h4>وقت الذروة للمذاكرة ⏰</h4>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">أفضل أوقات تواجد الطلاب (للبث المباشر)</p>
                    <div style="height: 150px; display: flex; align-items: flex-end; gap: 10px; margin-top: 20px; padding: 10px; border-bottom: 2px solid var(--glass-border);">
                        <div style="flex: 1; height: 30%; background: var(--glass-border); border-radius: 5px 5px 0 0;" title="صياحاً"></div>
                        <div style="flex: 1; height: 50%; background: var(--glass-border); border-radius: 5px 5px 0 0;" title="ظهراً"></div>
                        <div style="flex: 1; height: 90%; background: var(--gradient-1); border-radius: 5px 5px 0 0;" title="مساءً (الذروة)"></div>
                        <div style="flex: 1; height: 70%; background: var(--glass-border); border-radius: 5px 5px 0 0;" title="ليلاً"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">
                        <span>صباحاً</span>
                        <span>ظهراً</span>
                        <span>مساءً</span>
                        <span>ليلاً</span>
                    </div>
                </div>
            </div>

            <div class="vouchers-table-container" style="margin-top: 30px;">
                <h4 style="padding: 20px;">النمو المالي والطلابي (آخر 30 يوم) 📅</h4>
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>الفترة</th>
                            <th>الطلاب الجدد</th>
                            <th>الكورسات الأكثر طلباً</th>
                            <th>الإيرادات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>اليوم</td>
                            <td>+${Math.floor(Math.random() * 10)}</td>
                            <td>ثالثة ثانوي - جبر</td>
                            <td>${Math.floor(Math.random() * 500)} ج.م</td>
                        </tr>
                        <tr>
                            <td>هذا الأسبوع</td>
                            <td>+${Math.floor(Math.random() * 50) + 10}</td>
                            <td>تفاضل وتكامل</td>
                            <td>${Math.floor(Math.random() * 2000) + 1000} ج.م</td>
                        </tr>
                        <tr>
                            <td>هذا الشهر</td>
                            <td>+${usedVouchers.length}</td>
                            <td>المراجعة النهائية</td>
                            <td>${revenue} ج.م</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'add-lesson') {
        main.innerHTML = `
            <h3>إضافة درس جديد</h3>
            <div class="admin-form-container">
                <div class="form-group">
                    <label>رابط اليوتيوب</label>
                    <input type="text" id="lesson-url" placeholder="https://youtube.com/...">
                </div>
                <div class="form-group">
                    <label>عنوان الدرس</label>
                    <input type="text" id="lesson-title" placeholder="أدخل عنوان الفيديو">
                </div>
                <div class="form-group">
                    <label>وصف الفيديو / رقم الوحدة</label>
                    <input type="text" id="lesson-desc" placeholder="مثلاً: شرح الوحدة الأولى">
                </div>
                <div class="form-group">
                    <label>الفرع / المادة</label>
                    <select id="lesson-branch">
                        ${MATH_BRANCHES.filter(b => b !== 'الكل').map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>المرحلة</label>
                    <select id="lesson-grade" onchange="updateAdminBranches('lesson')">
                        <option value="3mid">الصف الثالث الإعدادي</option>
                        <option value="1sec">الصف الأول الثانوي</option>
                        <option value="2sec">الصف الثاني الثانوي</option>
                        <option value="3sec-sci">الصف الثالث الثانوي (علمي)</option>
                        <option value="3sec-lit">الصف الثالث الثانوي (أدبي)</option>
                    </select>
                </div>
            </div>
            <button class="btn-primary" onclick="saveNewLesson()">
                <i class="fas fa-save"></i> حفظ الدرس
            </button>

            <hr style="margin: 40px 0; border: 1px solid var(--glass-border);">
            
            <h3>إدارة الدروس المضافة</h3>
            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>العنوان</th>
                            <th>المرحلة</th>
                            <th>الفرع</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.lessons.slice().reverse().map(l => `
                            <tr>
                                <td>${l.title}</td>
                                <td>${appData.grades[l.grade]?.title || l.grade}</td>
                                <td>${l.branch}</td>
                                <td>
                                    <button class="btn-primary" style="background: #ef4444; padding: 5px 10px;" onclick="deleteItem('lessons', '${l.id}')">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'add-exam') {
        main.innerHTML = `
            <h3>إضافة اختبار جديد</h3>
            <div class="admin-form-container">
                <div class="form-group">
                    <label>عنوان الاختبار</label>
                    <input type="text" id="exam-title" placeholder="مثلاً: اختبار الجبر الشامل">
                </div>
                <div class="form-group">
                    <label>الفرع / المادة</label>
                    <select id="exam-branch">
                        ${MATH_BRANCHES.filter(b => b !== 'الكل').map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>المرحلة</label>
                    <select id="exam-grade" onchange="updateAdminBranches('exam')">
                        <option value="3mid">الصف الثالث الإعدادي</option>
                        <option value="1sec">الصف الأول الثانوي</option>
                        <option value="2sec">الصف الثاني الثانوي</option>
                        <option value="3sec-sci">الصف الثالث الثانوي (علمي)</option>
                        <option value="3sec-lit">الصف الثالث الثانوي (أدبي)</option>
                    </select>
                </div>
            </div>
            <div id="questions-container">
                <h4>الأسئلة</h4>
                <div class="question-block glass">
                    <div class="form-group">
                        <label>السؤال 1</label>
                        <textarea class="q-text" placeholder="أدخل نص السؤال"></textarea>
                    </div>
                    <div class="options-grid">
                        <input type="text" class="opt1" placeholder="الاختيار 1">
                        <input type="text" class="opt2" placeholder="الاختيار 2">
                        <input type="text" class="opt3" placeholder="الاختيار 3">
                        <input type="text" class="opt4" placeholder="الاختيار 4">
                    </div>
                    <div class="form-group">
                        <label>رقم الإجابة الصحيحة</label>
                        <select class="correct-idx">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="hero-btns" style="margin-top: 20px;">
                <button class="btn-secondary" onclick="addNewQuestionBlock()">
                    <i class="fas fa-plus"></i> إضافة سؤال جديد
                </button>
                <button class="btn-primary" onclick="saveNewExam()">
                    <i class="fas fa-save"></i> حفظ الاختبار بالكامل
                </button>
            </div>

            <hr style="margin: 40px 0; border: 1px solid var(--glass-border);">
            
            <h3>إدارة الاختبارات المضافة</h3>
            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>العنوان</th>
                            <th>المرحلة</th>
                            <th>الفرع</th>
                            <th>الأسئلة</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.exams.slice().reverse().map(e => `
                            <tr>
                                <td>${e.title}</td>
                                <td>${appData.grades[e.grade]?.title || e.grade}</td>
                                <td>${e.branch}</td>
                                <td>${e.questions?.length || 0} سؤال</td>
                                <td>
                                    <button class="btn-primary" style="background: #ef4444; padding: 5px 10px;" onclick="deleteItem('exams', '${e.id}')">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'add-file') {
        main.innerHTML = `
            <h3>إضافة ملف أو مذكرة جديدة</h3>
            <div class="admin-form-container">
                <div class="form-group">
                    <label>رابط الملف (Google Drive/Dropbox)</label>
                    <input type="text" id="file-url" placeholder="https://drive.google.com/...">
                </div>
                <div class="form-group">
                    <label>عنوان الملف</label>
                    <input type="text" id="file-title" placeholder="أدخل اسم المذكرة">
                </div>
                <div class="form-group">
                    <label>الفرع / المادة</label>
                    <select id="file-branch">
                        ${MATH_BRANCHES.filter(b => b !== 'الكل').map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>المرحلة</label>
                    <select id="file-grade" onchange="updateAdminBranches('file')">
                        <option value="3mid">الصف الثالث الإعدادي</option>
                        <option value="1sec">الصف الأول الثانوي</option>
                        <option value="2sec">الصف الثاني الثانوي</option>
                        <option value="3sec-sci">الصف الثالث الثانوي (علمي)</option>
                        <option value="3sec-lit">الصف الثالث الثانوي (أدبي)</option>
                    </select>
                </div>
            </div>
            <button class="btn-primary" onclick="saveNewFile()">
                <i class="fas fa-save"></i> حفظ الملف
            </button>

            <hr style="margin: 40px 0; border: 1px solid var(--glass-border);">
            
            <h3>إدارة المذكرات المضافة</h3>
            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>العنوان</th>
                            <th>المرحلة</th>
                            <th>الفرع</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.files.slice().reverse().map(f => `
                            <tr>
                                <td>${f.title}</td>
                                <td>${appData.grades[f.grade]?.title || f.grade}</td>
                                <td>${f.branch}</td>
                                <td>
                                    <button class="btn-primary" style="background: #ef4444; padding: 5px 10px;" onclick="deleteItem('files', '${f.id}')">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'manage-competition') {
        const selectedGrade = currentState.managementGrade;
        const comp = appData.competitions[selectedGrade] || {};
        const regs = appData.compRegistrations.filter(r => r.grade === selectedGrade);
        const matches = appData.compMatches.filter(m => m.grade === selectedGrade);

        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>إدارة مسابقات المتفوّقين 🏆</h3>
                <div class="badge" style="background: ${comp.isActive ? '#22c55e' : '#ef4444'}; color: white;">
                    ${comp.isActive ? 'المسابقة نشطة' : 'المسابقة مغلقة'}
                </div>
            </div>

            <div class="admin-form-container glass" style="padding: 25px; margin-bottom: 30px;">
                <div class="form-group">
                    <label>اختر الصف الدراسي لإدارته</label>
                    <select id="comp-mgmt-grade" onchange="currentState.managementGrade = this.value; renderAdminSection('manage-competition')">
                        ${Object.keys(appData.grades).map(gid => `
                            <option value="${gid}" ${selectedGrade === gid ? 'selected' : ''}>${appData.grades[gid].title}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>عنوان مسابقة ${appData.grades[selectedGrade]?.title}</label>
                    <input type="text" id="comp-title" value="${comp.title || ''}">
                </div>
                <div class="form-group">
                    <label>تفعيل المسابقة لهذا الصف</label>
                    <select id="comp-active">
                        <option value="true" ${comp.isActive ? 'selected' : ''}>نشطة (تظهر للطلاب)</option>
                        <option value="false" ${!comp.isActive ? 'selected' : ''}>غير نشطة (مخفية)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>المرحلة الحالية</label>
                    <select id="comp-phase-status">
                        <option value="Registration" ${comp.status === 'Registration' ? 'selected' : ''}>فتح باب التسجيل</option>
                        <option value="In Progress" ${comp.status === 'In Progress' ? 'selected' : ''}>المواجهات قائمة</option>
                        <option value="Ended" ${comp.status === 'Ended' ? 'selected' : ''}>انتهت المسابقة</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column: 1/-1;">
                    <label>وصف وشروط المسابقة (يظهر للطلاب)</label>
                    <textarea id="comp-desc" style="height: 100px;">${comp.desc || ''}</textarea>
                </div>
                <div class="hero-btns" style="grid-column: 1/-1;">
                    <button class="btn-primary" onclick="saveCompetition()">حفظ إعدادات ${appData.grades[selectedGrade]?.title}</button>
                    <button class="btn-primary" style="background: var(--gradient-2);" onclick="triggerDistribution('Winners')">بدء جولة الفائزين (Round ${(comp.currentRound || 0) + 1})</button>
                    <button class="btn-primary" style="background: #4b5563;" onclick="triggerDistribution('Losers')">بدء جولة الخاسرين</button>
                </div>
            </div>

            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-item glass">
                    <h4>${regs.length}</h4>
                    <p>المسجلين من هذا الصف</p>
                </div>
                <div class="stat-item glass">
                    <h4>${regs.filter(r => r.status === 'Active' || r.status === 'Qualified').length}</h4>
                    <p>المتأهلون (الفائزون)</p>
                </div>
                <div class="stat-item glass">
                    <h4>${regs.filter(r => r.status === 'Relegated').length}</h4>
                    <p>المستبعدون (لديهم فرصة ثانية)</p>
                </div>
            </div>

            <h4 style="margin-bottom: 15px;"><i class="fas fa-swords"></i> التحكم في نتائج مواجهات ${appData.grades[selectedGrade]?.title}</h4>
            <div class="vouchers-table-container" style="margin-bottom: 40px;">
                <table>
                    <thead>
                        <tr>
                            <th>الجولة</th>
                            <th>الطالب الأول</th>
                            <th>الطالب الثاني</th>
                            <th>تحديد الفائز</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${matches.slice().sort((a, b) => b.createdAt - a.createdAt).map(m => `
                            <tr>
                                <td>جولة ${m.round}</td>
                                <td style="font-weight: 700;">${m.playerA.name}</td>
                                <td style="font-weight: 700;">${m.playerB ? m.playerB.name : 'تأهل تلقائي'}</td>
                                <td>
                                    ${m.status === 'Finished' ? `
                                        <span class="badge" style="background: #22c55e;">انتهت المواجهة</span>
                                    ` : `
                                        <div style="display: flex; gap: 5px; justify-content: center;">
                                            <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="setMatchWinner('${m.id}', '${m.playerA.id}', '${m.playerB ? m.playerB.id : ''}')">
                                                فوز ${m.playerA.name.split(' ')[0]}
                                            </button>
                                            ${m.playerB ? `
                                                <button class="btn-primary" style="background: var(--gradient-2); padding: 5px 10px; font-size: 0.8rem;" onclick="setMatchWinner('${m.id}', '${m.playerB.id}', '${m.playerA.id}')">
                                                    فوز ${m.playerB.name.split(' ')[0]}
                                                </button>
                                            ` : ''}
                                        </div>
                                    `}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h4>قائمة المتسابقين الكلية (${appData.grades[selectedGrade]?.title})</h4>
            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>الحالة</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${regs.map(r => `
                            <tr>
                                <td>${r.studentName}</td>
                                <td>
                                    <span class="badge" style="background: ${r.status === 'Eliminated' ? '#ef4444' : (r.status === 'Active' ? '#3b82f6' : (r.status === 'Relegated' ? '#f59e0b' : '#22c55e'))}">
                                        ${r.status === 'Pending' ? 'مسجل' : (r.status === 'Active' ? 'يلعب الآن' : (r.status === 'Qualified' ? 'متأهل للفائزين' : (r.status === 'Relegated' ? 'منتقل للخاسرين' : 'مستبعد نهائياً')))}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-primary" style="background: #ef4444; padding: 5px 10px;" onclick="updateRegStatus('${r.studentId}', 'Eliminated')">استبعاد</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'add-package') {
        main.innerHTML = `
            <h3>إضافة باقة تعليمية جديدة 📦</h3>
            <div class="admin-form-container">
                <div class="form-group">
                    <label>عنوان الباقة</label>
                    <input type="text" id="pkg-title" placeholder="مثلاً: باقة المراجعة النهائية">
                </div>
                <div class="form-group">
                    <label>وصف الباقة</label>
                    <input type="text" id="pkg-desc" placeholder="شرح مبسط لمحتوى الباقة">
                </div>
                <div class="form-group">
                    <label>سعر الباقة (ج.م)</label>
                    <input type="number" id="pkg-price" placeholder="300">
                </div>
                <div class="form-group">
                    <label>الفرع / المادة</label>
                    <select id="pkg-branch">
                        ${MATH_BRANCHES.filter(b => b !== 'الكل').map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>المرحلة</label>
                    <select id="pkg-grade" onchange="updateAdminBranches('pkg')">
                        <option value="3mid">الصف الثالث الإعدادي</option>
                        <option value="1sec">الصف الأول الثانوي</option>
                        <option value="2sec">الصف الثاني الثانوي</option>
                        <option value="3sec-sci">الصف الثالث الثانوي (علمي)</option>
                        <option value="3sec-lit">الصف الثالث الثانوي (أدبي)</option>
                    </select>
                </div>
            </div>

            <div id="pkg-videos-container">
                <h4>فيديوهات الباقة</h4>
                <div class="pkg-video-block glass">
                    <div class="form-group">
                        <label>عنوان الفيديو 1</label>
                        <input type="text" class="v-title" placeholder="اسم الفيديو">
                    </div>
                    <div class="form-group">
                        <label>رابط الفيديو 1</label>
                        <input type="text" class="v-url" placeholder="https://youtube.com/...">
                    </div>
                </div>
            </div>
            
            <div class="hero-btns" style="margin-top: 20px;">
                <button class="btn-secondary" onclick="addNewPkgVideoBlock()">
                    <i class="fas fa-plus"></i> إضافة فيديو للباقة
                </button>
                <button class="btn-primary" onclick="saveNewPackage()">
                    <i class="fas fa-save"></i> حفظ الباقة
                </button>
            </div>

            <hr style="margin: 40px 0; border: 1px solid var(--glass-border);">
            
            <h3>إدارة الباقات المضافة</h3>
            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>العنوان</th>
                            <th>المرحلة</th>
                            <th>الفرع</th>
                            <th>السعر</th>
                            <th>الفيديوهات</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.packages.slice().reverse().map(p => `
                            <tr>
                                <td>${p.title}</td>
                                <td>${appData.grades[p.grade]?.title || p.grade}</td>
                                <td>${p.branch}</td>
                                <td>${p.price} ج.م</td>
                                <td>${p.videos?.length || 0} فيديو</td>
                                <td>
                                    <button class="btn-primary" style="background: #ef4444; padding: 5px 10px;" onclick="deleteItem('packages', '${p.id}')">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                    <button class="btn-primary" style="background: #10b981; padding: 5px 10px; margin-right: 5px;" onclick="generatePackageVouchersPrompt('${p.id}', '${p.title}')">
                                        <i class="fas fa-key"></i> أكواد
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'vouchers') {
        const unusedCount = appData.vouchers.filter(v => !v.isUsed).length;

        // Detailed breakdown
        const stats = {
            '3mid': appData.vouchers.filter(v => v.grade === '3mid').length,
            '1sec': appData.vouchers.filter(v => v.grade === '1sec').length,
            '2sec': appData.vouchers.filter(v => v.grade === '2sec').length,
            '3sec': appData.vouchers.filter(v => v.grade === '3sec').length,
        };

        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>نظام أكواد التفعيل المتخصصة 🔑</h3>
                <div style="display: flex; gap: 10px;">
                    <select id="voucher-grade-filter" style="width: auto; margin-top: 0; padding: 5px 15px;" onchange="filterVouchersByGrade(this.value)">
                        <option value="all">كل المراحل</option>
                        <option value="3mid">3 إعدادي (${stats['3mid']})</option>
                        <option value="1sec">1 ثانوي (${stats['1sec']})</option>
                        <option value="2sec">2 ثانوي (${stats['2sec']})</option>
                        <option value="3sec">3 ثانوي (${stats['3sec']})</option>
                    </select>
                </div>
            </div>

            <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 30px;">
                <div class="stat-item glass">
                    <h4 style="color: var(--primary-light);">${appData.vouchers.length}</h4>
                    <p>الإجمالي</p>
                </div>
                <div class="stat-item glass">
                    <h4 style="color: #22c55e;">${unusedCount}</h4>
                    <p>أكواد متاحة</p>
                </div>
                  <div class="stat-item glass">
                    <h4 style="color: #6366f1;">${stats['3mid']}</h4>
                    <p>3 إعدادي</p>
                </div>
                <div class="stat-item glass">
                    <h4 style="color: #f59e0b;">${stats['1sec']}</h4>
                    <p>1 ثانوي</p>
                </div>
                <div class="stat-item glass">
                    <h4 style="color: #ef4444;">${stats['2sec']}</h4>
                    <p>2 ثانوي</p>
                </div>
                <div class="stat-item glass">
                    <h4 style="color: #a855f7;">${stats['3sec']}</h4>
                    <p>3 ثانوي</p>
                </div>
            </div>
            
            <div class="hero-btns" style="margin-bottom: 30px;">
                <button class="btn-primary" onclick="generateVouchers()">
                    <i class="fas fa-magic"></i> توليد 1000 كود جديد
                </button>
            </div>

            <div class="vouchers-table-container">
                <table id="vouchers-main-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">م</th>
                            <th>الكود</th>
                            <th>المرحلة</th>
                            <th>اسم الطالب/ملاحظة</th>
                            <th>الحالة</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="vouchers-table-body">
                        ${renderVoucherRows(appData.vouchers)}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'students-list') {
        main.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>قائمة الطلاب المسجلين 🎓</h3>
                <button class="btn-primary" onclick="printStudentsList()">
                    <i class="fas fa-print"></i> طباعة القائمة
                </button>
            </div>
            
            <div class="vouchers-table-container">
                <table id="printable-students-table">
                    <thead>
                        <tr>
                            <th>الاسم</th>
                            <th>رقم الهاتف</th>
                            <th>المرحلة الدراسية</th>
                            <th>تاريخ التسجيل</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.students.map(s => `
                            <tr>
                                <td>${s.name}</td>
                                <td style="font-family: monospace;">${s.phone || 'N/A'}</td>
                                <td>${appData.grades[s.grade]?.title || s.grade}</td>
                                <td>${new Date(s.createdAt).toLocaleDateString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'visits-log') {
        main.innerHTML = `
            <h3>سجل الزيارات اليومية 🕒</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">متابعة لحظية لدخول الطلاب للمنصة</p>
            
            <div class="vouchers-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>المرحلة</th>
                            <th>وقت الزيارة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.visits.map(v => `
                            <tr>
                                <td>${v.studentName}</td>
                                <td>${appData.grades[v.grade]?.title || v.grade}</td>
                                <td style="direction: ltr; text-align: right;">${new Date(v.timestamp).toLocaleString('ar-EG')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (section === 'manage-groups') {
        main.innerHTML = `<h3>إدارة المجموعات</h3><p>يمكنك تعديل أسماء المجموعات من خلال مصفوفة appData في ملف app.js حالياً.</p>`;
    } else if (section === 'settings') {
        main.innerHTML = `<h3>الإعدادات</h3><p>الإعدادات العامة للمنصة ستتوفر قريباً.</p>`;
    } else if (section === 'reset-system') {
        main.innerHTML = `
            <div class="glass" style="padding: 40px; border: 1px solid #ef4444; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"></i>
                <h2 style="color: #ef4444; margin-bottom: 20px;">تصفير النظام بالكامل</h2>
                <p style="font-size: 1.2rem; margin-bottom: 30px;">
                    انتبه! هذه العملية ستقوم بحذف <b>كل شيء</b> قمت بإضافته (الدروس، الاختبارات، المذكرات، الطلاب، سجلات الزيارات، وأكواد التفعيل).
                </p>
                <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-primary" style="background: #ef4444; padding: 15px 40px;" onclick="resetFullSystem()">
                         نعم، قم بتصفير النظام
                    </button>
                    <!-- Security Test Button -->
                    <button class="btn-primary" style="background: #f59e0b; padding: 15px 40px;" onclick="testSecurityFeatures()">
                        <i class="fas fa-shield-alt"></i> تجربة نظام الحماية
                    </button>
                </div>
            </div>
        `;
    }

    if (section === 'add-lesson') updateAdminBranches('lesson');
    if (section === 'add-package') updateAdminBranches('pkg');
    if (section === 'add-exam') updateAdminBranches('exam');
    if (section === 'add-file') updateAdminBranches('file');
}

let pkgVideoCount = 1;
function addNewPkgVideoBlock() {
    pkgVideoCount++;
    const container = document.getElementById('pkg-videos-container');
    const block = document.createElement('div');
    block.className = 'pkg-video-block glass';
    block.innerHTML = `
        <div class="form-group">
            <label>عنوان الفيديو ${pkgVideoCount}</label>
            <input type="text" class="v-title" placeholder="اسم الفيديو">
        </div>
        <div class="form-group">
            <label>رابط الفيديو ${pkgVideoCount}</label>
            <input type="text" class="v-url" placeholder="https://youtube.com/...">
        </div>
    `;
    container.appendChild(block);
}

async function saveNewPackage() {
    const title = document.getElementById('pkg-title').value;
    const desc = document.getElementById('pkg-desc').value;
    const price = document.getElementById('pkg-price').value;
    const grade = document.getElementById('pkg-grade').value;
    const branch = document.getElementById('pkg-branch').value;
    const blocks = document.querySelectorAll('.pkg-video-block');

    if (!title || !price) return alert('برجاء إدخال عنوان وسعر الباقة');

    let videos = [];
    blocks.forEach(block => {
        const vTitle = block.querySelector('.v-title').value;
        const vUrl = block.querySelector('.v-url').value;
        if (vTitle && vUrl) videos.push({ title: vTitle, url: vUrl });
    });

    if (videos.length === 0) return alert('برجاء إضافة فيديو واحد على الأقل للباقة');

    const newPackage = {
        title, desc, price, grade, branch, videos,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const docRef = await db.collection('packages').add(newPackage);
        newPackage.id = docRef.id;
        appData.packages.push(newPackage);
        alert('تم حفظ الباقة بنجاح');
        if (currentState.selectedGrade === grade) renderContent();
        pkgVideoCount = 1;
        renderAdminSection('add-package');
    } catch (error) {
        console.error("Error saving package:", error);
        alert('حدث خطأ أثناء حفظ الباقة');
    }
}

async function checkPackageVoucher(btn, pkgId) {
    const input = btn.previousElementSibling;
    const code = input.value.trim().toUpperCase();
    if (!code) return alert('برجاء إدخال الكود');

    // Find in appData
    const voucher = appData.vouchers.find(v => v.code === code);

    if (voucher) {
        if (voucher.isUsed) return alert('هذا الكود تم استخدامه من قبل');
        if (voucher.isActive === false) return alert('تم إغلاق هذا الكود من قبل الإدارة');

        try {
            await db.collection('vouchers').doc(voucher.id).update({
                isUsed: true,
                usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                targetId: pkgId // Optional: track what it unlocked
            });
            voucher.isUsed = true;

            localStorage.setItem(`pkg_unlocked_${pkgId}`, 'true');
            alert('تم تفعيل الباقة بنجاح! يمكنك الآن مشاهدة الفيديوهات.');
            renderContent();
        } catch (error) {
            console.error("Error updating voucher:", error);
            alert('فشل تفعيل الكود، تأكد من الاتصال بالإنترنت');
        }
    } else {
        alert('كود تفعيل غير صحيح');
    }
}

function openPackageVideo(url, title) {
    const modal = document.getElementById('intro-modal');
    const videoId = getYouTubeId(url);
    if (!videoId) return alert('عذراً، رابط الفيديو غير صحيح');

    modal.style.display = 'flex';

    if (ytPlayers['intro'] && ytPlayers['intro'].loadVideoById) {
        try {
            ytPlayers['intro'].loadVideoById(videoId);
            ytPlayers['intro'].playVideo();
        } catch (e) {
            initYTPlayer('intro', videoId, 'intro-video-iframe');
        }
    } else {
        initYTPlayer('intro', videoId, 'intro-video-iframe');
    }
}

function showSubscriptionInfo(title, price, pkgId) {
    const phone = "01550366657";
    const modal = document.createElement('div');
    modal.id = 'subscription-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
        <div class="modal-content glass" style="max-width: 450px; text-align: center; border: 1px solid var(--primary-color);">
            <div style="font-size: 3rem; color: #22c55e; margin-bottom: 20px;">
                <i class="fab fa-vimeo-v" style="background: #ef4444; color: white; border-radius: 50%; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.5rem;">V</i>
            </div>
            <h3>الاشتراك في باقة: ${title}</h3>
            
            <div class="subscription-section">
                <p style="margin: 15px 0;">للاشتراك، برجاء تحويل <strong style="color: var(--primary-light);">${price} ج.م</strong> عبر فودافون كاش:</p>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 15px;">
                    <span id="payment-phone" style="font-size: 1.5rem; font-family: monospace; letter-spacing: 2px;">${phone}</span>
                    <button onclick="copyToClipboard('${phone}')" class="btn-icon" title="نسخ الرقم">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <button class="btn-primary w-100" onclick="contactSupportWhatsApp('${phone}', '${title}')">
                    <i class="fab fa-whatsapp"></i> إرسال إيصال التحويل لتفعيل الباقة
                </button>
            </div>

            <div style="margin: 20px 0; display: flex; align-items: center; gap: 10px; color: var(--text-muted);">
                <hr style="flex: 1; border: 0.5px solid var(--glass-border);">
                <span>أو إذا كان معك كود</span>
                <hr style="flex: 1; border: 0.5px solid var(--glass-border);">
            </div>

            <div class="voucher-activation-section">
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">أدخل كود التفعيل الذي استلمته من المدرس</p>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="modal-voucher-input" class="voucher-input" placeholder="أدخل الكود هنا" style="text-align: center; letter-spacing: 2px;">
                    <button class="btn-primary" onclick="handleModalVoucherActivation('${pkgId}')" style="min-width: 100px;">تفعيل</button>
                </div>
            </div>

            <button class="btn-outline w-100" style="margin-top: 20px;" onclick="this.closest('.modal').remove()">إغلاق</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function handleModalVoucherActivation(pkgId) {
    const input = document.getElementById('modal-voucher-input');
    const code = input.value.trim().toUpperCase();
    if (!code) return alert('برجاء إدخل الكود');

    const voucher = appData.vouchers.find(v => v.code === code);
    if (voucher) {
        if (voucher.isUsed) return alert('هذا الكود تم استخدامه من قبل');
        if (voucher.isActive === false) return alert('تم إيقاف هذا الكود');

        // Check if voucher is for specific package
        if (voucher.grade === 'package') {
            if (voucher.packageId !== pkgId) {
                return alert(`هذا الكود غير صحيح لهذه الباقة (مخصص لباقة: ${voucher.packageName})`);
            }
        } else {
            // Optional: Allow Grade Vouchers to unlock packages of that grade? 
            // "I buy a book by page" - user says package is like buying a book.
            // If user wants STRICT package codes, we should reject generic grade codes?
            // However, usually a "Full Year Subscription" (Grade Voucher) implies access to everything.
            // Let's allow Grade Match for better UX unless user complains.
            const pkg = appData.packages.find(p => p.id === pkgId);
            let currentGrade = pkg ? pkg.grade : '';
            let voucherCategory = currentGrade.startsWith('3sec') ? '3sec' : currentGrade;

            if (voucher.grade && voucher.grade !== voucherCategory) {
                return alert('هذا الكود لمرحلة دراسية أخرى، ولا يصلح لهذه الباقة');
            }
        }

        try {
            await db.collection('vouchers').doc(voucher.id).update({
                isUsed: true,
                usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                targetId: pkgId
            });
            voucher.isUsed = true;
            localStorage.setItem(`pkg_unlocked_${pkgId}`, 'true');
            alert('تم تفعيل الباقة بنجاح!');
            document.getElementById('subscription-modal').remove();
            renderContent();
        } catch (e) {
            alert('خطأ في الاتصال بالسحابة');
        }
    } else {
        alert('كود غير صحيح');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('تم نسخ الرقم بنجاح');
    });
}

function contactSupportWhatsApp(phone, pkgTitle) {
    const student = JSON.parse(localStorage.getItem('studentSession') || '{}');
    const msg = `أهلاً يا مستر، أنا الطالب ${student.name || ''}%0Aلقد قمت بتحويل تكلفة باقة *${pkgTitle}*%0Aوهذا إيصال التحويل لتفعيل الباقة.`;
    window.open(`https://wa.me/2${phone}?text=${msg}`, '_blank');
}

let questionCount = 1;
function addNewQuestionBlock() {
    questionCount++;
    const container = document.getElementById('questions-container');
    const block = document.createElement('div');
    block.className = 'question-block glass';
    block.innerHTML = `
        <div class="form-group">
            <label>السؤال ${questionCount}</label>
            <textarea class="q-text" placeholder="أدخل نص السؤال"></textarea>
        </div>
        <div class="options-grid">
            <input type="text" class="opt1" placeholder="الاختيار 1">
            <input type="text" class="opt2" placeholder="الاختيار 2">
            <input type="text" class="opt3" placeholder="الاختيار 3">
            <input type="text" class="opt4" placeholder="الاختيار 4">
        </div>
        <div class="form-group">
            <label>رقم الإجابة الصحيحة</label>
            <select class="correct-idx">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
            </select>
        </div>
    `;
    container.appendChild(block);
}

async function saveNewLesson() {
    const url = document.getElementById('lesson-url').value;
    const title = document.getElementById('lesson-title').value;
    const desc = document.getElementById('lesson-desc').value;
    const grade = document.getElementById('lesson-grade').value;
    const branch = document.getElementById('lesson-branch').value;
    if (!url || !title) return alert('برجاء ملء البيانات');
    const newLesson = {
        url, title, grade, branch, desc: desc || 'درس فيديو توضيحي',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        const docRef = await db.collection('lessons').add(newLesson);
        newLesson.id = docRef.id;
        appData.lessons.push(newLesson);
        alert('تم الحفظ بنجاح في السحابة');
        if (currentState.selectedGrade === grade) renderContent();
        renderAdminSection('add-lesson');
    } catch (error) {
        console.error("Error saving lesson:", error);
        alert('فشل الحفظ في قاعدة البيانات');
    }
}

async function saveNewExam() {
    const title = document.getElementById('exam-title').value;
    const grade = document.getElementById('exam-grade').value;
    const branch = document.getElementById('exam-branch').value;
    const blocks = document.querySelectorAll('.question-block');
    if (!title) return alert('برجاء إدخال عنوان الاختبار');
    let questions = [];
    blocks.forEach(block => {
        const text = block.querySelector('.q-text').value;
        const opts = [
            block.querySelector('.opt1').value,
            block.querySelector('.opt2').value,
            block.querySelector('.opt3').value,
            block.querySelector('.opt4').value
        ];
        const correct = block.querySelector('.correct-idx').value;
        if (text && opts.every(o => o)) questions.push({ text, opts, correct });
    });
    if (questions.length === 0) return alert('برجاء إضافة سؤال واحد على الأقل مع كافة بياناته');
    const newExam = {
        title, grade, branch, questions,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        const docRef = await db.collection('exams').add(newExam);
        newExam.id = docRef.id;
        appData.exams.push(newExam);
        alert('تم حفظ الاختبار بنجاح في السحابة');
        if (currentState.selectedGrade === grade) renderContent();
        questionCount = 1;
        renderAdminSection('add-exam');
    } catch (error) {
        console.error("Error saving exam:", error);
        alert('حدث خطأ أثناء حفظ الاختبار');
    }
}

async function saveNewFile() {
    const url = document.getElementById('file-url').value;
    const title = document.getElementById('file-title').value;
    const grade = document.getElementById('file-grade').value;
    const branch = document.getElementById('file-branch').value;
    if (!url || !title) return alert('برجاء ملء البيانات');
    const newFile = {
        url, title, grade, branch,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        const docRef = await db.collection('files').add(newFile);
        newFile.id = docRef.id;
        appData.files.push(newFile);
        alert('تم حفظ الملف بنجاح');
        if (currentState.selectedGrade === grade) renderContent();
        renderAdminSection('add-file');
    } catch (error) {
        console.error("Error saving file:", error);
        alert('فشل الحفظ في قاعدة البيانات');
    }
}

function logout() {
    currentState.isAdmin = false;
    document.getElementById('admin-dashboard').classList.add('hidden');
}

function hideAdminDashboard() {
    document.getElementById('admin-dashboard').classList.add('hidden');
}

function sendWhatsAppMessage(event) {
    event.preventDefault();
    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const grade = document.getElementById('contact-grade').value;
    const message = document.getElementById('contact-message').value;
    const whatsappNumber = "201550366657";
    const text = `*رسالة جديدة من الموقع*%0A%0A` +
        `*الاسم:* ${name}%0A` +
        `*رقم الهاتف:* ${phone}%0A` +
        `*المرحلة:* ${grade}%0A` +
        `*الرسالة:* ${message}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
    window.open(whatsappUrl, '_blank');
}

// --- Voucher Management ---
function generateRandomCode(length = 10) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function generateVouchers() {
    const gradesToGen = [
        { id: '3mid', title: '3 إعدادي' },
        { id: '1sec', title: '1 ثانوي' },
        { id: '2sec', title: '2 ثانوي' },
        { id: '3sec', title: '3 ثانوي' }
    ];

    if (!confirm('هل أنت متأكد من توليد 250 كود لكل مرحلة (إجمالي 1000 كود)؟')) return;

    const newVouchers = [];
    const chunks = [];

    // Create 250 vouchers per grade
    gradesToGen.forEach(g => {
        for (let i = 0; i < 250; i++) {
            const code = generateRandomCode(10);
            newVouchers.push({
                code: code,
                grade: g.id,
                isUsed: false,
                isActive: true,
                note: '',
                createdAt: new Date().toISOString()
            });
        }
    });

    // Firestore batch limit is 500
    for (let i = 0; i < newVouchers.length; i += 500) {
        chunks.push(newVouchers.slice(i, i + 500));
    }

    try {
        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(vData => {
                const ref = db.collection('vouchers').doc();
                batch.set(ref, vData);
                vData.id = ref.id;
            });
            await batch.commit();
        }

        appData.vouchers.push(...newVouchers);
        alert('تم توليد 1000 كود بنجاح (250 لكل مرحلة) وحفظهم في السحابة');
        renderAdminSection('vouchers');
    } catch (error) {
        console.error("Error generating vouchers:", error);
        alert('حدث خطأ أثناء توليد الأكواد');
    }
}

async function generatePackageVouchersPrompt(pkgId, pkgTitle) {
    const countStr = prompt(`كم عدد الأكواد التي تريد توليدها لباقة "${pkgTitle}"؟`, "50");
    if (!countStr) return;
    const count = parseInt(countStr);
    if (isNaN(count) || count <= 0) return alert("عدد غير صحيح");

    if (!confirm(`هل أنت متأكد من توليد ${count} كود خاص بالباقة "${pkgTitle}"؟`)) return;

    const newVouchers = [];
    for (let i = 0; i < count; i++) {
        newVouchers.push({
            code: generateRandomCode(12),
            grade: 'package',
            packageId: pkgId,
            packageName: pkgTitle,
            isUsed: false,
            isActive: true,
            note: '',
            createdAt: new Date().toISOString()
        });
    }

    // Batch save
    const chunks = [];
    for (let i = 0; i < newVouchers.length; i += 500) {
        chunks.push(newVouchers.slice(i, i + 500));
    }

    try {
        for (const chunk of chunks) {
            const batch = db.batch();
            chunk.forEach(vData => {
                const ref = db.collection('vouchers').doc();
                batch.set(ref, vData);
                vData.id = ref.id;
            });
            await batch.commit();
        }

        appData.vouchers.push(...newVouchers);
        alert(`تم توليد ${count} كود مخصص للباقة بنجاح`);
        // Navigate to vouchers section to show them
        document.querySelector('.admin-nav li[data-section="vouchers"]').click();
    } catch (error) {
        console.error("Error generating package vouchers:", error);
        alert('حدث خطأ أثناء حفظ الأكواد');
    }
}

async function checkVoucher(btn) {
    const input = btn.previousElementSibling;
    const code = input.value.trim().toUpperCase();
    if (!code) return alert('برجاء إدخال الكود');

    // Find in appData first
    const voucher = appData.vouchers.find(v => v.code === code);

    if (voucher) {
        if (voucher.isUsed) return alert('هذا الكود تم استخدامه من قبل');
        if (voucher.isActive === false) return alert('تم إغلاق هذا الكود من قبل الإدارة، برجاء التواصل مع الأستاذ');

        // Verify if voucher matches current selected grade
        let currentGrade = currentState.selectedGrade;
        let voucherCategory = currentGrade.startsWith('3sec') ? '3sec' : currentGrade;

        if (voucher.grade && voucher.grade !== voucherCategory) {
            return alert('هذا الكود مخصص لمرحلة دراسية أخرى، برجاء إدخال كود مخصص لهذه المرحلة');
        }

        try {
            await db.collection('vouchers').doc(voucher.id).update({
                isUsed: true,
                usedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            voucher.isUsed = true;

            // Unlock specific grade
            localStorage.setItem(`unlocked_${currentGrade}`, 'true');

            alert('تم تفعيل هذه المرحلة بنجاح! يمكنك الآن مشاهدة جميع الدروس الخاصة بها.');
            renderContent();
        } catch (error) {
            console.error("Error updating voucher status:", error);
            alert('فشل تفعيل الكود، تأكد من اتصالك بالإنترنت');
        }
    } else {
        alert('كود غير صحيح، تأكد من كتابة الكود بشكل صحيح');
    }
}

async function handleStudentLogin(event) {
    event.preventDefault();
    const name = document.getElementById('student-name').value;
    const phone = document.getElementById('student-phone').value;
    const grade = document.getElementById('student-grade').value;

    // Check if student already exists in our local data
    let student = appData.students.find(s => s.phone === phone);

    if (!student) {
        const studentData = {
            name,
            phone,
            grade,
            createdAt: new Date().toISOString()
        };

        try {
            const docRef = await db.collection('students').add(studentData);
            studentData.id = docRef.id;
            appData.students.unshift(studentData);
            student = studentData;
        } catch (error) {
            console.error("Error saving student:", error);
            return alert('حدث خطأ أثناء تسجيل الدخول');
        }
    } else {
        // If student exists but they changed their grade in the form, you might want to update it
        // but for "uniqueness", we just take the existing record.
    }

    localStorage.setItem('studentSession', JSON.stringify(student));
    logVisit(student);
    showSecurityWatermark(student);
    document.getElementById('student-login-modal').style.display = 'none';
    alert(`أهلاً بك يا ${student.name} في منصة الأستاذ أحمد فاروق`);

    // Auto select the student's grade
    selectGrade(student.grade);
}

function printStudentsList() {
    const table = document.getElementById('printable-students-table').outerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>قائمة الطلاب</title>');
    win.document.write('<style>body{direction:rtl; font-family: Tahoma; padding: 20px;} table{width:100%; border-collapse:collapse; margin-top:20px;} th,td{border:1px solid #ddd; padding:12px; text-align:right;} th{background:#f4f4f4;} h2{text-align:center;}</style>');
    win.document.write('</head><body>');
    win.document.write('<h2>قائمة الطلاب المسجلين - منصة الأستاذ أحمد فاروق</h2>');
    win.document.write(table);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
}

async function logVisit(student) {
    if (!student) return;

    // Prevent multiple logs in the same session (tab open)
    if (sessionStorage.getItem('visitLogged')) return;

    const visitData = {
        studentName: student.name,
        phone: student.phone,
        grade: student.grade,
        timestamp: new Date().toISOString()
    };
    try {
        await db.collection('visits').add(visitData);
        appData.visits.unshift(visitData); // Local update
        sessionStorage.setItem('visitLogged', 'true');
    } catch (error) {
        console.error("Error logging visit:", error);
    }
}

function openIntroVideo() {
    const modal = document.getElementById('intro-modal');
    const videoId = 'c7EwMgecsVk';
    modal.style.display = 'flex';

    if (ytPlayers['intro']) {
        ytPlayers['intro'].loadVideoById(videoId);
    } else {
        initYTPlayer('intro', videoId, 'intro-video-iframe');
    }
}

function initYTPlayer(id, videoId, elementId = null) {
    if (!isYouTubeAPIReady) {
        setTimeout(() => initYTPlayer(id, videoId, elementId), 500);
        return;
    }

    const targetId = elementId || `player-${id}`;

    // For modal/intro, ensure the element exists because destroy() removes it from DOM
    if (id === 'intro' && !document.getElementById('intro-video-iframe')) {
        const wrapper = document.getElementById('intro-video-wrapper');
        if (wrapper) {
            wrapper.insertAdjacentHTML('afterbegin', '<iframe id="intro-video-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>');
        }
    }

    // Clean up old player if exists
    if (ytPlayers[id]) {
        try {
            ytPlayers[id].destroy();
            delete ytPlayers[id];
        } catch (e) { }
    }

    ytPlayers[id] = new YT.Player(targetId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'autoplay': (id === 'intro') ? 1 : 0,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'iv_load_policy': 3,
            'disablekb': 1,
            'fs': 1,
            'enablejsapi': 1,
            'origin': window.location.origin
        },
        events: {
            'onStateChange': (event) => onPlayerStateChange(event, id)
        }
    });
}

function onPlayerStateChange(event, id) {
    const wrapper = id === 'intro' ? document.getElementById('intro-video-wrapper') : document.getElementById(`vid-wrapper-${id}`);
    if (!wrapper) return;
    const playIcon = wrapper.querySelector('.play-overlay i');
    const playOverlay = wrapper.querySelector('.play-overlay');

    if (event.data == YT.PlayerState.PLAYING) {
        if (playOverlay) playOverlay.style.opacity = '0';
        if (playIcon) playIcon.className = 'fas fa-pause';
        startProgressLoop(id);
    } else {
        if (playOverlay) playOverlay.style.opacity = '1';
        if (playIcon) playIcon.className = 'fas fa-play';
        stopProgressLoop(id);
    }
}

let progressIntervals = {};

function startProgressLoop(id) {
    stopProgressLoop(id);
    progressIntervals[id] = setInterval(() => {
        const player = ytPlayers[id];
        const progressBar = document.getElementById(`progress-${id}`);
        if (player && progressBar && player.getCurrentTime) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            const percent = (currentTime / duration) * 100;
            progressBar.style.width = `${percent}%`;
        }
    }, 1000);
}

function stopProgressLoop(id) {
    if (progressIntervals[id]) {
        clearInterval(progressIntervals[id]);
        delete progressIntervals[id];
    }
}

function handleSeek(event, id) {
    const player = ytPlayers[id];
    if (!player) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percent = x / width;
    const duration = player.getDuration();
    if (duration > 0) {
        player.seekTo(duration * percent, true);
    }
}

function togglePlayPause(id) {
    const player = ytPlayers[id];
    if (!player) return;

    const state = player.getPlayerState();
    if (state == YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

// Custom Fullscreen Handler
function toggleFullscreen(wrapperId) {
    const elem = document.getElementById(wrapperId);
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Seek functionality
function seek(id, seconds) {
    const player = ytPlayers[id];
    if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime + seconds, true);
    }
}

// Disable right-click on video wrappers to prevent context menu redirects
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.video-preview-wrapper, .video-container-wrapper')) {
        e.preventDefault();
        return false;
    }
});

function closeIntroVideo() {
    const modal = document.getElementById('intro-modal');
    if (ytPlayers['intro']) {
        ytPlayers['intro'].stopVideo();
    }
    modal.style.display = 'none';
}

function updateAdminBranches(type) {
    const gradeSelect = document.getElementById(`${type}-grade`);
    const branchSelect = document.getElementById(`${type}-branch`);
    if (!gradeSelect || !branchSelect) return;
    const selectedGrade = gradeSelect.value;

    const branches = appData.grades[selectedGrade]?.branches || MATH_BRANCHES;

    branchSelect.innerHTML = branches
        .filter(b => b !== 'الكل')
        .map(b => `<option value="${b}">${b}</option>`)
        .join('');
}
async function deleteItem(collection, id) {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    try {
        await db.collection(collection).doc(id).delete();
        // تحديث البيانات محلياً
        appData[collection] = appData[collection].filter(item => item.id !== id);
        alert('تم الحذف بنجاح');

        // إعادة رندرة القسم المفتوح في لوحة التحكم
        const sectionMap = {
            'lessons': 'add-lesson',
            'packages': 'add-package',
            'exams': 'add-exam',
            'files': 'add-file'
        };
        renderAdminSection(sectionMap[collection]);

        // تحديث الموقع الأساسي إذا كان المستخدم يشاهد قسماً معيناً
        if (currentState.selectedGrade) renderContent();
    } catch (error) {
        console.error("Error deleting item:", error);
        alert('حدث خطأ أثناء الحذف، يرجى المحاولة مرة أخرى');
    }
}
async function toggleVoucherStatus(id, currentActive) {
    try {
        const newStatus = !currentActive;
        await db.collection('vouchers').doc(id).update({
            isActive: newStatus
        });

        // تحديث محلي
        const voucher = appData.vouchers.find(v => v.id === id);
        if (voucher) voucher.isActive = newStatus;

        alert(newStatus ? 'تم تفعيل الكود بنجاح' : 'تم إغلاق الكود بنجاح');
        renderAdminSection('vouchers');
    } catch (error) {
        console.error("Error toggling voucher status:", error);
        alert('حدث خطأ أثناء تعديل حالة الكود');
    }
}

async function updateVoucherNote(id, note) {
    try {
        await db.collection('vouchers').doc(id).update({
            note: note
        });

        // تحديث محلي
        const voucher = appData.vouchers.find(v => v.id === id);
        if (voucher) voucher.note = note;
    } catch (error) {
        console.error("Error updating voucher note:", error);
    }
}

// --- New Voucher UI Helpers ---
function renderVoucherRows(vouchers) {
    return vouchers.slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .reverse()
        .map((v, idx, arr) => {
            const active = v.isActive !== false;
            const serial = arr.length - idx;
            const gradeTitle = v.grade === 'package'
                ? `<span style="color:#d8b4fe">📦 ${v.packageName}</span>`
                : (appData.grades[v.grade]?.title ||
                    (v.grade === '3sec' ? 'الثالث الثانوي' :
                        (v.grade === '3mid' ? 'الثالث الإعدادي' :
                            (v.grade === '1sec' ? 'الأول الثانوي' :
                                (v.grade === '2sec' ? 'الثاني الثانوي' : v.grade || 'غير محدد')))));

            return `
                <tr>
                    <td><span style="color: var(--text-muted); font-size: 0.8rem;">#${serial}</span></td>
                    <td style="font-family: monospace; font-size: 1.1rem; color: var(--primary-light);">${v.code}</td>
                    <td><span class="status-badge" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">${gradeTitle}</span></td>
                    <td>
                        <input type="text" class="voucher-note-input" 
                               value="${v.note || ''}" 
                               placeholder="اكتب اسم الطالب هنا..." 
                               onblur="updateVoucherNote('${v.id}', this.value)">
                    </td>
                    <td>
                        <span class="status-badge" style="background: ${v.isUsed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; color: ${v.isUsed ? '#ef4444' : '#22c55e'};">
                            ${v.isUsed ? 'مُستخدم' : 'متاح'}
                        </span>
                        <span class="status-badge" style="background: ${active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; color: ${active ? '#22c55e' : '#f59e0b'}; margin-right: 5px;">
                            ${active ? 'مفعل' : 'مغلق'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-primary" style="background: ${active ? '#f59e0b' : '#22c55e'}; padding: 5px 10px;" onclick="toggleVoucherStatus('${v.id}', ${active})">
                            <i class="fas fa-${active ? 'pause' : 'play'}"></i> ${active ? 'إغلاق' : 'تفعيل'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
}

function filterVouchersByGrade(grade) {
    const tbody = document.getElementById('vouchers-table-body');
    if (!tbody) return;

    const filtered = grade === 'all'
        ? appData.vouchers
        : appData.vouchers.filter(v => v.grade === grade);

    tbody.innerHTML = renderVoucherRows(filtered);
}

async function resetFullSystem() {
    const confirmation = confirm("⚠️ تحذير نهائي: هل أنت متأكد من حذف كافة البيانات (دروس، طلاب، اختبارات، أكواد، إلخ)؟ لا يمكن التراجع عن هذه الخطوة!");
    if (!confirmation) return;

    const secondConfirmation = prompt("لتأكيد الحذف، اكتب كلمة 'تصفير' في المربع أدناه:");
    if (secondConfirmation !== 'تصفير') {
        alert("إجراء ملغي: الكلمة غير صحيحة");
        return;
    }

    const collections = ['lessons', 'packages', 'exams', 'files', 'vouchers', 'students', 'visits'];

    try {
        // Show loading state
        document.getElementById('admin-content-area').innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary-light);"></i>
                <h3 style="margin-top: 20px;">جاري تصفير النظام... برجاء عدم إغلاق الصفحة</h3>
            </div>
        `;

        for (const coll of collections) {
            const snapshot = await db.collection(coll).get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        // Clear local storage
        localStorage.clear();
        sessionStorage.clear();

        alert("تم تصفير النظام بنجاح! سيتم إعادة تحميل الصفحة الآن.");
        window.location.reload();

    } catch (error) {
        console.error("Error resetting system:", error);
        alert("حدث خطأ أثناء تصفير النظام. برجاء المحاولة مرة أخرى أو التواصل مع المبرمج.");
    }
}

function testSecurityFeatures() {
    alert("سيتم الآن تجربة شاشة 'محاولة الاختراق' لمدة 3 ثواني...");
    toggleBlackout(true);
    setTimeout(() => {
        toggleBlackout(false);
        // Force watermark refresh
    }, 3000);
}

function updateCompetitionUI() {
    const dynamicArea = document.getElementById('competition-dynamic-area');
    if (!dynamicArea) return;

    const session = localStorage.getItem('studentSession');
    const student = session ? JSON.parse(session) : null;
    const reg = currentState.compReg;

    // Use competition for student's grade, or first available for guests
    const gradeId = student ? student.grade : Object.keys(appData.competitions)[0];
    const comp = appData.competitions[gradeId] || {};

    document.getElementById('display-comp-title').innerHTML = `<i class="fas fa-trophy" style="color: gold;"></i> ${comp.title || 'مسابقة المتفوقين'}`;
    document.getElementById('display-comp-desc').textContent = comp.desc || 'استعد لأقوى التحديات الرياضية!';

    let actionHTML = '';

    if (!student) {
        actionHTML = `<button class="btn-primary" onclick="alert('برجاء تسجيل الدخول أولاً للمشاركة'); scrollToSection('student-login-modal')">سجل دخولك للمشاركة</button>`;
    } else if (!comp.isActive) {
        actionHTML = `<div class="badge" style="background: var(--glass-border); color: var(--text-muted);">المسابقة مغلقة حالياً لصفك الدراسي</div>`;
    } else if (!reg) {
        if (comp.status === 'Registration' || !comp.status) {
            actionHTML = `
                <div class="registration-form glass" style="padding: 20px; border-radius: 15px; border: 1px solid var(--primary-light);">
                    <h4 style="color: var(--primary-light); margin-bottom: 15px;">انضم للمنافسة الآن! 🏆</h4>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label style="color: white; font-size: 0.9rem; margin-bottom: 8px; display: block;">أدخل اسمك الذي سيظهر في المسابقة:</label>
                        <input type="text" id="comp-student-name" placeholder="مثال: أحمد محمد علي" 
                               style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.3); color: white;">
                    </div>
                    <button class="btn-primary" style="width: 100%;" onclick="handleCompetitionSubscription()">تأكيد الاشتراك في المسابقة</button>
                    <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 10px; text-align: center;">هذه المسابقة مخصصة لطلاب: ${appData.grades[student.grade]?.title}</p>
                </div>
            `;
        } else {
            actionHTML = `<div class="badge" style="background: #ef4444; color: white;">عذراً، انتهت فترة التسجيل</div>`;
        }
    } else {
        if (reg.status === 'Pending') {
            actionHTML = `
                <div class="registration-status glass" style="padding: 15px; border-radius: 10px; border: 1px solid var(--primary-light);">
                    <p style="color: var(--primary-light); font-weight: 700; margin-bottom: 5px;"><i class="fas fa-clock"></i> تم التسجيل بنجاح</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">في انتظار توزيع طلاب صفك من قبل الإدارة...</p>
                </div>
            `;
        } else if (reg.status === 'Eliminated') {
            actionHTML = `
                <div class="registration-status glass card-loser" style="padding: 15px; border-radius: 10px;">
                    <p style="color: #ef4444; font-weight: 700; margin-bottom: 5px;"><i class="fas fa-times-circle"></i> حظ أوفر</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">لقد انتهى مشوارك في المسابقة.</p>
                </div>
            `;
        } else if (reg.status === 'Active' || reg.status === 'Qualified' || reg.status === 'Relegated') {
            if (currentState.currentMatch) {
                const m = currentState.currentMatch;
                const studentIsA = m.playerA.id === student.id;
                const opponentName = studentIsA ? (m.playerB ? m.playerB.name : 'تأهل تلقائي') : m.playerA.name;

                // Initial result is "Neutral/Tie" until teacher decides
                let resultText = "متعادلة (في انتظار قرار المستر)";
                if (m.winner) {
                    resultText = m.winner === student.id ? "مبروك! لقد فزت في هذه الجولة" : "للأسف، خسر هذه الجولة";
                }

                actionHTML = `
                    <div class="registration-status glass card-playing" style="padding: 25px; border-radius: 15px; animation: pulse-blue 2s infinite;">
                        <h4 style="color: #3b82f6; margin-bottom: 15px; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 10px;">مواجهة مباشرة ⚔️</h4>
                        <div style="display: flex; flex-direction: column; gap: 10px; text-align: right;">
                            <p><strong>الخصم:</strong> <span style="color: white; font-size: 1.1rem;">${opponentName}</span></p>
                            <p><strong>النتيجة:</strong> <span style="color: var(--primary-light); font-weight: 700;">${resultText}</span></p>
                        </div>
                    </div>
                `;
            } else if (reg.status === 'Qualified') {
                actionHTML = `
                    <div class="registration-status glass card-winner" style="padding: 15px; border-radius: 10px;">
                        <p style="color: #22c55e; font-weight: 700; margin-bottom: 5px;"><i class="fas fa-check-circle"></i> أنت بطل متأهل!</p>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">أحسنت! انتظر الجولة القادمة بتركيز.</p>
                    </div>
                `;
            } else if (reg.status === 'Relegated') {
                actionHTML = `
                    <div class="registration-status glass" style="padding: 15px; border-radius: 10px; border: 1px solid #f59e0b;">
                        <p style="color: #f59e0b; font-weight: 700; margin-bottom: 5px;"><i class="fas fa-history"></i> محاولة ثانية</p>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">لقد انتقلت لمسار الخاسرين. لا تقلق، لا زال لديك فرصة للمنافسة والعودة!</p>
                    </div>
                `;
            }
        }
    }

    document.getElementById('comp-action-area').innerHTML = actionHTML;

    // Render matches schedule table (Filter by student grade)
    const matches = appData.compMatches || [];
    const myGradeMatches = student ? matches.filter(m => {
        // Find if any player in this match belongs to student's grade (all players in a match should be same grade)
        // We can also store 'grade' in match object for easier filtering.
        return m.grade === student.grade;
    }) : [];

    if (myGradeMatches.length > 0) {
        document.getElementById('comp-schedule-container').classList.remove('hidden');
        renderMatchesTable(myGradeMatches);
    } else {
        document.getElementById('comp-schedule-container').classList.add('hidden');
    }
}

function renderMatchesTable(matches) {
    const tbody = document.getElementById('matches-table-body');
    if (!tbody) return;

    tbody.innerHTML = matches.slice().sort((a, b) => b.createdAt - a.createdAt).map(m => {
        const winnerId = m.winner;
        const playerAName = m.playerA.name;
        const playerBName = m.playerB ? m.playerB.name : '---';
        const bracketName = m.bracket === 'Losers' ? '<span style="color: #fca5a5;">الخاسرين</span>' : '<span style="color: #6ee7b7;">الفائزين</span>';

        let resultBadge = `<span class="match-status-badge status-tie">في الانتظار</span>`;
        if (winnerId) {
            resultBadge = winnerId === m.playerA.id
                ? `<span class="match-status-badge status-win">فوز ${playerAName}</span>`
                : `<span class="match-status-badge status-win">فوز ${playerBName}</span>`;
        }

        return `
            <tr>
                <td>جولة ${m.round}</td>
                <td>${bracketName}</td>
                <td class="${winnerId === m.playerA.id ? 'winner-highlight' : (winnerId ? 'loser-highlight' : '')}">${playerAName}</td>
                <td class="${m.playerB && winnerId === m.playerB.id ? 'winner-highlight' : (m.playerB && winnerId ? 'loser-highlight' : '')}">${playerBName}</td>
                <td>${resultBadge}</td>
            </tr>
        `;
    }).join('');
}

async function handleCompetitionSubscription() {
    const session = localStorage.getItem('studentSession');
    if (!session) return alert('برجاء تسجيل الدخول أولاً');

    const nameInput = document.getElementById('comp-student-name');
    const studentName = nameInput ? nameInput.value.trim() : "";

    if (!studentName) return alert('برجاء إدخال اسمك أولاً');
    if (studentName.length < 3) return alert('الاسم قصير جداً');

    const student = JSON.parse(session);

    if (!confirm(`هل أنت متأكد من الاشتراك باسم: ${studentName}؟`)) return;

    try {
        await db.collection('competition_registrations').doc(student.id).set({
            studentId: student.id,
            studentName: studentName,
            grade: student.grade,
            phone: student.phone,
            status: 'Pending',
            score: 0,
            registeredAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('تم تسجيلك بنجاح! تابع جدول المواجهات في الأسفل.');
        updateCompetitionUI();
    } catch (error) {
        console.error("Error subscribing to competition:", error);
        alert('حدث خطأ أثناء الاشتراك');
    }
}

async function saveCompetition() {
    const selectedGrade = currentState.managementGrade;
    const title = document.getElementById('comp-title').value;
    const desc = document.getElementById('comp-desc').value;
    const isActive = document.getElementById('comp-active').value === 'true';
    const status = document.getElementById('comp-phase-status').value;

    try {
        await db.collection('competition_settings').doc(selectedGrade).update({
            title,
            desc,
            isActive,
            status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('تم تحديث إعدادات مسابقة ' + appData.grades[selectedGrade].title);
    } catch (error) {
        console.error("Error saving competition:", error);
        alert('فشل الحفظ');
    }
}

// Admin Logic for Students Distribution
async function triggerDistribution(bracketType = 'Winners') {
    const selectedGrade = currentState.managementGrade;
    const comp = appData.competitions[selectedGrade] || {};
    const bracketMsg = bracketType === 'Winners' ? 'المتأهلين (الفائزين)' : 'المستبعدين (الخاسرين)';

    if (!confirm(`سيتم الآن توزيع طلاب مسار ${bracketMsg} لصف ${appData.grades[selectedGrade].title} عشوائياً. هل أنت متأكد؟`)) return;

    // Filter registrations by grade AND status
    const regs = appData.compRegistrations.filter(r => r.grade === selectedGrade);
    let targetStatus = bracketType === 'Winners' ? ['Pending', 'Qualified'] : ['Relegated'];

    const activeRegs = regs.filter(r => targetStatus.includes(r.status));

    if (activeRegs.length < 2) return alert(`لا يوجد عدد كافٍ من الطلاب في مسار ${bracketMsg} للمواجهة (تحتاج 2 على الأقل)`);

    const shuffled = [...activeRegs].sort(() => Math.random() - 0.5);
    const batch = db.batch();
    const currentRound = (comp.currentRound || 0) + 1;

    for (let i = 0; i < shuffled.length; i += 2) {
        const playerA = shuffled[i];
        const playerB = shuffled[i + 1] || null;

        const matchRef = db.collection('competition_matches').doc();
        const matchData = {
            round: currentRound,
            bracket: bracketType,
            grade: selectedGrade,
            playerA: { id: playerA.studentId, name: playerA.studentName },
            playerB: playerB ? { id: playerB.studentId, name: playerB.studentName } : null,
            status: playerB ? 'Waiting' : 'Finished',
            winner: playerB ? null : playerA.studentId,
            matchResult: playerB ? 'في انتظار المستر' : 'تأهل تلقائي',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        batch.set(matchRef, matchData);

        // Update student status to Active
        batch.update(db.collection('competition_registrations').doc(playerA.studentId), { status: 'Active' });
        if (playerB) batch.update(db.collection('competition_registrations').doc(playerB.studentId), { status: 'Active' });
    }

    // Update competition round for THIS grade only
    if (bracketType === 'Winners') {
        batch.update(db.collection('competition_settings').doc(selectedGrade), {
            currentRound: currentRound,
            status: 'In Progress'
        });
    }

    try {
        await batch.commit();
        alert(`تم توزيع جولة جولة ${bracketType === 'Winners' ? 'الفائزين' : 'الخاسرين'} لصف ${appData.grades[selectedGrade].title} بنجاح!`);
    } catch (error) {
        console.error("Distribution error:", error);
        alert('حدث خطأ أثناء التوزيع');
    }
}

async function setMatchWinner(matchId, winnerId, loserId) {
    if (!confirm('هل أنت متأكد من تحديد الفائز؟ لا يمكن التراجع.')) return;

    const batch = db.batch();
    const matchRef = db.collection('competition_matches').doc(matchId);

    // Get match data to check bracket
    const match = appData.compMatches.find(m => m.id === matchId);
    const isWinnerBracket = match.bracket !== 'Losers';

    batch.update(matchRef, {
        winner: winnerId,
        status: 'Finished'
    });

    // Winner always qualifies for next round in THEIR current bracket
    batch.update(db.collection('competition_registrations').doc(winnerId), {
        status: 'Qualified'
    });

    // Loser logic
    if (loserId) {
        if (isWinnerBracket) {
            // If lost in winner bracket, move to loser bracket (Relegated)
            batch.update(db.collection('competition_registrations').doc(loserId), {
                status: 'Relegated'
            });
        } else {
            // If lost in loser bracket, eliminated completely
            batch.update(db.collection('competition_registrations').doc(loserId), {
                status: 'Eliminated'
            });
        }
    }

    try {
        await batch.commit();
        alert('تم تحديث النتيجة! الفائز تأهل للمرحلة التالية، والخاسر انتقل للمسار المناسب.');
    } catch (e) {
        console.error(e);
        alert('خطأ في تحديث النتيجة');
    }
}

// Match results winner setting is now manual by teacher in admin panel
// Legacy arena logic removed based on teacher request.

async function updateRegStatus(studentId, newStatus) {
    if (!confirm('هل أنت متأكد من تغيير حالة الطالب؟')) return;
    try {
        await db.collection('competition_registrations').doc(studentId).update({ status: newStatus });
        alert('تم التحديث');
    } catch (e) {
        alert('خطأ في التحديث');
    }
}

// System Initialization for Competition (Runs once per grade if missing)
async function initCompetitionSettings() {
    const grades = Object.keys(appData.grades);

    for (const gid of grades) {
        const compRef = db.collection('competition_settings').doc(gid);
        const doc = await compRef.get();
        if (!doc.exists) {
            await compRef.set({
                title: `مسابقة ${appData.grades[gid].title}`,
                desc: `أهلاً بكم في المسابقة الكبرى لطلاب ${appData.grades[gid].title}. استعدوا للمواجهات المباشرة!`,
                isActive: false,
                status: "Registration",
                currentRound: 0,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Competition settings initialized for ${gid}.`);
        }
    }
}
initCompetitionSettings();