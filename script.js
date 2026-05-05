import { auth } from './src/firebase-config.js';
import supabase from './src/supabase-config.js';
import { createIcons, icons } from 'lucide';


auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Sesión persistente detectada:", user.email);
        // Removed auto-redirect so user can browse landing page
        // window.location.href = './app/index.html';
    }
});

const navbar = document.querySelector('.navbar');
const mobileBtn = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const stats = document.querySelectorAll('.stat-number');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    mobileBtn.classList.toggle('open');
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.section-title, .about-content, .service-flip-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .fade-in-up {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(styleSheet);

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = +entry.target.getAttribute('data-target');
            const duration = 2000;
            const increment = target / (duration / 16);

            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    entry.target.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    entry.target.innerText = target;
                }
            };
            updateCounter();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

stats.forEach(stat => statsObserver.observe(stat));

const cards = document.querySelectorAll('.service-flip-card');
cards.forEach(card => {
    card.addEventListener('click', () => {
        const inner = card.querySelector('.service-card-inner');
    });
});

const galleryTrack = document.querySelector('.gallery-track');
if (galleryTrack) {
    let isPaused = false;
    let animationId;
    let speed = 1;

    const galleryItems = Array.from(galleryTrack.children);
    galleryItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.addEventListener('click', toggleSelection);
        galleryTrack.appendChild(clone);
    });

    galleryTrack.style.scrollSnapType = 'none';

    function autoScroll() {
        if (!isPaused) {
            galleryTrack.scrollLeft += speed;

            if (galleryTrack.children.length > galleryItems.length) {
                const firstClone = galleryTrack.children[galleryItems.length];
                const singleSetWidth = firstClone.offsetLeft - galleryTrack.children[0].offsetLeft;
                if (galleryTrack.scrollLeft >= singleSetWidth) {
                    galleryTrack.scrollLeft -= singleSetWidth;
                }
            }
        }
        animationId = requestAnimationFrame(autoScroll);
    }

    autoScroll();

    galleryTrack.addEventListener('mouseenter', () => isPaused = true);
    galleryTrack.addEventListener('mouseleave', () => {
        const hasSelected = galleryTrack.querySelector('.gallery-img.selected');
        if (!hasSelected) isPaused = false;
    });

    galleryTrack.addEventListener('touchstart', () => isPaused = true);
    galleryTrack.addEventListener('touchend', () => {
        const hasSelected = galleryTrack.querySelector('.gallery-img.selected');
        if (!hasSelected) {
            setTimeout(() => isPaused = false, 1000);
        }
    });

    function toggleSelection(e) {
        galleryTrack.querySelectorAll('.gallery-img').forEach(img => {
            if (img !== e.target) img.classList.remove('selected');
        });
        e.target.classList.toggle('selected');

        if (e.target.classList.contains('selected')) {
            isPaused = true;
        } else {
            if (window.matchMedia('(hover: hover)').matches) {
                isPaused = galleryTrack.matches(':hover');
            } else {
                isPaused = false;
            }
        }
    }

    galleryItems.forEach(item => {
        item.addEventListener('click', toggleSelection);
    });
}

// --- Membership Plans Fetching & Rendering ---
async function loadMemberships() {
    const plansContainer = document.getElementById('plans-container');
    if (!plansContainer) return;

    try {
        const { data: plans, error } = await supabase
            .from('membership_plans')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (plans && plans.length > 0) {
            plansContainer.innerHTML = '';
            plans.forEach(plan => {
                const card = createPlanCard(plan);
                plansContainer.appendChild(card);
            });
            // Re-initialize lucide icons for dynamic content
            createIcons({ icons });
        } else {
            plansContainer.innerHTML = '<p class="loading-plans">No hay planes disponibles en este momento.</p>';
        }
    } catch (err) {
        console.error("Error loading memberships:", err);
        plansContainer.innerHTML = '<p class="loading-plans">Error al cargar los planes. Por favor, intenta más tarde.</p>';
    }
}

function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = `plan-card glass-card ${plan.theme}-theme`;
    
    // Fix: Handle both string and array for features
    let featuresHtml = '';
    if (plan.features) {
        let featuresArray = [];
        if (Array.isArray(plan.features)) {
            featuresArray = plan.features;
        } else if (typeof plan.features === 'string') {
            featuresArray = plan.features.split(',').map(f => f.trim());
        }
        featuresHtml = featuresArray.map(f => `<li>${f}</li>`).join('');
    }

    card.innerHTML = `
        <div class="plan-label">${plan.subtitle || 'MEMBRESÍA'}</div>
        <h3 class="plan-title">${plan.name}</h3>
        <div class="plan-price">$${Number(plan.price).toLocaleString('es-CL')} <span>/ mes</span></div>
        <ul class="plan-features">
            <li>${plan.monthly} clases mensuales</li>
            <li>Hasta ${plan.limit} clases por día</li>
            ${featuresHtml}
        </ul>
        <a href="./app/index.html" class="btn-primary" style="text-align:center;">Seleccionar Plan</a>
        ${plan.theme === 'gold' ? '<div class="plan-badge">Popular</div>' : ''}
    `;

    return card;
}

// Initial load
loadMemberships();

// Initialize static icons
createIcons({ icons });

