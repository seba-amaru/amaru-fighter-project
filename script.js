import supabase from './app/supabase-config.js';

function refreshLucideIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

/* global html2canvas */


supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        console.log("Sesión persistente detectada:", session.user.email);
        // Removed auto-redirect so user can browse landing page
        // window.location.href = './app/index.html';
    }
});

const navbar = document.querySelector('.navbar');
const mobileBtn = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');
const stats = document.querySelectorAll('.stat-number');

if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        mobileBtn.classList.toggle('open');
    });
}

if (mobileMenu) {
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });
}

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

// Flip cards interactivity
const serviceCards = document.querySelectorAll('.service-flip-card');
serviceCards.forEach(card => {
    card.addEventListener('click', () => {
        card.classList.toggle('flipped');
    });
});

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
            refreshLucideIcons();
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
    card.className = `plan-card ${plan.theme || 'bronze'}-theme`;

    // Fix: Handle both string and array for features
    let featuresHtml = '';
    if (plan.features) {
        let featuresArray = [];
        if (Array.isArray(plan.features)) {
            featuresArray = plan.features;
        } else if (typeof plan.features === 'string') {
            featuresArray = plan.features.split(',').map(f => f.trim());
        }
        featuresHtml = featuresArray.map(f => `
            <li>
                <i data-lucide="check-circle"></i>
                <span>${f}</span>
            </li>
        `).join('');
    }

    card.innerHTML = `
        <div class="plan-label">${plan.subtitle || 'MEMBRESÍA'}</div>
        <h3 class="plan-title">${plan.name}</h3>
        <div class="plan-price">
            <span class="currency">$</span>${Number(plan.price).toLocaleString('es-CL')} 
            <span>/ mes</span>
        </div>
        <ul class="plan-features">
            <li>
                <i data-lucide="calendar"></i>
                <span>${plan.monthly} clases mensuales</span>
            </li>
            <li>
                <i data-lucide="clock"></i>
                <span>Hasta ${plan.limit} clases por día</span>
            </li>
            ${featuresHtml}
        </ul>
        ${plan.theme === 'gold' ? '<div class="plan-badge">Popular</div>' : ''}
    `;

    return card;
}

// --- Schedule Fetching & Rendering ---
let allClasses = [];
let activeScheduleFilter = 'all';

async function loadSchedule() {
    const gridWrapper = document.getElementById('schedule-grid-wrapper');
    if (!gridWrapper) return;

    try {
        const { data: classes, error } = await supabase
            .from('classes')
            .select('*')
            .order('time', { ascending: true });

        if (error) throw error;

        allClasses = classes || [];

        if (allClasses.length > 0) {
            renderScheduleGrid(allClasses);
            renderScheduleMobile(allClasses);
        } else {
            showScheduleFallback();
        }
    } catch (err) {
        console.error("Error loading schedule:", err);
        showScheduleFallback();
    }
}

function showScheduleFallback() {
    const gridWrapper = document.getElementById('schedule-grid-wrapper');
    if (gridWrapper) {
        gridWrapper.innerHTML = `
            <div class="schedule-fallback-msg glass-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style="opacity:0.5; margin-bottom:16px;">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                </svg>
                <p>No se pudo cargar el horario dinámico.</p>
                <a href="images/horario.pdf" target="_blank" class="btn-outline" style="margin-top:16px; display:inline-block;">Ver Horario PDF</a>
            </div>
        `;
    }
}

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const dayIndexMap = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };

