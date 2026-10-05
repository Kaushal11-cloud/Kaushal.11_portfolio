/**
 * KAUSHAL 11 // PORTFOLIO JAVASCRIPT
 * Interactions, mobile drawer, scroll observers, filtering & contact handler
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Navigation on Scroll
  const header = document.querySelector('.site-header');
  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  // 1b. 3D Dumbbell Video Autoplay (Muted & Soundless)
  const heroDumbbellVideo = document.getElementById('heroDumbbellVideo');
  if (heroDumbbellVideo) {
    heroDumbbellVideo.muted = true;
    heroDumbbellVideo.defaultMuted = true;
    heroDumbbellVideo.volume = 0;
    const playPromise = heroDumbbellVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        heroDumbbellVideo.muted = true;
        heroDumbbellVideo.play().catch(() => {});
      });
    }
  }

  // 1c. Scroll-Driven 3D Dumbbell Transition Into Projects
  const dumbbellRig = document.getElementById('heroDumbbellRig');
  const lateralTag = document.querySelector('.hero-lateral-tag');

  if (dumbbellRig) {
    let ticking = false;

    const handleDumbbellScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      // Transition progress over the first 1.2 screen heights
      const progress = Math.min(1, Math.max(0, scrollY / (vh * 1.15)));

      if (progress > 0) {
        // Smooth kinematic glide down towards works section
        const translateY = scrollY * 0.72;
        const scale = Math.max(0.45, 1 - progress * 0.52);
        const rotate = progress * 32;
        const opacity = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) / 0.12) : 1;

        dumbbellRig.style.transform = `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale}) rotate(${rotate}deg)`;
        dumbbellRig.style.opacity = opacity;
      } else {
        dumbbellRig.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
        dumbbellRig.style.opacity = '1';
      }

      // Fade lateral developer tag gently on deep scroll
      if (lateralTag) {
        lateralTag.style.opacity = Math.max(0, 0.85 - progress * 0.85);
      }

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(handleDumbbellScroll);
        ticking = true;
      }
    }, { passive: true });

    handleDumbbellScroll();
  }

  // 2. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking any nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 3. Active Nav Link on Scroll (IntersectionObserver)
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => sectionObserver.observe(sec));

  // 4. Project Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterVal === 'all' || category === filterVal) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 5. Contact Form Simulation with Animated Toast
  const contactForm = document.getElementById('contactForm');
  const toastNotice = document.getElementById('formToast');

  if (contactForm && toastNotice) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('nameInput');
      const emailInput = document.getElementById('emailInput');
      const messageInput = document.getElementById('messageInput');

      if (!nameInput.value.trim() || !emailInput.value.trim() || !messageInput.value.trim()) {
        alert('Please fill out all required fields.');
        return;
      }

      // Show success toast
      toastNotice.className = 'toast-notice success';
      toastNotice.innerHTML = `✓ Thank you, <strong>${escapeHtml(nameInput.value)}</strong>! Your message has been received. I will be in touch shortly.`;
      toastNotice.style.display = 'block';

      // Reset form
      contactForm.reset();

      // Auto-hide toast after 6 seconds
      setTimeout(() => {
        toastNotice.style.display = 'none';
      }, 6000);
    });
  }

  // 6. Back to Top Button
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Utility to prevent XSS in simulated notification
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }
});
