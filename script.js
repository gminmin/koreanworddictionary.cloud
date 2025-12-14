const translations = {
    ko: {
        "nav.home": "홈",
        "nav.about": "동아리 소개",
        "nav.gallery": "작품 갤러리",
        "nav.pursuit": "추구하는 바",
        "nav.workflow": "워크플로우",
        "nav.contact": "문의하기",
        "nav.title": "진부중학교 3D 동아리",
        "hero.title": "상상을 현실로,<br>창작의 세계",
        "hero.subtitle": "진부중학교 3D 동아리입니다.",
        "hero.cta": "작품 보러가기",
        "about.title": "About",
        "about.subtitle": "창의력과 기술의 만남",
        "about.desc": "3D 창작물을 통해 우리가 오랫동안 기억하고 싶은것, 이제는 볼수없는것, 현실에 없는것을 만들어냅니다. 그리고 그 배경에는 무료 오픈소스 프로그램 'Blender'가 있습니다.",
        "gallery.title": "Gallery",
        "gallery.subtitle": "부원들의 열정이 담긴 작품들입니다.",
        "gallery.more": "더 많은 작품 보기",
        "footer.club": "진부중학교 3D 동아리",
        "footer.address": "강원특별자치도 평창군 진부면",
        "gallery.page.title": "전체 작품 갤러리",
        "gallery.page.subtitle": "동아리 부원들의 창의적인 작품들을 모두 만나보세요.",
        "gallery.work.2025": "2025년도 작품",
        "pursuit.more": "동아리의 방향",
        "pursuit.title": "Pursuit",
        "pursuit.subtitle": "추구하는 바는 다음과 같습니다.",
        "pursuit.page.title": "추구하는 바",
        "pursuit.page.subtitle": "동아리의 정체성을 정리하였습니다.",
        "pursuit.value1.title": "자유로운 창작",
        "pursuit.value1.desc": "우리는 자유를 지향합니다.<br>당신의 엉뚱하고 기발한 아이디어,<br>그 모든 것이 예술이 되는 공간입니다.",
        "pursuit.value2.title": "자신만의 스타일",
        "pursuit.value2.desc": "유행을 따르기보다 나만의 스타일을 찾습니다. 부원 각자가 가진 고유한 개성과 감성이<br>작품에 자연스럽게 스며들도록 합니다.",
        "pursuit.value3.title": "끊임없는 도전",
        "pursuit.value3.desc": "실패는 또 다른 배움의 기회입니다.<br>Blender의 수많은 기능을 탐구하고<br>새로운 기법을 시도하며 매일 성장합니다.",
        "pursuit.vision.title": "VISION",
        "pursuit.vision.desc": "<strong>'상상은 현실이 된다'</strong><br><br>진부중학교 3D 동아리는 단순한 툴 학습을 넘어,<br>창작을 위한 새로운 언어를 배웁니다.<br>우리는 서로 영감을 주고받으며 함께 성장합니다.",
        "pursuit.style.title": "우리의 스타일",
        "pursuit.style.desc": "미래를 향한 첫 걸음, 트렌드를 넘어서는 데서 시작됩니다.",
        "pursuit.style.desc2": "미니멀니즘, 과도한 디테일은 필요하지 않습니다."
    },
    en: {
        "nav.home": "Home",
        "nav.about": "About",
        "nav.gallery": "Gallery",
        "nav.pursuit": "Pursuit",
        "nav.workflow": "Workflow",
        "nav.contact": "Contact",
        "nav.title": "Jinbu Middle School 3D Club",
        "hero.title": "Imagination to Reality,<br>World of Creation",
        "hero.subtitle": "Jinbu Middle School 3D Club",
        "hero.cta": "View Works",
        "about.title": "About",
        "about.subtitle": "Where Creativity Meets Technology",
        "about.desc": "We turn ideas into reality through 3D modeling. and we learn various tools like 'Blender' and grow together.",
        "gallery.title": "Gallery",
        "gallery.subtitle": "Works filled with our members' passion.",
        "gallery.more": "View More Works",
        "footer.club": "Jinbu Middle School 3D Club",
        "footer.address": "Jinbu-myeon, Pyeongchang-gun, Gangwon-do",
        "gallery.page.title": "Full Gallery",
        "gallery.page.subtitle": "Explore all creative works by our members.",
        "gallery.work.2025": "2025 Work",
        "workflow.title": "Workflow",
        "workflow.subtitle": "The story behind the work<br>This is the process of creating a work of art.",
        "workflow.desc": "The process is divided into four main stages.",
        "pursuit.more": "More about our club",
        "pursuit.title": "Pursuit",
        "pursuit.subtitle": "The Pursuit of the club is as follows.",
        "pursuit.page.title": "Our Pursuit",
        "pursuit.page.subtitle": "Defining the identity of our club.",
        "pursuit.value1.title": "Free Creation",
        "pursuit.value1.desc": "We aim for freedom without boundaries.<br>Your wacky and brilliant ideas,<br>turn into art in this space.",
        "pursuit.value2.title": "Unique Style",
        "pursuit.value2.desc": "We find our own voice rather than following trends.<br>We encourage each member's unique personality<br>to naturally permeate their work.",
        "pursuit.value3.title": "Non-stop Challenge",
        "pursuit.value3.desc": "Failure is another opportunity to learn.<br>We explore Blender's countless features<br>and grow every day by trying new techniques.",
        "pursuit.vision.title": "Our Vision",
        "pursuit.vision.desc": "<strong>'Imagination Becomes Reality'</strong><br><br>Beyond simple technical skills,<br>we learn a new language to express ourselves in the digital world.<br>We inspire each other and grow together as 3D artists.",
        "pursuit.style.title": "Our Style",
        "pursuit.style.desc": "We embrace minimalism, where unnecessary details are not needed.",
        "pursuit.style.desc2": "We embrace minimalism, where unnecessary details are not needed.",
    }
};

