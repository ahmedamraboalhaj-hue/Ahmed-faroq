document.addEventListener('DOMContentLoaded', () => {
    // 0. Splash Screen Logic
    const splash = document.getElementById('splash-screen');
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 2500);

    // 1. Reveal Animations on Scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Apply reveal to elements
    const revealElements = [
        ...document.querySelectorAll('.feature-card'),
        ...document.querySelectorAll('.subject-card'),
        ...document.querySelectorAll('.achievement-card'),
        ...document.querySelectorAll('.stat-item'),
        document.querySelector('.hero-content'),
        document.querySelector('.hero-image'),
        document.querySelector('.contact-container')
    ];

    revealElements.forEach(el => {
        if (el) {
            el.classList.add('reveal');
            observer.observe(el);
        }
    });

    // 2. Navbar Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '1rem 5%';
            header.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        } else {
            header.style.padding = '1.5rem 5%';
            header.style.boxShadow = 'none';
        }
    });

    // 3. Contact Form Submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            if (name) {
                alert(`شكراً لك يا ${name}! تم إرسال رسالتك بنجاح لمستر أحمد فاروق.`);
                contactForm.reset();
            } else {
                alert('يرجى إدخال البيانات المطلوبة بالكامل.');
            }
        });
    }

    // 4. Smooth Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 4. "AI" Greeting or Dynamic Text
    const hour = new Date().getHours();
    const welcomeText = document.querySelector('.hero-subtitle');

    if (hour < 12) {
        welcomeText.innerText = "صباح الخير! " + welcomeText.innerText;
    } else if (hour < 18) {
        welcomeText.innerText = "طاب يومك! " + welcomeText.innerText;
    } else {
        welcomeText.innerText = "مساء الخير! " + welcomeText.innerText;
    }

    // 5. Mock Login/Signup Feedback
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    [loginBtn, signupBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            alert('أهلاً بك في منصة مستر أحمد فاروق! جارٍ العمل على إطلاق نظام الدخول الجديد.');
        });
    });
});
