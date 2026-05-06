import{t as e}from"./dist-CjQljHnc.js";import{t}from"./main-SWgw7C3H.js";var n=e(`https://rjvviunpdpcwfkquxytl.supabase.co`,`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqdnZpdW5wZHBjd2ZrcXV4eXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzIyMDMsImV4cCI6MjA4NzcwODIwM30.uZGN-7CNyxIevMVvOR60ueSGf6tkiIacl-jGX2z9zcE`,{auth:{autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0}});window.supabase=n;var r={async createProfile(e,t){let{data:n}=await window.supabase.from(`profiles`).select(`id`).eq(`email`,e.email).maybeSingle();if(n&&n.id!==e.uid){console.warn(`Profile with email ${e.email} exists with different ID. Merging accounts.`);let{error:t}=await window.supabase.from(`profiles`).update({id:e.uid}).eq(`id`,n.id);if(t)throw t;return this.getProfile(e.uid)}let{data:r,error:i}=await window.supabase.from(`profiles`).upsert({id:e.uid,email:e.email,full_name:t||e.displayName||`Atleta`,role:`athlete`,membership_limit:2,xp:0,level:0});if(i)throw i;return r},async getProfile(e){try{let{data:t,error:n}=await window.supabase.from(`profiles`).select(`*`).eq(`id`,e).maybeSingle();if(n)return n.code!==`PGRST116`&&console.warn(`[Supabase] getProfile error (ID: ${e}): ${n.message}`),null;if(t&&t.membership_plan_id){let{data:e,error:n}=await window.supabase.from(`membership_plans`).select(`name`).eq(`id`,t.membership_plan_id).maybeSingle();!n&&e&&(t.membership_plans=e)}return t}catch(e){return console.error(`[Supabase] getProfile exception:`,e),null}},async updateProfile(e,t){let{data:n,error:r}=await window.supabase.from(`profiles`).update(t).eq(`id`,e);if(r)throw r;return n},async saveFCMToken(e,t){return this.updateProfile(e,{fcm_token:t})},async deleteUser(e){let{data:t,error:n}=await window.supabase.from(`profiles`).delete().eq(`id`,e);if(n)throw n;return t},async softDeleteUser(e){let{data:t,error:n}=await window.supabase.from(`profiles`).update({is_deleted:!0}).eq(`id`,e);if(n)throw n;return t},async getAttendance(e){let{data:t,error:n}=await window.supabase.from(`attendance`).select(`*`).eq(`user_id`,e).order(`attended_at`,{ascending:!1});if(n)throw n;return t},async logAttendance(e,t,n){let{data:r,error:i}=await window.supabase.from(`attendance`).insert({user_id:e,class_id:t,class_name:n});if(i)throw i;return r},async recordPayment(e,t){let{data:n,error:r}=await window.supabase.from(`payments`).insert({user_id:e,...t});if(r)throw r;return n},async getPayments(e){let{data:t,error:n}=await window.supabase.from(`payments`).select(`*`).eq(`user_id`,e).order(`created_at`,{ascending:!1});if(n)throw n;return t},async getAllPayments(){let{data:e,error:t}=await window.supabase.from(`payments`).select(`*, profiles(full_name)`).order(`created_at`,{ascending:!1});if(t)throw t;return e},async getAllProfiles(){let{data:e,error:t}=await window.supabase.from(`profiles`).select(`*, membership_plans(name, monthly)`).eq(`role`,`athlete`).eq(`is_deleted`,!1).order(`full_name`,{ascending:!0});if(t)throw t;return e},async getClasses(){let{data:e,error:t}=await window.supabase.from(`classes`).select(`*`);if(t)throw t;return e.map(e=>({...e,img:e.img&&e.img.includes(`photo-1599058917232-d750c1844bb7`)?`https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500`:e.img}))},async upsertClass(e){let{data:t,error:n}=await window.supabase.from(`classes`).upsert(e);if(n)throw n;return t},async getPlans(){let{data:e,error:t}=await window.supabase.from(`membership_plans`).select(`*`).order(`sort_order`,{ascending:!0});if(t)throw t;return e},async upsertPlan(e){let{data:t,error:n}=await window.supabase.from(`membership_plans`).upsert(e);if(n)throw n;return t},async getMembershipPlans(){return this.getPlans()},async updatePlanOrder(e,t){let{error:n}=await window.supabase.from(`membership_plans`).update({sort_order:t}).eq(`id`,e);if(n)throw n},async getPendingPayments(){let{data:e,error:t}=await window.supabase.from(`payments`).select(`*`).eq(`status`,`pending`).order(`created_at`,{ascending:!1});if(t)throw t;return e},async updatePaymentStatus(e,t){let{data:n,error:r}=await window.supabase.from(`payments`).update({status:t}).eq(`id`,e);if(r)throw r;return n},async getPayment(e){let{data:t,error:n}=await window.supabase.from(`payments`).select(`*`).eq(`id`,e).single();if(n)throw n;return t},async deletePendingPayments(e){let{data:t,error:n}=await window.supabase.from(`payments`).delete().eq(`user_id`,e).eq(`status`,`pending`);if(n)throw n;return t},async deletePlan(e){let{error:t}=await window.supabase.from(`membership_plans`).delete().eq(`id`,e);if(t)throw t},async deleteClass(e){let{error:t}=await window.supabase.from(`classes`).delete().eq(`id`,e);if(t)throw t},async getReservations(e){let t=window.supabase.from(`reservations`).select(`*`);e&&(t=t.eq(`reservation_date`,e));let{data:n,error:r}=await t;if(r)throw r;return n},async getAllReservations(){let{data:e,error:t}=await window.supabase.from(`reservations`).select(`*`);if(t)throw t;return e},async getUserReservations(e){let{data:t,error:n}=await window.supabase.from(`reservations`).select(`*`).eq(`user_id`,e);if(n)throw n;return t},async createReservation(e,t,n,r){let{data:i,error:a}=await window.supabase.from(`reservations`).insert({user_id:e,class_id:t,class_name:n,reservation_date:r});if(a)throw a;return i},async deleteReservation(e,t,n){let{error:r}=await window.supabase.from(`reservations`).delete().eq(`user_id`,e).eq(`class_id`,t).eq(`reservation_date`,n);if(r)throw r},async getTournaments(e){let{data:t,error:n}=await window.supabase.from(`tournaments`).select(`*`).eq(`user_id`,e).order(`date`,{ascending:!0});if(n)throw n;return t.map(e=>({...e,img:e.img&&e.img.includes(`photo-1599058917232-d750c1844bb7`)?`https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500`:e.img}))},async upsertTournament(e,t){let{data:n,error:r}=await window.supabase.from(`tournaments`).upsert({...t,user_id:e});if(r)throw r;return n},async deleteTournament(e){let{error:t}=await window.supabase.from(`tournaments`).delete().eq(`id`,e);if(t)throw t},async uploadAvatar(e,t){let n=`${e}-${Date.now()}`,{error:r}=await window.supabase.storage.from(`avatars`).upload(n,t,{upsert:!0});if(r)throw r;let{data:i}=window.supabase.storage.from(`avatars`).getPublicUrl(n);return i.publicUrl},async uploadPaymentReceipt(e,t){let n=`${e}/${Date.now()}_${t.name}`,{error:r}=await window.supabase.storage.from(`payments`).upload(n,t,{upsert:!0});if(r)throw r;let{data:i}=window.supabase.storage.from(`payments`).getPublicUrl(n);return i.publicUrl},async getNotifications(){let{data:e,error:t}=await window.supabase.from(`global_notifications`).select(`*`).order(`created_at`,{ascending:!1});if(t)throw t;return e||[]},async addNotification(e,t,n){let{data:r,error:i}=await window.supabase.from(`global_notifications`).insert([{title:e,message:t,type:n}]).select();if(i)throw i;return r},async deleteNotification(e){let{error:t}=await window.supabase.from(`global_notifications`).delete().eq(`id`,e);if(t)throw t;return!0}},i=(e,t)=>{let n=window.showToast||(e=>console.log(e)),i=document.getElementById(`btn-register`);i&&(i.onclick=async()=>{let i=document.getElementById(`reg-name`).value.trim(),a=document.getElementById(`reg-email`).value.trim(),o=document.getElementById(`reg-password`).value;if(!i||!a||!o)return n(`Por favor llena todos los campos ⚠️`,`#eab308`);try{n(`Creando cuenta... 🥋`);let{data:s,error:c}=await window.supabase.auth.signUp({email:a,password:o,options:{data:{full_name:i}}});if(c)throw c;let l={...s.user,uid:s.user.id};await r.createProfile(l,i),n(`¡Cuenta creada con éxito! 🚀`),setTimeout(()=>{let n=document.getElementById(`auth-screen`),r=document.getElementById(`membership-selection-screen`);n&&n.classList.add(`hidden`),r?(t(),r.classList.remove(`hidden`)):(document.getElementById(`app-container`).classList.remove(`hidden`),e(`dashboard`))},1500)}catch(e){console.error(e);let t=`Error al registrar la cuenta`;e.code===`auth/invalid-email`?t=`El correo no tiene un formato válido.`:e.code===`auth/email-already-in-use`?t=`Este correo electrónico ya está registrado.`:e.code===`auth/weak-password`?t=`La contraseña es muy débil (mín. 6 caracteres).`:e.message&&(t+=`: `+e.message),n(t+` ❌`,`#ef4444`)}});let a=document.getElementById(`go-to-register`),o=document.getElementById(`go-to-login`),s=document.getElementById(`login-form-container`),c=document.getElementById(`register-form-container`);a&&(a.onclick=()=>{s.classList.add(`hidden`),c.classList.remove(`hidden`)}),o&&(o.onclick=()=>{c.classList.add(`hidden`),s.classList.remove(`hidden`)});let l=document.getElementById(`btn-login`);l&&(l.onclick=async()=>{let e=document.getElementById(`login-email`),t=document.getElementById(`login-password`),r=e.value,i=t.value;if(r.toLowerCase().trim()===`admin`&&(r=`admin@amaru.app`,n(`Acceso Maestro 🛡️`)),!r||!i)return n(`Faltan datos ⚠️`,`#eab308`);try{let{error:e}=await window.supabase.auth.signInWithPassword({email:r,password:i});if(e)throw e;n(`¡Bienvenido! 🥋`)}catch(e){n(`Error de acceso: `+e.message,`#ef4444`)}});let u=document.getElementById(`btn-google-login`);u&&(u.onclick=async()=>{try{n(`Conectando con Google... 🚀`);let{data:e,error:t}=await window.supabase.auth.signInWithOAuth({provider:`google`,options:{redirectTo:window.location.origin}});if(t)throw t}catch(e){n(`Error al conectar con Google ❌`,`#ef4444`),console.error(`Google Auth Error:`,e)}});let d=document.getElementById(`btn-forgot-password`);d&&(d.onclick=async()=>{let e=document.getElementById(`login-email`).value.trim();if(!e)return n(`Ingresa tu email para restablecer contraseña ⚠️`,`#eab308`);try{n(`Enviando enlace... 📧`);let{error:t}=await window.supabase.auth.resetPasswordForEmail(e,{redirectTo:window.location.origin+`/app/`});if(t)throw t;n(`Email de restablecimiento enviado ✅`,`#22c55e`)}catch(e){n(`Error: `+e.message,`#ef4444`)}});let f=document.getElementById(`btn-logout`);f&&(f.onclick=async()=>{localStorage.removeItem(`isAdminMode`),await window.supabase.auth.signOut(),window.location.reload()})},a={plans:[],classes:[],tournaments:[],userProfile:null};window.appState=a;var o=(e,t,n,r)=>{if(e===`csv`){let e=[n.join(`,`),...t.map(e=>Object.values(e).map(e=>`"${e}"`).join(`,`))].join(`
`),i=new Blob([e],{type:`text/csv;charset=utf-8;`}),a=document.createElement(`a`);a.href=URL.createObjectURL(i),a.download=`${r}.csv`,a.click()}else if(e===`xls`){let e=document.createElement(`table`),i=document.createElement(`thead`),a=document.createElement(`tr`);n.forEach(e=>{let t=document.createElement(`th`);t.innerText=e,a.appendChild(t)}),i.appendChild(a),e.appendChild(i);let o=document.createElement(`tbody`);t.forEach(e=>{let t=document.createElement(`tr`);Object.values(e).forEach(e=>{let n=document.createElement(`td`);n.innerText=e,t.appendChild(n)}),o.appendChild(t)}),e.appendChild(o);let s=`<html><head><meta charset="UTF-8"></head><body>${e.outerHTML}</body></html>`,c=new Blob([s],{type:`application/vnd.ms-excel`}),l=document.createElement(`a`);l.href=URL.createObjectURL(c),l.download=`${r}.xls`,l.click()}else if(e===`pdf`)if(window.jspdf!==void 0){let e=new window.jspdf.jsPDF;e.autoTable({head:[n],body:t.map(e=>Object.values(e)),theme:`grid`,styles:{fontSize:8},headStyles:{fillColor:[139,92,246]}}),e.save(`${r}.pdf`)}else window.showToast(`Librería PDF no cargada`,`#eab308`)},s=(e,t)=>{o(t,e.map(e=>({name:e.full_name||`Sin Nombre`,email:e.email||``,phone:e.phone||``,level:e.level||0,plan:e.membership_plans?.name||`Sin Plan`,status:e._computedStatus||`Desconocido`,expiry:e._expiryDate?e._expiryDate.toLocaleDateString():`N/A`})),[`Nombre`,`Email`,`Teléfono`,`Nivel`,`Plan`,`Estado`,`Vencimiento`],`Socios_Amaru_${new Date().toISOString().split(`T`)[0]}`)},c=`modulepreload`,l=function(e){return`/`+e},u={},d=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=l(t,n),t in u)return;u[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:c,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},f=[],p=[],m=[],h=`resumen`,g={search:``,status:[`pending`,`approved`,`rejected`],dateFrom:``,dateTo:``,method:``,minAmount:``,maxAmount:``},_={field:`created_at`,dir:`desc`},v=1,y=25,b=`all`,x=()=>document.getElementById(`admin-content-area`),S=e=>e==null?`$0`:`$`+Math.round(e).toLocaleString(`es-CL`),C=e=>e?new Date(e).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,w=e=>[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][e]||``,T=()=>new Date().toISOString().split(`T`)[0],ee=e=>{if(!e)return null;let t=[`enero`,`febrero`,`marzo`,`abril`,`mayo`,`junio`,`julio`,`agosto`,`septiembre`,`octubre`,`noviembre`,`diciembre`],n=e.toLowerCase(),r=t.findIndex(e=>n.includes(e)),i=e.match(/(\d{4})/);return r===-1||!i?null:{month:r,year:parseInt(i[1])}},E=async()=>{try{let{data:e,error:t}=await window.supabase.from(`payments`).select(`*, profiles(full_name, email, role, membership_status, membership_expiry, membership_plan_id)`).order(`created_at`,{ascending:!1});if(t)throw t;let{data:n,error:r}=await window.supabase.from(`profiles`).select(`*`);if(r)throw r;let{data:i,error:a}=await window.supabase.from(`membership_plans`).select(`*`);if(a)throw a;f=e||[],p=n||[],m=i||[]}catch(e){console.error(`[Payments] Error fetching data:`,e),window.showToast&&window.showToast(`Error cargando datos de pagos`,`#ef4444`)}},te=async()=>{let e=x(),t=document.getElementById(`admin-revenue-section`);t&&t.classList.add(`hidden`),e.innerHTML=`
        <div class="glass-premium p-20">
            <div class="p-20 text-center">
                <i data-lucide="loader" class="spin"></i>
                <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">Cargando control de pagos...</p>
            </div>
        </div>`,window.lucide&&window.lucide.createIcons(),await E(),D()},D=()=>{let e=x();if(!e)return;e.innerHTML=`
        <div class="glass-premium p-20" id="payments-dashboard">
            <div class="header-split mb-20" style="align-items:flex-start;">
                <div>
                    <h3 style="font-size:1.3rem; margin-bottom:4px;">💰 Control de Pagos</h3>
                    <p class="subtitle">Gestión diaria de ingresos, transacciones y cobranza</p>
                </div>
                <a href="#" id="link-revenue-advanced" style="font-size:0.75rem; color:var(--accent-purple); text-decoration:none; display:flex; align-items:center; gap:4px;">
                    <i data-lucide="bar-chart-2" style="width:14px;"></i> Ver análisis avanzado →
                </a>
            </div>

            <!-- Tabs -->
            <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; flex-wrap:wrap;">
                <button id="tab-resumen" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${h===`resumen`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="layout-dashboard" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Resumen
                </button>
                <button id="tab-transacciones" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${h===`transacciones`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="list" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Transacciones
                </button>
                <button id="tab-cobranza" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${h===`cobranza`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="zap" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Cobranza del Mes
                </button>
            </div>

            <!-- Content area -->
            <div id="payments-view-content"></div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),document.getElementById(`tab-resumen`).onclick=()=>{h=`resumen`,D()},document.getElementById(`tab-transacciones`).onclick=()=>{h=`transacciones`,D()},document.getElementById(`tab-cobranza`).onclick=()=>{h=`cobranza`,D()};let t=document.getElementById(`link-revenue-advanced`);t&&(t.onclick=e=>{e.preventDefault(),d(()=>Promise.resolve().then(()=>Ie).then(e=>{e.renderRevenueSection&&e.renderRevenueSection()}),void 0)});let n=document.getElementById(`payments-view-content`);h===`resumen`?ne(n):h===`transacciones`?re(n):k(n)},ne=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=f.filter(e=>{let t=new Date(e.created_at);return t.getFullYear()===r&&t.getMonth()===n&&e.status===`approved`}),a=i.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),o=i.length,s=o>0?a/o:0,c=n===0?11:n-1,l=n===0?r-1:r,u=f.filter(e=>{let t=new Date(e.created_at);return t.getFullYear()===l&&t.getMonth()===c&&e.status===`approved`}).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),d=u>0?(a-u)/u*100:a>0?100:0,h=f.filter(e=>e.status===`pending`),g=h.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),_=p.filter(e=>e.membership_status===`active`),v=_.length,y=_.filter(e=>{let t=f.filter(t=>t.user_id===e.id&&t.status===`approved`).sort((e,t)=>new Date(t.created_at)-new Date(e.created_at))[0];if(!t)return!1;let i=ee(t.coverage_month);return i?i.month===n&&i.year===r:!1}).length,b=v>0?(y/v*100).toFixed(0):0,x=h.filter(e=>(t-new Date(e.created_at))/(1e3*60*60*24)<=7).slice(0,5),C=_.filter(e=>{if(!e.membership_expiry)return!1;let n=Math.ceil((new Date(e.membership_expiry)-t)/(1e3*60*60*24));return n>0&&n<=5}).slice(0,5),T=[];for(let e=6;e>=0;e--){let n=new Date(t);n.setDate(n.getDate()-e);let r=n.toISOString().split(`T`)[0],i=f.filter(e=>e.created_at&&e.created_at.startsWith(r)&&e.status===`approved`);T.push({label:n.toLocaleDateString(`es-CL`,{weekday:`short`,day:`numeric`}),total:i.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),count:i.length})}e.innerHTML=`
        <!-- KPIs -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:25px;">
            <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ingresos ${w(n)}</span>
                <strong style="font-size:1.5rem; color:var(--accent-purple); font-weight:900;">${S(a)}</strong>
                <span style="font-size:0.75rem; color:${d>=0?`#22c55e`:`#ef4444`}; display:block; margin-top:4px;">${d>=0?`+`:``}${d.toFixed(1)}% vs mes ant.</span>
            </div>
            <div class="stat-mini-premium ${h.length>0?`pulse-warning`:``}" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Pendientes por Aprobar</span>
                <strong style="font-size:1.5rem; color:#fbbf24; font-weight:900;">${h.length}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${S(g)}</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Cobertura del Mes</span>
                <strong style="font-size:1.5rem; color:#22c55e; font-weight:900;">${y}/${v}</strong>
                <div style="width:80%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; margin:6px auto 0;">
                    <div style="width:${b}%; height:100%; background:#22c55e; border-radius:3px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${b}% al día</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ticket Promedio</span>
                <strong style="font-size:1.5rem; color:#3b82f6; font-weight:900;">${S(s)}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${o} pagos</span>
            </div>
        </div>

        <!-- Gráfico últimos 7 días -->
        <div style="margin-bottom:25px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h4 style="font-size:0.9rem; font-weight:700;">📈 Ingresos últimos 7 días</h4>
            </div>
            <div class="chart-container" style="min-height:200px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:15px;">
                <canvas id="resumenChart"></canvas>
            </div>
        </div>

        <!-- Acciones requeridas -->
        <div style="margin-bottom:20px;">
            <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-circle" style="width:16px; color:#fbbf24;"></i> Acciones Requeridas
            </h4>
            ${x.length===0&&C.length===0?`<p style="opacity:0.5; font-size:0.85rem; padding:15px;">🎉 No hay acciones pendientes. Todo está al día.</p>`:`<div style="display:flex; flex-direction:column; gap:8px;">
                    ${x.map(e=>{let n=e.profiles?.full_name||e.user_name||`Usuario`,r=S(parseFloat(e.amount)||0),i=Math.floor((t-new Date(e.created_at))/(1e3*60*60*24));return`
                            <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:rgba(251,191,36,0.05); border-radius:10px; border:1px solid rgba(251,191,36,0.15);">
                                <div style="width:36px; height:36px; border-radius:50%; background:rgba(251,191,36,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="clock" style="width:16px; color:#fbbf24;"></i>
                                </div>
                                <div style="flex:1;">
                                    <strong style="font-size:0.9rem;">${n}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Pago pendiente ${r} — hace ${i} día${i===1?``:`s`}</span>
                                </div>
                                <button class="btn-quick-approve btn-glass-small" data-id="${e.id}" style="border-color:#22c55e; color:#22c55e;"><i data-lucide="check" style="width:14px;"></i> Aprobar</button>
                            </div>
                        `}).join(``)}
                    ${C.map(e=>{let n=Math.ceil((new Date(e.membership_expiry)-t)/(1e3*60*60*24)),r=m.find(t=>t.id===e.membership_plan_id);return`
                            <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:rgba(239,68,68,0.05); border-radius:10px; border:1px solid rgba(239,68,68,0.15);">
                                <div style="width:36px; height:36px; border-radius:50%; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="alert-triangle" style="width:16px; color:#ef4444;"></i>
                                </div>
                                <div style="flex:1;">
                                    <strong style="font-size:0.9rem;">${e.full_name||`Sin nombre`}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Membresía vence en ${n} día${n===1?``:`s`} — ${r?.name||`Sin plan`}</span>
                                </div>
                                <button class="btn-quick-register btn-glass-small" data-uid="${e.id}" style="border-color:var(--accent-purple); color:var(--accent-purple);"><i data-lucide="dollar-sign" style="width:14px;"></i> Registrar</button>
                            </div>
                        `}).join(``)}
                </div>`}
        </div>
    `,window.lucide&&window.lucide.createIcons(),O(T),e.querySelectorAll(`.btn-quick-approve`).forEach(e=>{e.onclick=()=>Ee(e.getAttribute(`data-id`),`approved`)}),e.querySelectorAll(`.btn-quick-register`).forEach(e=>{e.onclick=()=>A(e.getAttribute(`data-uid`))})},O=e=>{let t=document.getElementById(`resumenChart`);t&&(window._resumenChart&&window._resumenChart.destroy(),window._resumenChart=new Chart(t,{type:`bar`,data:{labels:e.map(e=>e.label),datasets:[{label:`Ingresos ($)`,data:e.map(e=>e.total),backgroundColor:`rgba(139, 92, 246, 0.7)`,borderColor:`rgba(139, 92, 246, 1)`,borderWidth:1,borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:`rgba(13,13,18,0.95)`,callbacks:{label:e=>` Ingresos: ${S(e.raw)}`}}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:10}},grid:{display:!1}},y:{ticks:{color:`rgba(255,255,255,0.4)`,font:{size:10},callback:e=>`$`+(e>=1e3?(e/1e3).toFixed(0)+`k`:e)},grid:{color:`rgba(255,255,255,0.06)`}}}}}))},re=e=>{let t=f.filter(e=>{if(!g.status.includes(e.status)||g.method&&e.payment_method!==g.method||g.dateFrom&&e.created_at<g.dateFrom+`T00:00:00`||g.dateTo&&e.created_at>g.dateTo+`T23:59:59`||g.minAmount&&(parseFloat(e.amount)||0)<parseFloat(g.minAmount)||g.maxAmount&&(parseFloat(e.amount)||0)>parseFloat(g.maxAmount))return!1;if(g.search){let t=g.search.toLowerCase(),n=(e.profiles?.full_name||e.user_name||``).toLowerCase(),r=(e.profiles?.email||``).toLowerCase(),i=(e.concept||e.plan_name||``).toLowerCase();return n.includes(t)||r.includes(t)||i.includes(t)}return!0});t.sort((e,t)=>{let n,r;switch(_.field){case`amount`:n=parseFloat(e.amount)||0,r=parseFloat(t.amount)||0;break;case`name`:n=e.profiles?.full_name||``,r=t.profiles?.full_name||``;break;case`status`:n=e.status,r=t.status;break;default:n=new Date(e.created_at),r=new Date(t.created_at)}return _.dir===`asc`?n>r?1:-1:n<r?1:-1});let n=t.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),r=Math.max(1,Math.ceil(t.length/y));v=Math.min(v,r);let i=(v-1)*y,a=t.slice(i,i+y);e.innerHTML=`
        <!-- Filtros -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <input type="text" id="tx-search" placeholder="🔍 Buscar alumno, email o concepto..." value="${g.search}" style="flex:1; min-width:180px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 12px; border-radius:8px; font-size:0.8rem; outline:none;">

            <select id="tx-date-preset" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="lastmonth">Mes pasado</option>
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                ${[{val:`pending`,label:`Pendiente`,color:`#fbbf24`},{val:`approved`,label:`Aprobado`,color:`#22c55e`},{val:`rejected`,label:`Rechazado`,color:`#ef4444`}].map(e=>`
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.7rem; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; border:1px solid ${g.status.includes(e.val)?e.color:`rgba(255,255,255,0.1)`};">
                        <input type="checkbox" class="tx-status-check" value="${e.val}" ${g.status.includes(e.val)?`checked`:``} style="accent-color:${e.color};">
                        <span style="color:${g.status.includes(e.val)?e.color:`var(--text-gray)`};">${e.label}</span>
                    </label>
                `).join(``)}
            </div>

            <select id="tx-method" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todos los métodos</option>
                <option value="manual" ${g.method===`manual`?`selected`:``}>Transferencia/Manual</option>
                <option value="mercadopago" ${g.method===`mercadopago`?`selected`:``}>Mercado Pago</option>
                <option value="webpay" ${g.method===`webpay`?`selected`:``}>Webpay</option>
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="tx-min" placeholder="Min $" value="${g.minAmount}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <span style="opacity:0.5; font-size:0.75rem;">-</span>
                <input type="number" id="tx-max" placeholder="Max $" value="${g.maxAmount}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
            </div>

            <button id="tx-clear-filters" class="btn-glass-small" style="font-size:0.7rem;"><i data-lucide="x" style="width:12px;"></i> Limpiar</button>
        </div>

        <!-- Totales -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.8rem; color:var(--text-gray);">Mostrando <strong style="color:white;">${t.length}</strong> transacciones | Total filtrado: <strong style="color:var(--accent-purple);">${S(n)}</strong></span>
            <div style="display:flex; gap:8px; align-items:center;">
                <select id="tx-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="csv">CSV</option>
                    <option value="xls">XLS</option>
                    <option value="pdf">PDF</option>
                </select>
                <button id="tx-export-btn" class="btn-primary" style="padding:6px 14px; font-size:0.75rem; border-radius:8px;"><i data-lucide="download" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Exportar</button>
            </div>
        </div>

        <!-- Tabla -->
        <div style="overflow-x:auto; border:1px solid rgba(255,255,255,0.06); border-radius:12px; margin-bottom:15px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="created_at">Fecha ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="name">Alumno ↕</th>
                        <th style="padding:10px 12px; text-align:left;">Concepto</th>
                        <th style="padding:10px 12px; text-align:right; cursor:pointer; white-space:nowrap;" data-sort="amount">Monto ↕</th>
                        <th style="padding:10px 12px; text-align:left;">Método</th>
                        <th style="padding:10px 12px; text-align:center; cursor:pointer; white-space:nowrap;" data-sort="status">Estado ↕</th>
                        <th style="padding:10px 12px; text-align:left;">Cobertura</th>
                        <th style="padding:10px 12px; text-align:right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${a.length===0?`<tr><td colspan="8" style="padding:30px; text-align:center; opacity:0.5;">No hay transacciones que coincidan con los filtros.</td></tr>`:a.map(e=>{let t=e.profiles?.full_name||e.user_name||`N/A`,n=e.profiles?.email||``,r=e.concept||e.plan_name||`Membresía`,i=parseFloat(e.amount)||0,a=e.payment_method||`manual`,o=a===`mercadopago`?`Mercado Pago`:a===`webpay`?`Webpay`:`Transferencia`,s=e.status===`approved`?`#22c55e`:e.status===`pending`?`#fbbf24`:`#ef4444`,c=e.status===`approved`?`Aprobado`:e.status===`pending`?`Pendiente`:`Rechazado`,l=e.status===`approved`?`rgba(34,197,94,0.15)`:e.status===`pending`?`rgba(251,191,36,0.15)`:`rgba(239,68,68,0.15)`;return`
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                <td style="padding:10px 12px; white-space:nowrap;">${C(e.created_at)}</td>
                                <td style="padding:10px 12px;">
                                    <strong>${t}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${n}</span>
                                </td>
                                <td style="padding:10px 12px;">${r}</td>
                                <td style="padding:10px 12px; text-align:right; font-weight:700;">${S(i)}</td>
                                <td style="padding:10px 12px;"><span style="font-size:0.7rem; opacity:0.7;">${o}</span></td>
                                <td style="padding:10px 12px; text-align:center;">
                                    <span style="font-size:0.7rem; background:${l}; color:${s}; padding:3px 10px; border-radius:20px; font-weight:700;">${c}</span>
                                </td>
                                <td style="padding:10px 12px; font-size:0.75rem; color:var(--text-gray);">${e.coverage_month||`—`}</td>
                                <td style="padding:10px 12px; text-align:right; white-space:nowrap;">
                                    ${e.status===`pending`?`<button class="tx-approve-btn btn-glass-small" data-id="${e.id}" style="border-color:#22c55e; color:#22c55e; padding:3px 8px; font-size:0.7rem;"><i data-lucide="check" style="width:12px;"></i></button>
                                       <button class="tx-edit-btn btn-glass-small" data-id="${e.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>`:`<button class="tx-revert-btn btn-glass-small" data-id="${e.id}" style="border-color:#fbbf24; color:#fbbf24; padding:3px 8px; font-size:0.7rem;"><i data-lucide="rotate-ccw" style="width:12px;"></i></button>`}
                                    <button class="tx-delete-btn btn-glass-small delete" data-id="${e.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="trash-2" style="width:12px;"></i></button>
                                </td>
                            </tr>
                        `}).join(``)}
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:8px; align-items:center;">
                <span style="font-size:0.75rem; color:var(--text-gray);">Filas:</span>
                <select id="tx-per-page" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="25" ${y===25?`selected`:``}>25</option>
                    <option value="50" ${y===50?`selected`:``}>50</option>
                    <option value="100" ${y===100?`selected`:``}>100</option>
                </select>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button id="tx-prev-page" class="btn-glass-small" ${v<=1?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-left" style="width:14px;"></i></button>
                <span style="font-size:0.8rem;">Página <strong>${v}</strong> de ${r}</span>
                <button id="tx-next-page" class="btn-glass-small" ${v>=r?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-right" style="width:14px;"></i></button>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),ie(e,t)},ie=(e,t)=>{let n=e.querySelector(`#tx-search`);if(n){let e;n.oninput=()=>{clearTimeout(e),e=setTimeout(()=>{g.search=n.value,v=1,D()},300)}}let r=e.querySelector(`#tx-date-preset`);r&&(r.onchange=()=>{let e=new Date,t=r.value;if(g.dateFrom=``,g.dateTo=``,t===`today`)g.dateFrom=T(),g.dateTo=T();else if(t===`week`){let t=new Date(e);t.setDate(t.getDate()-7),g.dateFrom=t.toISOString().split(`T`)[0],g.dateTo=T()}else if(t===`month`)g.dateFrom=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-01`,g.dateTo=T();else if(t===`lastmonth`){let t=new Date(e.getFullYear(),e.getMonth()-1,1);g.dateFrom=t.toISOString().split(`T`)[0];let n=new Date(e.getFullYear(),e.getMonth(),0);g.dateTo=n.toISOString().split(`T`)[0]}v=1,D()}),e.querySelectorAll(`.tx-status-check`).forEach(t=>{t.onchange=()=>{let t=Array.from(e.querySelectorAll(`.tx-status-check:checked`)).map(e=>e.value);g.status=t.length?t:[`pending`,`approved`,`rejected`],v=1,D()}});let i=e.querySelector(`#tx-method`);i&&(i.onchange=()=>{g.method=i.value,v=1,D()});let a=e.querySelector(`#tx-min`),s=e.querySelector(`#tx-max`);a&&(a.onchange=()=>{g.minAmount=a.value,v=1,D()}),s&&(s.onchange=()=>{g.maxAmount=s.value,v=1,D()});let c=e.querySelector(`#tx-clear-filters`);c&&(c.onclick=()=>{g={search:``,status:[`pending`,`approved`,`rejected`],dateFrom:``,dateTo:``,method:``,minAmount:``,maxAmount:``},v=1,D()}),e.querySelectorAll(`th[data-sort]`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-sort`);_.field===t?_.dir=_.dir===`asc`?`desc`:`asc`:(_.field=t,_.dir=`desc`),D()}});let l=e.querySelector(`#tx-prev-page`),u=e.querySelector(`#tx-next-page`),d=e.querySelector(`#tx-per-page`);l&&(l.onclick=()=>{v>1&&(v--,D())}),u&&(u.onclick=()=>{v++,D()}),d&&(d.onchange=()=>{y=parseInt(d.value),v=1,D()}),e.querySelectorAll(`.tx-approve-btn`).forEach(e=>{e.onclick=()=>Ee(e.getAttribute(`data-id`),`approved`)}),e.querySelectorAll(`.tx-edit-btn`).forEach(e=>{e.onclick=async()=>{let t=prompt(`Nuevo monto (deja vacío para cancelar):`);if(t!==null&&t.trim()!==``)try{await window.supabase.from(`payments`).update({amount:parseFloat(t)}).eq(`id`,e.getAttribute(`data-id`)),window.showToast(`Monto actualizado ✅`,`#22c55e`),await E(),D()}catch{window.showToast(`Error al editar`,`#ef4444`)}}}),e.querySelectorAll(`.tx-revert-btn`).forEach(e=>{e.onclick=()=>Ee(e.getAttribute(`data-id`),`pending`)}),e.querySelectorAll(`.tx-delete-btn`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Eliminar este registro de pago?`))try{await window.supabase.from(`payments`).delete().eq(`id`,e.getAttribute(`data-id`)),window.showToast(`Registro eliminado ✅`,`#22c55e`),await E(),D()}catch{window.showToast(`Error al eliminar`,`#ef4444`)}}});let f=e.querySelector(`#tx-export-btn`);f&&(f.onclick=()=>{let n=e.querySelector(`#tx-export-format`)?.value||`csv`;o(n,t.map(e=>[C(e.created_at),e.profiles?.full_name||e.user_name||`N/A`,e.profiles?.email||``,e.concept||e.plan_name||`Membresía`,parseFloat(e.amount||0).toFixed(0),e.payment_method||`manual`,e.status===`approved`?`Aprobado`:e.status===`pending`?`Pendiente`:`Rechazado`,e.coverage_month||``]),[`Fecha`,`Alumno`,`Email`,`Concepto`,`Monto`,`Método`,`Estado`,`Cobertura`],`Transacciones_Amaru_${T()}`),window.showToast&&window.showToast(`Exportado (${n.toUpperCase()}) ✅`,`#22c55e`)})},k=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=p.filter(e=>e.membership_status===`active`||e.membership_status===`frozen`).map(e=>{let i=f.filter(t=>t.user_id===e.id&&t.status===`approved`).sort((e,t)=>new Date(t.created_at)-new Date(e.created_at))[0]||null,a=i?ee(i.coverage_month):null,o=`none`,s=`Sin registro`,c=`#9ca3af`,l=`rgba(156,163,175,0.15)`;if(i)if(a&&a.month===n&&a.year===r)o=`ok`,s=`Al día`,c=`#22c55e`,l=`rgba(34,197,94,0.15)`;else{let n=e.membership_expiry?new Date(e.membership_expiry):null,r=n?Math.ceil((n-t)/(1e3*60*60*24)):null;r!==null&&r>0&&r<=5?(o=`warning`,s=`Por vencer`,c=`#fbbf24`,l=`rgba(251,191,36,0.15)`):r!==null&&r<=0?(o=`overdue`,s=`Moroso`,c=`#ef4444`,l=`rgba(239,68,68,0.15)`):(o=`warning`,s=`Pendiente`,c=`#fbbf24`,l=`rgba(251,191,36,0.15)`)}let u=m.find(t=>t.id===e.membership_plan_id);return{profile:e,lastPayment:i,coverageMonth:i?.coverage_month||`—`,status:o,statusLabel:s,statusColor:c,statusBg:l,planName:u?.name||`Sin plan`,planPrice:u?.price||0}}),a=i;b!==`all`&&(a=i.filter(e=>e.status===b));let o={ok:0,warning:0,overdue:0,none:0};i.forEach(e=>o[e.status]++);let s=i.length,c=s>0?(o.ok/s*100).toFixed(0):0;e.innerHTML=`
        <!-- KPIs Cobranza -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px;">
                <span style="font-size:1.2rem; font-weight:900; color:white;">${s}</span>
                <span style="font-size:0.8rem; color:var(--text-gray);">alumnos activos</span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="cov-filter-btn btn-glass-small ${b===`all`?`active`:``}" data-filter="all" style="font-size:0.75rem; ${b===`all`?`background:rgba(255,255,255,0.1); color:white; border-color:white;`:``}">
                    Todos (${s})
                </button>
                <button class="cov-filter-btn btn-glass-small ${b===`ok`?`active`:``}" data-filter="ok" style="font-size:0.75rem; ${b===`ok`?`background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e;`:`color:#22c55e; border-color:rgba(34,197,94,0.3);`}">
                    🟢 Al día (${o.ok})
                </button>
                <button class="cov-filter-btn btn-glass-small ${b===`warning`?`active`:``}" data-filter="warning" style="font-size:0.75rem; ${b===`warning`?`background:rgba(251,191,36,0.2); color:#fbbf24; border-color:#fbbf24;`:`color:#fbbf24; border-color:rgba(251,191,36,0.3);`}">
                    🟡 Por vencer (${o.warning})
                </button>
                <button class="cov-filter-btn btn-glass-small ${b===`overdue`?`active`:``}" data-filter="overdue" style="font-size:0.75rem; ${b===`overdue`?`background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;`:`color:#ef4444; border-color:rgba(239,68,68,0.3);`}">
                    🔴 Morosos (${o.overdue})
                </button>
                <button class="cov-filter-btn btn-glass-small ${b===`none`?`active`:``}" data-filter="none" style="font-size:0.75rem; ${b===`none`?`background:rgba(156,163,175,0.2); color:#9ca3af; border-color:#9ca3af;`:`color:#9ca3af; border-color:rgba(156,163,175,0.3);`}">
                    ⚪ Sin registro (${o.none})
                </button>
            </div>
            <div style="min-width:150px; text-align:right;">
                <div style="font-size:0.75rem; color:var(--text-gray); margin-bottom:4px;">Cobertura ${w(n)} ${r}</div>
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                    <div style="width:${c}%; height:100%; background:linear-gradient(90deg, #22c55e, #4ade80); border-radius:4px;"></div>
                </div>
                <div style="font-size:0.75rem; color:#22c55e; font-weight:700; margin-top:2px;">${c}% al día</div>
            </div>
        </div>

        <!-- Lista -->
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${a.length===0?`<p style="opacity:0.5; font-size:0.85rem; padding:20px; text-align:center;">No hay alumnos en esta categoría.</p>`:a.map(e=>{let n=e.profile,r=n.membership_expiry?Math.ceil((new Date(n.membership_expiry)-t)/(1e3*60*60*24)):null;return`
                    <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid ${e.statusColor};">
                        <div style="width:36px; height:36px; border-radius:50%; background:${e.statusBg}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <i data-lucide="user" style="width:16px; color:${e.statusColor};"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <strong style="font-size:0.9rem;">${n.full_name||`Sin nombre`}</strong>
                                <span class="tag" style="background:${e.statusBg}; color:${e.statusColor}; font-size:0.65rem; padding:2px 8px; font-weight:700;">${e.statusLabel}</span>
                                <span class="tag" style="background:rgba(255,255,255,0.05); font-size:0.65rem; padding:2px 8px;">${e.planName}</span>
                            </div>
                            <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:2px;">
                                ${n.email||``}
                                ${r===null?``:` • Vence: ${r>0?r+` días`:`Expirado`}`}
                            </span>
                        </div>
                        <div style="text-align:right; flex-shrink:0; min-width:120px;">
                            <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Último pago</span>
                            <strong style="font-size:0.85rem; color:white;">${e.lastPayment?S(parseFloat(e.lastPayment.amount)||0):`—`}</strong>
                            <span style="font-size:0.65rem; color:var(--text-gray); display:block;">${e.coverageMonth}</span>
                        </div>
                        <div style="flex-shrink:0;">
                            <button class="btn-register-payment btn-glass-small" data-uid="${n.id}" style="border-color:var(--accent-purple); color:var(--accent-purple);">
                                <i data-lucide="dollar-sign" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Registrar
                            </button>
                        </div>
                    </div>
                `}).join(``)}
        </div>
    `,window.lucide&&window.lucide.createIcons(),e.querySelectorAll(`.cov-filter-btn`).forEach(e=>{e.onclick=()=>{b=e.getAttribute(`data-filter`),D()}}),e.querySelectorAll(`.btn-register-payment`).forEach(e=>{e.onclick=()=>A(e.getAttribute(`data-uid`))})},A=e=>{let t=p.find(t=>t.id===e),n=m.find(e=>e.id===t?.membership_plan_id),r=n?.price||``,i=n?.name||`Membresía`,a=new Date,o=w(a.getMonth()),s=a.getFullYear(),c=document.createElement(`div`);c.className=`glass-container`,c.style.cssText=`
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; padding: 20px; transition: opacity 0.3s ease;
    `,c.innerHTML=`
        <div class="glass-premium" style="max-width:420px; width:100%; padding:30px; border-radius:24px; animation: slideUp 0.3s ease; box-shadow: 0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0; font-size:1.2rem; display:flex; align-items:center; gap:10px;">
                    <i data-lucide="dollar-sign" style="color:var(--accent-purple);"></i> Registrar Pago
                </h3>
                <button class="close-quick-modal" style="background:none; border:none; color:white; opacity:0.5; cursor:pointer;"><i data-lucide="x"></i></button>
            </div>
            <p style="font-size:0.9rem; opacity:0.7; margin-bottom:20px;">Alumno: <strong>${t?.full_name||`Sin nombre`}</strong></p>

            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Monto ($)</label>
                <input type="number" id="qp-amount" value="${r}" class="login-input" style="width:100%; padding:12px 15px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Concepto</label>
                <input type="text" id="qp-concept" value="${i}" class="login-input" style="width:100%; padding:12px 15px;">
            </div>
            <div style="display:flex; gap:15px; margin-bottom:25px;">
                <div style="flex:2;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Mes de Cobertura</label>
                    <select id="qp-month" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                        ${[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`].map(e=>`<option value="${e}" ${e===o?`selected`:``} style="background:#111; color:white;">${e}</option>`).join(``)}
                    </select>
                </div>
                <div style="flex:1;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Año</label>
                    <select id="qp-year" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                        ${[s-1,s,s+1].map(e=>`<option value="${e}" ${e===s?`selected`:``} style="background:#111; color:white;">${e}</option>`).join(``)}
                    </select>
                </div>
            </div>
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button class="btn-glass close-quick-modal" style="padding:10px 20px;">Cancelar</button>
                <button id="qp-save-btn" class="btn-primary" style="padding:10px 25px; display:flex; align-items:center; gap:8px;">
                    Guardar <i data-lucide="check" style="width:16px; height:16px;"></i>
                </button>
            </div>
        </div>
    `,document.body.appendChild(c),window.lucide&&window.lucide.createIcons();let l=()=>{c.style.opacity=`0`,setTimeout(()=>c.remove(),300)};c.querySelectorAll(`.close-quick-modal`).forEach(e=>{e.onclick=l}),document.getElementById(`qp-save-btn`).onclick=async()=>{let t=parseFloat(document.getElementById(`qp-amount`).value),n=document.getElementById(`qp-concept`).value.trim(),r=document.getElementById(`qp-month`).value,i=document.getElementById(`qp-year`).value;if(!t||t<=0){window.showToast(`Ingresa un monto válido`,`#ef4444`);return}try{window.showToast(`Registrando pago...`);let{error:a}=await window.supabase.from(`payments`).insert({user_id:e,amount:t,concept:n,status:`approved`,payment_method:`manual`,coverage_month:`${r} ${i}`,created_at:new Date().toISOString()});if(a)throw a;let o=new Date;o.setDate(o.getDate()+30),await window.supabase.from(`profiles`).update({membership_status:`active`,membership_expiry:o.toISOString(),is_frozen:!1}).eq(`id`,e),window.showToast(`Pago registrado ✅`,`#22c55e`),l(),await E(),D()}catch(e){console.error(e),window.showToast(`Error al registrar pago`,`#ef4444`)}}},j=[],ae=[],M=`dashboard`,N={search:``,status:[],plan:``,minDaysLeft:``,maxDaysLeft:``,minLastAttendance:``},P={field:`full_name`,dir:`asc`},F=1,I=25,L=`all`,R=`all`,oe=()=>document.getElementById(`admin-content-area`),se=e=>e?new Date(e).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,ce=e=>[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][e]||``,le=async()=>{try{let e=await window.supabase.from(`profiles`).select(`*`),t=await window.supabase.from(`reservations`).select(`*`),n=await window.supabase.from(`membership_plans`).select(`*`),r=await window.supabase.from(`payments`).select(`*`);j=e.data||[],ae=t.data||[],n.data,r.data}catch(e){console.error(`[Members] Error fetching data:`,e),window.showToast&&window.showToast(`Error cargando datos de socios`,`#ef4444`)}},z=async()=>{let e=oe(),t=document.getElementById(`admin-revenue-section`);t&&t.classList.add(`hidden`),e.innerHTML=`
        <div class="glass-premium p-20">
            <div class="p-20 text-center">
                <i data-lucide="loader" class="spin"></i>
                <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">Cargando control de socios...</p>
            </div>
        </div>`,window.lucide&&window.lucide.createIcons(),await le(),B()},B=()=>{let e=oe();if(!e)return;e.innerHTML=`
        <div class="glass-premium p-20" id="members-dashboard">
            <div class="header-split mb-20" style="align-items:flex-start;">
                <div>
                    <h3 style="font-size:1.3rem; margin-bottom:4px;">👥 Control de Socios</h3>
                    <p class="subtitle">Gestión integral de membresías, retención y comunicaciones</p>
                </div>
                <button class="btn-action-glow" id="btn-add-member-admin" style="width: 32px; height: 32px;"><i data-lucide="user-plus" style="width: 16px;"></i></button>
            </div>

            <!-- Tabs -->
            <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; flex-wrap:wrap;">
                <button id="tab-dashboard" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${M===`dashboard`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="layout-dashboard" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Dashboard
                </button>
                <button id="tab-directorio" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${M===`directorio`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="users" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Directorio
                </button>
                <button id="tab-retencion" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${M===`retencion`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="heart-pulse" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Retención
                </button>
                <button id="tab-comunicaciones" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${M===`comunicaciones`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="message-square" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Comunicaciones
                </button>
            </div>

            <!-- Content area -->
            <div id="members-view-content"></div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),document.getElementById(`tab-dashboard`).onclick=()=>{M=`dashboard`,B()},document.getElementById(`tab-directorio`).onclick=()=>{M=`directorio`,B()},document.getElementById(`tab-retencion`).onclick=()=>{M=`retencion`,B()},document.getElementById(`tab-comunicaciones`).onclick=()=>{M=`comunicaciones`,B()},document.getElementById(`btn-add-member-admin`).onclick=()=>je();let t=document.getElementById(`members-view-content`);M===`dashboard`?ue(t):M===`directorio`?pe(t):M===`retencion`?he(t):ge(t)},ue=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=j.map(e=>_e(e,t,n,r)),a=i.length,o=i.filter(e=>e._status===`Activo`).length;i.filter(e=>e._status===`Inactivo`).length;let s=i.filter(e=>e._status===`Moroso`).length,c=i.filter(e=>e._status===`Congelado`).length,l=i.filter(e=>{let t=e.created_at?new Date(e.created_at):null;return t&&t.getMonth()===n&&t.getFullYear()===r}).length,u=i.filter(e=>e._status===`Activo`&&e._daysLeft!==null&&e._daysLeft>0&&e._daysLeft<=5).slice(0,5),d=i.filter(e=>e._status===`Activo`&&e._daysSinceLastAttendance>14&&e._daysSinceLastAttendance!==-1).slice(0,5),f=i.filter(e=>e._status===`Moroso`).slice(0,5),p=[];for(let e=5;e>=0;e--){let t=new Date(r,n-e,1),a=t.getMonth(),o=t.getFullYear(),s=i.filter(e=>{let t=e.created_at?new Date(e.created_at):null;return t&&t.getMonth()===a&&t.getFullYear()===o}).length;p.push({label:ce(a).substring(0,3),count:s})}let m={};i.forEach(e=>{let t=e.membership_plans?.name||`Sin Plan`;m[t]=(m[t]||0)+1}),e.innerHTML=`
        <!-- KPIs -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
            <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Total Socios</span>
                <strong style="font-size:1.5rem; color:var(--accent-purple); font-weight:900;">${a}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${l} nuevos este mes</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Activos</span>
                <strong style="font-size:1.5rem; color:#22c55e; font-weight:900;">${o}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${(o/a*100||0).toFixed(0)}% del total</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Congelados</span>
                <strong style="font-size:1.5rem; color:#3b82f6; font-weight:900;">${c}</strong>
            </div>
            <div class="stat-mini-premium ${s>0?`pulse-warning`:``}" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Morosos</span>
                <strong style="font-size:1.5rem; color:#ef4444; font-weight:900;">${s}</strong>
            </div>
        </div>

        <!-- Gráficos -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:25px;">
            <div style="background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:15px;">
                <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:12px;">📈 Nuevos Socios (6 meses)</h4>
                <div class="chart-container" style="min-height:180px;">
                    <canvas id="membersEvolutionChart"></canvas>
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:15px;">
                <h4 style="font-size:0.85rem; font-weight:700; margin-bottom:12px;">🥧 Distribución por Plan</h4>
                <div class="chart-container" style="min-height:180px;">
                    <canvas id="membersPlanChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Alertas críticas -->
        <div>
            <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-triangle" style="width:16px; color:#ef4444;"></i> Alertas Críticas
            </h4>
            ${u.length===0&&d.length===0&&f.length===0?`<p style="opacity:0.5; font-size:0.85rem; padding:15px;">🎉 No hay alertas críticas. Todo está bajo control.</p>`:`<div style="display:flex; flex-direction:column; gap:8px;">
                    ${u.map(e=>de(e,`expiring`)).join(``)}
                    ${d.map(e=>de(e,`noAttendance`)).join(``)}
                    ${f.map(e=>de(e,`overdue`)).join(``)}
                </div>`}
        </div>
    `,window.lucide&&window.lucide.createIcons(),fe(p,m),e.querySelectorAll(`.alert-action-renew`).forEach(e=>{e.onclick=()=>ve(e.getAttribute(`data-id`))}),e.querySelectorAll(`.alert-action-register`).forEach(e=>{e.onclick=()=>A(e.getAttribute(`data-uid`))}),e.querySelectorAll(`.alert-action-edit`).forEach(e=>{e.onclick=()=>je(e.getAttribute(`data-id`),j)})},de=(e,t)=>{let n={expiring:{icon:`clock`,color:`#fbbf24`,bg:`rgba(251,191,36,0.08)`,border:`rgba(251,191,36,0.2)`,text:`Vence en ${e._daysLeft} días`},noAttendance:{icon:`user-x`,color:`#f97316`,bg:`rgba(249,115,22,0.08)`,border:`rgba(249,115,22,0.2)`,text:`Sin asistir hace ${e._daysSinceLastAttendance} días`},overdue:{icon:`alert-circle`,color:`#ef4444`,bg:`rgba(239,68,68,0.08)`,border:`rgba(239,68,68,0.2)`,text:`Membresía vencida`}}[t];return`
        <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; background:${n.bg}; border-radius:10px; border:1px solid ${n.border};">
            <div style="width:36px; height:36px; border-radius:50%; background:${n.color}22; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i data-lucide="${n.icon}" style="width:16px; color:${n.color};"></i>
            </div>
            <div style="flex:1;">
                <strong style="font-size:0.9rem;">${e.full_name||`Sin nombre`}</strong>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${n.text} — ${e.membership_plans?.name||`Sin plan`}</span>
            </div>
            <div style="display:flex; gap:6px;">
                ${t===`expiring`||t===`overdue`?`<button class="alert-action-register btn-glass-small" data-uid="${e.id}" style="border-color:var(--accent-purple); color:var(--accent-purple); font-size:0.7rem;"><i data-lucide="dollar-sign" style="width:12px;"></i></button>`:``}
                <button class="alert-action-edit btn-glass-small" data-id="${e.id}" style="font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>
            </div>
        </div>
    `},fe=(e,t)=>{let n=document.getElementById(`membersEvolutionChart`);n&&(window._membersEvolutionChart&&window._membersEvolutionChart.destroy(),window._membersEvolutionChart=new Chart(n,{type:`line`,data:{labels:e.map(e=>e.label),datasets:[{label:`Nuevos`,data:e.map(e=>e.count),borderColor:`var(--accent-purple)`,backgroundColor:`rgba(139,92,246,0.15)`,fill:!0,tension:.4,borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:10}},grid:{display:!1}},y:{ticks:{color:`rgba(255,255,255,0.4)`,font:{size:10}},grid:{color:`rgba(255,255,255,0.06)`},beginAtZero:!0}}}}));let r=document.getElementById(`membersPlanChart`);if(r){window._membersPlanChart&&window._membersPlanChart.destroy();let e=Object.keys(t),n=Object.values(t);window._membersPlanChart=new Chart(r,{type:`doughnut`,data:{labels:e,datasets:[{data:n,backgroundColor:[`#8b5cf6`,`#22c55e`,`#3b82f6`,`#f97316`,`#ef4444`,`#fbbf24`],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:`right`,labels:{color:`rgba(255,255,255,0.7)`,font:{size:10},boxWidth:10}}}}})}},pe=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=j.map(e=>_e(e,t,n,r));if(N.search){let e=N.search.toLowerCase();i=i.filter(t=>(t.full_name||``).toLowerCase().includes(e)||(t.email||``).toLowerCase().includes(e)||(t.phone||``).toLowerCase().includes(e))}N.status.length>0&&(i=i.filter(e=>N.status.includes(e._status))),N.plan&&(i=i.filter(e=>(e.membership_plans?.name||``)===N.plan)),N.minDaysLeft!==``&&(i=i.filter(e=>e._daysLeft!==null&&e._daysLeft>=parseInt(N.minDaysLeft))),N.maxDaysLeft!==``&&(i=i.filter(e=>e._daysLeft!==null&&e._daysLeft<=parseInt(N.maxDaysLeft))),N.minLastAttendance!==``&&(i=i.filter(e=>e._daysSinceLastAttendance>=parseInt(N.minLastAttendance))),i.sort((e,t)=>{let n,r;switch(P.field){case`full_name`:n=e.full_name||``,r=t.full_name||``;break;case`status`:n=e._status,r=t._status;break;case`plan`:n=e.membership_plans?.name||``,r=t.membership_plans?.name||``;break;case`expiry`:n=e._expiryDate||0,r=t._expiryDate||0;break;case`lastAttendance`:n=e._lastAttendance||0,r=t._lastAttendance||0;break;case`level`:n=e.level||0,r=t.level||0;break;default:n=e.full_name||``,r=t.full_name||``}return P.dir===`asc`?n>r?1:-1:n<r?1:-1});let a=Math.max(1,Math.ceil(i.length/I));F=Math.min(F,a);let o=(F-1)*I,s=i.slice(o,o+I),c=[{val:`Activo`,label:`Activo`,color:`#22c55e`},{val:`Inactivo`,label:`Inactivo`,color:`#ef4444`},{val:`Moroso`,label:`Moroso`,color:`#f97316`},{val:`Congelado`,label:`Congelado`,color:`#3b82f6`}],l=[...new Set(j.map(e=>e.membership_plans?.name).filter(Boolean))];e.innerHTML=`
        <!-- Filtros -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <input type="text" id="dir-search" placeholder="🔍 Buscar nombre, email o teléfono..." value="${N.search}" style="flex:1; min-width:180px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 12px; border-radius:8px; font-size:0.8rem; outline:none;">

            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                ${c.map(e=>`
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.7rem; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; border:1px solid ${N.status.includes(e.val)?e.color:`rgba(255,255,255,0.1)`};">
                        <input type="checkbox" class="dir-status-check" value="${e.val}" ${N.status.includes(e.val)?`checked`:``} style="accent-color:${e.color};">
                        <span style="color:${N.status.includes(e.val)?e.color:`var(--text-gray)`};">${e.label}</span>
                    </label>
                `).join(``)}
            </div>

            <select id="dir-plan" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todos los planes</option>
                ${l.map(e=>`<option value="${e}" ${N.plan===e?`selected`:``}>${e}</option>`).join(``)}
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="dir-min-days" placeholder="Min días" value="${N.minDaysLeft}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <span style="opacity:0.5; font-size:0.75rem;">-</span>
                <input type="number" id="dir-max-days" placeholder="Max días" value="${N.maxDaysLeft}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
            </div>

            <input type="number" id="dir-min-attendance" placeholder="Sin asistir ≥ días" value="${N.minLastAttendance}" style="width:120px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">

            <button id="dir-clear-filters" class="btn-glass-small" style="font-size:0.7rem;"><i data-lucide="x" style="width:12px;"></i> Limpiar</button>
        </div>

        <!-- Totales -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.8rem; color:var(--text-gray);">Mostrando <strong style="color:white;">${i.length}</strong> socios</span>
            <div style="display:flex; gap:8px; align-items:center;">
                <select id="dir-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="csv">CSV</option>
                    <option value="xls">XLS</option>
                    <option value="pdf">PDF</option>
                </select>
                <button id="dir-export-btn" class="btn-primary" style="padding:6px 14px; font-size:0.75rem; border-radius:8px;"><i data-lucide="download" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Exportar</button>
            </div>
        </div>

        <!-- Tabla -->
        <div style="overflow-x:auto; border:1px solid rgba(255,255,255,0.06); border-radius:12px; margin-bottom:15px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                <thead>
                    <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="full_name">Socio ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="plan">Plan ↕</th>
                        <th style="padding:10px 12px; text-align:center; cursor:pointer; white-space:nowrap;" data-sort="status">Estado ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="expiry">Vencimiento ↕</th>
                        <th style="padding:10px 12px; text-align:left; cursor:pointer; white-space:nowrap;" data-sort="lastAttendance">Última Asistencia ↕</th>
                        <th style="padding:10px 12px; text-align:center; cursor:pointer; white-space:nowrap;" data-sort="level">Nivel ↕</th>
                        <th style="padding:10px 12px; text-align:right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${s.length===0?`<tr><td colspan="7" style="padding:30px; text-align:center; opacity:0.5;">No hay socios que coincidan con los filtros.</td></tr>`:s.map(e=>{let t=e._statusColor,n=e._statusBg;return`
                                <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                    <td style="padding:10px 12px;">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <img src="${e.photo_url||`/assets/unknow-BC4RhdqH.png`}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">
                                            <div>
                                                <strong style="font-size:0.85rem;">${e.full_name||`Sin nombre`}</strong>
                                                <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${e.email||``}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding:10px 12px;">${e.membership_plans?.name||`Sin Plan`}</td>
                                    <td style="padding:10px 12px; text-align:center;">
                                        <span style="font-size:0.7rem; background:${n}; color:${t}; padding:3px 10px; border-radius:20px; font-weight:700;">${e._status}</span>
                                    </td>
                                    <td style="padding:10px 12px; white-space:nowrap;">
                                        ${e._expiryDate?se(e._expiryDate.toISOString()):`—`}
                                        ${e._daysLeft===null?``:`<span style="font-size:0.7rem; color:${e._daysLeft<=5?`#ef4444`:`var(--text-gray)`}; display:block;">${e._daysLeft>0?e._daysLeft+` días`:`Expirado`}</span>`}
                                    </td>
                                    <td style="padding:10px 12px; white-space:nowrap;">
                                        ${e._lastAttendance?se(e._lastAttendance.toISOString()):`Nunca`}
                                        ${e._daysSinceLastAttendance>0?`<span style="font-size:0.7rem; color:var(--text-gray); display:block;">hace ${e._daysSinceLastAttendance} días</span>`:``}
                                    </td>
                                    <td style="padding:10px 12px; text-align:center;">LVL ${e.level||0}</td>
                                    <td style="padding:10px 12px; text-align:right; white-space:nowrap;">
                                        <button class="dir-edit-btn btn-glass-small" data-id="${e.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>
                                        <button class="dir-renew-btn btn-glass-small" data-id="${e.id}" style="border-color:#22c55e; color:#22c55e; padding:3px 8px; font-size:0.7rem;"><i data-lucide="refresh-cw" style="width:12px;"></i></button>
                                        <button class="dir-delete-btn btn-glass-small delete" data-id="${e.id}" style="padding:3px 8px; font-size:0.7rem;"><i data-lucide="trash-2" style="width:12px;"></i></button>
                                    </td>
                                </tr>
                            `}).join(``)}
                </tbody>
            </table>
        </div>

        <!-- Paginación -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; gap:8px; align-items:center;">
                <span style="font-size:0.75rem; color:var(--text-gray);">Filas:</span>
                <select id="dir-per-page" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:5px 8px; border-radius:6px; font-size:0.75rem; outline:none;">
                    <option value="25" ${I===25?`selected`:``}>25</option>
                    <option value="50" ${I===50?`selected`:``}>50</option>
                    <option value="100" ${I===100?`selected`:``}>100</option>
                </select>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button id="dir-prev-page" class="btn-glass-small" ${F<=1?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-left" style="width:14px;"></i></button>
                <span style="font-size:0.8rem;">Página <strong>${F}</strong> de ${a}</span>
                <button id="dir-next-page" class="btn-glass-small" ${F>=a?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-right" style="width:14px;"></i></button>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),me(e,i)},me=(e,t)=>{let n=e.querySelector(`#dir-search`);if(n){let e;n.oninput=()=>{clearTimeout(e),e=setTimeout(()=>{N.search=n.value,F=1,B()},300)}}e.querySelectorAll(`.dir-status-check`).forEach(t=>{t.onchange=()=>{let t=Array.from(e.querySelectorAll(`.dir-status-check:checked`)).map(e=>e.value);N.status=t,F=1,B()}});let r=e.querySelector(`#dir-plan`);r&&(r.onchange=()=>{N.plan=r.value,F=1,B()});let i=e.querySelector(`#dir-min-days`),a=e.querySelector(`#dir-max-days`);i&&(i.onchange=()=>{N.minDaysLeft=i.value,F=1,B()}),a&&(a.onchange=()=>{N.maxDaysLeft=a.value,F=1,B()});let o=e.querySelector(`#dir-min-attendance`);o&&(o.onchange=()=>{N.minLastAttendance=o.value,F=1,B()});let c=e.querySelector(`#dir-clear-filters`);c&&(c.onclick=()=>{N={search:``,status:[],plan:``,minDaysLeft:``,maxDaysLeft:``,minLastAttendance:``},F=1,B()}),e.querySelectorAll(`th[data-sort]`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-sort`);P.field===t?P.dir=P.dir===`asc`?`desc`:`asc`:(P.field=t,P.dir=`asc`),B()}});let l=e.querySelector(`#dir-prev-page`),u=e.querySelector(`#dir-next-page`),d=e.querySelector(`#dir-per-page`);l&&(l.onclick=()=>{F>1&&(F--,B())}),u&&(u.onclick=()=>{F++,B()}),d&&(d.onchange=()=>{I=parseInt(d.value),F=1,B()}),e.querySelectorAll(`.dir-edit-btn`).forEach(e=>{e.onclick=()=>je(e.getAttribute(`data-id`),j)}),e.querySelectorAll(`.dir-renew-btn`).forEach(e=>{e.onclick=()=>ve(e.getAttribute(`data-id`))}),e.querySelectorAll(`.dir-delete-btn`).forEach(e=>{e.onclick=()=>Ne(e.getAttribute(`data-id`))});let f=e.querySelector(`#dir-export-btn`);f&&(f.onclick=()=>{let n=e.querySelector(`#dir-export-format`)?.value||`csv`;s(t,n),window.showToast&&window.showToast(`Exportado (${n.toUpperCase()}) ✅`,`#22c55e`)})},he=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=j.map(e=>_e(e,t,n,r)).map(e=>{let n=0;return e._status===`Inactivo`&&(n+=80),e._status===`Moroso`&&(n+=60),e._daysSinceLastAttendance>30?n+=40:e._daysSinceLastAttendance>14?n+=25:e._daysSinceLastAttendance>7&&(n+=10),e._daysLeft!==null&&e._daysLeft<=5&&e._daysLeft>0&&(n+=30),e._monthRes<=1&&t.getDate()>15&&(n+=15),e._status===`Congelado`&&(n+=20),{...e,_churnScore:Math.min(100,n)}}),a=i;L===`high`?a=i.filter(e=>e._churnScore>=60):L===`medium`?a=i.filter(e=>e._churnScore>=30&&e._churnScore<60):L===`low`?a=i.filter(e=>e._churnScore>0&&e._churnScore<30):L===`inactive`&&(a=i.filter(e=>e._status===`Inactivo`)),a.sort((e,t)=>t._churnScore-e._churnScore);let o={high:0,medium:0,low:0,inactive:0};i.forEach(e=>{e._status===`Inactivo`?o.inactive++:e._churnScore>=60?o.high++:e._churnScore>=30?o.medium++:e._churnScore>0&&o.low++}),e.innerHTML=`
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px;">
                <span style="font-size:1.2rem; font-weight:900; color:white;">${i.length}</span>
                <span style="font-size:0.8rem; color:var(--text-gray);">socios evaluados</span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="risk-filter-btn btn-glass-small ${L===`all`?`active`:``}" data-filter="all" style="font-size:0.75rem; ${L===`all`?`background:rgba(255,255,255,0.1); color:white; border-color:white;`:``}">
                    Todos
                </button>
                <button class="risk-filter-btn btn-glass-small ${L===`high`?`active`:``}" data-filter="high" style="font-size:0.75rem; ${L===`high`?`background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;`:`color:#ef4444; border-color:rgba(239,68,68,0.3);`}">
                    🔴 Alto riesgo (${o.high})
                </button>
                <button class="risk-filter-btn btn-glass-small ${L===`medium`?`active`:``}" data-filter="medium" style="font-size:0.75rem; ${L===`medium`?`background:rgba(251,191,36,0.2); color:#fbbf24; border-color:#fbbf24;`:`color:#fbbf24; border-color:rgba(251,191,36,0.3);`}">
                    🟡 Medio riesgo (${o.medium})
                </button>
                <button class="risk-filter-btn btn-glass-small ${L===`low`?`active`:``}" data-filter="low" style="font-size:0.75rem; ${L===`low`?`background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e;`:`color:#22c55e; border-color:rgba(34,197,94,0.3);`}">
                    🟢 Bajo riesgo (${o.low})
                </button>
                <button class="risk-filter-btn btn-glass-small ${L===`inactive`?`active`:``}" data-filter="inactive" style="font-size:0.75rem; ${L===`inactive`?`background:rgba(156,163,175,0.2); color:#9ca3af; border-color:#9ca3af;`:`color:#9ca3af; border-color:rgba(156,163,175,0.3);`}">
                    ⚪ Inactivos (${o.inactive})
                </button>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
            ${a.length===0?`<p style="opacity:0.5; font-size:0.85rem; padding:20px; text-align:center;">No hay socios en esta categoría.</p>`:a.map(e=>{let n=e._churnScore,r=n>=60?`#ef4444`:n>=30?`#fbbf24`:`#22c55e`,i=n>=60?`rgba(239,68,68,0.15)`:n>=30?`rgba(251,191,36,0.15)`:`rgba(34,197,94,0.15)`,a=[];return e._daysSinceLastAttendance>14&&a.push(`Sin asistir ${e._daysSinceLastAttendance} días`),e._daysLeft!==null&&e._daysLeft<=5&&e._daysLeft>0&&a.push(`Vence en ${e._daysLeft} días`),e._monthRes<=1&&t.getDate()>15&&a.push(`Baja frecuencia`),e._status===`Congelado`&&a.push(`Membresía congelada`),e._status===`Moroso`&&a.push(`Membresía vencida`),e._status===`Inactivo`&&a.push(`Inactivo`),`
                        <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid ${r};">
                            <div style="width:44px; height:44px; border-radius:50%; background:${i}; display:flex; align-items:center; justify-content:center; flex-shrink:0; flex-direction:column;">
                                <span style="font-size:0.7rem; font-weight:800; color:${r};">${n}</span>
                                <span style="font-size:0.5rem; color:${r}; opacity:0.7;">Riesgo</span>
                            </div>
                            <div style="flex:1; min-width:0;">
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <strong style="font-size:0.9rem;">${e.full_name||`Sin nombre`}</strong>
                                    <span class="tag" style="background:${e._statusBg}; color:${e._statusColor}; font-size:0.65rem; padding:2px 8px; font-weight:700;">${e._status}</span>
                                    <span class="tag" style="background:rgba(255,255,255,0.05); font-size:0.65rem; padding:2px 8px;">${e.membership_plans?.name||`Sin plan`}</span>
                                </div>
                                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:2px;">
                                    ${a.join(` • `)}
                                </span>
                            </div>
                            <div style="flex-shrink:0; display:flex; gap:6px;">
                                <button class="risk-action-edit btn-glass-small" data-id="${e.id}" style="font-size:0.7rem;"><i data-lucide="edit-2" style="width:12px;"></i></button>
                                ${e._status===`Inactivo`?``:`<button class="risk-action-register btn-glass-small" data-uid="${e.id}" style="border-color:var(--accent-purple); color:var(--accent-purple); font-size:0.7rem;"><i data-lucide="dollar-sign" style="width:12px;"></i></button>`}
                            </div>
                        </div>
                    `}).join(``)}
        </div>
    `,window.lucide&&window.lucide.createIcons(),e.querySelectorAll(`.risk-filter-btn`).forEach(e=>{e.onclick=()=>{L=e.getAttribute(`data-filter`),B()}}),e.querySelectorAll(`.risk-action-edit`).forEach(e=>{e.onclick=()=>je(e.getAttribute(`data-id`),j)}),e.querySelectorAll(`.risk-action-register`).forEach(e=>{e.onclick=()=>A(e.getAttribute(`data-uid`))})},ge=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=j.map(e=>_e(e,t,n,r)),a=i;R!==`all`&&(a=i.filter(e=>R===`active`?e._status===`Activo`:R===`inactive`?e._status===`Inactivo`:R===`moroso`?e._status===`Moroso`:R===`expiring`?e._status===`Activo`&&e._daysLeft!==null&&e._daysLeft>0&&e._daysLeft<=7:R===`noAttendance`?e._status===`Activo`&&e._daysSinceLastAttendance>14:!0)),[...new Set(j.map(e=>e.membership_plans?.name).filter(Boolean))],e.innerHTML=`
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div>
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">🎯 Segmento</h4>
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
                    <button class="comm-segment-btn btn-glass ${R===`all`?`active`:``}" data-segment="all" style="text-align:left; ${R===`all`?`background:var(--accent-purple); color:white; border-color:var(--accent-purple);`:``}">
                        <strong>Todos los socios</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${R===`active`?`active`:``}" data-segment="active" style="text-align:left; ${R===`active`?`background:#22c55e; color:white; border-color:#22c55e;`:``}">
                        <strong>Socios Activos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Activo`).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${R===`moroso`?`active`:``}" data-segment="moroso" style="text-align:left; ${R===`moroso`?`background:#f97316; color:white; border-color:#f97316;`:``}">
                        <strong>Socios Morosos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Moroso`).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${R===`expiring`?`active`:``}" data-segment="expiring" style="text-align:left; ${R===`expiring`?`background:#fbbf24; color:white; border-color:#fbbf24;`:``}">
                        <strong>Por vencer esta semana</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Activo`&&e._daysLeft!==null&&e._daysLeft>0&&e._daysLeft<=7).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${R===`noAttendance`?`active`:``}" data-segment="noAttendance" style="text-align:left; ${R===`noAttendance`?`background:#ef4444; color:white; border-color:#ef4444;`:``}">
                        <strong>Sin asistir >14 días</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Activo`&&e._daysSinceLastAttendance>14).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${R===`inactive`?`active`:``}" data-segment="inactive" style="text-align:left; ${R===`inactive`?`background:#9ca3af; color:white; border-color:#9ca3af;`:``}">
                        <strong>Socios Inactivos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Inactivo`).length} contactos</span>
                    </button>
                </div>

                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">📝 Mensaje</h4>
                <select id="comm-template" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:10px; border-radius:8px; font-size:0.8rem; margin-bottom:10px; outline:none;">
                    <option value="">Escribir mensaje personalizado...</option>
                    <option value="payment_reminder">📌 Recordatorio de pago</option>
                    <option value="expiry_reminder">⏰ Membresía por vencer</option>
                    <option value="comeback">💪 Te extrañamos en el gimnasio</option>
                    <option value="promo">🎉 Promoción especial</option>
                    <option value="class_cancel">🚫 Clase cancelada</option>
                </select>
                <textarea id="comm-message" rows="6" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:12px; border-radius:8px; font-size:0.85rem; outline:none; resize:vertical;" placeholder="Escribe tu mensaje aquí..."></textarea>
                <button id="btn-send-comm" class="btn-primary w-full mt-10" style="padding:12px;">
                    <i data-lucide="send" style="width:16px; vertical-align:middle; margin-right:6px;"></i> Enviar a ${a.length} socios
                </button>
            </div>

            <div>
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">📋 Vista previa de destinatarios</h4>
                <div style="max-height:500px; overflow-y:auto; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px;">
                    ${a.length===0?`<p style="opacity:0.5; font-size:0.85rem; text-align:center; padding:20px;">Selecciona un segmento para ver destinatarios.</p>`:a.slice(0,50).map(e=>`
                            <div style="display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid rgba(255,255,255,0.03);">
                                <img src="${e.photo_url||`/assets/unknow-BC4RhdqH.png`}" style="width:28px; height:28px; border-radius:50%; object-fit:cover;">
                                <div style="flex:1; min-width:0;">
                                    <span style="font-size:0.8rem; font-weight:600;">${e.full_name||`Sin nombre`}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${e.email||``}</span>
                                </div>
                                <span class="tag" style="background:${e._statusBg}; color:${e._statusColor}; font-size:0.6rem; padding:1px 6px;">${e._status}</span>
                            </div>
                        `).join(``)}
                    ${a.length>50?`<p style="text-align:center; font-size:0.75rem; color:var(--text-gray); padding:10px;">...y ${a.length-50} más</p>`:``}
                </div>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),e.querySelectorAll(`.comm-segment-btn`).forEach(e=>{e.onclick=()=>{R=e.getAttribute(`data-segment`),B()}});let o=e.querySelector(`#comm-template`),s=e.querySelector(`#comm-message`),c={payment_reminder:`Hola {nombre},

Te recordamos que tu membresía está pendiente de pago. Mantén tu entrenamiento al día y no pierdas tu progreso.

¿Tienes dudas? Escríbenos.

Equipo Amaru 🥋`,expiry_reminder:`Hola {nombre},

Tu membresía vence pronto. Renueva ahora para seguir entrenando sin interrupciones.

Equipo Amaru 🥋`,comeback:`Hola {nombre},

Te extrañamos en el dojo. ¿Todo bien? Tu progreso te está esperando. Ven a retomar tu entrenamiento esta semana.

Equipo Amaru 🥋`,promo:`Hola {nombre},

¡Tenemos una promoción especial para ti! Aprovecha descuentos exclusivos en tu próxima renovación.

Consulta en recepción o responde este mensaje.

Equipo Amaru 🥋`,class_cancel:`Hola {nombre},

Te informamos que la clase de hoy ha sido cancelada. Disculpa las molestias.

Consulta el horario actualizado en la app.

Equipo Amaru 🥋`};o&&s&&(o.onchange=()=>{let e=c[o.value];e&&(s.value=e)});let l=e.querySelector(`#btn-send-comm`);l&&(l.onclick=()=>{if(!s?.value?.trim()){window.showToast(`Escribe un mensaje antes de enviar`,`#ef4444`);return}window.showToast(`Mensaje preparado para ${a.length} socios. (Integrar con servicio de envío)`,`#22c55e`)})},_e=(e,t,n,r)=>{let i=e.membership_expiry?new Date(e.membership_expiry):null,a=i?i-t:null,o=i?Math.ceil(a/(1e3*60*60*24)):null,s=ae.filter(t=>t.user_id===e.id);s.sort((e,t)=>new Date(t.reservation_date)-new Date(e.reservation_date));let c=s.length>0?new Date(s[0].reservation_date):null,l=c?Math.floor((t-c)/(1e3*60*60*24)):-1,u=s.filter(e=>{let t=new Date(e.reservation_date);return t.getMonth()===n&&t.getFullYear()===r}).length,d=`Activo`,f=`#22c55e`,p=`rgba(34, 197, 94, 0.15)`;return e.is_frozen?(d=`Congelado`,f=`#3b82f6`,p=`rgba(59, 130, 246, 0.15)`):e.membership_status===`inactive`?(d=`Inactivo`,f=`#ef4444`,p=`rgba(239, 68, 68, 0.15)`):o!==null&&o<=0?o>-30?(d=`Moroso`,f=`#f97316`,p=`rgba(249, 115, 22, 0.15)`):(d=`Inactivo`,f=`#ef4444`,p=`rgba(239, 68, 68, 0.15)`):o===null&&e.membership_status!==`active`&&(d=`Inactivo`,f=`#ef4444`,p=`rgba(239, 68, 68, 0.15)`),{...e,_status:d,_statusColor:f,_statusBg:p,_expiryDate:i,_daysLeft:o,_lastAttendance:c,_daysSinceLastAttendance:l,_monthRes:u,_totalRes:s.length}},ve=async e=>{let t=j.find(t=>t.id===e);if(!t||!t.membership_plan_id){window.showToast(`El socio no tiene un plan asignado para renovar.`,`#ef4444`);return}if(confirm(`¿Renovar el plan de ${t.full_name} por 1 mes más?`))try{let t=new Date;t.setMonth(t.getMonth()+1),await window.supabase.from(`profiles`).update({membership_expiry:t.toISOString(),membership_status:`active`,is_frozen:!1}).eq(`id`,e),window.showToast(`Plan renovado exitosamente ✅`,`#22c55e`),z()}catch(e){console.error(e),window.showToast(`Error al renovar plan.`,`#ef4444`)}},V=window.Swal,H=[],U=()=>document.getElementById(`admin-content-area`),ye=async()=>{window.showToast(`Configurando clases... 🥋`);try{let e=await r.getClasses();U().innerHTML=`
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <h3>Gestión de Clases</h3>
                        <button class="btn-action-glow" id="btn-add-class-admin"><i data-lucide="plus"></i> Clase</button>
                    </div>
                    <div class="admin-list-container">
                        ${e.length===0?`<p class="opacity-50">Configura tu primera clase.</p>`:e.map(e=>`
                            <div class="admin-item-card glass">
                                <div>
                                    <strong style="display:block;">${e.name}</strong>
                                    <span style="font-size:0.8rem; opacity:0.6;">${e.days.join(`, `)} • ${e.time}</span>
                                </div>
                                <div class="item-actions">
                                    <button class="edit-class-btn btn-glass-small" data-id="${e.id}"><i data-lucide="edit-3"></i></button>
                                    <button class="delete-class-btn btn-glass-small delete" data-id="${e.id}"><i data-lucide="trash-2"></i></button>
                                </div>
                            </div>
                        `).join(``)}
                    </div>
                </div>
            `,window.lucide.createIcons(),document.getElementById(`btn-add-class-admin`).onclick=()=>ke(),document.querySelectorAll(`.edit-class-btn`).forEach(t=>{t.onclick=n=>{n.stopPropagation();let r=t.getAttribute(`data-id`);e.find(e=>e.id==r)?ke(r,e):window.showToast(`Clase no encontrada`,`#ef4444`)}}),document.querySelectorAll(`.delete-class-btn`).forEach(e=>{e.onclick=t=>{t.stopPropagation(),De(e.getAttribute(`data-id`))}})}catch(e){console.error(e)}},be=async(e,t)=>{try{let n=await r.getMembershipPlans(),i=n.findIndex(t=>t.id===e);if(i===-1)return;let a=t===`up`?i-1:i+1;if(a<0||a>=n.length)return;let o=n[i],s=n[a],c=o.sort_order;await r.updatePlanOrder(o.id,s.sort_order||a),await r.updatePlanOrder(s.id,c||i),window.showToast(`Orden actualizado 🔄`,`#8b5cf6`),xe()}catch(e){console.error(e),window.showToast(`Error al reordenar plan`,`#ef4444`)}},xe=async()=>{try{let e=await r.getMembershipPlans();U().innerHTML=`
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <div>
                            <h3>Planes de Membresía</h3>
                            <p class="subtitle">Ordena los planes a tu disposición</p>
                        </div>
                        <button class="btn-action-glow" id="btn-add-plan-admin"><i data-lucide="plus"></i> Plan</button>
                    </div>
                    <div class="admin-list-container">
                        ${e.map((t,n)=>`
                            <div class="admin-item-card glass" style="display:flex; align-items:center; gap:15px; padding: 15px;">
                                <div class="sort-actions" style="display:flex; flex-direction:column; gap:4px;">
                                    <button class="move-plan-btn btn-glass-small" data-id="${t.id}" data-dir="up" ${n===0?`disabled style="opacity:0.2;"`:``}>
                                        <i data-lucide="chevron-up"></i>
                                    </button>
                                    <button class="move-plan-btn btn-glass-small" data-id="${t.id}" data-dir="down" ${n===e.length-1?`disabled style="opacity:0.2;"`:``}>
                                        <i data-lucide="chevron-down"></i>
                                    </button>
                                </div>
                                <div style="flex:1;">
                                    <strong style="display:block; font-size:1.1rem;">${t.name}</strong>
                                    <span style="font-size:0.85rem; opacity:0.6; display:block; margin-top:2px;">$${Number(t.price).toLocaleString()} • ${t.monthly} cl/mes</span>
                                </div>
                                <div class="item-actions">
                                    <button class="edit-plan-btn btn-glass-small" data-id="${t.id}"><i data-lucide="edit-3"></i></button>
                                    <button class="delete-plan-btn btn-glass-small delete" data-id="${t.id}"><i data-lucide="trash-2"></i></button>
                                </div>
                            </div>
                        `).join(``)}
                    </div>
                </div>
            `,window.lucide.createIcons(),document.getElementById(`btn-add-plan-admin`).onclick=()=>Ae(),document.querySelectorAll(`.edit-plan-btn`).forEach(t=>{t.onclick=n=>{n.stopPropagation();let r=t.getAttribute(`data-id`);e.find(e=>e.id==r)?Ae(r,e):window.showToast(`Plan no encontrado`,`#ef4444`)}}),document.querySelectorAll(`.delete-plan-btn`).forEach(e=>{e.onclick=t=>{t.stopPropagation(),Oe(e.getAttribute(`data-id`))}}),document.querySelectorAll(`.move-plan-btn`).forEach(e=>{e.onclick=t=>{t.stopPropagation(),!e.disabled&&be(e.getAttribute(`data-id`),e.getAttribute(`data-dir`))}})}catch(e){console.error(e),window.showToast(`Error al cargar planes`,`#ef4444`)}},Se=async()=>{U().innerHTML=`<div class="glass-premium p-20"><div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando asistencia...</div></div>`,window.lucide.createIcons();try{let{data:e,error:t}=await window.supabase.from(`reservations`).select(`*, profiles(full_name, email)`).order(`reservation_date`,{ascending:!1}).limit(800);if(t)throw t;let n=t=>{let n=new Date,r=n.toISOString().split(`T`)[0],i=n.getDay(),a=[];if(t===`today`)a=e.filter(e=>e.reservation_date===r);else if(t===`week`){let t=new Date(n);t.setDate(t.getDate()-7),a=e.filter(e=>new Date(e.reservation_date)>=t)}else if(t===`month`){let t=new Date(n);t.setMonth(t.getMonth()-1),a=e.filter(e=>new Date(e.reservation_date)>=t)}else a=e;if(t===`today`)H=window.appState.classes.filter(e=>{let t=e.days;if(typeof t==`string`)try{t=JSON.parse(t)}catch(e){console.warn(`Caught empty error`,e)}return Array.isArray(t)&&t.includes(i)}).map(e=>{let t=a.filter(t=>t.class_id===e.id).map(e=>({name:e.profiles?.full_name||e.user_name||`Desconocido`,email:e.profiles?.email||``}));return{date:r,classId:e.id,className:e.name,classTime:e.time,classType:e.type,classTheme:e.theme,attendees:t}});else{let e={};a.forEach(t=>{let n=`${t.reservation_date}||${t.class_id}`;if(!e[n]){let r=window.appState.classes.find(e=>e.id===t.class_id)||{};e[n]={date:t.reservation_date,classId:t.class_id,className:t.class_name||r.name||`Clase`,classTime:t.class_time||r.time||``,classType:t.class_type||r.type||`-`,classTheme:r.theme||`smoke-purple`,attendees:[]}}e[n].attendees.push({name:t.profiles?.full_name||t.user_name||`Desconocido`,email:t.profiles?.email||``})}),H=Object.values(e).sort((e,t)=>t.date.localeCompare(e.date))}let o={totalSessions:H.length,totalReservations:a.length,uniqueSocio:new Set(a.map(e=>e.user_id)).size},s={Striking:`#ef4444`,BJJ:`#8b5cf6`,MMA:`#f97316`,"Funcional Fighter":`#22c55e`,"BJJ Gi":`#8b5cf6`,"No Gi":`#a855f7`},c=e=>{let t=e.trim().split(` `);return((t[0]?.[0]||``)+(t[1]?.[0]||``)).toUpperCase()},l=e=>{let t=new Date(e+`T12:00:00`);return e===r?`HOY`:t.toLocaleDateString(`es-ES`,{weekday:`short`,day:`2-digit`,month:`short`}).toUpperCase()},u=``;if(t===`month`&&a.length>0){let e={},t={},n=0,r=0,i=new Date;i.setDate(i.getDate()-7);let s=new Date;s.setDate(s.getDate()-14),a.forEach(a=>{let o=new Date(a.reservation_date);e[a.user_id]||(e[a.user_id]=0),e[a.user_id]++;let c=o.getDay();t[c]||(t[c]=0),t[c]++,o>=i?n++:o>=s&&o<i&&r++});let c=[`Domingo`,`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`][Object.keys(t).sort((e,n)=>t[n]-t[e])[0]],l=(o.totalReservations/Math.max(1,o.uniqueSocio)/4).toFixed(1),d=``;n<r*.8?d=`<div style="display:flex; gap:8px;"><i data-lucide="alert-triangle" style="color:#ef4444; width:16px;"></i> <span><strong>¡Alerta!</strong> La asistencia bajó un ${Math.round((1-n/r)*100)}% esta semana.</span></div>`:n>r*1.1&&(d=`<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px;"></i> <span><strong>¡Súper!</strong> La asistencia subió esta semana respecto a la anterior.</span></div>`),u=`
                        <div class="glass" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                            <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 5px; color: #3b82f6; font-size: 0.9rem;">
                                <i data-lucide="activity" style="width: 16px;"></i> Inteligencia de Asistencia
                            </h4>
                            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.5; display: flex; flex-direction: column; gap: 8px;">
                                <div style="display:flex; gap:8px;"><i data-lucide="calendar" style="color:#a855f7; width:16px;"></i> <span>El día más concurrido es el <strong>${c}</strong>.</span></div>
                                <div style="display:flex; gap:8px;"><i data-lucide="user-check" style="color:#fbbf24; width:16px;"></i> <span>Frecuencia promedio: <strong>${l} clases/sem</strong> por alumno activo.</span></div>
                                ${d}
                            </div>
                        </div>
                    `}let d=``,f=H.length===0?`<div style="text-align:center; padding:60px 0; opacity:0.3;">
                        <i data-lucide="calendar-off" style="width:50px; height:50px; margin-bottom:15px; display:block; margin-inline:auto;"></i>
                        <p>No se encontraron actividades registradas.</p>
                     </div>`:H.map((e,t)=>{let n=``;e.date!==d&&(d=e.date,n=`<div class="att-date-divider" style="font-size:0.65rem; color:var(--text-gray); font-weight:800; letter-spacing:1px; margin: 15px 0 10px;">${l(e.date)}</div>`);let r=s[e.classType]||`var(--accent-cyan)`,i=e.attendees.map(e=>`
                        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                            <div style="width:34px;height:34px;border-radius:10px;background:${r}11;border:1px solid ${r}22;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:${r};flex-shrink:0;">
                                ${c(e.name)}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:0.85rem; font-weight:600;">${e.name}</div>
                                <div style="font-size:0.7rem; opacity:0.4;">${e.email||`socio@amaru.app`}</div>
                            </div>
                            <div style="width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 10px #22c55e77;"></div>
                        </div>
                    `).join(``)||`<p style="font-size:0.75rem; opacity:0.4; text-align:center; padding:15px 0;">Nadie registrado todavía</p>`;return`
                        ${n}
                        <div class="att-panel-card" data-idx="${t}" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; margin-bottom:12px; transition:0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer; overflow:hidden;">
                            <div class="att-panel-header" style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px;">
                                <div style="display:flex; align-items:center; gap:15px; flex:1;">
                                    <div style="width:4px; height:35px; background:${r}; border-radius:4px;"></div>
                                    <div>
                                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                            <span style="font-size:0.65rem; font-weight:800; background:${r}22; color:${r}; padding:2px 8px; border-radius:20px; text-transform:uppercase;">${e.classType}</span>
                                            <span style="font-size:0.75rem; opacity:0.4;">${e.classTime}</span>
                                        </div>
                                        <h4 style="margin:0; font-size:1.05rem; font-weight:700;">${e.className}</h4>
                                    </div>
                                </div>
                                <div style="text-align:right;">
                                    <div style="font-size:1.4rem; font-weight:900; color:${r}; line-height:1;">${e.attendees.length}</div>
                                    <div style="font-size:0.6rem; opacity:0.4; text-transform:uppercase; letter-spacing:1px; margin-top:2px;">SOCIOS</div>
                                </div>
                                <i data-lucide="chevron-right" class="chevron-${t}" style="margin-left:15px; width:18px; opacity:0.2; transition:0.3s;"></i>
                            </div>
                            <div id="att-detail-${t}" style="display:none; padding: 0 20px 20px; border-top:1px solid rgba(255,255,255,0.03);">
                                <div style="margin-top:15px;">
                                    ${i}
                                </div>
                            </div>
                        </div>
                    `}).join(``);document.getElementById(`att-period-content`).innerHTML=`
                    ${u}
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:25px;">
                        <div class="stat-mini-premium" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.6rem; font-weight:900; color:var(--accent-purple);">${o.totalSessions}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SESIONES</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.6rem; font-weight:900; color:var(--accent-cyan);">${o.totalReservations}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">RESERVAS</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.6rem; font-weight:900; color:#22c55e;">${o.uniqueSocio}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SOCIOS</span>
                        </div>
                    </div>
                    ${f}
                `,window.lucide.createIcons(),document.querySelectorAll(`.att-panel-card`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-idx`),n=document.getElementById(`att-detail-${t}`),r=e.querySelector(`.chevron-${t}`),i=n.style.display===`block`;n.style.display=i?`none`:`block`,r&&(r.style.transform=i?`rotate(0deg)`:`rotate(90deg)`,r.style.opacity=i?`0.2`:`0.6`),e.style.background=i?`rgba(255,255,255,0.02)`:`rgba(255,255,255,0.05)`,e.style.borderColor=i?`rgba(255,255,255,0.06)`:`rgba(255,255,255,0.15)`}}),window._attExportData={reservations:a,groups:H,periodLabel:t}};U().innerHTML=`
                <div class="glass-premium p-20">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <div>
                            <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Control de Asistencia</h2>
                            <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${e.length} asistencias en historial</p>
                        </div>
                        <button id="btn-manual-attendance" class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; background: var(--accent-cyan); color: #000;">
                            <i data-lucide="plus-circle" style="width:16px; margin-right:5px; vertical-align:middle;"></i> Ingreso Manual
                        </button>
                    </div>

                    <div style="display:flex; gap:8px; margin-bottom:25px; background:rgba(255,255,255,0.03); padding:6px; border-radius:14px; width:fit-content;">
                        <button class="att-period-btn" data-period="today" style="border:none; background:var(--accent-purple); color:white; padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Hoy</button>
                        <button class="att-period-btn" data-period="week" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Semana</button>
                        <button class="att-period-btn" data-period="month" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Mes</button>
                        <button class="att-period-btn" data-period="all" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Todo</button>
                    </div>

                    <div id="att-period-content"></div>

                    <div style="margin-top:30px; display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:15px; padding:15px;">
                       <select id="att-export-format" style="flex:1; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px; font-weight:600; outline:none;">
                            <option value="csv" style="color:black">Formato CSV</option>
                            <option value="xls" style="color:black">Formato EXCEL</option>
                            <option value="pdf" style="color:black">Formato PDF</option>
                       </select>
                       <button id="btn-export-attendance" class="btn-primary" style="padding:10px 25px; font-weight:800;">
                            <i data-lucide="download" style="width:16px; margin-right:8px; vertical-align:middle;"></i> EXPORTAR
                       </button>
                    </div>
                </div>
            `;let i=document.getElementById(`btn-manual-attendance`);i&&(i.onclick=async()=>{try{let e=await r.getAllProfiles(),t=await r.getClasses(),n=e.map(e=>`<option value="${e.id}">${e.full_name||e.email}</option>`).join(``),i=t.map(e=>`<option value="${e.id}">${e.name} (${e.type})</option>`).join(``),{value:a}=await V.fire({title:`Ingreso Manual`,html:`
                                <div style="text-align: left; font-size: 0.9rem;">
                                    <label>Usuario</label>
                                    <select id="swal-manual-user" class="swal2-input" style="width: 100%; height: 40px; margin-bottom: 15px; background: rgba(0,0,0,0.1); color: white;">
                                        <option value="" disabled selected>Seleccionar Atleta</option>
                                        ${n}
                                    </select>
                                    <label>Clase</label>
                                    <select id="swal-manual-class" class="swal2-input" style="width: 100%; height: 40px; margin-bottom: 15px; background: rgba(0,0,0,0.1); color: white;">
                                        <option value="" disabled selected>Seleccionar Clase</option>
                                        ${i}
                                    </select>
                                    <label>Fecha</label>
                                    <input type="date" id="swal-manual-date" class="swal2-input" style="width: 100%; height: 40px; background: rgba(0,0,0,0.1); color: white;" value="${new Date().toISOString().split(`T`)[0]}">
                                </div>
                            `,focusConfirm:!1,showCancelButton:!0,confirmButtonText:`Registrar`,cancelButtonText:`Cancelar`,background:`#1f1f2e`,color:`#fff`,preConfirm:()=>{let e=document.getElementById(`swal-manual-user`).value,t=document.getElementById(`swal-manual-class`).value,n=document.getElementById(`swal-manual-class`).options[document.getElementById(`swal-manual-class`).selectedIndex]?.text,r=document.getElementById(`swal-manual-date`).value;return!e||!t||!r?(V.showValidationMessage(`Por favor completa todos los campos`),!1):{user:e,classId:t,className:n,date:r}}});a&&(V.fire({title:`Procesando...`,allowOutsideClick:!1,didOpen:()=>{V.showLoading();let e=V.getPopup().querySelector(`.swal2-loader`);e&&(e.style.borderColor=`var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent`)},background:`#1f1f2e`,color:`#fff`}),await r.createReservation(a.user,a.classId,a.className,a.date),window.showToast(`✅ Asistencia manual registrada con éxito`,`#22c55e`),Se())}catch(e){console.error(e),window.showToast(`Error al cargar datos para ingreso manual`,`#ef4444`)}}),window.lucide.createIcons(),n(`today`),document.querySelectorAll(`.att-period-btn`).forEach(e=>{e.onclick=e=>{document.querySelectorAll(`.att-period-btn`).forEach(e=>{e.style.background=`transparent`,e.style.color=`var(--text-gray)`}),e.target.style.background=`var(--accent-purple)`,e.target.style.color=`white`,n(e.target.getAttribute(`data-period`))}}),document.getElementById(`btn-export-attendance`).onclick=()=>{let e=document.getElementById(`att-export-format`).value,t=window._attExportData;if(!t||t.reservations.length===0)return window.showToast(`No hay datos para exportar`,`#ef4444`);let n=[`Fecha`,`Clase`,`Horario`,`Alumno`,`Email`],r=[];t.groups.forEach(e=>{e.attendees.forEach(t=>{r.push([e.date,e.className,e.classTime,t.name,t.email])})}),o(e,r,n,`Asistencia_${t.periodLabel}_Amaru`)}}catch(e){console.error(e),U().innerHTML=`<div class="glass-premium p-20"><p class="opacity-50">Error al cargar asistencia: ${e.message}</p></div>`}},Ce=async()=>{let e=document.getElementById(`admin-revenue-section`);e&&e.classList.add(`hidden`),window.showToast(`Cargando códigos de descuento...`);try{let{data:e,error:t}=await window.supabase.from(`discounts`).select(`*`).order(`created_at`,{ascending:!1});if(t)throw t;let n=e||[],{data:r}=await window.supabase.from(`profiles`).select(`id, full_name, active_promo`).not(`active_promo`,`is`,null),i=r||[],a=document.getElementById(`admin-content-area`);a.innerHTML=`
                <div class="glass-premium p-20">
                    <div class="header-split mb-20">
                        <h3>Códigos de Descuento</h3>
                        <p class="subtitle">Crear promociones y alianzas con influencers</p>
                    </div>

                    <div class="admin-form glass mb-20">
                        <input type="text" id="new-promo-code" placeholder="CÓDIGO (ej. AMOR20, INFLUENCERX)" class="input-glass" style="text-transform: uppercase;">
                        <input type="number" id="new-promo-perc" placeholder="% de Descuento (ej. 20)" class="input-glass mt-10" min="1" max="100">
                        <label class="mt-10 mb-5 text-sm opacity-70" style="display:block;">Fecha de expiración (opcional):</label>
                        <input type="date" id="new-promo-exp" class="input-glass" title="Fecha de expiración (opcional)">
                        
                        <label class="mt-10 mb-5 text-sm opacity-70" style="display:block;">Planes aplicables (opcional, si no se marca ninguno se aplica a todos):</label>
                        <div id="promo-plans-checkboxes" class="mt-5" style="display: flex; flex-direction: column; gap: 5px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            ${window.appState.plans.map(e=>`
                                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9em; cursor: pointer;">
                                    <input type="checkbox" class="promo-plan-checkbox" value="${e.id}">
                                    ${e.name}
                                </label>
                            `).join(``)}
                        </div>
                        <button class="btn-primary mt-10 w-full" id="btn-create-promo">Crear Código</button>
                    </div>

                    <h4>Códigos Activos</h4>
                    <div id="promo-list" class="admin-list-container mt-10">
                        ${n.length===0?`<p class="opacity-50">No hay códigos creados.</p>`:``}
                        ${n.map(e=>{let t=i.filter(t=>t.active_promo===e.code);return`
                            <div class="admin-item-card glass" style="flex-direction: column; align-items: stretch; padding: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <div>
                                        <strong style="font-size: 1.1em; color: var(--accent-purple); display: block;">${e.code}</strong>
                                        <span class="tag mt-5" style="background: rgba(34, 197, 94, 0.2); color: #22c55e; display: inline-block;">${e.percent}% Dcto</span>
                                        ${e.expiresAt?`<span class="tag mt-5 ml-5" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; display: inline-block;">Vence: ${new Date(e.expiresAt).toLocaleDateString()}</span>`:`<span class="tag mt-5 ml-5" style="background: rgba(156, 163, 175, 0.2); color: #9ca3af; display: inline-block;">Sin caducidad</span>`}
                                        ${e.plans&&e.plans.length>0?`<span class="tag mt-5 ml-5" style="background: rgba(147, 51, 234, 0.2); color: #c084fc; display: inline-block;">Planes: ${e.plans.map(e=>{let t=window.appState.plans.find(t=>t.id===e);return t?t.name:e}).join(`, `)}</span>`:`<span class="tag mt-5 ml-5" style="background: rgba(156, 163, 175, 0.2); color: #9ca3af; display: inline-block;">Todos los planes</span>`}
                                    </div>
                                    <button class="btn-glass btn-delete-promo" data-id="${e.id}" style="border-color: #ef4444; color: #ef4444; padding: 5px 10px;">Eliminar</button>
                                </div>
                                <div style="font-size: 0.9em; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                                    <strong>Usuarios usando este código: ${t.length}</strong>
                                    ${t.length>0?`
                                        <ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px;">
                                            ${t.map(e=>`<li>${e.full_name||`Usuario `+e.id.substring(0,5)}</li>`).join(``)}
                                        </ul>
                                    `:``}
                                </div>
                            </div>
                        `}).join(``)}
                    </div>
                </div>
            `,window.lucide.createIcons();let o=document.getElementById(`btn-create-promo`);o&&(o.onclick=async()=>{let e=document.getElementById(`new-promo-code`).value.trim().toUpperCase(),t=parseInt(document.getElementById(`new-promo-perc`).value),r=document.getElementById(`new-promo-exp`).value,i=document.querySelectorAll(`.promo-plan-checkbox:checked`),a=Array.from(i).map(e=>e.value);if(!e||isNaN(t)||t<=0||t>100)return window.showToast(`Código o porcentaje inválido`,`#ef4444`);if(n.find(t=>t.code===e))return window.showToast(`Ese código ya existe`,`#ef4444`);try{let n={code:e,percent:t,plans:a.length>0?a:null,expiresAt:r?new Date(r+`T23:59:59`).toISOString():null},{error:i}=await window.supabase.from(`discounts`).insert(n);if(i)throw i;window.showToast(`Código ${e} creado exitosamente`,`#22c55e`),Ce()}catch(e){console.error(e),window.showToast(`Error al crear código`,`#ef4444`)}}),document.querySelectorAll(`.btn-delete-promo`).forEach(e=>{e.onclick=async e=>{if(confirm(`¿Estás seguro de eliminar este código? (Los usuarios dejarán de tener el descuento)`))try{let{error:t}=await window.supabase.from(`discounts`).delete().eq(`id`,e.target.getAttribute(`data-id`));if(t)throw t;window.showToast(`Código eliminado`),Ce()}catch(e){console.error(e),window.showToast(`Error al eliminar`,`#ef4444`)}}})}catch(e){console.error(`Error loading discounts`,e),window.showToast(`Error cargando sección de descuentos`,`#ef4444`)}},we=()=>{let e=document.getElementById(`admin-revenue-section`);e&&e.classList.add(`hidden`);let t=document.getElementById(`admin-content-area`);t.innerHTML=`
            <div class="admin-header-flex">
                <h3>Avisos Globales</h3>
                <button id="btn-create-notification" class="btn-primary">NUEVO AVISO</button>
            </div>
            <div id="admin-notifications-list" class="mt-20 user-list">
                <div style="text-align: center; color: var(--text-gray); padding: 20px;">Cargando avisos...</div>
            </div>

            <!-- Modal Nuevo Aviso -->
            <div id="modal-notif" class="overlay">
                <div class="glass" style="max-width: 500px; padding: 30px; border-radius: 20px; width: 90%;">
                    <h3>Publicar Aviso Global</h3>
                    <div class="form-group mt-20">
                        <label>Título del Aviso</label>
                        <input type="text" id="notif-title" placeholder="Ej: Clase Especial de Seminario">
                    </div>
                    <div class="form-group mt-15">
                        <label>Tipo de Aviso</label>
                        <select id="notif-type" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                            <option value="info" style="color: black;">Aviso General</option>
                            <option value="calendar" style="color: black;">Recordatorio (Aniversario, Seminario, Competencia)</option>
                            <option value="alert" style="color: black;">Alerta Urgente</option>
                        </select>
                    </div>
                    <div class="form-group mt-15">
                        <label>Mensaje</label>
                        <textarea id="notif-message" rows="4" placeholder="Detalles importantes..." style="resize: vertical; min-height: 80px;"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 25px;">
                        <button id="btn-save-notif" class="btn-primary" style="flex:1;">PUBLICAR</button>
                        <button id="btn-close-notif" class="btn-secondary" style="flex:1;">CANCELAR</button>
                    </div>
                </div>
            </div>
        `,window.lucide.createIcons();let n=async()=>{try{let e=await r.getNotifications(),t=document.getElementById(`admin-notifications-list`);if(e.length===0){t.innerHTML=`<div style="text-align: center; color: var(--text-gray); padding: 20px;">No hay avisos globales activos.</div>`;return}t.innerHTML=e.map(e=>{let t=`var(--accent-cyan)`,n=`INFO`;return e.type===`alert`&&(t=`#ef4444`,n=`URGENTE`),e.type===`calendar`&&(t=`#f59e0b`,n=`FECHA IMPORTANTE`),`
                    <div class="user-card glass" style="display:flex; justify-content:space-between; align-items:center; border-left: 4px solid ${t};">
                        <div>
                            <h4>${e.title||``}</h4>
                            <p style="font-size:0.85rem; color:var(--text-gray); margin-top:5px;">${e.message}</p>
                            <span style="font-size:0.75rem; color:${t};"><strong>[${n}]</strong> ${new Date(e.created_at).toLocaleString()}</span>
                        </div>
                        <button class="btn-secondary btn-delete-notif" data-id="${e.id}" style="padding: 8px;">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `}).join(``),window.lucide.createIcons(),document.querySelectorAll(`.btn-delete-notif`).forEach(e=>{e.onclick=async e=>{let t=e.currentTarget.dataset.id;confirm(`¿Seguro que deseas eliminar este aviso global?`)&&(window.showToast(`Eliminando aviso...`,`#f59e0b`),await r.deleteNotification(t),window.showToast(`Aviso eliminado exitosamente.`,`#ef4444`),n())}})}catch(e){console.error(e),document.getElementById(`admin-notifications-list`).innerHTML=`<div style="color:#ef4444;">Error cargando avisos</div>`}},i=document.getElementById(`modal-notif`);document.getElementById(`btn-create-notification`).onclick=()=>{document.getElementById(`notif-title`).value=``,document.getElementById(`notif-message`).value=``,document.getElementById(`notif-type`).value=`info`,i.classList.add(`active`)},document.getElementById(`btn-close-notif`).onclick=()=>{i.classList.remove(`active`)},document.getElementById(`btn-save-notif`).onclick=async()=>{let e=document.getElementById(`notif-title`).value.trim(),t=document.getElementById(`notif-message`).value.trim(),a=document.getElementById(`notif-type`).value;if(!e||!t){window.showToast(`Por favor completa el título y mensaje.`,`#ef4444`);return}try{window.showToast(`Publicando aviso...`,`#f59e0b`),await r.addNotification(e,t,a),window.showToast(`Aviso global publicado con éxito ✅`,`#22c55e`),i.classList.remove(`active`),n()}catch(e){console.error(e),window.showToast(`Error publicando aviso`,`#ef4444`)}},n()};window.currentEditingMemberId=null;var Te=()=>{document.querySelectorAll(`.overlay`).forEach(e=>{e.classList.remove(`active`),e.style.display=``})},Ee=async(e,t)=>{try{if(await r.updatePaymentStatus(e,t),t===`approved`){let t=await r.getPayment(e);if(t&&t.user_id){let e=new Date;e.setDate(e.getDate()+30),await r.updateProfile(t.user_id,{membership_status:`active`,membership_expiry:e.toISOString(),membership_plan_id:t.plan_id||null,updated_at:new Date().toISOString()}),await r.deletePendingPayments(t.user_id)}}window.showToast(`Pago ${t===`approved`?`aprobado`:`rechazado`} ✅`,t===`approved`?`#22c55e`:`#ef4444`),te()}catch(e){console.error(e),window.showToast(`Error al actualizar pago`,`#ef4444`)}},De=async e=>{if(confirm(`¿Eliminar esta clase?`))try{await r.deleteClass(e),window.showToast(`Clase eliminada ✅`,`#22c55e`),ye()}catch(e){console.error(e),window.showToast(`Error al eliminar clase`,`#ef4444`)}},Oe=async e=>{if(confirm(`¿Eliminar este plan?`))try{await r.deletePlan(e),window.showToast(`Plan eliminado ✅`,`#22c55e`),xe()}catch(e){console.error(e),window.showToast(`Error al eliminar plan`,`#ef4444`)}},ke=(e=null,t=[])=>{let n=document.getElementById(`class-modal`),i=document.getElementById(`class-form`),a=document.getElementById(`class-modal-title`);i.reset(),a.innerText=e?`Editar Clase 🥋`:`Nueva Clase 🥋`;let o=e&&t.find(t=>t.id==e)||{};document.getElementById(`cls-name`).value=o.name||``,document.getElementById(`cls-coach`).value=o.coach||``,document.getElementById(`cls-time`).value=o.time||``,document.getElementById(`cls-type`).value=o.type||`Striking`,document.getElementById(`cls-theme`).value=o.theme||`smoke-purple`,document.getElementById(`cls-capacity`)&&(document.getElementById(`cls-capacity`).value=o.capacity||20);let s=document.getElementById(`cls-days-container`);if(s){let e=[`Dom`,`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`],t=o.days||[];s.innerHTML=e.map((e,n)=>`
                <label class="day-check" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <input type="checkbox" name="cls-day" value="${n}" ${t.includes(n)?`checked`:``}>
                    <span>${e}</span>
                </label>
            `).join(``)}n.classList.add(`active`),i.onsubmit=async t=>{t.preventDefault();let a=Array.from(i.querySelectorAll(`input[name="cls-day"]:checked`)).map(e=>parseInt(e.value)),s={name:document.getElementById(`cls-name`).value.trim(),coach:document.getElementById(`cls-coach`).value.trim(),time:document.getElementById(`cls-time`).value,type:document.getElementById(`cls-type`).value,theme:document.getElementById(`cls-theme`).value,days:a.length>0?a:[1,2,3,4,5],img:o.img||`https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500`};s.id=e||(typeof crypto<`u`&&crypto.randomUUID?crypto.randomUUID():Date.now().toString());try{window.showLoading(`Guardando clase...`),await r.upsertClass(s),window.hideLoading(),window.showToast(`Clase guardada ✅`,`#22c55e`),window.appState.classes=await r.getClasses(),n.classList.remove(`active`),ye()}catch(e){console.error(e),window.hideLoading(),window.showToast(`Fallo al guardar clase ❌`,`#ef4444`)}}},Ae=(e=null,t=[])=>{let n=document.getElementById(`plan-modal`),i=document.getElementById(`plan-form`),a=document.getElementById(`plan-modal-title`);i.reset(),a.innerText=e?`Editar Plan 💎`:`Nuevo Plan 💎`;let o=e&&t.find(t=>t.id==e)||{};document.getElementById(`plan-name`).value=o.name||``,document.getElementById(`plan-price`).value=o.price||``,document.getElementById(`plan-limit`).value=o.limit||0,document.getElementById(`plan-monthly`).value=o.monthly||0,document.getElementById(`plan-subtitle`)&&(document.getElementById(`plan-subtitle`).value=o.subtitle||``),document.getElementById(`plan-theme`).value=o.theme||`bronze`,document.getElementById(`plan-features`)&&(document.getElementById(`plan-features`).value=o.features?o.features.join(`, `):``),document.getElementById(`plan-popular`)&&(document.getElementById(`plan-popular`).checked=o.popular||!1),document.getElementById(`plan-desc`)&&(document.getElementById(`plan-desc`).value=o.description||``);let s=document.getElementById(`plan-days-container`);if(s){let e=[`Dom`,`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`],t=Array.isArray(o.days)?o.days:[];s.innerHTML=e.map((e,n)=>`
                <label class="day-check" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <input type="checkbox" name="plan-day" value="${n}" ${t.includes(n)?`checked`:``}>
                    <span>${e}</span>
                </label>
            `).join(``)}n.classList.add(`active`),i.onsubmit=async a=>{a.preventDefault();let s=document.getElementById(`plan-features`),c=s?s.value.split(`,`).map(e=>e.trim()).filter(e=>e):[],l=Array.from(i.querySelectorAll(`input[name="plan-day"]:checked`)).map(e=>parseInt(e.value)),u={name:document.getElementById(`plan-name`).value.trim(),price:parseFloat(document.getElementById(`plan-price`).value),monthly:parseInt(document.getElementById(`plan-monthly`).value),limit:parseInt(document.getElementById(`plan-limit`).value),theme:document.getElementById(`plan-theme`).value.trim(),subtitle:document.getElementById(`plan-subtitle`)?document.getElementById(`plan-subtitle`).value.trim():``,features:c,popular:document.getElementById(`plan-popular`)?document.getElementById(`plan-popular`).checked:!1,days:l,description:document.getElementById(`plan-desc`)?document.getElementById(`plan-desc`).value.trim():``};u.id=e||(typeof crypto<`u`&&crypto.randomUUID?crypto.randomUUID():Date.now().toString()),u.sort_order=e?o.sort_order||0:t.length;try{window.showLoading(`Guardando plan...`),await r.upsertPlan(u),window.hideLoading(),window.showToast(`Plan guardado ✅`,`#22c55e`),n.classList.remove(`active`),xe()}catch(e){console.error(e),window.hideLoading(),window.showToast(`Fallo al guardar plan ❌`,`#ef4444`)}}};window.currentEditingMemberId=null;var je=async(e=null,t=[])=>{try{window.currentEditingMemberId=e;let n=document.getElementById(`member-modal`);if(!n){console.error(`Modal 'member-modal' not found!`);return}document.querySelectorAll(`.overlay`).forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`),n.style.display=`flex`,window.lucide.createIcons();let r=document.getElementById(`member-modal-title`),i=document.getElementById(`member-form`),a=document.getElementById(`mem-profile-summary`),o=document.getElementById(`mem-modal-tabs`),s=document.getElementById(`mem-plan`);s&&(s.innerHTML=`<option value="" style="color: black;">Sin Plan (Inactivo)</option>`,(window.appState.plans||[]).forEach(e=>{let t=document.createElement(`option`);t.value=e.id,t.text=e.name,t.style.color=`black`,s.appendChild(t)}));let c=(e,t)=>{let n=document.getElementById(e);n&&(n.value=t||``)},l=e=>{document.querySelectorAll(`.mem-tab`).forEach(e=>{e.style.background=`rgba(255,255,255,0.05)`,e.style.color=`var(--text-gray)`,e.style.borderColor=`rgba(255,255,255,0.1)`});let t=document.querySelector(`.mem-tab[data-tab="${e}"]`);t&&(t.style.background=`var(--accent-purple)`,t.style.color=`white`,t.style.borderColor=`var(--accent-purple)`);let n=document.getElementById(`mem-tab-profile`),r=document.getElementById(`mem-tab-membership`),i=document.getElementById(`mem-tab-history`);n&&n.classList.toggle(`hidden`,e!==`profile`),r&&r.classList.toggle(`hidden`,e!==`membership`),i&&i.classList.toggle(`hidden`,e!==`history`)};if(document.querySelectorAll(`.mem-tab`).forEach(e=>{e.onclick=t=>{t.preventDefault(),l(e.getAttribute(`data-tab`))}}),e){let n=t.find(t=>t.id===e);if(!n){console.warn(`User not found in array:`,e),window.showToast(`Socio no encontrado`,`#ef4444`);return}r&&(r.innerText=`Editar Socio`),a&&(a.classList.remove(`hidden`),a.style.display=`flex`);let i=document.getElementById(`mem-avatar-preview`);i&&(i.src=n.photo_url||`/assets/unknow-BC4RhdqH.png`);let s=document.getElementById(`mem-display-name`);s&&(s.textContent=n.full_name||`Sin Nombre`);let u=document.getElementById(`mem-display-email`);u&&(u.textContent=n.email||``);let d=document.getElementById(`mem-display-badges`);if(d){let e=n.membership_expiry?new Date(n.membership_expiry):null,t=e?Math.ceil((e-new Date)/(1e3*60*60*24)):0,r=`Inactivo`,i=`#ef4444`;n.is_frozen?(r=`Congelado`,i=`#3b82f6`):t>0?(r=`Activo`,i=`#22c55e`):t>-30&&(r=`Moroso`,i=`#f97316`),d.innerHTML=`
                        <span style="font-size:0.6rem; background:${i}20; color:${i}; padding:2px 8px; border-radius:12px; font-weight:700; border:1px solid ${i}40;">${r}</span>
                        <span style="font-size:0.6rem; background:rgba(139,92,246,0.15); color:var(--accent-purple); padding:2px 8px; border-radius:12px; font-weight:700;">LVL ${n.level||0}</span>
                        <span style="font-size:0.6rem; background:rgba(255,255,255,0.05); color:var(--text-gray); padding:2px 8px; border-radius:12px; font-weight:700;">${n.membership_plans?.name||`Sin Plan`}</span>`}o&&(o.classList.remove(`hidden`),o.style.display=`flex`),c(`mem-name`,n.full_name),c(`mem-email`,n.email),c(`mem-phone`,n.phone),c(`mem-level`,n.level||0),c(`mem-xp`,n.xp||0),c(`mem-entry-date`,n.created_at?n.created_at.split(`T`)[0]:``),c(`mem-birthdate`,n.birthdate),c(`mem-emergency-contact`,n.emergency_contact),c(`mem-admin-notes`,n.admin_notes),c(`mem-plan`,n.membership_plan_id);let f=document.getElementById(`mem-status`);if(f){let e=n.membership_expiry?new Date(n.membership_expiry):null,t=e?Math.ceil((e-new Date)/(1e3*60*60*24)):0;n.is_frozen?f.value=`frozen`:n.membership_status===`active`&&t>0?f.value=`active`:f.value=`inactive`}c(`mem-expiry`,n.membership_expiry?n.membership_expiry.split(`T`)[0]:``),c(`mem-class-limit`,n.membership_limit||2),c(`mem-surcharge`,n.surcharge_pct||30);let p=document.getElementById(`mem-status-display`);if(p){let e=n.membership_expiry?new Date(n.membership_expiry):null;if(e){p.classList.remove(`hidden`);let t=Math.ceil((e-new Date)/(1e3*60*60*24)),n=document.getElementById(`mem-days-left`),r=document.getElementById(`mem-progress-bar`);if(n&&(n.textContent=t>0?`${t} días restantes`:`Expirado`,n.style.color=t<=5?`#ef4444`:`#22c55e`),r){let e=Math.max(0,Math.min(100,(30-t)/30*100));r.style.width=`${e}%`,r.style.background=t<=5?`#ef4444`:`var(--accent-purple)`}}else p.classList.add(`hidden`)}let m=document.getElementById(`admin-pass-tools`);if(m){m.classList.remove(`hidden`);let e=document.getElementById(`btn-admin-reset-pass`);e&&(e.onclick=async()=>{if(confirm(`¿Enviar email de restablecimiento a ${n.email}?`))try{let{error:e}=await window.supabase.auth.resetPasswordForEmail(n.email,{redirectTo:window.location.origin+`/app/`});if(e)throw e;window.showToast(`Email enviado correctamente 📧`,`#22c55e`)}catch(e){console.error(e),window.showToast(`Error al enviar email ❌`,`#ef4444`)}})}Me(n.id),l(`profile`)}else r&&(r.innerText=`Nuevo Socio`),i&&i.reset(),c(`mem-entry-date`,new Date().toISOString().split(`T`)[0]),c(`mem-xp`,0),c(`mem-level`,0),a&&a.classList.add(`hidden`),o&&o.classList.add(`hidden`),l(`profile`)}catch(e){console.error(`Error opening member modal:`,e),window.showToast(`Error crítico al abrir editor ❌`,`#ef4444`)}},Me=async e=>{let t=document.getElementById(`mem-attendance-list`),n=document.getElementById(`mem-stat-total`),i=document.getElementById(`mem-stat-month`),a=document.getElementById(`mem-stat-payments`);t.innerHTML=`<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>`,window.lucide.createIcons();try{let[o,s]=await Promise.all([r.getAttendance(e),r.getPayments(e)]),c=new Date,l=c.getMonth(),u=c.getFullYear(),d=o?o.length:0,f=o?o.filter(e=>{let t=new Date(e.attended_at);return t.getMonth()===l&&t.getFullYear()===u}).length:0;n.textContent=d,i.textContent=f,a.textContent=s?s.length:0;let p=[];o&&o.forEach(e=>{p.push({type:`attendance`,date:new Date(e.attended_at),label:e.class_name||`Clase`,icon:`calendar-check`})}),s&&s.forEach(e=>{p.push({type:`payment`,date:new Date(e.created_at),label:`$${e.amount||0} — ${e.concept||`Pago`}`,icon:e.status===`approved`?`check-circle`:`clock`,color:e.status===`approved`?`#22c55e`:`#fbbf24`,status:e.status})}),p.sort((e,t)=>t.date-e.date),p.length===0?t.innerHTML=`<div style="text-align:center; padding:30px; color:var(--text-gray);"><i data-lucide="inbox" style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;"></i><p style="font-size:0.85rem;">Sin actividad registrada</p></div>`:t.innerHTML=p.slice(0,50).map(e=>{let t=e.date.toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}),n=e.date.toLocaleTimeString(`es-CL`,{hour:`2-digit`,minute:`2-digit`}),r=e.color||(e.type===`attendance`?`var(--accent-cyan)`:`#22c55e`),i=e.type===`attendance`?`rgba(6,182,212,0.08)`:`rgba(34,197,94,0.08)`,a=e.type===`attendance`?`Asistencia`:e.status===`approved`?`Pago Aprobado`:`Pago Pendiente`;return`<div style="display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; margin-bottom:6px; background:${i}; border:1px solid rgba(255,255,255,0.04);">
                        <div style="width:32px; height:32px; border-radius:8px; background:${r}15; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="${e.icon}" style="width:14px; height:14px; color:${r};"></i></div>
                        <div style="flex:1; min-width:0;"><strong style="font-size:0.78rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.label}</strong><span style="font-size:0.65rem; color:var(--text-gray);">${a}</span></div>
                        <div style="text-align:right; flex-shrink:0;"><span style="font-size:0.7rem; color:var(--text-gray); display:block;">${t}</span><span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">${n}</span></div></div>`}).join(``),window.lucide.createIcons()}catch(e){console.error(`Error loading member history:`,e),t.innerHTML=`<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar historial</p>`}},Ne=async e=>{if(confirm(`¿Eliminar socio definitivamente? Todo su progreso y reservas se borrarán.`))try{await r.softDeleteUser(e),window.showToast(`Socio eliminado correctamente 🗑️`,`#ef4444`),z()}catch(e){console.error(e),window.showToast(`Error al eliminar socio ❌`,`#ef4444`)}},Pe=()=>{document.addEventListener(`click`,e=>{(e.target.closest(`.btn-close-modal`)||e.target.closest(`.btn-close`)||e.target.closest(`.btn-action-cancel`))&&Te(),e.target.classList.contains(`overlay`)&&Te()});let e=document.getElementById(`member-form`);e&&(e.onsubmit=async e=>{e.preventDefault();let t=document.getElementById(`mem-name`).value.trim(),n=document.getElementById(`mem-email`).value.trim(),i=document.getElementById(`mem-phone`).value.trim(),a=parseInt(document.getElementById(`mem-level`).value)||0,o=parseInt(document.getElementById(`mem-xp`).value)||0,s=document.getElementById(`mem-entry-date`).value,c=document.getElementById(`mem-birthdate`).value,l=document.getElementById(`mem-emergency-contact`).value.trim(),u=document.getElementById(`mem-admin-notes`).value.trim(),d=document.getElementById(`mem-plan`).value,f=document.getElementById(`mem-status`).value,p=document.getElementById(`mem-expiry`).value,m=parseInt(document.getElementById(`mem-class-limit`).value)||2,h=parseInt(document.getElementById(`mem-surcharge`).value)||30;if(!t||!n){window.showToast(`Nombre y Email son obligatorios ⚠️`,`#eab308`);return}let g={full_name:t,email:n,phone:i||null,level:a,xp:o,birthdate:c||null,emergency_contact:l||null,admin_notes:u||null,membership_plan_id:d||null,membership_limit:m,surcharge_pct:h,is_frozen:f===`frozen`};if(s&&(g.created_at=new Date(s).toISOString()),f===`active`)if(g.membership_status=`active`,p)g.membership_expiry=new Date(p).toISOString();else{let e=new Date;e.setDate(e.getDate()+30),g.membership_expiry=e.toISOString()}else f===`frozen`?(g.membership_status=`active`,p&&(g.membership_expiry=new Date(p).toISOString())):(g.membership_status=`inactive`,g.membership_expiry=p?new Date(p).toISOString():null);try{if(window.currentEditingMemberId)await r.updateProfile(window.currentEditingMemberId,g),window.showToast(`Datos de socio actualizados ✅`,`#22c55e`);else{window.showToast(`Creando nuevo socio... 🥋`,`#8b5cf6`);let{data:e,error:i}=await window.supabase.auth.signUp({email:n,password:`Amaru123!`,options:{data:{full_name:t}}});if(i)throw i;let a={uid:e.user.id,email:n};await r.createProfile(a,t),await r.updateProfile(e.user.id,g),window.showToast(`Socio creado exitosamente ✅`,`#22c55e`)}document.getElementById(`member-modal`).classList.remove(`active`),z()}catch(e){console.error(e),window.showToast(`Error al guardar socio ❌`,`#ef4444`)}})},W=()=>{let e=document.querySelector(`.class-timeline`),t=document.querySelector(`.date-carousel-premium`);if(!e)return;let{appState:n,auth:i,showLoading:a,hideLoading:o,toggleReservation:s,openClassModal:c}=window;if(t){t.innerHTML=``;for(let e=0;e<7;e++){let s=new Date;s.setHours(12,0,0,0),s.setDate(s.getDate()+e);let c=s.toISOString().split(`T`)[0],l=s.toLocaleDateString(`es-ES`,{weekday:`short`}).toUpperCase(),u=s.getDate(),d=c===n.selectedDate,f=document.createElement(`div`);f.className=`date-chip ${d?`active`:``}`,f.innerHTML=`<span>${l}</span><p>${u}</p>`,f.onclick=async()=>{n.selectedDate=c,a&&a(`Cargando clases... ⏳`);try{n.reservations=(await r.getReservations(c)||[]).filter(e=>e.user_id===i.currentUser?.uid).map(e=>e.class_id)}catch(e){console.error(`[Schedule] Error fetching reservations:`,e),n.reservations=[]}o&&o(),W()},t.appendChild(f)}}let l=[`Domingo`,`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`],u=new Date(n.selectedDate+`T12:00:00`).getDay(),d=l[u];console.log(`[Schedule] Rendering for ${n.selectedDate} (${d}, index: ${u})`),console.log(`[Schedule] Total classes in state: ${n.classes?.length}`);let f=n.classes.filter(e=>{let t=n.activeFilter===`Todas`||e.type===n.activeFilter,r=e.days;if(typeof r==`string`)try{r=JSON.parse(r)}catch{r=r.split(`,`).map(e=>e.trim())}let i=!1;return Array.isArray(r)&&(i=r.some(e=>e===u||String(e)===String(u)||String(e).toLowerCase()===d.toLowerCase()||String(e).toLowerCase().startsWith(d.substring(0,3).toLowerCase()))),t&&i});if(console.log(`[Schedule] Filtered classes: ${f.length}`),f.length===0){e.innerHTML=`
            <div style="text-align:center; padding:40px 20px; color:var(--text-gray);">
                <i data-lucide="calendar-x" style="width:40px; height:40px; opacity:0.3; margin-bottom:15px;"></i>
                <p>No hay clases programadas para este día.</p>
                <span style="font-size:0.8rem; opacity:0.6;">(Filtro: ${n.activeFilter})</span>
            </div>`,window.lucide&&window.lucide.createIcons();return}e.innerHTML=f.map((e,t)=>{let r=n.reservations.includes(e.id);return`
            <div class="stitch-class-card ${r?`booked`:``} ${e.theme}" style="opacity:0; animation: elegantFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${.04+t*.08}s forwards;">
                <div class="smoke-layer"></div>
                <div class="stitch-class-content">
                    <div class="cls-info-main">
                        <span class="tag">${e.type}</span>
                        <h4>${e.name}</h4>
                        <p>${e.time} • Coach ${e.coach}</p>
                    </div>
                    <button class="btn-reserve-stitch ${r?`booked`:``}" data-id="${e.id}">
                        ${n.role===`admin`?`EDITAR`:r?`CANCELAR`:`RESERVAR`}
                    </button>
                </div>
            </div>`}).join(``),window.lucide&&window.lucide.createIcons(),document.querySelectorAll(`.btn-reserve-stitch`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-id`);n.role===`admin`?c&&c(t,n.classes):s&&s(t)}})},G=()=>{let e=document.getElementById(`tourney-list`);if(!e)return;let{appState:t,auth:n,showToast:i}=window;t.tournaments.length===0?e.innerHTML=`
            <div class="smoothcomp-banner p-20 text-center mb-20" style="border: 1px solid rgba(203, 242, 240, 0.3); border-radius: 20px; background: linear-gradient(135deg, rgba(203, 242, 240, 0.15) 0%, rgba(203, 242, 240, 0.05) 100%);">
                <i data-lucide="trophy" style="width: 40px; height: 40px; color: #fff; margin-bottom: 10px;"></i>
                <h3>Conecta con Smoothcomp</h3>
                <p class="opacity-70 mb-10 text-sm">Administra tus competencias internacionales directas a tu perfil atlético.</p>
                <a href="https://smoothcomp.com/es/events/upcoming" target="_blank" class="cyber-btn" style="text-decoration:none; display:inline-block; margin-top:10px;">Encontrar Eventos 🏆</a>
            </div>
            <p class="opacity-50 text-center p-20">No tienes torneos locales registrados manualmente aún.</p>
        `:e.innerHTML=`
            <div class="smoothcomp-banner p-20 text-center mb-20" style="border: 1px solid rgba(203, 242, 240, 0.3); border-radius: 20px; background: linear-gradient(135deg, rgba(203, 242, 240, 0.15) 0%, rgba(203, 242, 240, 0.05) 100%);">
                <i data-lucide="trophy" style="width: 40px; height: 40px; color: #fff; margin-bottom: 10px;"></i>
                <h3>Módulo Smoothcomp</h3>
                <p class="opacity-70 mb-10 text-sm">Administra tus competencias internacionales directas.</p>
                <a href="https://smoothcomp.com/es/events/upcoming" target="_blank" class="cyber-btn" style="text-decoration:none; display:inline-block; margin-top:10px;">Ver Eventos Oficiales 🏆</a>
            </div>
            ${t.tournaments.map((e,t)=>`
            <div class="stitch-tourney-card luxury-gradient" style="opacity:0; animation: elegantFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${.04+t*.12}s forwards;">
                <div class="st-tourney-content">
                    <div>
                        <span class="st-tag">COMPETICIÓN</span>
                        <h4>${e.name}</h4>
                        <p>${e.place}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size:0.7rem; opacity:0.7; font-weight:700; margin-bottom: 5px;">${e.date}</p>
                        <div class="item-actions">
                            <button class="edit-tourney-btn" data-id="${e.id}" style="background:none; border:none; color:white; cursor:pointer;"><i data-lucide="edit-3" style="width:14px;"></i></button>
                            <button class="delete-tourney-btn" data-id="${e.id}" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i data-lucide="trash-2" style="width:14px;"></i></button>
                        </div>
                    </div>
                </div>
            </div>`).join(``)}
        `,window.lucide&&window.lucide.createIcons(),document.querySelectorAll(`.edit-tourney-btn`).forEach(e=>{e.onclick=()=>{let n=e.getAttribute(`data-id`),r=t.tournaments.find(e=>e.id===n);r&&(document.getElementById(`tourney-id`).value=r.id,document.getElementById(`tourney-name`).value=r.name,document.getElementById(`tourney-place`).value=r.place,document.getElementById(`tourney-date`).value=r.date,document.getElementById(`tourney-modal-title`).innerText=`Editar Torneo`,document.getElementById(`tourney-modal`).classList.add(`active`))}}),document.querySelectorAll(`.delete-tourney-btn`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Eliminar este torneo de tu lista?`)){let a=e.getAttribute(`data-id`);try{await r.deleteTournament(a),t.tournaments=await r.getTournaments(n.currentUser.uid),G(),i&&i(`Torneo eliminado 🗑️`,`#ef4444`)}catch{i&&i(`Error al eliminar torneo ❌`,`#ef4444`)}}}});let a=document.getElementById(`add-tourney-btn`);a&&(a.onclick=()=>Fe(null,t.tournaments))},Fe=(e=null,t=[])=>{let n=document.getElementById(`tourney-modal`);if(!n){console.error(`Tournament modal not found in DOM`);return}if(e){let n=t.find(t=>t.id===e);n&&(document.getElementById(`tourney-id`).value=n.id,document.getElementById(`tourney-name`).value=n.name,document.getElementById(`tourney-place`).value=n.place,document.getElementById(`tourney-date`).value=n.date,document.getElementById(`tourney-modal-title`).innerText=`Editar Torneo`)}else document.getElementById(`tourney-id`).value=``,document.getElementById(`tourney-name`).value=``,document.getElementById(`tourney-place`).value=``,document.getElementById(`tourney-date`).value=``,document.getElementById(`tourney-modal-title`).innerText=`Nuevo Torneo`;n.classList.add(`active`)},Ie=t({renderRevenueSection:()=>Be}),Le=null,K=[],q={year:new Date().getFullYear(),month:new Date().getMonth()},J=null,Y=20,X=e=>e==null?`$0`:`$`+Math.round(e).toLocaleString(`es-CL`),Re=e=>e?new Date(e).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,Z=e=>[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][e]||``,ze=async()=>{try{let{data:e,error:t}=await window.supabase.from(`payments`).select(`
                *,
                profiles:profiles(id, full_name, email, membership_plan_id, membership_status, membership_expiry)
            `).eq(`status`,`approved`).order(`created_at`,{ascending:!1});if(t)throw t;let{data:n}=await window.supabase.from(`membership_plans`).select(`*`),r=new Map((n||[]).map(e=>[e.id,e]));return(e||[]).map(e=>{let t=null,i=(e.concept||e.plan_name||``).toLowerCase();return i&&n&&(t=n.find(e=>i.includes((e.name||``).toLowerCase()))),!t&&e.profiles?.membership_plan_id&&(t=r.get(e.profiles.membership_plan_id)||null),{...e,plan:t}})}catch(e){return console.error(`[Revenue] Error fetching data:`,e),window.showToast&&window.showToast(`Error cargando ingresos`,`#ef4444`),[]}},Be=async()=>{let e=document.getElementById(`admin-revenue-section`),t=document.getElementById(`admin-content-area`);e&&e.classList.add(`hidden`),t&&(t.innerHTML=`<div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando inteligencia financiera...</div>`),window.lucide&&window.lucide.createIcons(),K=await ze(),Q()},Q=()=>{let e=document.getElementById(`admin-content-area`);if(!e)return;let t=new Date,n=t.getMonth(),r=t.getFullYear();q||={year:r,month:n};let i=We(K,q.year,q.month),a=J?We(K,J.year,J.month):Ge(K,q.year,q.month),o=i.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),s=a.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),c=s>0?(o-s)/s*100:o>0?100:0,l=new Set(i.map(e=>e.user_id)).size,u=i.length>0?o/i.length:0,d={};i.forEach(e=>{let t=e.plan?.name||e.concept||`Otro`;d[t]||(d[t]={count:0,total:0}),d[t].count++,d[t].total+=parseFloat(e.amount)||0});let f=Ke(K,6);e.innerHTML=`
        <div class="glass-premium p-20">
            <div class="header-split mb-20">
                <div>
                    <h3 style="font-size:1.3rem; margin-bottom:4px;">💰 Evolución de Ingresos</h3>
                    <p class="subtitle">Análisis detallado de pagos y membresías</p>
                </div>
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); padding:6px 12px; border-radius:10px; border:1px solid var(--glass-border);">
                        <i data-lucide="calendar" style="width:14px; color:var(--accent-purple);"></i>
                        <select id="rev-filter-month" style="background:transparent; color:white; border:none; font-size:0.75rem; font-weight:600; outline:none; cursor:pointer;">
                            ${[0,1,2,3,4,5,6,7,8,9,10,11].map(e=>`<option value="${e}" ${e===q.month?`selected`:``} style="color:black;">${Z(e)}</option>`).join(``)}
                        </select>
                        <select id="rev-filter-year" style="background:transparent; color:white; border:none; font-size:0.75rem; font-weight:600; outline:none; cursor:pointer;">
                            ${[r-1,r,r+1].map(e=>`<option value="${e}" ${e===q.year?`selected`:``} style="color:black;">${e}</option>`).join(``)}
                        </select>
                    </div>
                    <button id="btn-compare-prev" class="btn-glass" style="padding:6px 14px; font-size:0.7rem; ${J?`background:var(--accent-purple); color:white; border-color:var(--accent-purple);`:``}">
                        <i data-lucide="git-compare" style="width:12px;"></i> Comparar
                    </button>
                </div>
            </div>

            <!-- KPIs -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
                <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ingresos ${Z(q.month)}</span>
                    <strong style="font-size:1.4rem; color:var(--accent-purple); font-weight:900;">${X(o)}</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Crecimiento</span>
                    <strong style="font-size:1.4rem; color:${c>=0?`#22c55e`:`#ef4444`}; font-weight:900;">${c>=0?`+`:``}${c.toFixed(1)}%</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Pagadores</span>
                    <strong style="font-size:1.4rem; color:#3b82f6; font-weight:900;">${l}</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ticket Promedio</span>
                    <strong style="font-size:1.4rem; color:#fbbf24; font-weight:900;">${X(u)}</strong>
                </div>
            </div>

            <!-- Gráfico histórico -->
            <div style="margin-bottom:25px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="font-size:0.9rem; font-weight:700;">📈 Histórico de Ingresos (últimos 6 meses)</h4>
                </div>
                <div class="chart-container" style="min-height:220px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:15px;">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- Desglose por plan -->
            <div style="margin-bottom:25px;">
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">🥋 Ingresos por Plan / Concepto</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${Object.keys(d).length===0?`<p style="opacity:0.5; font-size:0.8rem;">Sin ingresos registrados en este periodo.</p>`:Object.entries(d).sort((e,t)=>t[1].total-e[1].total).map(([e,t])=>{let n=o>0?(t.total/o*100).toFixed(1):0;return`
                                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="flex:1;">
                                        <strong style="font-size:0.85rem;">${e}</strong>
                                        <span style="font-size:0.7rem; color:var(--text-gray); margin-left:8px;">${t.count} pago${t.count===1?``:`s`}</span>
                                    </div>
                                    <div style="width:100px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                        <div style="width:${n}%; height:100%; background:var(--accent-purple); border-radius:3px;"></div>
                                    </div>
                                    <strong style="font-size:0.9rem; min-width:70px; text-align:right;">${X(t.total)}</strong>
                                    <span style="font-size:0.7rem; color:var(--accent-purple); min-width:40px; text-align:right;">${n}%</span>
                                </div>
                            `}).join(``)}
                </div>
            </div>

            <!-- Lista detallada de pagadores -->
            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                    <h4 style="font-size:0.9rem; font-weight:700;">👥 Detalle de Pagos — ${Z(q.month)} ${q.year}</h4>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <input type="text" id="rev-search-input" placeholder="Buscar alumno..." style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:6px 12px; border-radius:8px; font-size:0.75rem; outline:none; width:160px;">
                        <select id="rev-sort-select" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:6px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                            <option value="date-desc" style="color:black;">Más reciente</option>
                            <option value="date-asc" style="color:black;">Más antiguo</option>
                            <option value="amount-desc" style="color:black;">Mayor monto</option>
                            <option value="amount-asc" style="color:black;">Menor monto</option>
                            <option value="name-asc" style="color:black;">Nombre A-Z</option>
                        </select>
                    </div>
                </div>
                <div id="revenue-payments-list" style="display:flex; flex-direction:column; gap:8px;">
                    ${Ve(i)}
                </div>
                ${i.length>Y?`
                    <div style="text-align:center; margin-top:15px;">
                        <button id="btn-load-more-rev" class="btn-glass" style="padding:8px 20px; font-size:0.75rem;">
                            Ver más (${i.length-Y} restantes)
                        </button>
                    </div>
                `:``}
            </div>

            <!-- Insights automáticos -->
            <div class="glass" style="background:rgba(139,92,246,0.05); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:12px; margin-bottom:20px;">
                <h4 style="margin-bottom:10px; display:flex; align-items:center; gap:5px; color:var(--accent-purple); font-size:0.9rem;">
                    <i data-lucide="brain" style="width:16px;"></i> Análisis Inteligente
                </h4>
                <div id="revenue-insights-dynamic" style="font-size:0.85rem; color:rgba(255,255,255,0.8); line-height:1.5; display:flex; flex-direction:column; gap:8px;">
                    ${He(i,a,o,s,c,d)}
                </div>
            </div>

            <!-- Exportar -->
            <div style="display:flex; gap:8px; align-items:center; justify-content:flex-end; border-top:1px solid rgba(255,255,255,0.1); padding-top:15px;">
                <span style="font-size:0.75rem; color:var(--text-gray); font-weight:600;">Exportar periodo:</span>
                <select id="rev-export-format" style="background:rgba(255,255,255,0.05); color:var(--text-gray); border:1px solid var(--glass-border); padding:6px 12px; border-radius:8px; font-size:0.75rem; outline:none;">
                    <option value="csv" style="color:black;">CSV</option>
                    <option value="xls" style="color:black;">XLS</option>
                    <option value="pdf" style="color:black;">PDF</option>
                </select>
                <button id="btn-export-revenue" class="btn-primary" style="padding:8px 16px; font-size:0.75rem; border-radius:8px;">
                    <i data-lucide="download" style="width:14px; height:14px; margin-right:4px; vertical-align:middle;"></i> Exportar
                </button>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),Ue(f),qe(i)},Ve=e=>{let t=(document.getElementById(`rev-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`rev-sort-select`)?.value||`date-desc`,r=[...e];t&&(r=r.filter(e=>{let n=(e.profiles?.full_name||``).toLowerCase(),r=(e.profiles?.email||``).toLowerCase(),i=(e.concept||``).toLowerCase();return n.includes(t)||r.includes(t)||i.includes(t)})),r.sort((e,t)=>{switch(n){case`date-desc`:return new Date(t.created_at)-new Date(e.created_at);case`date-asc`:return new Date(e.created_at)-new Date(t.created_at);case`amount-desc`:return(parseFloat(t.amount)||0)-(parseFloat(e.amount)||0);case`amount-asc`:return(parseFloat(e.amount)||0)-(parseFloat(t.amount)||0);case`name-asc`:return(e.profiles?.full_name||``).localeCompare(t.profiles?.full_name||``);default:return 0}});let i=r.slice(0,Y);return i.length===0?`<div style="text-align:center; padding:30px; opacity:0.4;">
            <i data-lucide="inbox" style="width:40px; height:40px; margin-bottom:10px; display:block; margin-inline:auto;"></i>
            <p style="font-size:0.85rem;">No hay pagos que coincidan con los filtros.</p>
        </div>`:i.map((e,t)=>{let n=e.profiles?.full_name||`Usuario sin nombre`,r=e.profiles?.email||``,i=e.plan?.name||e.concept||`—`,a=parseFloat(e.amount)||0,o=Re(e.created_at),s=e.payment_method||`manual`,c=s===`mercadopago`?`Mercado Pago`:s===`webpay`?`Webpay`:`Transferencia/Manual`;return`
            <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid var(--accent-purple); animation: slideInUp 0.3s ease ${t*.03}s both;">
                <div style="width:36px; height:36px; border-radius:50%; background:rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="user" style="width:16px; color:var(--accent-purple);"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <strong style="font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n}</strong>
                        <span class="tag" style="background:rgba(139,92,246,0.15); color:var(--accent-purple); font-size:0.65rem; padding:2px 8px;">${i}</span>
                    </div>
                    <span style="font-size:0.7rem; color:var(--text-gray); opacity:0.7;">${r}</span>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <strong style="font-size:1rem; color:white; display:block;">${X(a)}</strong>
                    <span style="font-size:0.65rem; color:var(--text-gray);">${o}</span>
                </div>
                <div style="text-align:right; flex-shrink:0; min-width:90px;">
                    <span class="tag" style="background:rgba(34,197,94,0.15); color:#22c55e; font-size:0.65rem; padding:2px 8px;">Aprobado</span>
                    <span style="font-size:0.6rem; color:var(--text-gray); display:block; margin-top:2px;">${c}</span>
                </div>
            </div>
        `}).join(``)},He=(e,t,n,r,i,a)=>{let o=[];i>10?o.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px; flex-shrink:0;"></i> <span>¡Excelente crecimiento! Ingresos subieron un <strong>${i.toFixed(1)}%</strong> vs periodo anterior.</span></div>`):i<-10?o.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-down" style="color:#ef4444; width:16px; flex-shrink:0;"></i> <span>Alerta: ingresos bajaron un <strong>${Math.abs(i).toFixed(1)}%</strong>. Considera una promoción o campaña de reactivación.</span></div>`):i===0?o.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:var(--text-gray); width:16px; flex-shrink:0;"></i> <span>No hay datos suficientes para comparar con el periodo anterior.</span></div>`):o.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:#fbbf24; width:16px; flex-shrink:0;"></i> <span>Ingresos estables con variación del <strong>${i.toFixed(1)}%</strong>.</span></div>`);let s=Object.entries(a).sort((e,t)=>t[1].total-e[1].total)[0];if(s&&o.push(`<div style="display:flex; gap:8px;"><i data-lucide="award" style="color:#fbbf24; width:16px; flex-shrink:0;"></i> <span>El plan más rentable es <strong>${s[0]}</strong> con ${X(s[1].total)} (${s[1].count} pagos).</span></div>`),e.length>5){let t={};e.forEach(e=>{let n=e.user_id;t[n]||(t[n]=0),t[n]+=parseFloat(e.amount)||0});let r=Object.values(t).sort((e,t)=>t-e),i=Math.max(1,Math.ceil(r.length*.2)),a=r.slice(0,i).reduce((e,t)=>e+t,0),s=n>0?(a/n*100).toFixed(0):0;s>50&&o.push(`<div style="display:flex; gap:8px;"><i data-lucide="users" style="color:#3b82f6; width:16px; flex-shrink:0;"></i> <span>El <strong>${s}%</strong> de ingresos proviene del 20% de tus alumnos (alta concentración).</span></div>`)}if(r>0){let e=n-r;o.push(`<div style="display:flex; gap:8px;"><i data-lucide="scale" style="color:#8b5cf6; width:16px; flex-shrink:0;"></i> <span>Diferencia vs anterior: <strong style="color:${e>=0?`#22c55e`:`#ef4444`}">${e>=0?`+`:``}${X(e)}</strong></span></div>`)}return o.join(``)||`<p style="opacity:0.5;">Sin insights disponibles para este periodo.</p>`},Ue=e=>{let t=document.getElementById(`revenueChart`);if(!t)return;Le&&Le.destroy();let n=e.map(e=>`${Z(e.month).substring(0,3)} ${String(e.year).slice(2)}`),r=e.map(e=>e.total),i=e.map(e=>e.count);Le=new Chart(t,{type:`bar`,data:{labels:n,datasets:[{label:`Ingresos ($)`,data:r,backgroundColor:`rgba(139, 92, 246, 0.7)`,borderColor:`rgba(139, 92, 246, 1)`,borderWidth:1,borderRadius:6,yAxisID:`y`},{label:`Cant. Pagos`,data:i,type:`line`,borderColor:`#22c55e`,backgroundColor:`rgba(34, 197, 94, 0.1)`,borderWidth:2,pointRadius:3,pointBackgroundColor:`#22c55e`,tension:.4,yAxisID:`y1`}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:`index`,intersect:!1},plugins:{legend:{labels:{color:`rgba(255,255,255,0.7)`,font:{size:11}}},tooltip:{backgroundColor:`rgba(13,13,18,0.95)`,titleColor:`#fff`,bodyColor:`#ccc`,borderColor:`rgba(255,255,255,0.1)`,borderWidth:1,callbacks:{label:e=>e.dataset.label===`Ingresos ($)`?` Ingresos: ${X(e.raw)}`:` ${e.dataset.label}: ${e.raw}`}}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:10}},grid:{display:!1}},y:{type:`linear`,display:!0,position:`left`,ticks:{color:`rgba(255,255,255,0.4)`,font:{size:10},callback:e=>`$`+(e>=1e3?(e/1e3).toFixed(0)+`k`:e)},grid:{color:`rgba(255,255,255,0.06)`}},y1:{type:`linear`,display:!0,position:`right`,ticks:{color:`rgba(34,197,94,0.6)`,font:{size:10}},grid:{display:!1}}}}})},We=(e,t,n)=>e.filter(e=>{let r=new Date(e.created_at);return r.getFullYear()===t&&r.getMonth()===n}),Ge=(e,t,n)=>{let r=n===0?11:n-1;return We(e,n===0?t-1:t,r)},Ke=(e,t)=>{let n=[],r=new Date;for(let i=t-1;i>=0;i--){let t=new Date(r.getFullYear(),r.getMonth()-i,1),a=We(e,t.getFullYear(),t.getMonth());n.push({year:t.getFullYear(),month:t.getMonth(),total:a.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),count:a.length})}return n},qe=e=>{let t=document.getElementById(`rev-filter-month`),n=document.getElementById(`rev-filter-year`);t&&(t.onchange=()=>{q.month=parseInt(t.value),q.year=parseInt(n.value),Y=20,Q()}),n&&(n.onchange=()=>{q.month=parseInt(t.value),q.year=parseInt(n.value),Y=20,Q()});let r=document.getElementById(`btn-compare-prev`);r&&(r.onclick=()=>{if(J)J=null;else{let e=q.month===0?11:q.month-1;J={year:q.month===0?q.year-1:q.year,month:e}}Q()});let i=document.getElementById(`rev-search-input`);if(i){let t;i.oninput=()=>{clearTimeout(t),t=setTimeout(()=>{let t=document.getElementById(`revenue-payments-list`);t&&(t.innerHTML=Ve(e)),window.lucide&&window.lucide.createIcons()},300)}}let a=document.getElementById(`rev-sort-select`);a&&(a.onchange=()=>{let t=document.getElementById(`revenue-payments-list`);t&&(t.innerHTML=Ve(e)),window.lucide&&window.lucide.createIcons()});let s=document.getElementById(`btn-load-more-rev`);s&&(s.onclick=()=>{Y+=20,Q()});let c=document.getElementById(`btn-export-revenue`);c&&(c.onclick=()=>{let t=document.getElementById(`rev-export-format`)?.value||`csv`,n=(document.getElementById(`rev-search-input`)?.value||``).toLowerCase(),r=document.getElementById(`rev-sort-select`)?.value||`date-desc`,i=[...e];n&&(i=i.filter(e=>{let t=(e.profiles?.full_name||``).toLowerCase(),r=(e.profiles?.email||``).toLowerCase(),i=(e.concept||``).toLowerCase();return t.includes(n)||r.includes(n)||i.includes(n)})),i.sort((e,t)=>{switch(r){case`date-desc`:return new Date(t.created_at)-new Date(e.created_at);case`date-asc`:return new Date(e.created_at)-new Date(t.created_at);case`amount-desc`:return(parseFloat(t.amount)||0)-(parseFloat(e.amount)||0);case`amount-asc`:return(parseFloat(e.amount)||0)-(parseFloat(t.amount)||0);case`name-asc`:return(e.profiles?.full_name||``).localeCompare(t.profiles?.full_name||``);default:return 0}}),o(t,i.map(e=>[Re(e.created_at),e.profiles?.full_name||`N/A`,e.profiles?.email||``,e.plan?.name||e.concept||`—`,parseFloat(e.amount||0).toFixed(0),e.payment_method||`manual`,e.status===`approved`?`Aprobado`:e.status]),[`Fecha`,`Alumno`,`Email`,`Plan/Concepto`,`Monto`,`Método`,`Estado`],`Ingresos_${Z(q.month)}_${q.year}_Amaru`),window.showToast&&window.showToast(`Exportado (${t.toUpperCase()}) ✅`,`#22c55e`)})};console.log(`[INIT] Amaru App Logic Loaded - V1.4.5 (Restored & Robust)`);var $={get currentUser(){return window.appState?.user||null}};window.auth=$,document.addEventListener(`DOMContentLoaded`,()=>{window.buyDailyPass=()=>{document.getElementById(`upsell-modal`).classList.add(`hidden`),document.getElementById(`pay-concept`).value=`Pase Diario / Clase Extra`,document.getElementById(`pay-amount`).value=`5000`,document.getElementById(`payment-modal`).classList.add(`active`)},window.upgradePlan=()=>{document.getElementById(`upsell-modal`).classList.add(`hidden`),document.querySelectorAll(`.nav-item`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.screen`).forEach(e=>e.classList.remove(`active`)),document.getElementById(`membership-selection-screen`).classList.remove(`hidden`),document.getElementById(`membership-selection-screen`).classList.add(`active`),document.getElementById(`app-container`).classList.add(`hidden`)},lucide.createIcons(),window.onerror=(e,t,n)=>{showToast(`Error: ${e}`,`#ef4444`),console.error(`Critical Error:`,e,`at`,t,`:`,n)};let e=document.getElementById(`btn-apply-promo`);e&&(e.onclick=async()=>{let e=document.getElementById(`promo-code-input`).value.trim().toUpperCase(),t=document.getElementById(`promo-code-message`);if(!e){t.style.display=`block`,t.style.color=`#ef4444`,t.innerText=`Ingresa un código.`;return}try{showToast(`Validando código...`);let{data:n,error:r}=await window.supabase.from(`discounts`).select(`*`).eq(`code`,e).maybeSingle();if(r)throw Error(`Error consultando código`);if(n){if(n.expiresAt){let e=new Date(n.expiresAt);if(e.setDate(e.getDate()+1),e<new Date)throw Error(`Este código ha expirado`)}a.activePromo=n,t.style.display=`block`,t.style.color=`#22c55e`,t.innerText=`¡Código '${n.code}' aplicado! ${n.percent}% de descuento.`,typeof N==`function`&&N(),showToast(`Descuento del ${n.percent}% aplicado ✨`,`#22c55e`)}else throw Error(`Código no válido`)}catch{a.activePromo=null,t.style.display=`block`,t.style.color=`#ef4444`,t.innerText=`Código inválido o expirado.`,typeof N==`function`&&N()}});let t=document.createElement(`div`);t.id=`toast-stack-container`,t.style.cssText=`
        position: fixed;
        bottom: 30px;
        right: 30px;
        display: flex;
        flex-direction: column-reverse;
        gap: 12px;
        z-index: 9999;
        pointer-events: none;
    `,document.body.appendChild(t),window.showToast=(e,n=`var(--accent-purple)`)=>{let r=document.createElement(`div`);r.style.cssText=`
            background: rgba(13, 13, 18, 0.95);
            border: 1px solid ${n};
            border-left: 4px solid ${n};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 500;
            font-size: 0.85rem;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.6);
            pointer-events: auto;
            min-width: 280px;
            max-width: 350px;
            transform: translateX(120%);
            transition: all 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
            display: flex;
            align-items: center;
            gap: 12px;
        `,r.innerHTML=`<span>${e}</span>`,t.appendChild(r),requestAnimationFrame(()=>{r.style.transform=`translateX(0)`}),setTimeout(()=>{r.style.transform=`translateX(120%)`,r.style.opacity=`0`,setTimeout(()=>r.remove(),500)},4e3)},window.showLoading=(e=`Cargando...`)=>{typeof Swal<`u`&&Swal.fire({title:e,allowOutsideClick:!1,background:`#1f1f2e`,color:`#fff`,didOpen:()=>{Swal.showLoading();let e=Swal.getPopup().querySelector(`.swal2-loader`);e&&(e.style.borderColor=`var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent`)}})},window.hideLoading=()=>{typeof Swal<`u`&&Swal.close()};let n=new URLSearchParams(window.location.search);n.get(`payment`)===`success`?(showToast(`¡Pago procesado con éxito! Bienvenido 🥋`,`#22c55e`),window.history.replaceState({},document.title,window.location.pathname)):n.get(`payment`)===`failure`&&(showToast(`El pago no pudo completarse. Intenta de nuevo. ❌`,`#ef4444`),window.history.replaceState({},document.title,window.location.pathname)),Object.assign(a,{attendance:0,attendanceGoal:4,membershipLimit:2,reservations:[],tournaments:[],classes:[],plans:[],isAdminMode:localStorage.getItem(`isAdminMode`)===`true`,activeFilter:`Todas`,selectedDate:new Date().toISOString().split(`T`)[0],role:`athlete`,level:0,xp:0,notifications:[],membershipExpiry:`2026-02-28`,attendanceHistoryCount:0,surchargePct:30,unsubscribeReservations:null,activePromo:null,proRataPreference:null}),window.appState=a;let o=[`El único entrenamiento malo es el que no sucedió.`,`No entrenas para ser mejor que otros, entrenas para que tu 'yo' de ayer no pueda alcanzarte.`,`La disciplina es el puente entre la intención y el cinturón negro.`,`El sudor es la tinta con la que escribes tu propia historia de superación.`,`En el dojo, el ego es el primer oponente que debes derribar antes de saludar al maestro.`,`La mente domina, el cuerpo obedece; si la mente no se rinde, el cuerpo es invencible.`,`La calma en el combate no nace de la falta de miedo, sino del exceso de preparación.`,`Caer siete veces y levantarse ocho no es solo una técnica de Jiu Jitsu/Judo/Wrestling, es una filosofía de vida.`,`El dolor del entrenamiento es temporal, pero el orgullo de la victoria sobre ti mismo es eterno.`,`No busques una vida fácil, busca la fortaleza mental para superar una difícil.`,`Tu mayor rival no está frente a ti con guantes, está dentro de ti pidiendo que te detengas. No lo escuches.`],s=()=>{let e=document.getElementById(`motivational-quote`);e&&(e.innerText=`"${o[Math.floor(Math.random()*o.length)]}"`)},c=()=>{let e=document.getElementById(`nav-admin`),t=document.getElementById(`btn-back-admin`),n=document.getElementById(`btn-dashboard-back-admin`);a.role===`admin`?a.isAdminMode?(e&&e.classList.remove(`hidden`),t&&t.classList.remove(`hidden`),n&&n.classList.remove(`hidden`)):(e&&e.classList.add(`hidden`),t&&t.classList.remove(`hidden`),n&&n.classList.remove(`hidden`)):(e&&e.classList.add(`hidden`),t&&t.classList.add(`hidden`),n&&n.classList.add(`hidden`))},l=e=>{`${e}`,a.isAdminMode=e,localStorage.setItem(`isAdminMode`,e),c(),e?(m(`admin-panel`),showToast(`Modo Administrador Activo 🛡️`,`#ef4444`)):(m(`dashboard`),showToast(`Modo Usuario Activo 👤`))};typeof MercadoPago<`u`&&new MercadoPago(`APP_USR-126c732c-4185-4911-82a0-e7452c2f1243`,{locale:`es-CL`});let u={async createPreference(e){console.log(`Creando Preferencia de Mercado Pago para:`,e.name),showToast(`Conectando con Mercado Pago... 💳`,`#22c55e`);let t=$.currentUser;if(!t)return showToast(`Debes iniciar sesión`,`#ef4444`);try{let{data:n,error:r}=await window.supabase.functions.invoke(`create-mp-preference`,{body:{plan:e,userId:t.uid,userEmail:t.email}});if(r)throw Error(`Error en el servidor al generar el pago: `+r.message);if(a.activePromo&&await window.supabase.from(`profiles`).update({active_promo:a.activePromo.code}).eq(`id`,t.uid),n&&n.init_point)showToast(`Redirigiendo a entorno seguro... 🔒`,`#22c55e`),window.location.href=n.init_point;else throw Error(`No se pudo obtener el link de pago`)}catch(e){console.error(`Payment creation error:`,e),showToast(`Fallo al conectar con la pasarela de pagos ❌`,`#ef4444`)}}},d=document.querySelectorAll(`.nav-item`),f=document.querySelectorAll(`.screen`),p=e=>{e&&(e.classList.remove(`screen-appear`),e.offsetWidth,e.classList.add(`screen-appear`))},m=e=>{`${e}`,d.forEach(t=>{t.getAttribute(`data-screen`)===e?t.classList.add(`active`):t.classList.remove(`active`)}),f.forEach(e=>{e.classList.remove(`active`),e.classList.remove(`screen-appear`)});let t=document.getElementById(e);t&&(t.classList.add(`active`),p(t)),e===`dashboard`&&(D(),O(),ie(),s()),e===`schedule`&&W(),e===`tournaments`&&G(),e===`notifications`&&ae(),e===`profile`&&g()},h=e=>{if(a.attendanceHistoryCount=e.length,!e||e.length===0){a.currentMonthAttendance=0,a.currentStreak=0;return}let t=new Date,n=t.getMonth(),r=t.getFullYear();a.currentMonthAttendance=e.filter(e=>{let t=new Date(e.attended_at);return t.getMonth()===n&&t.getFullYear()===r}).length;let i=[...new Set(e.map(e=>new Date(e.attended_at).toISOString().split(`T`)[0]))].sort().reverse(),o=0,s=new Date,c=s.toISOString().split(`T`)[0];if(i.includes(c))o++,s.setDate(s.getDate()-1);else{let e=new Date;e.setDate(e.getDate()-1);let t=e.toISOString().split(`T`)[0];i.includes(t)&&(o++,s.setDate(s.getDate()-2))}if(o>0)for(;;){let e=s.toISOString().split(`T`)[0];if(i.includes(e))o++,s.setDate(s.getDate()-1);else break}a.currentStreak=o},g=async()=>{let e=$.currentUser;if(e)try{let t=await r.getAttendance(e.uid);h(t);let n=new Date,i=[0,0,0,0];t.forEach(e=>{let t=new Date(e.attended_at),r=Math.floor((n-t)/(1e3*60*60*24)),a=Math.floor(r/7);a>=0&&a<4&&i[3-a]++}),k(),T(i)}catch(e){console.error(`Error updating profile stats:`,e)}},_=0,v=null;d.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-screen`);if(a.role===`admin`)if(t===`dashboard`){if(_++,`${_}`,clearTimeout(v),_>=3){l(!0),_=0;return}v=setTimeout(()=>{_=0},1e3)}else _=0;if(t===`admin-panel`)if(a.role===`admin`)l(!0);else{showToast(`Acceso restringido 🔒`,`#ef4444`);return}m(t)})});let y=!1;window.supabase.auth.onAuthStateChange(async(e,t)=>{if(e===`SIGNED_IN`&&!y||e===`INITIAL_SESSION`&&y)return;e===`INITIAL_SESSION`&&(y=!0);let n=t?.user,i=null;n?(i={...n,uid:n.id,email:n.email},a.user=i):a.user=null;let o=document.getElementById(`auth-screen`),s=document.getElementById(`app-container`);if(i){o.innerHTML=`
                <div style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column; background: var(--bg-dark, #0d0d12);">
                    <div style="width: 220px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 25px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
                        <div style="height: 100%; background: linear-gradient(90deg, var(--accent-cyan, #00f0ff), var(--neon-blue, #0055ff)); border-radius: 10px; animation: cyberLoad 1.5s infinite ease-in-out alternate; width: 60%; box-shadow: 0 0 10px var(--accent-cyan, #00f0ff);"></div>
                    </div>
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 600; letter-spacing: 2px; animation: pulseText 1.5s infinite alternate; font-family: 'Inter', sans-serif;">CARGANDO DATOS...</p>
                    <style>
                    @keyframes cyberLoad { 0% { transform: translateX(-100%); } 100% { transform: translateX(150%); } }
                    @keyframes pulseText { 0% { opacity: 0.4; } 100% { opacity: 1; } }
                    </style>
                </div>`;try{let e=await r.getProfile(i.uid);if(e||=(await r.createProfile(i),await r.getProfile(i.uid)),sessionStorage.getItem(`mp_payment_success`)===`true`){sessionStorage.removeItem(`mp_payment_success`);try{let t=(await r.getPayments(i.uid)).find(e=>e.status===`pending`);if(t){await r.updatePaymentStatus(t.id,`approved`,`mercadopago`),showToast(`Pago validado automáticamente ✨`,`#22c55e`);let n=new Date;n.setMonth(n.getMonth()+1),await r.updateProfile(i.uid,{membership_status:`active`,membership_expiry:n.toISOString().split(`T`)[0]}),e=await r.getProfile(i.uid)}}catch(e){console.error(`Error confirmando pago:`,e)}}a.role=e.role||`athlete`,a.role===`admin`?a.isAdminMode=!0:a.isAdminMode=!1,a.level=e.level||0,a.xp=e.xp||0,a.membershipLimit=e.membership_limit||2,a.membershipStatus=e.membership_status||`inactive`,a.planTheme=e.membership_plans?.theme||`bronze`,a.plan=e.membership_plan_id,a.photoURL=e.photo_url||`../images/icon-192.png`,h(await r.getAttendance(i.uid)||[]),a.role===`admin`?a.notifications=await r.getNotifications():a.notifications=(await r.getNotifications()).filter(e=>e.is_active!==!1);let t=document.querySelector(`.greeting`);t&&(t.textContent=`¡Hola, ${e.full_name||i.displayName||`Atleta`}!`),j(i.uid);let n=document.getElementById(`profile-plan-name`),u=document.getElementById(`profile-plan-status`),d=document.getElementById(`profile-plan-remaining`),f=document.getElementById(`profile-plan-progress`);if(n&&(n.textContent=e.membership_plans?.name||(e.membership_status===`active`?`PLAN ACTIVO`:`SIN PLAN`),e.membership_expiry)){let t=new Date(e.membership_expiry),n=new Date;if(t>n){u.textContent=`ACTIVO`,u.style.background=`#22c55e`;let e=Math.ceil((t-n)/(1e3*60*60*24));d.textContent=`${e} Días restantes`;let r=Math.max(0,Math.min(100,(30-e)/30*100));f&&(f.style.width=`${r}%`)}else u.textContent=`INACTIVO`,u.style.background=`#ef4444`,d.textContent=`Renovación requerida`}k();let g=document.getElementById(`user-combat-style`);g&&(g.value=e.combat_style||`striker`,g.onchange=async e=>{let t=e.target.value;window.showLoading(`Guardando estilo...`);try{await r.updateProfile(i.uid,{combat_style:t}),window.hideLoading(),showToast(`¡Estilo actualizado!`,`#22c55e`)}catch(e){console.error(e),showToast(`Error al guardar estilo`,`#ef4444`)}}),window.supabase.channel(`profile:${i.uid}`).on(`postgres_changes`,{event:`UPDATE`,filter:`id=eq.${i.uid}`,schema:`public`,table:`profiles`},t=>{let n=t.new;Object.assign(e,n),a.level=n.level,a.xp=n.xp,a.membershipLimit=n.membership_limit,a.membershipStatus=n.membership_status||`inactive`,g&&n.combat_style&&(g.value=n.combat_style),k(),c()}).subscribe();try{let[e,t,n,o]=await Promise.all([r.getClasses(),r.getPlans(),r.getTournaments(i.uid),r.getUserReservations(i.uid)]);e&&(a.classes=e),t&&(a.plans=t,window.renderPaymentTabs&&window.renderPaymentTabs()),n&&(a.tournaments=n),o&&(a.allUserReservations=o,a.xp=(a.xp||0)+o.length*50),W(),G()}catch(e){console.error(`Error fetching initial data:`,e)}try{console.log(`Global notifications listener (Firebase) disabled.`)}catch(e){console.error(`Error setting up global notifications listener:`,e)}window.supabase.channel(`global-data`).on(`postgres_changes`,{event:`*`,schema:`public`,table:`classes`},async()=>{a.classes=await r.getClasses(),W()}).on(`postgres_changes`,{event:`*`,schema:`public`,table:`membership_plans`},async()=>{a.plans=await r.getPlans()}).on(`postgres_changes`,{event:`*`,schema:`public`,table:`tournaments`,filter:`user_id=eq.${i.uid}`},async()=>{a.tournaments=await r.getTournaments(i.uid),G(),ie()}).subscribe(),a.role===`admin`&&window.supabase.channel(`admin-payments`).on(`postgres_changes`,{event:`*`,schema:`public`,table:`payments`},async()=>{let e=document.querySelector(`#admin-content-area h3`)?.innerText;e&&(e.includes(`Validación de Pagos`)||e.includes(`Pagos`))&&te(),showToast(`¡Actualización de pago detectada! 💳`,`#22c55e`)}).subscribe(),a.unsubscribeReservations&&a.unsubscribeReservations();let _=window.supabase.channel(`reservations:${i.uid}`).on(`postgres_changes`,{event:`*`,filter:`user_id=eq.${i.uid}`,schema:`public`,table:`reservations`},async()=>{a.reservations=(await r.getReservations(a.selectedDate)).filter(e=>e.user_id===i.uid).map(e=>e.class_id),a.allUserReservations=await r.getUserReservations(i.uid),a.xp=(e.xp||0)+(a.allUserReservations?.length||0)*50,k(),W(),D()}).subscribe();a.unsubscribeReservations=()=>{window.supabase.removeChannel(_)},a.reservations=(await r.getReservations(a.selectedDate)).filter(e=>e.user_id===i.uid).map(e=>e.class_id),W(),D(),a.role=e.role||`athlete`;let v=document.getElementById(`nav-admin`),y=document.querySelectorAll(`.nav-item:not(#nav-admin)`);a.role===`admin`?y.forEach(e=>e.classList.remove(`hidden`)):v&&v.classList.add(`hidden`),c(),ee();let b=document.getElementById(`btn-back-admin`),x=document.getElementById(`btn-dashboard-back-admin`);if(b&&(b.onclick=()=>l(!0)),x&&(x.onclick=()=>l(!0)),a.role!==`admin`&&e.membership_status!==`active`){s.classList.add(`hidden`);let t=new Date,n=`${t.getMonth()}-${t.getFullYear()}`,r=e.proRataMonthYear||``;e.proRataPreference&&r===n?a.proRataPreference=e.proRataPreference:e.proRataPreference&&(a.proRataPreference=null,db.collection(`users`).doc(i.uid).set({proRataPreference:null,proRataMonthYear:null,proRataSelectionDate:null,proRataExpiredInMonth:!0},{merge:!0}).catch(e=>console.error(`Error resetting data:`,e))),e.proRataExpiredInMonth&&(showToast(`⚠️ Tu opción proporcional anterior expiró al terminar el mes. Se ha restablecido a pago de mes completo.`,`#8b5cf6`),window.supabase.from(`profiles`).update({pro_rata_expired_in_month:null}).eq(`id`,i.uid).catch(e=>console.error(`Error clearing expiration flag:`,e))),N();let o=t.getDate();if(!a.proRataPreference&&o>=15){let e=document.getElementById(`pro-rata-info-screen`),r=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),p(e)),r&&r.classList.add(`hidden`);let o=async o=>{try{a.proRataPreference=o,await db.collection(`users`).doc(i.uid).set({proRataPreference:o,proRataMonthYear:n,proRataSelectionDate:t.toISOString()},{merge:!0}),N(),e&&e.classList.add(`hidden`),r&&(r.classList.remove(`hidden`),p(r))}catch(e){console.error(`Error saving preference:`,e),showToast(`Error al guardar preferencia`,`#ef4444`)}};document.getElementById(`btn-option-proportional`).onclick=()=>o(`proportional`),document.getElementById(`btn-option-full`).onclick=()=>o(`full`)}else{document.getElementById(`pro-rata-info-screen`).classList.add(`hidden`);let e=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),p(e))}}else if(o.classList.add(`hidden`),s.classList.remove(`hidden`),window.location.hash===`#payments`)m(`profile`),document.getElementById(`payment-modal`)?.classList.add(`active`);else if(m(a.isAdminMode?`admin-panel`:`dashboard`),a.isAdminMode){let e=document.getElementById(`admin-content-area`);e&&(e.innerHTML=`<div class="p-20 text-center glass" style="border-radius: 12px; margin-top: 20px;">
                                    <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--accent-purple); margin-bottom: 10px;"></i>
                                    <h3>Panel de Control</h3>
                                    <p style="color: var(--text-gray); font-size: 0.9rem;">Selecciona una opción del menú superior para comenzar.</p>
                                </div>`,window.lucide&&window.lucide.createIcons())}}catch(e){console.error(`Sync error:`,e),o.classList.add(`hidden`),s.classList.remove(`hidden`),m(`dashboard`)}D(),O(),M(),k();let e=document.getElementById(`profile-user-name`),t=document.getElementById(`nav-user-name`),n=i.displayName||(a.role===`admin`?`Administrador`:`Atleta`);e&&(e.innerText=n),t&&(t.innerText=n);let u=document.getElementById(`profile-avatar`);u&&(u.src=a.photoURL||`../images/icon-192.png`)}else o.classList.remove(`hidden`),p(o),s.classList.add(`hidden`)}),i(m,N);let b=document.getElementById(`btn-edit-avatar`),x=document.getElementById(`btn-delete-avatar`),S=document.getElementById(`avatar-input`);b&&S&&(b.onclick=()=>S.click(),S.onchange=async e=>{let t=e.target.files[0];if(!t)return;let n=$.currentUser;if(n){showToast(`Subiendo imagen... 📸`);try{let e=await r.uploadAvatar(n.uid,t);await n.updateProfile({photoURL:e}),await r.updateProfile(n.uid,{photo_url:e});let i=document.getElementById(`profile-avatar`);i&&(i.src=e),showToast(`Foto de perfil actualizada ✨`,`#22c55e`)}catch(e){console.error(e),showToast(`Error al subir foto ❌`,`#ef4444`)}}}),x&&(x.onclick=async()=>{let e=$.currentUser;if(e){showToast(`Eliminando foto... 🗑️`);try{await e.updateProfile({photoURL:``}),await r.updateProfile(e.uid,{photo_url:null});let t=document.getElementById(`profile-avatar`);t&&(t.src=`../images/icon-192.png`),showToast(`Foto eliminada ✅`)}catch(e){console.error(e),showToast(`Error al eliminar ❌`,`#ef4444`)}}});let C=document.getElementById(`btn-exit-admin-mode`);C&&(C.onclick=()=>l(!1));let w=null,T=(e=[0,0,0,0])=>{let t=document.getElementById(`attendanceChart`);if(!t)return;w&&w.destroy();let n=e.every(e=>e===0)?[0,0,0,0]:e;w=new Chart(t,{type:`line`,data:{labels:[`Sem 1`,`Sem 2`,`Sem 3`,`Sem 4`],datasets:[{label:`Clases`,data:n,borderColor:`#CBF2F0`,tension:.4,fill:!0,backgroundColor:`rgba(203, 242, 240, 0.1)`}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{display:!1,beginAtZero:!0},x:{grid:{display:!1}}}}})},ee=()=>{let e=document.querySelector(`.date-carousel-premium`);if(!e)return;let t=[`DOM`,`LUN`,`MAR`,`MIÉ`,`JUE`,`VIE`,`SÁB`],n=new Date,i=``;for(let e=0;e<7;e++){let r=new Date;r.setDate(n.getDate()+e);let o=r.toISOString().split(`T`)[0],s=o===a.selectedDate;i+=`
                <div class="date-chip ${s?`active`:``}" data-date="${o}">
                    <span>${t[r.getDay()]}</span>
                    <p>${r.getDate()}</p>
                </div>
            `}e.innerHTML=i,e.querySelectorAll(`.date-chip`).forEach(e=>{e.onclick=async()=>{a.selectedDate=e.getAttribute(`data-date`),ee();let t=$.currentUser;t&&(a.reservations=(await r.getReservations(a.selectedDate)).filter(e=>e.user_id===t.uid).map(e=>e.class_id),W())}})},E=!1;window.toggleReservation=async e=>{if(E)return;let t=$.currentUser;if(!t){showToast(`Inicia sesión 🔒`,`#ef4444`);return}let n=new Date,i=n.getFullYear()+`-`+String(n.getMonth()+1).padStart(2,`0`)+`-`+String(n.getDate()).padStart(2,`0`);if(a.role!==`admin`&&a.selectedDate!==i){showToast(`Solo puedes agendar clases para el día de hoy 📅`,`#ef4444`);return}let o=a.classes.find(t=>t.id===e);if(!o)return;let s=a.reservations.includes(e);E=!0;try{if(s){let n=new Date,i=(new Date(`${a.selectedDate}T${o.time}`)-n)/(1e3*60*60);if(a.role!==`admin`&&i<1){showToast(`No puedes cancelar a menos de 1 hr ⏳`,`#ef4444`);return}await r.deleteReservation(t.uid,e,a.selectedDate),a.reservations=a.reservations.filter(t=>t!==e),a.allUserReservations&&=a.allUserReservations.filter(t=>!(t.class_id===e&&t.reservation_date===a.selectedDate)),setTimeout(()=>{W(),D(),O()},0),showToast(`Reserva cancelada 🗓️`,`#71717A`)}else{if(a.membershipStatus!==`active`&&a.role!==`admin`){showToast(`Membresía inactiva. ¡Actívala ahora! 🔒`,`#f59e0b`),m(`membership`);return}if(a.plan){let e=a.plans.find(e=>e.name===a.plan||e.id===a.plan);if(e&&e.days&&e.days.length>0){let t=new Date(a.selectedDate+`T12:00:00`).getDay();if(!e.days.includes(t))return showToast(`Plan no válido para este día 🗓️`,`#ef4444`)}let t=a.selectedDate.substring(0,7),n=a.allUserReservations?a.allUserReservations.filter(e=>e.reservation_date&&e.reservation_date.startsWith(t)):[],r=999;if(e&&(r=e.monthly||999),n.length>=r){let e=document.getElementById(`upsell-modal`);return e&&(e.classList.remove(`hidden`),lucide.createIcons()),E=!1,showToast(`Límite mensual agotado ⚠️`,`#eab308`)}}if(a.reservations.length>=a.membershipLimit){let e=document.getElementById(`upsell-modal`);return e&&(e.classList.remove(`hidden`),lucide.createIcons()),E=!1,showToast(`Límite diario alcanzado ⚠️`,`#eab308`)}await r.createReservation(t.uid,e,o.name,a.selectedDate),a.reservations.includes(e)||a.reservations.push(e),a.allUserReservations&&a.allUserReservations.push({user_id:t.uid,class_id:e,class_name:o.name,reservation_date:a.selectedDate}),setTimeout(()=>{W(),D(),O()},0);let n=10,i=(o.type||``).toLowerCase();(i.includes(`gi`)||i.includes(`no-gi`))&&(n=15),i.includes(`open`)&&(n=5),await r.updateProfile(t.uid,{xp:(a.xp||0)+n}),a.xp=(a.xp||0)+n,k(),showToast(`¡Clase reservada con éxito! 🥋`,`#22c55e`)}}catch(e){console.error(`Supabase Reservation Error:`,e),showToast(`Error procesando reserva ❌`,`#ef4444`)}finally{E=!1}},window.renderSchedule=W,window.renderTournaments=G;let D=()=>{let e=document.getElementById(`attendance-circle`),t=document.getElementById(`attendance-percent`),n=document.getElementById(`completed-classes-count`),r=document.getElementById(`user-streak-text`);if(r&&(r.innerText=`${a.currentStreak||0} Días`),e&&t){let r=a.membershipLimit||5;r>10&&(r=5);let i=r*4,o=a.currentMonthAttendance||0,s=Math.min(100,Math.round(o/i*100)),c=`var(--amaru-gold)`;c=s<50?`#ef4444`:s<100?`#eab308`:`#22c55e`,e.style.stroke=c;let l=188.5-s/100*188.5;if(e.style.strokeDashoffset=l,t.innerText=`${s}%`,n){let e=o,t=0,r=e=>{n.innerHTML=`${e} <span style="font-size: 1rem; color: var(--text-gray); font-weight: 600;">/ ${i}</span>`};if(e>0){let n=Math.max(1,Math.ceil(e/(1500/30))),i=setInterval(()=>{if(t+=n,t>=e){if(t=e,clearInterval(i),r(t),s>=100&&$.currentUser){let e=`goal_reward_${new Date().getFullYear()}_${new Date().getMonth()}_${$.currentUser.uid}`;localStorage.getItem(e)||ne(e)}}else r(t)},30)}else r(0)}}},ne=async e=>{typeof confetti==`function`&&confetti({particleCount:150,spread:80,origin:{y:.6},colors:[`#D4AF37`,`#ffffff`,`#22c55e`]}),showToast(`¡Meta Mensual Alcanzada! +500 XP Extra 🏆`,`var(--amaru-gold)`);try{let t=$.currentUser;t&&(a.xp=(a.xp||0)+500,await r.updateProfile(t.uid,{xp:a.xp}),k(),localStorage.setItem(e,`true`))}catch(e){console.error(`Error giving month reward`,e)}},O=()=>{let e=document.getElementById(`dynamic-next-class`);if(!e)return;let t=new Date,n=t.toISOString().split(`T`)[0],r=t.getHours()*60+t.getMinutes();t.getDay();let i=null,o=!1;if(a.allUserReservations&&a.allUserReservations.length>0){let e=a.allUserReservations.filter(e=>e.reservation_date>=n).map(e=>{let t=a.classes.find(t=>t.id===e.class_id);if(!t)return null;let[n,r]=t.time.split(`:`).map(Number);return{...e,classData:t,totalMinutes:n*60+r}}).filter(e=>e!==null).sort((e,t)=>e.reservation_date===t.reservation_date?e.totalMinutes-t.totalMinutes:e.reservation_date.localeCompare(t.reservation_date)).find(e=>e.reservation_date>n?!0:e.totalMinutes>r+10);e&&(i=e.classData,o=!0)}if(!i&&a.classes.length>0)for(let e=0;e<7;e++){let n=new Date;n.setDate(t.getDate()+e);let o=n.getDay(),s=a.classes.filter(e=>{let t=e.days;if(typeof t==`string`)try{t=JSON.parse(t)}catch{}return Array.isArray(t)&&t.includes(o)}).sort((e,t)=>{let[n,r]=e.time.split(`:`).map(Number),[i,a]=t.time.split(`:`).map(Number);return n*60+r-(i*60+a)});if(e===0){let e=s.find(e=>{let[t,n]=e.time.split(`:`).map(Number);return t*60+n>r});if(e){i=e;break}}else if(s.length>0){i=s[0];break}}if(i){if(e.classList.remove(`smoke-purple`,`smoke-cyan`,`smoke-gold`,`smoke-crimson`),i.theme&&e.classList.add(i.theme),e.innerHTML=`
                <div class="card-overlay" style="backdrop-filter: blur(12px); background: linear-gradient(90deg, rgba(8, 8, 10, 0.95) 0%, rgba(8, 8, 10, 0.45) 100%);"></div>
                <div class="hero-content">
                    <span class="tag" style="background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        ${o?`TU PRÓXIMA CITA`:`PRÓXIMA CLASE`}
                    </span>
                    <h2 style="color: white; font-weight: 900; margin: 10px 0 5px; font-size: 1.8rem; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${i.name}</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 500;"><i data-lucide="clock" style="width:14px; vertical-align: middle; margin-right: 4px;"></i> ${i.time} • Coach ${i.coach}</p>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        ${o?`<button class="btn-primary" id="btn-checkin-dash" style="background:white; color:black; padding: 12px 24px; font-size:0.8rem; border-radius:100px; border:none; font-weight:900; box-shadow: 0 4px 15px rgba(255,255,255,0.2);">MARCAR ASISTENCIA (+25 XP)</button>`:``}
                        <button class="btn-glass" id="btn-dashboard-go-schedule" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 12px 24px; font-size: 0.8rem; border-radius: 100px;">VER AGENDA</button>
                    </div>
                </div>
            `,lucide.createIcons(),o){let e=document.getElementById(`btn-checkin-dash`);e&&(e.onclick=()=>re(i))}document.getElementById(`btn-dashboard-go-schedule`).onclick=()=>{let e=document.querySelector(`[data-screen="schedule"]`);e&&e.click()}}else e.innerHTML=`<div class="p-30 text-center opacity-50">No hay clases programadas próximamente</div>`},re=async e=>{let t=$.currentUser;if(t){showToast(`Registrando asistencia... 🥋`);try{await r.logAttendance(t.uid,e.id,e.name);let n=(a.xp||0)+25;await r.updateProfile(t.uid,{xp:n}),a.xp=n,a.attendanceHistoryCount++,showToast(`¡Asistencia confirmada! +25 XP 🔥`,`#22c55e`),k(),O(),D()}catch(e){console.error(`Check-in error:`,e),showToast(`Ya registraste asistencia hoy o hubo un error 🛡️`,`#eab308`)}}},ie=()=>{let e=document.getElementById(`motivation-container`);if(!e)return;e.innerHTML=``;let t=a.tournaments[0];if(t){let n=new Date(t.date)-new Date,r=Math.floor(n/(1e3*60*60*24));if(r>0){let n=document.createElement(`div`);n.className=`glass-premium tournament-countdown-card`,n.style.margin=`0 20px 20px`,n.style.position=`relative`,n.style.overflow=`hidden`,n.innerHTML=`
                    <div class="countdown-bg-glow"></div>
                    <div style="position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div class="trophy-pulse">
                                <i data-lucide="trophy" style="color: #FFD700; width: 28px; height: 28px;"></i>
                            </div>
                            <div>
                                <h4 style="font-size: 0.95rem; font-weight: 800; letter-spacing: 0.5px;">OBJETIVO: ${t.name.toUpperCase()}</h4>
                                <p style="font-size: 0.75rem; color: var(--text-gray);">Faltan <span style="color: var(--accent-cyan); font-weight: 800;">${r} días</span> para la gloria</p>
                            </div>
                        </div>
                        <div class="countdown-digits">
                            <span class="digit">${r}</span>
                            <span class="unit">DÍAS</span>
                        </div>
                    </div>
                    <div class="tournament-progress-mini">
                        <div class="t-progress-fill" style="width: ${Math.max(5,100-r*3.3)}%"></div>
                    </div>
                `,e.prepend(n)}}lucide.createIcons()},k=()=>{let e=document.getElementById(`user-rank-status`),t=document.querySelector(`.rank-bar-fill`),n=document.querySelector(`.rank-info-text`),r=a.planTheme===`gold`?100:a.planTheme===`silver`?30:10,i=Math.floor(a.xp||0),o=Math.min(Math.floor(i/100),r),s=Math.min(i%100/100*100,100);o>=r&&(s=100);let c=o<10?`Nomad`:o<30?`Warrior`:o<50?`Elite`:`Legend`;a.level=o,a.role===`admin`?(e&&(e.innerText=`ADMINISTRADOR • Elite`),t&&(t.style.width=`100%`),n&&(n.innerHTML=`<span>MAX XP</span><strong>100%</strong>`)):(e&&(e.innerText=`Nivel ${o} • ${c}`),t&&(t.style.width=`${s}%`),n&&(n.innerHTML=`<span>${i} / ${r*100} XP Max</span><strong>${Math.floor(s)}% Lvl Up</strong>`));let l=document.querySelector(`#profile-user-level span`);l&&(l.innerText=a.role===`admin`?`MAX`:o);let u=document.querySelector(`.lvl-fill`),d=document.querySelector(`.level-indicator span`);u&&(u.style.width=a.role===`admin`?`100%`:`${s}%`),d&&(d.innerText=a.role===`admin`?`LVL MAX`:`NVL ${o}`);let f=document.querySelector(`.stat-box:nth-child(2) .stat-value`);f&&(f.innerText=a.attendanceHistoryCount||0),A()},A=()=>{let e=document.getElementById(`user-badges-container`);e&&(e.innerHTML=[{id:`Novato`,icon:`shield`,unlocked:a.role===`admin`||a.attendanceHistoryCount>=5,desc:`5 Clases tomadas`,msg:`¡El inicio de la grandeza empieza con el primer paso!`},{id:`Constante`,icon:`calendar-check`,unlocked:a.role===`admin`||a.attendanceHistoryCount>=20,desc:`20 Clases tomadas`,msg:`La disciplina es el puente entre metas y logros.`},{id:`Guerrero`,icon:`zap`,unlocked:a.role===`admin`||a.level>=10,desc:`Alcanza Nivel 10`,msg:`Tus rivales tiemblan ante tu poder.`},{id:`Elite`,icon:`crown`,unlocked:a.role===`admin`||a.level>=50,desc:`Alcanza Nivel 50`,msg:`¡Eres una leyenda viviente en el tatami!`}].map(e=>`
            <div class="badge-item ${e.unlocked?``:`locked`}" title="${e.id}: ${e.desc}" ${e.unlocked?`onclick="this.classList.toggle('flipped')"`:``}>
                <div class="badge-card-inner">
                    <div class="badge-card-front">
                        <div class="badge-icon"><i data-lucide="${e.icon}"></i></div>
                    </div>
                    <div class="badge-card-back">
                        <p>${e.msg}</p>
                    </div>
                </div>
            </div>
        `).join(``),lucide.createIcons())},j=async e=>{try{console.log(`Firebase Messaging removed. Push notifications require Supabase/OneSignal setup.`)}catch(e){console.error(`Error initializing Firebase Messaging:`,e)}},ae=()=>{let e=document.getElementById(`notifications-list`);if(!e)return;let t=[];if(a.membershipExpiry){let e=new Date(a.membershipExpiry)-new Date,n=Math.ceil(e/(1e3*60*60*24));if(n<=10&&n>=0){let e=n<=3;t.push(`
                    <div class="notification-item glass ${e?`critical`:``}" style="border-left-color: var(--accent-cyan);">
                        <div class="notif-icon ${e?`pulse`:``}" style="color: var(--accent-cyan);">
                            <i data-lucide="credit-card"></i>
                        </div>
                        <div class="notif-content">
                            <h4>Renovación de Plan</h4>
                            <p>Tu plan Elite vence en <strong>${n} días</strong>. ¡No te quedes sin entrenar!</p>
                            <span class="notif-time">Recordatorio Administrativo</span>
                        </div>
                        ${e?`<div class="critical-badge" style="background:var(--accent-cyan)">RENOVAR</div>`:``}
                    </div>
                `)}}a.level===0&&(a.xp||0)<5&&t.push(`
                <div class="notification-item glass" style="border-left-color: var(--accent-purple);">
                    <div class="notif-icon" style="color: var(--accent-purple);">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <div class="notif-content">
                        <h4>¡Bienvenido a AmaruApp! 🥋</h4>
                        <p>Nos alegra tenerte en el equipo. Explora la app, revisa los planes disponibles y prepárate para tu primer entrenamiento.</p>
                        <span class="notif-time">Mensaje de Bienvenida</span>
                    </div>
                </div>
            `);let n=a.notifications.map(e=>{let t=`bell`,n=`var(--accent-purple)`,r=``;return e.type===`welcome`?t=`sparkles`:e.type===`alert`?(t=`alert-triangle`,n=`#ef4444`,r=`<div class="critical-badge" style="background:#ef4444">URGENTE</div>`):e.type===`calendar`&&(t=`calendar`,n=`#f59e0b`,r=`<div class="critical-badge" style="background:#f59e0b">IMPORTANTE</div>`),`
            <div class="notification-item glass" style="border-left-color: ${n};">
                <div class="notif-icon" style="color: ${n};">
                    <i data-lucide="${t}"></i>
                </div>
                <div class="notif-content">
                    <h4>${e.title}</h4>
                    <p>${e.message}</p>
                    <span class="notif-time">${new Date(e.date||e.time||Date.now()).toLocaleDateString()}</span>
                </div>
                ${r}
            </div>
            `}),r=a.tournaments.map(e=>{let t=Math.ceil((new Date(e.date)-new Date)/(1e3*60*60*24)),n=t<=7;return`
            <div class="notification-item glass ${n?`critical`:``}">
                <div class="notif-icon ${n?`pulse`:``}">
                    <i data-lucide="trophy"></i>
                </div>
                <div class="notif-content">
                    <h4>Nueva Alerta de Torneo</h4>
                    <p>Faltan <strong>${t} días</strong> para <strong>${e.name}</strong> en ${e.place}.</p>
                    <span class="notif-time">Aviso Deportivo</span>
                </div>
                ${n?`<div class="critical-badge">EVENTO</div>`:``}
            </div>`});e.innerHTML=[...t,...n,...r].join(``)||`<div class="p-20 text-center opacity-50">No hay notificaciones nuevas.</div>`,lucide.createIcons()},M=async()=>{let e=document.getElementById(`payment-history-list`),t=document.getElementById(`current-membership-progress`),n=document.getElementById(`btn-view-plans`);if(n&&(n.onclick=()=>{let e=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),p(e)),typeof N==`function`&&N()}),!(!e||!$.currentUser)){if(t)try{let e=await r.getProfile($.currentUser.uid);if(e&&e.membership_status===`active`){let n=e.membership_plans?.name||`PLAN ACTIVO`;e.membership_plans?.theme;let r=e.membership_plans?.class_limit||e.membership_limit||0,i=0,o=0;if(e.membership_expiry){let t=new Date(e.membership_expiry);o=Math.max(0,Math.ceil((t-new Date)/(1e3*60*60*24)));let n=new Date(t);n.setDate(n.getDate()-30),a.allUserReservations&&(i=a.allUserReservations.filter(e=>{let r=new Date(e.reservation_date);return r>=n&&r<=t}).length)}let s=r>0?Math.min(i/r*100,100):i>0?100:0;t.innerHTML=`
                        <div class="membership-card-interactive" id="membership-main-info" style="cursor:pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 5px; border-radius: 12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <span style="font-size:0.95rem; font-weight:800; color:var(--accent-purple); letter-spacing: 0.5px;">${n}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); font-weight:600; text-transform: uppercase;">Estado: Activo</span>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size:0.85rem; color: #fff; font-weight: 800;">${o}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display: block;">días restantess</span>
                                </div>
                            </div>
                            
                            <div class="progress-bar-bg" style="height:10px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                                <div class="progress-bar-fill" style="height:100%; width:${s}%; background: linear-gradient(90deg, var(--accent-purple), #fff); border-radius:10px; transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                            </div>
                            
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                                <p style="font-size:0.75rem; color:rgba(255,255,255,0.8); font-weight: 600;">Utilizado: <span style="color:var(--accent-purple);">${i}</span> / ${r} clases</p>
                                <div id="toggle-membership-indicator" style="background: rgba(255,255,255,0.1); border-radius: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255,255,255,0.1);">
                                    <i data-lucide="chevron-down" style="width: 14px; height: 14px; color: white;"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div id="membership-extra-details" class="hidden" style="margin-top:20px; padding-top:20px; border-top: 1px solid rgba(255,255,255,0.1); animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
                            <div class="details-stats-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom: 20px;">
                                <div class="detail-stat glass" style="padding:15px; text-align:center; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02); position: relative; overflow: hidden;">
                                    <i data-lucide="bookmark" style="position: absolute; top: 10px; right: 10px; width: 12px; opacity: 0.2;"></i>
                                    <span style="display:block; font-size:0.6rem; color:var(--text-gray); text-transform:uppercase; font-weight:800; margin-bottom:6px; letter-spacing: 1px;">Reservas Realizadas</span>
                                    <strong style="font-size:1.6rem; color: white; font-weight: 900;">${a.allUserReservations?.length||0}</strong>
                                    <p style="font-size:0.6rem; color:var(--accent-purple); font-weight: 700; margin-top: 4px;">Total Histórico</p>
                                </div>
                                <div class="detail-stat glass" style="padding:15px; text-align:center; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);">
                                    <span style="display:block; font-size:0.6rem; color:var(--text-gray); text-transform:uppercase; font-weight:800; margin-bottom:6px; letter-spacing: 1px;">Clases Activas</span>
                                    <strong style="font-size:1.6rem; color: #fff; font-weight: 900;">${a.attendanceHistoryCount||0}</strong>
                                    <p style="font-size:0.6rem; color:#10b981; font-weight: 700; margin-top: 4px;">En Sistema</p>
                                </div>
                            </div>
                            
                            <div class="membership-info-banner glass" style="padding:15px; border-radius:20px; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 15px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="background: var(--accent-purple); width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="calendar" style="width: 18px; color: black;"></i>
                                    </div>
                                    <div style="flex: 1;">
                                        <p style="font-size:0.8rem; color: white; font-weight: 800;">Renovación del Plan</p>
                                        <p style="font-size:0.7rem; color: var(--text-gray); font-weight: 500;">Tu suscripción se renueva el <span style="color: white; font-weight: 700;">${e.membership_expiry?new Date(e.membership_expiry).toLocaleDateString(`es-ES`,{day:`numeric`,month:`long`,year:`numeric`}):`pronto`}</span></p>
                                    </div>
                                </div>
                                <button id="btn-renew-advance-plan" class="btn-primary" style="width: 100%; border-radius: 12px; padding: 10px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); transition: all 0.3s ease;">
                                    <i data-lucide="credit-card" style="width: 16px;"></i> Renovar / Adelantar Pago
                                </button>
                            </div>
                        </div>
                    `;let c=t.querySelector(`#membership-main-info`),l=t.querySelector(`#membership-extra-details`),u=t.querySelector(`#toggle-membership-indicator`);c&&l&&(c.onclick=()=>{l.classList.contains(`hidden`)?(l.classList.remove(`hidden`),u&&(u.style.transform=`rotate(180deg)`),c.style.background=`rgba(255,255,255,0.03)`):(l.classList.add(`hidden`),u&&(u.style.transform=`rotate(0deg)`),c.style.background=`transparent`),lucide.createIcons()});let d=t.querySelector(`#btn-renew-advance-plan`);d&&(d.onclick=()=>{let e=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),p(e)),typeof N==`function`&&N()}),lucide.createIcons()}else t.innerHTML=`<p style="text-align:center; font-size:0.8rem; color:var(--text-gray);">No tienes una membresía activa actualmente.</p>`}catch(e){console.error(`Error setting membership progress:`,e),t.innerHTML=`<p style="text-align:center; font-size:0.8rem; color:var(--text-gray);">Error al cargar progreso.</p>`}try{let t=await r.getPayments($.currentUser.uid);e.innerHTML=t.length===0?`<li class="p-20 opacity-50 text-center">No hay pagos registrados.</li>`:t.map(e=>`
                    <li class="payment-premium-item glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px; border-radius:15px;">
                        <div class="pay-info">
                            <strong style="display:block; font-size:1.1rem;">$${parseFloat(e.amount).toLocaleString()}</strong>
                            <span style="font-size:0.75rem; color:var(--text-gray);">${e.concept||`Plan Amaru`}</span>
                        </div>
                        <span class="tag" style="background:${e.status===`pending`?`rgba(234,179,8,0.2)`:`rgba(34,197,94,0.2)`}; color:${e.status===`pending`?`#eab308`:`#22c55e`};">
                            ${e.status===`pending`?`Pendiente`:`Aprobado`}
                        </span>
                    </li>
                `).join(``)}catch(e){console.error(`Error rendering payments:`,e)}}};document.getElementById(`admin-content-area`);function N(){let e=document.getElementById(`membership-plans-container`);e&&(e.innerHTML=a.plans.map((e,t)=>{let n=e.price,r=``,i=e.subtitle,o=`/ MES`,s=``;if(a.proRataPreference===`proportional`){let t=new Date,c=t.getDate(),l=new Date(t.getFullYear(),t.getMonth()+1,0).getDate(),u=l-c+1,d=e.price/l,f=1+a.surchargePct/100;n=Math.round(d*u*f),r=`<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.8em; margin-right: 5px;">$${e.price.toLocaleString()}</span>`,i=`Plan Proporcional (${u} días restantes)`,o=``,s=`<div style="font-size: 0.75em; color: var(--accent-yellow); margin-bottom: 5px; font-weight: 600;">Incluye recargo del ${a.surchargePct}%</div>`}else if(a.activePromo){let t=!0,i=!1;if(a.activePromo.plans&&a.activePromo.plans.length>0&&(t=a.activePromo.plans.includes(e.id)),a.activePromo.expiresAt){let e=new Date(a.activePromo.expiresAt);e.setDate(e.getDate()+1),i=e<new Date}t&&!i&&(n-=n*(a.activePromo.percent/100),r=`<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.8em; margin-right: 5px;">$${e.price.toLocaleString()}</span>`)}else a.proRataPreference===`full`&&(s=`<div style="font-size: 0.75em; color: #60a5fa; margin-bottom: 5px; font-weight: 600;">Mes adelantado sin recargos</div>`);return`
            <div id="plan-card-${e.id}" class="plan-card ${e.theme} ${e.popular?`popular`:``}" style="opacity:0; animation: elegantFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${.05+t*.12}s forwards;">
                <div class="plan-card-inner">
                    <!-- Front Side -->
                    <div class="plan-card-front">
                        ${e.popular?`<div class="popular-badge">RECOMENDADO</div>`:``}
                        <div class="plan-icon-wrapper" onclick="togglePlanFlip('${e.id}')" style="cursor: pointer; position: relative; z-index: 10;">
                            <i data-lucide="${e.theme===`bronze`?`shield`:e.theme===`silver`?`shield-check`:`crown`}" class="main-shield"></i>
                            <div class="tap-hint"><i data-lucide="mouse-pointer-2"></i></div>
                        </div>
                        <h2>${e.name}</h2>
                        <p class="plan-subtitle">${i}</p>
                        ${s}
                        <div class="plan-price">COP ${r}<span>$${n.toLocaleString()}</span> ${o}</div>
                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${e.id}')">SELECCIONAR PLAN</button>
                    </div>

                    <!-- Back Side (Details) -->
                    <div class="plan-card-back">
                        <div class="plan-icon-wrapper back-trigger" onclick="togglePlanFlip('${e.id}')" style="cursor: pointer; background: rgba(203, 242, 240, 0.2); border-color: rgba(203, 242, 240, 0.5);">
                            <i data-lucide="chevron-left"></i>
                        </div>
                        <h3 style="color:var(--accent-purple); margin-bottom: 20px; font-weight: 800; letter-spacing: 1px;">VENTAJAS DEL PLAN</h3>
                        <ul class="plan-features" style="text-align: left; margin-bottom: 30px;">
                            <li><i data-lucide="clock" style="width:14px; color:var(--accent-purple);"></i> <strong>${e.limit}</strong> Clases por día</li>
                            <li><i data-lucide="calendar" style="width:14px; color:var(--accent-purple);"></i> <strong>${e.monthly}</strong> Clases por mes</li>
                            ${(e.features||[]).map(e=>`<li><i data-lucide="check-circle-2" style="width:14px; color:#22c55e;"></i> ${e}</li>`).join(``)}
                        </ul>
                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${e.id}')" style="margin-top: auto;">SELECCIONAR Y PAGAR</button>
                    </div>
                </div>
            </div>
        `}).join(``),lucide.createIcons())}window.togglePlanFlip=e=>{let t=document.getElementById(`plan-card-${e}`);t&&t.classList.toggle(`flipped`)},window.selectMembershipPlan=async e=>{let t=a.plans.find(t=>t.id==e);if(!t)return;let n=$.currentUser;if(!n)return showToast(`Debes iniciar sesión para continuar`,`#ef4444`);let r={...t};if(a.activePromo){let e=!0;a.activePromo.plans&&a.activePromo.plans.length>0&&(e=a.activePromo.plans.includes(t.id)),e&&(r.price-=r.price*(a.activePromo.percent/100),r.name=`${r.name} (Promo: ${a.activePromo.code})`)}let i=async e=>{try{if(showToast(`Iniciando pago para ${e.name}... 💳`,`#22c55e`),u!==void 0&&typeof u.createPreference==`function`)await u.createPreference(e);else throw Error(`Servicio de pagos no disponible`)}catch(e){console.error(`Auto-payment error:`,e),showToast(`No se pudo iniciar el pago automático. Intenta de nuevo.`,`#ef4444`)}},o=new Date,s=o.getDate(),c=!1;try{let e=await db.collection(`users`).doc(n.uid).get();if(e.exists){let t=e.data();(!t.membership_status||t.membership_status===`pending`)&&(c=!0)}}catch(e){console.error(`Error checking user plan status:`,e)}if(c&&s>=15){let e=new Date(o.getFullYear(),o.getMonth()+1,0).getDate(),t=e-s+1,n=r.price/e,c=1+a.surchargePct/100,l=Math.round(n*t*c),u={...r,price:l,name:`${r.name} (Proporcional resto del mes)`},d={...r,name:`${r.name} (Mes Completo)`};if(a.proRataPreference===`proportional`)return await i(u);if(a.proRataPreference===`full`)return await i(d);if(document.getElementById(`proportional-modal`))document.getElementById(`btn-pay-proportional`).innerHTML=`<strong style="font-size: 1rem;">Pagar Proporcional ($${l.toLocaleString()})</strong><span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Lo que resta del mes (incluye recargo)</span>`,document.getElementById(`btn-pay-full`).innerHTML=`<strong style="font-size: 1rem;">Pagar Mes Completo ($${r.price.toLocaleString()})</strong><span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Se cobrará el mes entero desde hoy</span>`,document.getElementById(`proportional-modal`).style.display=`flex`;else{let e=`
                <div id="proportional-modal" class="overlay" style="display:flex; z-index: 10000; align-items: center; justify-content: center; background: rgba(0,0,0,0.8);">
                    <div class="modal-content glass" style="max-width:350px; text-align:center; padding: 25px; border-radius: 20px;">
                        <h3 style="margin-bottom:15px; color:var(--accent-yellow); font-size: 1.2rem; font-weight: 800;">Bienvenido a Amaru</h3>
                        <p style="font-size:0.9rem; margin-bottom: 20px; color: #ddd;">Como ingresas pasado el día 15, puedes elegir cómo pagar tu primera membresía:</p>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            <button id="btn-pay-proportional" class="btn-primary" style="padding:15px; font-size:0.85rem; border-radius:12px; display: flex; flex-direction: column; align-items: center;">
                                <strong style="font-size: 1rem;">Pagar Proporcional ($${l.toLocaleString()})</strong>
                                <span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Lo que resta del mes (incluye recargo)</span>
                            </button>
                            <button id="btn-pay-full" class="btn-secondary" style="padding:15px; font-size:0.85rem; border-radius:12px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; transition: all 0.2s;">
                                <strong style="font-size: 1rem;">Pagar Mes Completo ($${r.price.toLocaleString()})</strong>
                                <span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Se cobrará el mes entero desde hoy</span>
                            </button>
                            <button id="btn-cancel-proportional" style="margin-top:10px; background:none; color:var(--text-gray); border:none; text-decoration:underline; font-weight: 600; cursor: pointer;">Cancelar</button>
                        </div>
                    </div>
                </div>`;document.body.insertAdjacentHTML(`beforeend`,e)}document.getElementById(`btn-pay-proportional`).onclick=async()=>{document.getElementById(`proportional-modal`).style.display=`none`,await i(u)},document.getElementById(`btn-pay-full`).onclick=async()=>{document.getElementById(`proportional-modal`).style.display=`none`,await i(d)},document.getElementById(`btn-cancel-proportional`).onclick=()=>{document.getElementById(`proportional-modal`).style.display=`none`};return}if(a.role===`admin`)return showToast(`El administrador no realiza pagos ⚙️`,`#fbbf24`);await i(r)};let P=document.getElementById(`btn-skip-membership`);P&&(P.onclick=async()=>{document.getElementById(`membership-selection-screen`).classList.add(`hidden`),document.getElementById(`app-container`).classList.remove(`hidden`),m(`dashboard`);let e=$.currentUser;if(e&&a.role!==`admin`)try{let{data:t}=await window.supabase.from(`payments`).select(`id`).eq(`user_id`,e.uid).eq(`status`,`pending`);(!t||t.length===0)&&await r.recordPayment(e.uid,{amount:0,concept:`Registro - Pago Omitido`,receipt_url:null,status:`pending`,payment_method:`manual`,currency:`COP`})}catch(e){console.error(`Error al registrar el pago omitido:`,e)}showToast(`¡Explora AmaruApp! 🥋`)})}),document.addEventListener(`DOMContentLoaded`,()=>{Pe(),(()=>{let e=document.getElementById(`manage-classes-btn`),t=document.getElementById(`manage-users-btn`),n=document.getElementById(`manage-active-users-btn`),r=document.getElementById(`view-attendance-btn`),i=document.getElementById(`manage-payments-btn`),a=document.getElementById(`view-revenue-btn`),o=document.getElementById(`manage-discounts-btn`),s=document.getElementById(`manage-notifications-btn`);document.getElementById(`btn-export-revenue`),e&&(e.onclick=()=>{let e=document.getElementById(`admin-revenue-section`);e&&e.classList.add(`hidden`),ye()}),t&&(t.onclick=()=>xe()),n&&(n.onclick=()=>z()),r&&(r.onclick=()=>Se()),i&&(i.onclick=()=>te()),a&&(a.onclick=()=>Be()),o&&(o.onclick=()=>Ce()),s&&(s.onclick=()=>we())})()}),`serviceWorker`in navigator&&(window.location.hostname===`localhost`?(console.log(`Service Worker no registrado en localhost para evitar problemas de caché.`),navigator.serviceWorker.getRegistrations().then(function(e){for(let t of e)t.unregister()})):window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/app/sw.js`,{scope:`/app/`}).then(e=>{console.log(`Service Worker Registrado: `,e),e.active?typeof initMessaging==`function`&&initMessaging():e.addEventListener(`updatefound`,()=>{let t=e.installing;t.addEventListener(`statechange`,()=>{t.state===`activated`&&typeof initMessaging==`function`&&initMessaging()})})}).catch(e=>console.error(`Error de Service Worker: `,e))}));