let currentLang = 'ko';

function updateLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    // Update text content
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    // Update button text
    const dropbtns = document.querySelectorAll('.lang-dropbtn');
    dropbtns.forEach(btn => {
        btn.innerHTML = lang === 'ko' ? 'Language ▾' : 'Language ▾'; // Keep generic or change to '한국어 ▾' / 'English ▾'
        // Let's make it show the current language for better UX
        btn.innerHTML = lang === 'ko' ? '한국어 ▾' : 'English ▾';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.section-title, .section-subtitle, .about-text, .about-image, .workflow-text, .workflow-image, .gallery-item, .glass-card, .vision-section, .hero-title, .brand-identity-section');
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Language Dropdown Logic
    const langLinks = document.querySelectorAll('[data-lang]');
    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });

    // Initialize button text
    updateLanguage('ko');

    // Logo Comparison Slider Logic
    function initComparisons() {
        const container = document.querySelector('.img-comp-container');
        const overlay = document.querySelector('.img-comp-overlay');
        const handle = document.querySelector('.comp-slider-handle');

        if (!container || !overlay || !handle) return;

        let clicked = 0;
        let w = container.offsetWidth;

        // Ensure starting position (50%)
        slide(w / 2);

        function updateDraggingState(isDragging) {
            if (isDragging) container.classList.add('dragging');
            else container.classList.remove('dragging');
        }



        // Add events to handle
        handle.addEventListener("mousedown", slideReady);
        handle.addEventListener("touchstart", slideReady);

        // Add events to container (click/drag anywhere in container to move)
        container.addEventListener("mousedown", slideReady);
        container.addEventListener("touchstart", slideReady);

        window.addEventListener("mouseup", slideFinish);
        window.addEventListener("touchend", slideFinish);

        function slideReady(e) {
            e.preventDefault();
            clicked = 1;
            updateDraggingState(true);
            window.addEventListener("mousemove", slideMove);
            window.addEventListener("touchmove", slideMove);
            slideMove(e); // Update position immediately on click
        }

        function slideFinish() {
            clicked = 0;
            updateDraggingState(false);
            window.removeEventListener("mousemove", slideMove);
            window.removeEventListener("touchmove", slideMove);
        }

        function slideMove(e) {
            if (clicked == 0) return;
            let pos = getCursorPos(e);

            // Constrain
            if (pos < 0) pos = 0;
            if (pos > w) pos = w;

            slide(pos);
        }

        function getCursorPos(e) {
            let a, x = 0;
            e = (e.changedTouches) ? e.changedTouches[0] : e;

            // Get position relative to viewport
            a = container.getBoundingClientRect();

            // Calculate relative to container
            x = e.clientX - a.left;

            return x;
        }

        function slide(x) {
            overlay.style.width = x + "px";
            handle.style.left = overlay.offsetWidth + "px"; // Move handle
        }
    }

    // Initialize slider if element exists
    initComparisons();

    // Re-init on resize to handle responsive width changes
    window.addEventListener('resize', () => {
        // Simple re-init / adjustment logic could go here if needed
        // For now, let's keep it simple.
    });

    // Color Palette Copy Logic
    const colorSwatches = document.querySelectorAll('.color-swatch-item');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const colorCode = swatch.getAttribute('data-color');
            const codeElement = swatch.querySelector('.color-code');
            const originalText = codeElement.innerText;

            // Function to handle success visual feedback
            const showSuccess = () => {
                codeElement.innerText = "Copied!";
                codeElement.style.color = "#4ade80"; // Success green

                setTimeout(() => {
                    codeElement.innerText = originalText;
                    codeElement.style.color = "";
                }, 1500);
            };

            // Try modern API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(colorCode).then(showSuccess).catch(err => {
                    console.error('Clipboard API failed', err);
                    fallbackCopy(colorCode);
                });
            } else {
                fallbackCopy(colorCode);
            }

            function fallbackCopy(text) {
                const textArea = document.createElement("textarea");
                textArea.value = text;

                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";

                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        showSuccess();
                    } else {
                        alert("Hex code: " + text); // Ultimate fallback
                    }
                } catch (err) {
                    console.error('Fallback copy failed', err);
                    alert("Hex code: " + text);
                }

                document.body.removeChild(textArea);
            }
        });
    });
});
