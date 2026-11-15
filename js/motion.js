(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    let lenis = null;

    if (gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        document.documentElement.classList.add('js-motion');

        // One shared Lenis instance, driven by GSAP's ticker.
        if (!reducedMotion && window.Lenis) {
            lenis = new window.Lenis({
                autoRaf: false,
                duration: 1.05,
                smoothWheel: true,
                syncTouch: false,
                anchors: true,
                wheelMultiplier: 0.9
            });

            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
            window.systLenis = lenis;
        }

        if (!reducedMotion) {
            // Hero entrance: simple, short and limited to the first viewport.
            const hero = document.querySelector('.hero');
            if (hero) {
                const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
                intro.from('.hero-content .badge', { y: 18, opacity: 0, duration: 0.55 })
                    .from('.hero-title', { y: 42, opacity: 0, duration: 0.85 }, '-=0.2')
                    .from('.hero-description', { y: 20, opacity: 0, duration: 0.65 }, '-=0.4')
                    .from('.hero-buttons .btn', { y: 16, opacity: 0, duration: 0.55, stagger: 0.1 }, '-=0.35')
                    .from('.hero-photo--main', { y: 22, opacity: 0, scale: 0.98, duration: 0.9 }, '-=0.6')
                    .from('.hero-photo--detail', { y: 18, opacity: 0, duration: 0.7 }, '-=0.55')
                    .from('.hero-glass-note, .hero-glass-chip', { y: 12, opacity: 0, duration: 0.55, stagger: 0.1 }, '-=0.5')
                    .from('.code-window', { y: 28, opacity: 0, rotate: 0, duration: 0.85 }, '-=0.55');
            }

            // Reveal sections only once; no perpetual scroll-linked transforms.
            gsap.utils.toArray('.section-header').forEach((header) => {
                gsap.from(header.children, {
                    y: 26,
                    opacity: 0,
                    duration: 0.7,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: header, start: 'top 86%', once: true }
                });
            });

            [
                '.service-card', '.process-step', '.project-card',
                '.about-card', '.contact-card', '.review-card', '.reviews-form-card', '.payment-card',
                '.download-card', '.readme-card'
            ].forEach((selector) => {
                const items = gsap.utils.toArray(selector);
                if (!items.length) return;

                gsap.from(items, {
                    y: 34,
                    opacity: 0,
                    duration: 0.72,
                    stagger: 0.11,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: items[0],
                        start: 'top 88%',
                        once: true
                    }
                });
            });

            // Cafeteria case study: stagger the two previews and reveal the story copy.
            const cafeteriaShowcase = document.querySelector('.cafeteria-showcase');
            if (cafeteriaShowcase) {
                const versions = cafeteriaShowcase.querySelectorAll('.cafeteria-version');
                const story = cafeteriaShowcase.querySelector('.cafeteria-story');
                const storyParts = story ? story.querySelectorAll(
                    '.cafeteria-story-eyebrow, .cafeteria-story-line, .cafeteria-story-lead, .cafeteria-story-point, .cafeteria-story-signature'
                ) : [];

                gsap.from(versions, {
                    x: -28,
                    opacity: 0,
                    duration: 0.78,
                    stagger: 0.16,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: cafeteriaShowcase,
                        start: 'top 78%',
                        once: true
                    }
                });

                if (story) {
                    gsap.from(story, {
                        x: 28,
                        opacity: 0,
                        duration: 0.85,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: cafeteriaShowcase,
                            start: 'top 78%',
                            once: true
                        }
                    });
                    gsap.from(storyParts, {
                        y: 18,
                        opacity: 0,
                        duration: 0.62,
                        stagger: 0.075,
                        ease: 'power2.out',
                        delay: 0.12,
                        scrollTrigger: {
                            trigger: cafeteriaShowcase,
                            start: 'top 76%',
                            once: true
                        }
                    });
                }
            }

            const headerBar = document.querySelector('.header');
            if (headerBar) {
                const updateHeader = () => headerBar.classList.toggle('is-scrolled', window.scrollY > 12);
                updateHeader();
                window.addEventListener('scroll', updateHeader, { passive: true });
            }

            const authCard = document.querySelector('.auth-card');
            if (authCard) gsap.from(authCard, { y: 22, opacity: 0, duration: 0.7, ease: 'power3.out' });
        }

        window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    }

    // Mobile navigation works independently of animation libraries.
    const menuButton = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-navigation');

    if (menuButton && mobileNav) {
        const setMenu = (open) => {
            menuButton.classList.toggle('is-open', open);
            mobileNav.classList.toggle('is-open', open);
            menuButton.setAttribute('aria-expanded', String(open));
            menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        };

        menuButton.addEventListener('click', () => {
            setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
        });
        mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') setMenu(false);
        });
        document.addEventListener('click', (event) => {
            if (mobileNav.classList.contains('is-open') && !event.target.closest('.header-right-group')) setMenu(false);
        });
    }

    window.addEventListener('pagehide', () => {
        if (lenis) lenis.destroy();
    }, { once: true });
})();
