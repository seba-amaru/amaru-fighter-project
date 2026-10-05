import{t as e}from"./supabase-config-BObpT6R-.js";function t(){window.lucide&&typeof window.lucide.createIcons==`function`&&window.lucide.createIcons()}e.auth.onAuthStateChange((e,t)=>{t&&console.log(`Sesión persistente detectada:`,t.user.email)});var n=document.querySelector(`.navbar`),r=document.querySelector(`.mobile-menu-toggle`),i=document.querySelector(`.mobile-menu`),a=document.querySelectorAll(`.mobile-link`),o=document.querySelectorAll(`.stat-number`);n&&window.addEventListener(`scroll`,()=>{window.scrollY>50?n.classList.add(`scrolled`):n.classList.remove(`scrolled`)}),r&&i&&r.addEventListener(`click`,()=>{i.classList.toggle(`active`),r.classList.toggle(`open`)}),i&&a.forEach(e=>{e.addEventListener(`click`,()=>{i.classList.remove(`active`)})});var s=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add(`fade-in-up`),s.unobserve(e.target))})},{threshold:.1,rootMargin:`0px 0px -50px 0px`});document.querySelectorAll(`.section-title, .about-content, .service-flip-card`).forEach(e=>{e.style.opacity=`0`,e.style.transform=`translateY(20px)`,e.style.transition=`opacity 0.6s ease-out, transform 0.6s ease-out`,s.observe(e)});var c=document.createElement(`style`);c.innerText=`
    .fade-in-up {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`,document.head.appendChild(c);var l=new IntersectionObserver(e=>{e.forEach(e=>{if(e.isIntersecting){let t=+e.target.getAttribute(`data-target`),n=t/(2e3/16),r=0,i=()=>{r+=n,r<t?(e.target.innerText=Math.ceil(r),requestAnimationFrame(i)):e.target.innerText=t};i(),l.unobserve(e.target)}})},{threshold:.5});o.forEach(e=>l.observe(e)),document.querySelectorAll(`.service-flip-card`).forEach(e=>{e.addEventListener(`click`,()=>{e.classList.toggle(`flipped`)})});async function u(){let n=document.getElementById(`plans-container`);if(n)try{let{data:r,error:i}=await e.from(`membership_plans`).select(`*`).order(`sort_order`,{ascending:!0});if(i)throw i;r&&r.length>0?(n.innerHTML=``,r.forEach(e=>{let t=d(e);n.appendChild(t)}),t()):n.innerHTML=`<p class="loading-plans">No hay planes disponibles en este momento.</p>`}catch(e){console.error(`Error loading memberships:`,e),n.innerHTML=`<p class="loading-plans">Error al cargar los planes. Por favor, intenta más tarde.</p>`}}function d(e){let t=document.createElement(`div`);t.className=`plan-card ${e.theme||`bronze`}-theme`;let n=``;if(e.features){let t=[];Array.isArray(e.features)?t=e.features:typeof e.features==`string`&&(t=e.features.split(`,`).map(e=>e.trim())),n=t.map(e=>`
            <li>
                <i data-lucide="check-circle"></i>
                <span>${e}</span>
            </li>
        `).join(``)}return t.innerHTML=`
        <div class="plan-label">${e.subtitle||`MEMBRESÍA`}</div>
        <h3 class="plan-title">${e.name}</h3>
        <div class="plan-price">
            <span class="currency">$</span>${Number(e.price).toLocaleString(`es-CL`)} 
            <span>/ mes</span>
        </div>
        <ul class="plan-features">
            <li>
                <i data-lucide="calendar"></i>
                <span>${e.monthly} clases mensuales</span>
            </li>
            <li>
                <i data-lucide="clock"></i>
                <span>Hasta ${e.limit} clases por día</span>
            </li>
            ${n}
        </ul>
        ${e.theme===`gold`?`<div class="plan-badge">Popular</div>`:``}
    `,t}var f=[],p=`all`;async function m(){if(document.getElementById(`schedule-grid-wrapper`))try{let{data:t,error:n}=await e.from(`classes`).select(`*`).order(`time`,{ascending:!0});if(n)throw n;f=t||[],f.length>0?(C(f),w(f)):h()}catch(e){console.error(`Error loading schedule:`,e),h()}}function h(){let e=document.getElementById(`schedule-grid-wrapper`);e&&(e.innerHTML=`
            <div class="schedule-fallback-msg glass-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" style="opacity:0.5; margin-bottom:16px;">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                </svg>
                <p>No se pudo cargar el horario dinámico.</p>
                <a href="images/horario.pdf" target="_blank" class="btn-outline" style="margin-top:16px; display:inline-block;">Ver Horario PDF</a>
            </div>
        `)}var g=[`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`,`Domingo`],_={Lunes:1,Martes:2,Miércoles:3,Jueves:4,Viernes:5,Sábado:6,Domingo:0},v={Striking:{bg:`rgba(239, 68, 68, 0.12)`,border:`rgba(239, 68, 68, 0.35)`,text:`#ef4444`,label:`Kick Boxing`},BJJ:{bg:`rgba(139, 92, 246, 0.12)`,border:`rgba(139, 92, 246, 0.35)`,text:`#8b5cf6`,label:`Jiu Jitsu`},"BJJ Gi":{bg:`rgba(139, 92, 246, 0.12)`,border:`rgba(139, 92, 246, 0.35)`,text:`#8b5cf6`,label:`Jiu Jitsu Gi`},"No Gi":{bg:`rgba(168, 85, 247, 0.12)`,border:`rgba(168, 85, 247, 0.35)`,text:`#a855f7`,label:`No Gi`},MMA:{bg:`rgba(249, 115, 22, 0.12)`,border:`rgba(249, 115, 22, 0.35)`,text:`#f97316`,label:`MMA`},"Funcional Fighter":{bg:`rgba(34, 197, 94, 0.12)`,border:`rgba(34, 197, 94, 0.35)`,text:`#22c55e`,label:`Funcional`}};function y(e){return v[e]||{bg:`rgba(6, 182, 212, 0.12)`,border:`rgba(6, 182, 212, 0.35)`,text:`var(--accent-cyan)`,label:e}}function b(e){if(!e)return[];if(Array.isArray(e))return e;if(typeof e==`string`)try{let t=JSON.parse(e);if(Array.isArray(t))return t}catch{return e.split(`,`).map(e=>e.trim())}return[]}function x(e,t){let n=b(e),r=_[t];return n.some(e=>{let n=String(e).trim();return n.toLowerCase()===t.toLowerCase()||n.toLowerCase()===t.substring(0,3).toLowerCase()||n===String(r)})}function S(e,t){return t===`all`?e:e.filter(e=>e.type===t)}function C(e){let t=document.getElementById(`schedule-grid-wrapper`),n=S(e,p),r=`<div class="schedule-table">`;r+=`<div class="schedule-header-row">`,r+=`<div class="schedule-time-col">Hora</div>`,g.forEach(e=>{let t=new Date().getDay()===_[e];r+=`<div class="schedule-day-col ${t?`today`:``}">${e}${t?`<span class="today-badge">Hoy</span>`:``}</div>`}),r+=`</div>`;let i=[...new Set(n.map(e=>e.time))].sort();i.length===0?r+=`<div class="schedule-empty">No hay clases para esta disciplina.</div>`:i.forEach(e=>{r+=`<div class="schedule-row">`,r+=`<div class="schedule-time-col"><span class="time-label">${e}</span></div>`,g.forEach(t=>{let i=n.filter(n=>x(n.days,t)&&n.time===e);r+=`<div class="schedule-cell">`,i.forEach(e=>{let t=y(e.type);r+=`
                        <div class="schedule-class-card" style="background:${t.bg}; border-color:${t.border};" data-type="${e.type}">
                            <span class="class-type-tag" style="color:${t.text};">${t.label}</span>
                            <h4 class="class-name">${e.name}</h4>
                            <p class="class-coach">Coach ${e.coach||`Amaru`}</p>
                        </div>
                    `}),r+=`</div>`}),r+=`</div>`}),r+=`</div>`,t.innerHTML=r}function w(e){let t=document.getElementById(`schedule-mobile`);if(!t)return;let n=S(e,p),r=new Date().getDay(),i=g.find(e=>_[e]===r)||`Lunes`,a=``;g.forEach(e=>{let t=n.filter(t=>x(t.days,e)).sort((e,t)=>e.time.localeCompare(t.time)),r=e===i,o=t.length>0;a+=`
            <div class="schedule-day-accordion ${r?`today`:``} ${o?``:`empty`}">
                <button class="day-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                    <span class="day-name">${e}${r?`<span class="today-badge-mobile">Hoy</span>`:``}</span>
                    <span class="day-count">${t.length} clase${t.length===1?``:`s`}</span>
                    <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="day-accordion-content">
                    ${o?t.map(e=>{let t=y(e.type);return`
                            <div class="mobile-class-card" style="border-left-color:${t.text};">
                                <div class="mobile-class-time">${e.time}</div>
                                <div class="mobile-class-info">
                                    <span class="mobile-class-tag" style="color:${t.text};">${t.label}</span>
                                    <h4>${e.name}</h4>
                                    <p>Coach ${e.coach||`Amaru`}</p>
                                </div>
                            </div>
                        `}).join(``):`<p class="no-classes">No hay clases programadas.</p>`}
                </div>
            </div>
        `}),t.innerHTML=a;let o=t.querySelector(`.schedule-day-accordion.today`);o&&o.classList.add(`open`)}document.addEventListener(`click`,e=>{e.target.classList.contains(`filter-btn`)&&(document.querySelectorAll(`.filter-btn`).forEach(e=>e.classList.remove(`active`)),e.target.classList.add(`active`),p=e.target.getAttribute(`data-filter`),C(f),w(f))});async function T(){let e=document.getElementById(`btn-download-schedule`),t=document.querySelector(`.schedule-table`),n=document.getElementById(`schedule-mobile`);if(!t&&!n)return;let r=window.innerWidth>968?t:n;if(!r){alert(`Primero carga el horario para poder descargarlo.`);return}let i=e.innerHTML;e.innerHTML=`<div class="loading-spinner" style="width:16px; height:16px; border-width:2px;"></div> Generando...`,e.disabled=!0;try{let t=(await html2canvas(r,{backgroundColor:`#000000`,scale:2,useCORS:!0,logging:!1,onclone:e=>{let t=e.querySelector(`.schedule-table`)||e.getElementById(`schedule-mobile`);if(t){t.style.padding=`40px`,t.style.borderRadius=`0px`,t.style.display=`block`;let n=e.createElement(`div`);n.innerHTML=`
                        <div style="text-align:center; margin-bottom:40px; color:white; font-family:sans-serif;">
                            <h1 style="margin:0; font-size:32px;">AMARUFIGHTER</h1>
                            <p style="margin:5px 0; opacity:0.7;">Horario de Clases - La Familia Nunca Muere</p>
                        </div>
                    `,t.prepend(n)}}})).toDataURL(`image/png`),{jsPDF:n}=window.jspdf,a=new n({orientation:window.innerWidth>968?`l`:`p`,unit:`mm`,format:`a4`}),o=a.getImageProperties(t),s=a.internal.pageSize.getWidth(),c=o.height*s/o.width;a.addImage(t,`PNG`,0,0,s,c),a.save(`Horario_Amarufighter_${p}.pdf`),e.innerHTML=`¡Descargado! ✓`,setTimeout(()=>{e.innerHTML=i,e.disabled=!1},3e3)}catch(t){console.error(`Error exporting schedule:`,t),alert(`Hubo un error al generar el archivo. Por favor intenta de nuevo.`),e.innerHTML=i,e.disabled=!1}}function E(){let e=Array.from(document.querySelectorAll(`.gallery-frame`)),t=document.getElementById(`btn-toggle-gallery`),n=!1;function r(){e.forEach((e,t)=>{t>=8?(e.classList.add(`extra-photo`),n?e.classList.add(`expanded`):e.classList.remove(`expanded`)):e.classList.remove(`extra-photo`,`expanded`)}),t&&(t.querySelector(`span`).textContent=n?`Mostrar Menos`:`Explorar Galería Completa (18 fotos)`,n?t.classList.add(`expanded`):t.classList.remove(`expanded`))}t&&t.addEventListener(`click`,()=>{n=!n,r()}),r();let i=document.getElementById(`gallery-lightbox`),a=document.getElementById(`gallery-lightbox-img`),o=document.getElementById(`gallery-lightbox-counter`),s=document.getElementById(`gallery-lightbox-close`),c=document.getElementById(`gallery-lightbox-prev`),l=document.getElementById(`gallery-lightbox-next`);if(!i)return;let u=e.map(e=>{let t=e.querySelector(`img`);return{src:t?t.getAttribute(`src`):``,alt:t?t.getAttribute(`alt`):`Amarufighter`}}),d=0;function f(e){if(u.length===0)return;e<0&&(e=u.length-1),e>=u.length&&(e=0),d=e;let t=u[d];a.src=t.src,a.alt=t.alt,o&&(o.textContent=`${d+1} / ${u.length}`)}function p(e){f(e),i.classList.add(`active`),document.body.style.overflow=`hidden`}function m(){i.classList.remove(`active`),document.body.style.overflow=``}e.forEach((e,t)=>{e.addEventListener(`click`,()=>{p(t)})}),s&&s.addEventListener(`click`,m),c&&c.addEventListener(`click`,e=>{e.stopPropagation(),f(d-1)}),l&&l.addEventListener(`click`,e=>{e.stopPropagation(),f(d+1)}),i.addEventListener(`click`,e=>{e.target===i&&m()});let h=0;i.addEventListener(`touchstart`,e=>{h=e.changedTouches[0].screenX},{passive:!0}),i.addEventListener(`touchend`,e=>{let t=e.changedTouches[0].screenX-h;Math.abs(t)>40&&f(t>0?d-1:d+1)},{passive:!0}),document.addEventListener(`keydown`,e=>{i.classList.contains(`active`)&&(e.key===`Escape`&&m(),e.key===`ArrowLeft`&&f(d-1),e.key===`ArrowRight`&&f(d+1))})}u(),m(),t(),document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`btn-download-schedule`);e&&e.addEventListener(`click`,T),E()});