const typeColors = {
    'Striking': { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', text: '#ef4444', label: 'Kick Boxing' },
    'BJJ': { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)', text: '#8b5cf6', label: 'Jiu Jitsu' },
    'BJJ Gi': { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.35)', text: '#8b5cf6', label: 'Jiu Jitsu Gi' },
    'No Gi': { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.35)', text: '#a855f7', label: 'No Gi' },
    'MMA': { bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.35)', text: '#f97316', label: 'MMA' },
    'Funcional Fighter': { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.35)', text: '#22c55e', label: 'Funcional' }
};

function getClassTypeInfo(type) {
    return typeColors[type] || { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)', text: 'var(--accent-cyan)', label: type };
}

function parseDays(days) {
    if (!days) return [];
    if (Array.isArray(days)) return days;
    if (typeof days === 'string') {
        try {
            const parsed = JSON.parse(days);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return days.split(',').map(d => d.trim());
        }
    }
    return [];
}

function matchesDay(classDays, dayName) {
    const parsed = parseDays(classDays);
    const targetIndex = dayIndexMap[dayName];

    return parsed.some(d => {
        const strD = String(d).trim();
        // Match by day name (case insensitive)
        if (strD.toLowerCase() === dayName.toLowerCase()) return true;
        if (strD.toLowerCase() === dayName.substring(0, 3).toLowerCase()) return true;
        // Match by numeric day index (0 = Sunday, 1 = Monday)
        if (strD === String(targetIndex)) return true;
        return false;
    });
}

function filterClasses(classes, filter) {
    if (filter === 'all') return classes;
    return classes.filter(c => c.type === filter);
}

function renderScheduleGrid(classes) {
    const wrapper = document.getElementById('schedule-grid-wrapper');
    const filtered = filterClasses(classes, activeScheduleFilter);

    let html = '<div class="schedule-table">';

    // Header row
    html += '<div class="schedule-header-row">';
    html += '<div class="schedule-time-col">Hora</div>';
    dayNames.forEach(day => {
        const isToday = new Date().getDay() === dayIndexMap[day];
        html += `<div class="schedule-day-col ${isToday ? 'today' : ''}">${day}${isToday ? '<span class="today-badge">Hoy</span>' : ''}</div>`;
    });
    html += '</div>';

    // Build rows by time slots (group classes by time)
    const timeSlots = [...new Set(filtered.map(c => c.time))].sort();

    if (timeSlots.length === 0) {
        html += '<div class="schedule-empty">No hay clases para esta disciplina.</div>';
    } else {
        timeSlots.forEach(time => {
            html += '<div class="schedule-row">';
            html += `<div class="schedule-time-col"><span class="time-label">${time}</span></div>`;

            dayNames.forEach(day => {
                const dayClasses = filtered.filter(c => matchesDay(c.days, day) && c.time === time);
                html += `<div class="schedule-cell">`;
                dayClasses.forEach(cls => {
                    const info = getClassTypeInfo(cls.type);
                    html += `
                        <div class="schedule-class-card" style="background:${info.bg}; border-color:${info.border};" data-type="${cls.type}">
                            <span class="class-type-tag" style="color:${info.text};">${info.label}</span>
                            <h4 class="class-name">${cls.name}</h4>
                            <p class="class-coach">Coach ${cls.coach || 'Amaru'}</p>
                        </div>
                    `;
                });
                html += '</div>';
            });

            html += '</div>';
        });
    }

    html += '</div>';
    wrapper.innerHTML = html;
}

function renderScheduleMobile(classes) {
    const container = document.getElementById('schedule-mobile');
    if (!container) return;

    const filtered = filterClasses(classes, activeScheduleFilter);
    const todayIndex = new Date().getDay();
    const todayName = dayNames.find(d => dayIndexMap[d] === todayIndex) || 'Lunes';

    let html = '';
    dayNames.forEach((day) => {
        const dayClasses = filtered.filter(c => matchesDay(c.days, day)).sort((a, b) => a.time.localeCompare(b.time));
        const isToday = day === todayName;
        const hasClasses = dayClasses.length > 0;

        html += `
            <div class="schedule-day-accordion ${isToday ? 'today' : ''} ${hasClasses ? '' : 'empty'}">
                <button class="day-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                    <span class="day-name">${day}${isToday ? '<span class="today-badge-mobile">Hoy</span>' : ''}</span>
                    <span class="day-count">${dayClasses.length} clase${dayClasses.length !== 1 ? 's' : ''}</span>
                    <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="day-accordion-content">
                    ${hasClasses ? dayClasses.map(cls => {
            const info = getClassTypeInfo(cls.type);
            return `
                            <div class="mobile-class-card" style="border-left-color:${info.text};">
                                <div class="mobile-class-time">${cls.time}</div>
                                <div class="mobile-class-info">
                                    <span class="mobile-class-tag" style="color:${info.text};">${info.label}</span>
                                    <h4>${cls.name}</h4>
                                    <p>Coach ${cls.coach || 'Amaru'}</p>
                                </div>
                            </div>
                        `;
        }).join('') : '<p class="no-classes">No hay clases programadas.</p>'}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Auto-open today's accordion
    const todayAccordion = container.querySelector('.schedule-day-accordion.today');
    if (todayAccordion) todayAccordion.classList.add('open');
}

// Filter buttons logic
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        activeScheduleFilter = e.target.getAttribute('data-filter');
        renderScheduleGrid(allClasses);
        renderScheduleMobile(allClasses);
    }
});

// --- Export Schedule Logic ---
async function exportSchedule() {
    const btn = document.getElementById('btn-download-schedule');
    const scheduleGrid = document.querySelector('.schedule-table');
    const scheduleMobile = document.getElementById('schedule-mobile');
    
    if (!scheduleGrid && !scheduleMobile) return;

    // Determine which view to capture (Desktop grid is better for PDF)
    const elementToCapture = window.innerWidth > 968 ? scheduleGrid : scheduleMobile;
    
    if (!elementToCapture) {
        alert("Primero carga el horario para poder descargarlo.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="loading-spinner" style="width:16px; height:16px; border-width:2px;"></div> Generando...';
    btn.disabled = true;

    try {
        // Optimization for capture: ensure all elements are visible and backgrounds are rendered
        const canvas = await html2canvas(elementToCapture, {
            backgroundColor: '#000000', // Keep the dark aesthetic
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector('.schedule-table') || clonedDoc.getElementById('schedule-mobile');
                if (clonedEl) {
                    clonedEl.style.padding = '40px';
                    clonedEl.style.borderRadius = '0px';
                    // Force display if hidden
                    clonedEl.style.display = 'block';
                    
                    // Add a header to the export
                    const header = clonedDoc.createElement('div');
                    header.innerHTML = `
                        <div style="text-align:center; margin-bottom:40px; color:white; font-family:sans-serif;">
                            <h1 style="margin:0; font-size:32px;">AMARUFIGHTER</h1>
                            <p style="margin:5px 0; opacity:0.7;">Horario de Clases - La Familia Nunca Muere</p>
                        </div>
                    `;
                    clonedEl.prepend(header);
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Save as PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: window.innerWidth > 968 ? 'l' : 'p',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Horario_Amarufighter_${activeScheduleFilter}.pdf`);

        // Success state
        btn.innerHTML = '¡Descargado! ✓';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 3000);

    } catch (err) {
        console.error("Error exporting schedule:", err);
        alert("Hubo un error al generar el archivo. Por favor intenta de nuevo.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- Galería Editorial Inmersiva & Lightbox ---
function initAmaruGalleryExperience() {
    const frames = Array.from(document.querySelectorAll('.gallery-frame'));
    const toggleBtn = document.getElementById('btn-toggle-gallery');
    const INITIAL_VISIBLE_COUNT = 8;
    let isExpanded = false;

    // 1. Configuración de visibilidad inicial (primeras 8 fotos para mantener la carga limpia)
    function applyVisibility() {
        frames.forEach((frame, idx) => {
            if (idx >= INITIAL_VISIBLE_COUNT) {
                frame.classList.add('extra-photo');
                if (isExpanded) {
                    frame.classList.add('expanded');
                } else {
                    frame.classList.remove('expanded');
                }
            } else {
                frame.classList.remove('extra-photo', 'expanded');
            }
        });

        if (toggleBtn) {
            toggleBtn.querySelector('span').textContent = isExpanded ? 'Mostrar Menos' : 'Explorar Galería Completa (18 fotos)';
            if (isExpanded) {
                toggleBtn.classList.add('expanded');
            } else {
                toggleBtn.classList.remove('expanded');
            }
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            applyVisibility();
        });
    }

    applyVisibility();

    // 2. Lightbox Modal Minimalista
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('gallery-lightbox-img');
    const lightboxCounter = document.getElementById('gallery-lightbox-counter');
    const closeBtn = document.getElementById('gallery-lightbox-close');
    const lbPrevBtn = document.getElementById('gallery-lightbox-prev');
    const lbNextBtn = document.getElementById('gallery-lightbox-next');

    if (!lightbox) return;

    const allImages = frames.map((frame) => {
        const img = frame.querySelector('img');
        return {
            src: img ? img.getAttribute('src') : '',
            alt: img ? img.getAttribute('alt') : 'Amarufighter'
        };
    });

    let currentIndex = 0;

    function showImage(idx) {
        if (allImages.length === 0) return;
        if (idx < 0) idx = allImages.length - 1;
        if (idx >= allImages.length) idx = 0;
        currentIndex = idx;

        const data = allImages[currentIndex];
        lightboxImg.src = data.src;
        lightboxImg.alt = data.alt;
        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentIndex + 1} / ${allImages.length}`;
        }
    }

    function openLightbox(index) {
        showImage(index);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    frames.forEach((frame, idx) => {
        frame.addEventListener('click', () => {
            openLightbox(idx);
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (lbPrevBtn) lbPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
    if (lbNextBtn) lbNextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // Soporte para gestos táctiles Swipe en móvil
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) showImage(currentIndex - 1); // Swipe derecha -> anterior
            else showImage(currentIndex + 1); // Swipe izquierda -> siguiente
        }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    });
}

// Initial load
loadMemberships();
loadSchedule();

// Initialize static icons
refreshLucideIcons();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('btn-download-schedule');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', exportSchedule);
    }
    initAmaruGalleryExperience();
});

