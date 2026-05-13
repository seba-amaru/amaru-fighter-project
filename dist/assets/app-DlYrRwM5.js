const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/revenue-Dm74bIC-.js","assets/main-jiITlyvp.js","assets/supabase-config-BzB6TJQm.js","assets/main-BW5kuAFT.css"])))=>i.map(i=>d[i]);
import"./supabase-config-BzB6TJQm.js";import{t as e}from"./main-jiITlyvp.js";import{a as t,i as n,n as r,t as i}from"./revenue-Dm74bIC-.js";var a={emailRegex:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,init(){this.setupEmailValidation(),this.setupPasswordValidation(),this.setupPasswordResetValidation()},setupEmailValidation(){document.querySelectorAll(`input[type="email"], input[name="email"]`).forEach(e=>{let t=e.closest(`.auth-input-wrapper`);if(!t)return;let n=t.querySelector(`.validation-icon`);n||(n=document.createElement(`i`),n.className=`validation-icon`,n.setAttribute(`data-lucide`,`check-circle`),t.appendChild(n));let r=t.parentElement.querySelector(`.validation-message`);r||(r=document.createElement(`div`),r.className=`validation-message`,t.parentElement.appendChild(r)),e.addEventListener(`input`,()=>{let t=e.value.trim();if(t.length===0){this.clearState(e,n,r);return}let i=this.emailRegex.test(t);this.setState(e,n,r,i,i?`Email válido`:`Ingresa un email válido`)})})},setupPasswordValidation(){document.querySelectorAll(`input[type="password"]:not(#reset-email)`).forEach(e=>{let t=e.closest(`.auth-input-wrapper`);if(!t)return;let n=t.parentElement,r=n.querySelector(`.password-strength`);if(!r){r=document.createElement(`div`),r.className=`password-strength`;for(let e=0;e<4;e++){let e=document.createElement(`div`);e.className=`strength-segment`,r.appendChild(e)}let e=document.createElement(`span`);e.className=`strength-label`,r.appendChild(e),n.appendChild(r)}e.addEventListener(`input`,()=>{let t=e.value,n=this.checkPasswordStrength(t);this.updateStrengthIndicator(r,n)})})},setupPasswordResetValidation(){let e=document.getElementById(`reset-email`);if(!e)return;let t=document.getElementById(`btn-send-reset`);e.addEventListener(`input`,()=>{t&&(t.disabled=!this.emailRegex.test(e.value.trim()),t.style.opacity=t.disabled?`0.5`:`1`)})},checkPasswordStrength(e){let t=0;return e.length>=8&&t++,/[a-z]/.test(e)&&/[A-Z]/.test(e)&&t++,/\d/.test(e)&&t++,/[^A-Za-z0-9]/.test(e)&&t++,{score:t,label:[`Muy débil`,`Débil`,`Media`,`Fuerte`,`Muy fuerte`][t],className:[`weak`,`weak`,`fair`,`good`,`strong`][t]}},updateStrengthIndicator(e,t){let n=e.querySelectorAll(`.strength-segment`),r=e.querySelector(`.strength-label`);n.forEach((e,n)=>{e.className=`strength-segment`,n<t.score&&e.classList.add(`filled`,t.className)}),r&&(r.textContent=t.label,r.className=`strength-label ${t.className}`)},setState(e,t,n,r,i){e.classList.remove(`is-valid`,`is-invalid`),e.classList.add(r?`is-valid`:`is-invalid`),t.classList.add(`visible`),t.setAttribute(`data-lucide`,r?`check-circle`:`x-circle`),window.lucide&&window.lucide.createIcons(),n.textContent=i,n.className=`validation-message ${r?`valid`:`invalid`}`},clearState(e,t,n){e.classList.remove(`is-valid`,`is-invalid`),t.classList.remove(`visible`),n.textContent=``,n.className=`validation-message`}},o={async createProfile(e,t){let{data:n}=await window.supabase.from(`profiles`).select(`id`).eq(`email`,e.email).maybeSingle();if(n&&n.id!==e.uid){console.warn(`Profile with email ${e.email} exists with different ID. Merging accounts.`);let{error:t}=await window.supabase.from(`profiles`).update({id:e.uid}).eq(`id`,n.id);if(t)throw t;return this.getProfile(e.uid)}let{data:r,error:i}=await window.supabase.from(`profiles`).upsert({id:e.uid,email:e.email,full_name:t||e.displayName||`Atleta`,role:`athlete`,membership_limit:2,xp:0,level:0});if(i)throw i;return r},async getProfile(e){try{let{data:t,error:n}=await window.supabase.from(`profiles`).select(`*`).eq(`id`,e).maybeSingle();if(n)return n.code!==`PGRST116`&&console.warn(`[Supabase] getProfile error (ID: ${e}): ${n.message}`),null;if(t&&t.membership_plan_id){let{data:e,error:n}=await window.supabase.from(`membership_plans`).select(`name`).eq(`id`,t.membership_plan_id).maybeSingle();!n&&e&&(t.membership_plans=e)}return t}catch(e){return console.error(`[Supabase] getProfile exception:`,e),null}},async updateProfile(e,t){let{data:n,error:r}=await window.supabase.from(`profiles`).update(t).eq(`id`,e);if(r)throw r;return n},async saveFCMToken(e,t){return this.updateProfile(e,{fcm_token:t})},async deleteUser(e){let{data:t,error:n}=await window.supabase.from(`profiles`).delete().eq(`id`,e);if(n)throw n;return t},async softDeleteUser(e){let{data:t,error:n}=await window.supabase.from(`profiles`).update({is_deleted:!0}).eq(`id`,e);if(n)throw n;return t},async getAttendance(e){let{data:t,error:n}=await window.supabase.from(`attendance`).select(`*`).eq(`user_id`,e).order(`attended_at`,{ascending:!1});if(n)throw n;return t},async logAttendance(e,t,n){let{data:r,error:i}=await window.supabase.from(`attendance`).insert({user_id:e,class_id:t,class_name:n});if(i)throw i;return r},async recordPayment(e,t){let{data:n,error:r}=await window.supabase.from(`payments`).insert({user_id:e,...t});if(r)throw r;return n},async getPayments(e){let{data:t,error:n}=await window.supabase.from(`payments`).select(`*`).eq(`user_id`,e).order(`created_at`,{ascending:!1});if(n)throw n;return t},async getAllPayments(){let{data:e,error:t}=await window.supabase.from(`payments`).select(`*, profiles(full_name)`).order(`created_at`,{ascending:!1});if(t)throw t;return e},async getAllProfiles(){let{data:e,error:t}=await window.supabase.from(`profiles`).select(`*, membership_plans(name, monthly)`).eq(`role`,`athlete`).eq(`is_deleted`,!1).order(`full_name`,{ascending:!0});if(t)throw t;return e},async getClasses(){let{data:e,error:t}=await window.supabase.from(`classes`).select(`*`);if(t)throw t;return e.map(e=>({...e,img:e.img&&e.img.includes(`photo-1599058917232-d750c1844bb7`)?`https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500`:e.img}))},async upsertClass(e){let{data:t,error:n}=await window.supabase.from(`classes`).upsert(e);if(n)throw n;return t},async getPlans(){let{data:e,error:t}=await window.supabase.from(`membership_plans`).select(`*`).order(`sort_order`,{ascending:!0});if(t)throw t;return e},async upsertPlan(e){let{data:t,error:n}=await window.supabase.from(`membership_plans`).upsert(e);if(n)throw n;return t},async getMembershipPlans(){return this.getPlans()},async updatePlanOrder(e,t){let{error:n}=await window.supabase.from(`membership_plans`).update({sort_order:t}).eq(`id`,e);if(n)throw n},async getPendingPayments(){let{data:e,error:t}=await window.supabase.from(`payments`).select(`*`).eq(`status`,`pending`).order(`created_at`,{ascending:!1});if(t)throw t;return e},async updatePaymentStatus(e,t){let{data:n,error:r}=await window.supabase.from(`payments`).update({status:t}).eq(`id`,e);if(r)throw r;return n},async getPayment(e){let{data:t,error:n}=await window.supabase.from(`payments`).select(`*`).eq(`id`,e).single();if(n)throw n;return t},async deletePendingPayments(e){let{data:t,error:n}=await window.supabase.from(`payments`).delete().eq(`user_id`,e).eq(`status`,`pending`);if(n)throw n;return t},async deletePlan(e){let{error:t}=await window.supabase.from(`membership_plans`).delete().eq(`id`,e);if(t)throw t},async deleteClass(e){let{error:t}=await window.supabase.from(`classes`).delete().eq(`id`,e);if(t)throw t},async getReservations(e){let t=window.supabase.from(`reservations`).select(`*`);e&&(t=t.eq(`reservation_date`,e));let{data:n,error:r}=await t;if(r)throw r;return n},async getAllReservations(){let{data:e,error:t}=await window.supabase.from(`reservations`).select(`*`);if(t)throw t;return e},async getUserReservations(e){let{data:t,error:n}=await window.supabase.from(`reservations`).select(`*`).eq(`user_id`,e);if(n)throw n;return t},async createReservation(e,t,n,r){let{data:i,error:a}=await window.supabase.from(`reservations`).insert({user_id:e,class_id:t,class_name:n,reservation_date:r});if(a)throw a;return i},async deleteReservation(e,t,n){let{error:r}=await window.supabase.from(`reservations`).delete().eq(`user_id`,e).eq(`class_id`,t).eq(`reservation_date`,n);if(r)throw r},async getTournaments(e){let{data:t,error:n}=await window.supabase.from(`tournaments`).select(`*`).eq(`user_id`,e).order(`date`,{ascending:!0});if(n)throw n;return t.map(e=>({...e,img:e.img&&e.img.includes(`photo-1599058917232-d750c1844bb7`)?`https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500`:e.img}))},async upsertTournament(e,t){let{data:n,error:r}=await window.supabase.from(`tournaments`).upsert({...t,user_id:e});if(r)throw r;return n},async deleteTournament(e){let{error:t}=await window.supabase.from(`tournaments`).delete().eq(`id`,e);if(t)throw t},async uploadAvatar(e,t){let n=`${e}-${Date.now()}`,{error:r}=await window.supabase.storage.from(`avatars`).upload(n,t,{upsert:!0});if(r)throw r;let{data:i}=window.supabase.storage.from(`avatars`).getPublicUrl(n);return i.publicUrl},async uploadPaymentReceipt(e,t){let n=`${e}/${Date.now()}_${t.name}`,{error:r}=await window.supabase.storage.from(`payments`).upload(n,t,{upsert:!0});if(r)throw r;let{data:i}=window.supabase.storage.from(`payments`).getPublicUrl(n);return i.publicUrl},async getNotifications(){let{data:e,error:t}=await window.supabase.from(`global_notifications`).select(`*`).order(`created_at`,{ascending:!1});if(t)throw t;return e||[]},async addNotification(e,t,n){let{data:r,error:i}=await window.supabase.from(`global_notifications`).insert([{title:e,message:t,type:n}]).select();if(i)throw i;return r},async deleteNotification(e){let{error:t}=await window.supabase.from(`global_notifications`).delete().eq(`id`,e);if(t)throw t;return!0},async getUserNotifications(e){let{data:t,error:n}=await window.supabase.from(`user_notifications`).select(`*`).eq(`user_id`,e).order(`created_at`,{ascending:!1});if(n)throw n;return t||[]},async getUnreadCount(e){let{count:t,error:n}=await window.supabase.from(`user_notifications`).select(`*`,{count:`exact`,head:!0}).eq(`user_id`,e).eq(`is_read`,!1);if(n)throw n;return t||0},async sendUserNotification(e,t,n,r=`direct`){let i=window.appState?.user?.uid||null,{data:a,error:o}=await window.supabase.from(`user_notifications`).insert([{user_id:e,sender_id:i,title:t,message:n,type:r}]).select();if(o)throw o;return a},async markNotificationRead(e){let{error:t}=await window.supabase.from(`user_notifications`).update({is_read:!0,read_at:new Date().toISOString()}).eq(`id`,e);if(t)throw t;return!0},async markAllNotificationsRead(e){let{error:t}=await window.supabase.from(`user_notifications`).update({is_read:!0,read_at:new Date().toISOString()}).eq(`user_id`,e).eq(`is_read`,!1);if(t)throw t;return!0},async deleteUserNotification(e){let{error:t}=await window.supabase.from(`user_notifications`).delete().eq(`id`,e);if(t)throw t;return!0},async sendBulkEmail(e,t,n,r){let{data:i,error:a}=await window.supabase.functions.invoke(`send-email`,{body:{to:e,subject:t,text:n,html:r||n.replace(/\n/g,`<br>`)}});if(a)throw a;return i}},s={reminderTimers:new Map,init(e){this.checkMembershipExpiry(),this.requestPushPermission(),this.startClassReminderCheck(e)},async checkMembershipExpiry(){let e=window.appState?.userProfile;if(!e||!e.membership_expiry)return;let t=new Date(e.membership_expiry),n=Math.ceil((t-new Date)/(1e3*60*60*24));n<=7&&n>0?this.showMembershipToast(`Membresía por vencer`,`Tu membresía vence en ${n} día${n===1?``:`s`}. Renueva para no perder acceso.`,`warning`):n<=0&&this.showMembershipToast(`Membresía vencida`,`Tu membresía ha vencido. Renueva ahora para recuperar el acceso completo.`,`danger`)},showMembershipToast(e,t,n){document.querySelectorAll(`.notification-toast`).forEach(e=>e.remove());let r=document.createElement(`div`);r.className=`notification-toast membership-${n}`,r.innerHTML=`
            <div class="toast-icon">
                <i data-lucide="${n===`warning`?`alert-triangle`:`alert-octagon`}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${e}</div>
                <div class="toast-message">${t}</div>
            </div>
            <button class="toast-close"><i data-lucide="x" style="width:14px;"></i></button>
        `,document.body.appendChild(r),window.lucide&&window.lucide.createIcons(),requestAnimationFrame(()=>r.classList.add(`visible`));let i=r.querySelector(`.toast-close`);i.onclick=()=>{r.classList.remove(`visible`),setTimeout(()=>r.remove(),500)},n===`warning`&&setTimeout(()=>{r.classList.remove(`visible`),setTimeout(()=>r.remove(),500)},8e3)},async requestPushPermission(){if(`Notification`in window&&Notification.permission===`default`)try{let e=await Notification.requestPermission();console.log(`[Notifications] Permission:`,e)}catch(e){console.warn(`[Notifications] Permission request failed:`,e)}},sendPush(e,t={}){if(!(`Notification`in window)||Notification.permission!==`granted`)return;let n={icon:`../images/icon-192.png`,badge:`../images/icon-192.png`,requireInteraction:!1,...t};try{navigator.serviceWorker.ready.then(t=>{t.showNotification(e,n)})}catch(e){console.warn(`[Notifications] Push failed:`,e)}},async startClassReminderCheck(e){e&&(this.reminderInterval=setInterval(()=>{this.checkUpcomingClasses(e)},300*1e3),this.checkUpcomingClasses(e))},async checkUpcomingClasses(e){try{let t=new Date().toISOString().split(`T`)[0],n=await o.getReservations(t);if(!n||!n.length)return;let r=n.filter(t=>t.user_id===e),i=new Date,a=i.getHours(),s=i.getMinutes(),c=a*60+s;r.forEach(e=>{if(!e.class_time)return;let[n,r]=e.class_time.split(`:`).map(Number),i=n*60+r-c;if(i>25&&i<=35){let n=`${e.class_id}-${t}`;this.reminderTimers.has(n)||(this.reminderTimers.set(n,!0),this.sendPush(`¡Clase pronto! ${e.class_name||``}`,{body:`Tu clase comienza en 30 minutos (${e.class_time}). ¡Prepárate!`,tag:n,requireInteraction:!0,actions:[{action:`open`,title:`Ver agenda`},{action:`dismiss`,title:`Descartar`}]}))}})}catch(e){console.warn(`[Notifications] Class reminder check failed:`,e)}},stop(){this.reminderInterval&&=(clearInterval(this.reminderInterval),null),this.reminderTimers.clear()}},c={items:[{question:`¿Cómo reservo una clase?`,answer:`Ve a la sección Agenda, selecciona el día que deseas, elige la clase disponible y presiona "Reservar". Recuerda que necesitas una membresía activa para hacer reservas.`},{question:`¿Cuántas clases puedo reservar por semana?`,answer:`Depende de tu plan de membresía. El plan básico permite 2 clases semanales, el plan intermedio 4 clases, y el plan avanzado clases ilimitadas. Puedes ver tu límite actual en tu perfil.`},{question:`¿Qué pasa si no puedo asistir a una clase reservada?`,answer:`Puedes cancelar tu reserva desde la sección "Mis Reservas" con al menos 2 horas de anticipación. Si no cancelas y no asistes, se contará como una ausencia.`},{question:`¿Cómo renuevo mi membresía?`,answer:`Dirígete a tu perfil y selecciona "Renovar Membresía". Allí podrás elegir entre los planes disponibles y realizar el pago de forma segura.`},{question:`¿Qué disciplinas ofrece Amaru Fighters?`,answer:`Ofrecemos MMA, Grappling/BJJ y Striking (Boxeo/Kickboxing). Cada disciplina tiene horarios específicos que puedes consultar en la agenda.`},{question:`¿Cómo subo mi foto de perfil?`,answer:`En tu perfil, toca sobre tu foto actual o el ícono de cámara. Podrás subir una nueva imagen desde tu dispositivo.`},{question:`¿Puedo cambiar mi estilo de combate?`,answer:`Sí, en tu perfil encontrarás un selector de "Estilo de Combate". Puedes cambiarlo en cualquier momento según tu preferencia.`},{question:`¿Cómo contacto al administrador?`,answer:`Desde la sección de mensajes en tu perfil, puedes enviar un mensaje directo al equipo de Amaru Fighters. Responderemos a la brevedad.`}],init(){this.render(),this.bindEvents()},render(){let e=document.getElementById(`faq-container`);e&&(e.innerHTML=this.items.map((e,t)=>`
            <div class="faq-item" data-index="${t}">
                <div class="faq-question">
                    <span>${e.question}</span>
                    <i data-lucide="chevron-down"></i>
                </div>
                <div class="faq-answer">${e.answer}</div>
            </div>
        `).join(``),window.lucide&&window.lucide.createIcons())},bindEvents(){document.querySelectorAll(`.faq-item`).forEach(e=>{e.querySelector(`.faq-question`).addEventListener(`click`,()=>{let t=e.classList.contains(`open`);document.querySelectorAll(`.faq-item`).forEach(e=>e.classList.remove(`open`)),t||e.classList.add(`open`)})})}},l=(e,t)=>{let n=window.showToast||(e=>console.log(e)),r=document.getElementById(`btn-register`);r&&(r.onclick=async()=>{let r=document.getElementById(`reg-name`).value.trim(),i=document.getElementById(`reg-email`).value.trim(),a=document.getElementById(`reg-password`).value;if(!r||!i||!a)return n(`Por favor llena todos los campos ⚠️`,`#eab308`);try{n(`Creando cuenta... 🥋`);let{data:s,error:c}=await window.supabase.auth.signUp({email:i,password:a,options:{data:{full_name:r}}});if(c)throw c;let l={...s.user,uid:s.user.id};await o.createProfile(l,r),n(`¡Cuenta creada con éxito! 🚀`),setTimeout(()=>{let n=document.getElementById(`auth-screen`),r=document.getElementById(`membership-selection-screen`);n&&n.classList.add(`hidden`),r?(t(),r.classList.remove(`hidden`)):(document.getElementById(`app-container`).classList.remove(`hidden`),e(`dashboard`))},1500)}catch(e){console.error(e);let t=`Error al registrar la cuenta`;e.code===`auth/invalid-email`?t=`El correo no tiene un formato válido.`:e.code===`auth/email-already-in-use`?t=`Este correo electrónico ya está registrado.`:e.code===`auth/weak-password`?t=`La contraseña es muy débil (mín. 6 caracteres).`:e.message&&(t+=`: `+e.message),n(t+` ❌`,`#ef4444`)}});let i=document.getElementById(`go-to-register`),a=document.getElementById(`go-to-login`),s=document.getElementById(`login-form-container`),c=document.getElementById(`register-form-container`);i&&(i.onclick=()=>{s.classList.add(`hidden`),c.classList.remove(`hidden`)}),a&&(a.onclick=()=>{c.classList.add(`hidden`),s.classList.remove(`hidden`)});let l=document.getElementById(`btn-login`);l&&(l.onclick=async()=>{let e=document.getElementById(`login-email`),t=document.getElementById(`login-password`),r=e.value,i=t.value;if(r.toLowerCase().trim()===`admin`&&(r=`admin@amaru.app`,n(`Acceso Maestro 🛡️`)),!r||!i)return n(`Faltan datos ⚠️`,`#eab308`);try{let{error:e}=await window.supabase.auth.signInWithPassword({email:r,password:i});if(e)throw e;n(`¡Bienvenido! 🥋`)}catch(e){n(`Error de acceso: `+e.message,`#ef4444`)}});let u=document.getElementById(`btn-google-login`);u&&(u.onclick=async()=>{try{n(`Conectando con Google... 🚀`);let{data:e,error:t}=await window.supabase.auth.signInWithOAuth({provider:`google`,options:{redirectTo:window.location.origin}});if(t)throw t}catch(e){n(`Error al conectar con Google ❌`,`#ef4444`),console.error(`Google Auth Error:`,e)}});let d=document.getElementById(`btn-forgot-password`);d&&(d.onclick=async()=>{let e=document.getElementById(`login-email`).value.trim();if(!e)return n(`Ingresa tu email para restablecer contraseña ⚠️`,`#eab308`);try{n(`Enviando enlace... 📧`);let{error:t}=await window.supabase.auth.resetPasswordForEmail(e,{redirectTo:window.location.origin+`/app/`});if(t)throw t;n(`Email de restablecimiento enviado ✅`,`#22c55e`)}catch(e){n(`Error: `+e.message,`#ef4444`)}});let f=document.getElementById(`btn-logout`);f&&(f.onclick=async()=>{localStorage.removeItem(`isAdminMode`),await window.supabase.auth.signOut(),window.location.reload()})},u={plans:[],classes:[],tournaments:[],userProfile:null};window.appState=u;var d=(e,t=8e3,n=`Operación`)=>new Promise((r,i)=>{let a=setTimeout(()=>{i(Error(`${n}: Tiempo de espera agotado (${t}ms)`))},t);e.then(e=>{clearTimeout(a),r(e)}).catch(e=>{clearTimeout(a),i(e)})}),f=async(e,t={})=>{let{maxRetries:n=3,delayMs:r=1e3,context:i=`Operación`}=t,a;for(let t=0;t<=n;t++)try{return t>0&&(console.log(`[Retry] ${i} - Intento ${t+1}/${n+1}`),await new Promise(e=>setTimeout(e,r*t))),await e()}catch(e){if(a=e,console.warn(`[Retry] ${i} falló en intento ${t+1}:`,e.message),e.status&&e.status>=400&&e.status<500)throw e}throw a},p=e=>{if(!e)return!1;let t=(e.message||``).toLowerCase();return t.includes(`network`)||t.includes(`timeout`)||t.includes(`fetch`)||t.includes(`abort`)||t.includes(`failed`)||t.includes(`tiempo de espera`)},m=`modulepreload`,h=function(e){return`/`+e},g={},_=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=h(t,n),t in g)return;g[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:m,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},v=[],y=[],b=[],x=`resumen`,S={search:``,status:[`pending`,`approved`,`rejected`],dateFrom:``,dateTo:``,method:``,minAmount:``,maxAmount:``},C={field:`created_at`,dir:`desc`},w=1,T=25,E=`all`,D=()=>document.getElementById(`admin-content-area`),O=e=>e==null?`$0`:`$`+Math.round(e).toLocaleString(`es-CL`),ee=e=>e?new Date(e).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,k=e=>[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][e]||``,A=()=>new Date().toISOString().split(`T`)[0],te=e=>{if(!e)return null;let t=[`enero`,`febrero`,`marzo`,`abril`,`mayo`,`junio`,`julio`,`agosto`,`septiembre`,`octubre`,`noviembre`,`diciembre`],n=e.toLowerCase(),r=t.findIndex(e=>n.includes(e)),i=e.match(/(\d{4})/);return r===-1||!i?null:{month:r,year:parseInt(i[1])}},j=async()=>{try{let{data:e,error:t}=await window.supabase.from(`payments`).select(`*, profiles(full_name, email, role, membership_status, membership_expiry, membership_plan_id)`).order(`created_at`,{ascending:!1});if(t)throw t;let{data:n,error:r}=await window.supabase.from(`profiles`).select(`*`);if(r)throw r;let{data:i,error:a}=await window.supabase.from(`membership_plans`).select(`*`);if(a)throw a;v=e||[],y=n||[],b=i||[]}catch(e){console.error(`[Payments] Error fetching data:`,e),window.showToast&&window.showToast(`Error cargando datos de pagos`,`#ef4444`)}},ne=async()=>{let e=D(),t=document.getElementById(`admin-revenue-section`);t&&t.classList.add(`hidden`),e.innerHTML=`
        <div class="glass-premium p-20">
            <div class="p-20 text-center">
                <i data-lucide="loader" class="spin"></i>
                <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">Cargando control de pagos...</p>
            </div>
        </div>`,window.lucide&&window.lucide.createIcons(),await j(),M()},M=()=>{let e=D();if(!e)return;e.innerHTML=`
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
                <button id="tab-resumen" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${x===`resumen`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="layout-dashboard" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Resumen
                </button>
                <button id="tab-transacciones" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${x===`transacciones`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="list" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Transacciones
                </button>
                <button id="tab-cobranza" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${x===`cobranza`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="zap" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Cobranza del Mes
                </button>
            </div>

            <!-- Content area -->
            <div id="payments-view-content"></div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),document.getElementById(`tab-resumen`).onclick=()=>{x=`resumen`,M()},document.getElementById(`tab-transacciones`).onclick=()=>{x=`transacciones`,M()},document.getElementById(`tab-cobranza`).onclick=()=>{x=`cobranza`,M()};let t=document.getElementById(`link-revenue-advanced`);t&&(t.onclick=e=>{e.preventDefault(),_(()=>import(`./revenue-Dm74bIC-.js`).then(e=>e.r).then(e=>{e.renderRevenueSection&&e.renderRevenueSection()}),__vite__mapDeps([0,1,2,3]))});let n=document.getElementById(`payments-view-content`);x===`resumen`?re(n):x===`transacciones`?ae(n):se(n)},re=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=v.filter(e=>{let t=new Date(e.created_at);return t.getFullYear()===r&&t.getMonth()===n&&e.status===`approved`}),a=i.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),o=i.length,s=o>0?a/o:0,c=n===0?11:n-1,l=n===0?r-1:r,u=v.filter(e=>{let t=new Date(e.created_at);return t.getFullYear()===l&&t.getMonth()===c&&e.status===`approved`}).reduce((e,t)=>e+(parseFloat(t.amount)||0),0),d=u>0?(a-u)/u*100:a>0?100:0,f=v.filter(e=>e.status===`pending`),p=f.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),m=y.filter(e=>e.membership_status===`active`),h=m.length,g=m.filter(e=>{let t=v.filter(t=>t.user_id===e.id&&t.status===`approved`).sort((e,t)=>new Date(t.created_at)-new Date(e.created_at))[0];if(!t)return!1;let i=te(t.coverage_month);return i?i.month===n&&i.year===r:!1}).length,_=h>0?(g/h*100).toFixed(0):0,x=f.filter(e=>(t-new Date(e.created_at))/(1e3*60*60*24)<=7).slice(0,5),S=m.filter(e=>{if(!e.membership_expiry)return!1;let n=Math.ceil((new Date(e.membership_expiry)-t)/(1e3*60*60*24));return n>0&&n<=5}).slice(0,5),C=[];for(let e=6;e>=0;e--){let n=new Date(t);n.setDate(n.getDate()-e);let r=n.toISOString().split(`T`)[0],i=v.filter(e=>e.created_at&&e.created_at.startsWith(r)&&e.status===`approved`);C.push({label:n.toLocaleDateString(`es-CL`,{weekday:`short`,day:`numeric`}),total:i.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),count:i.length})}e.innerHTML=`
        <!-- KPIs -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:25px;">
            <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ingresos ${k(n)}</span>
                <strong style="font-size:1.5rem; color:var(--accent-purple); font-weight:900;">${O(a)}</strong>
                <span style="font-size:0.75rem; color:${d>=0?`#22c55e`:`#ef4444`}; display:block; margin-top:4px;">${d>=0?`+`:``}${d.toFixed(1)}% vs mes ant.</span>
            </div>
            <div class="stat-mini-premium ${f.length>0?`pulse-warning`:``}" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Pendientes por Aprobar</span>
                <strong style="font-size:1.5rem; color:#fbbf24; font-weight:900;">${f.length}</strong>
                <span style="font-size:0.75rem; color:var(--text-gray); display:block; margin-top:4px;">${O(p)}</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Cobertura del Mes</span>
                <strong style="font-size:1.5rem; color:#22c55e; font-weight:900;">${g}/${h}</strong>
                <div style="width:80%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; margin:6px auto 0;">
                    <div style="width:${_}%; height:100%; background:#22c55e; border-radius:3px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${_}% al día</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ticket Promedio</span>
                <strong style="font-size:1.5rem; color:#3b82f6; font-weight:900;">${O(s)}</strong>
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
            ${x.length===0&&S.length===0?`<p style="opacity:0.5; font-size:0.85rem; padding:15px;">🎉 No hay acciones pendientes. Todo está al día.</p>`:`<div style="display:flex; flex-direction:column; gap:8px;">
                    ${x.map(e=>{let n=e.profiles?.full_name||e.user_name||`Usuario`,r=O(parseFloat(e.amount)||0),i=Math.floor((t-new Date(e.created_at))/(1e3*60*60*24));return`
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
                    ${S.map(e=>{let n=Math.ceil((new Date(e.membership_expiry)-t)/(1e3*60*60*24)),r=b.find(t=>t.id===e.membership_plan_id);return`
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
    `,window.lucide&&window.lucide.createIcons(),ie(C),e.querySelectorAll(`.btn-quick-approve`).forEach(e=>{e.onclick=()=>je(e.getAttribute(`data-id`),`approved`)}),e.querySelectorAll(`.btn-quick-register`).forEach(e=>{e.onclick=()=>N(e.getAttribute(`data-uid`))})},ie=e=>{let t=document.getElementById(`resumenChart`);t&&(window._resumenChart&&window._resumenChart.destroy(),window._resumenChart=new Chart(t,{type:`bar`,data:{labels:e.map(e=>e.label),datasets:[{label:`Ingresos ($)`,data:e.map(e=>e.total),backgroundColor:`rgba(139, 92, 246, 0.7)`,borderColor:`rgba(139, 92, 246, 1)`,borderWidth:1,borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:`rgba(13,13,18,0.95)`,callbacks:{label:e=>` Ingresos: ${O(e.raw)}`}}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:10}},grid:{display:!1}},y:{ticks:{color:`rgba(255,255,255,0.4)`,font:{size:10},callback:e=>`$`+(e>=1e3?(e/1e3).toFixed(0)+`k`:e)},grid:{color:`rgba(255,255,255,0.06)`}}}}}))},ae=e=>{let t=v.filter(e=>{if(!S.status.includes(e.status)||S.method&&e.payment_method!==S.method||S.dateFrom&&e.created_at<S.dateFrom+`T00:00:00`||S.dateTo&&e.created_at>S.dateTo+`T23:59:59`||S.minAmount&&(parseFloat(e.amount)||0)<parseFloat(S.minAmount)||S.maxAmount&&(parseFloat(e.amount)||0)>parseFloat(S.maxAmount))return!1;if(S.search){let t=S.search.toLowerCase(),n=(e.profiles?.full_name||e.user_name||``).toLowerCase(),r=(e.profiles?.email||``).toLowerCase(),i=(e.concept||e.plan_name||``).toLowerCase();return n.includes(t)||r.includes(t)||i.includes(t)}return!0});t.sort((e,t)=>{let n,r;switch(C.field){case`amount`:n=parseFloat(e.amount)||0,r=parseFloat(t.amount)||0;break;case`name`:n=e.profiles?.full_name||``,r=t.profiles?.full_name||``;break;case`status`:n=e.status,r=t.status;break;default:n=new Date(e.created_at),r=new Date(t.created_at)}return C.dir===`asc`?n>r?1:-1:n<r?1:-1});let n=t.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),r=Math.max(1,Math.ceil(t.length/T));w=Math.min(w,r);let i=(w-1)*T,a=t.slice(i,i+T);e.innerHTML=`
        <!-- Filtros -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <input type="text" id="tx-search" placeholder="🔍 Buscar alumno, email o concepto..." value="${S.search}" style="flex:1; min-width:180px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 12px; border-radius:8px; font-size:0.8rem; outline:none;">

            <select id="tx-date-preset" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="lastmonth">Mes pasado</option>
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                ${[{val:`pending`,label:`Pendiente`,color:`#fbbf24`},{val:`approved`,label:`Aprobado`,color:`#22c55e`},{val:`rejected`,label:`Rechazado`,color:`#ef4444`}].map(e=>`
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.7rem; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; border:1px solid ${S.status.includes(e.val)?e.color:`rgba(255,255,255,0.1)`};">
                        <input type="checkbox" class="tx-status-check" value="${e.val}" ${S.status.includes(e.val)?`checked`:``} style="accent-color:${e.color};">
                        <span style="color:${S.status.includes(e.val)?e.color:`var(--text-gray)`};">${e.label}</span>
                    </label>
                `).join(``)}
            </div>

            <select id="tx-method" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todos los métodos</option>
                <option value="transferencia" ${S.method===`transferencia`?`selected`:``}>Transferencia Bancaria</option>
                <option value="pasarela" ${S.method===`pasarela`?`selected`:``}>Pasarela de Pago</option>
                <option value="efectivo" ${S.method===`efectivo`?`selected`:``}>Efectivo</option>
                <option value="mercadopago" ${S.method===`mercadopago`?`selected`:``}>Mercado Pago</option>
                <option value="webpay" ${S.method===`webpay`?`selected`:``}>Webpay</option>
                <option value="manual" ${S.method===`manual`?`selected`:``}>Transferencia/Manual (legado)</option>
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="tx-min" placeholder="Min $" value="${S.minAmount}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <span style="opacity:0.5; font-size:0.75rem;">-</span>
                <input type="number" id="tx-max" placeholder="Max $" value="${S.maxAmount}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
            </div>

            <button id="tx-clear-filters" class="btn-glass-small" style="font-size:0.7rem;"><i data-lucide="x" style="width:12px;"></i> Limpiar</button>
        </div>

        <!-- Totales -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.8rem; color:var(--text-gray);">Mostrando <strong style="color:white;">${t.length}</strong> transacciones | Total filtrado: <strong style="color:var(--accent-purple);">${O(n)}</strong></span>
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
                    ${a.length===0?`<tr><td colspan="8" style="padding:30px; text-align:center; opacity:0.5;">No hay transacciones que coincidan con los filtros.</td></tr>`:a.map(e=>{let t=e.profiles?.full_name||e.user_name||`N/A`,n=e.profiles?.email||``,r=e.concept||e.plan_name||`Membresía`,i=parseFloat(e.amount)||0,a=e.payment_method||`manual`,o={transferencia:`Transferencia Bancaria`,pasarela:`Pasarela de Pago`,efectivo:`Efectivo`,mercadopago:`Mercado Pago`,webpay:`Webpay`,manual:`Transferencia/Manual`}[a]||a,s=e.status===`approved`?`#22c55e`:e.status===`pending`?`#fbbf24`:`#ef4444`,c=e.status===`approved`?`Aprobado`:e.status===`pending`?`Pendiente`:`Rechazado`,l=e.status===`approved`?`rgba(34,197,94,0.15)`:e.status===`pending`?`rgba(251,191,36,0.15)`:`rgba(239,68,68,0.15)`;return`
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                                <td style="padding:10px 12px; white-space:nowrap;">${ee(e.created_at)}</td>
                                <td style="padding:10px 12px;">
                                    <strong>${t}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">${n}</span>
                                </td>
                                <td style="padding:10px 12px;">${r}</td>
                                <td style="padding:10px 12px; text-align:right; font-weight:700;">${O(i)}</td>
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
                    <option value="25" ${T===25?`selected`:``}>25</option>
                    <option value="50" ${T===50?`selected`:``}>50</option>
                    <option value="100" ${T===100?`selected`:``}>100</option>
                </select>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button id="tx-prev-page" class="btn-glass-small" ${w<=1?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-left" style="width:14px;"></i></button>
                <span style="font-size:0.8rem;">Página <strong>${w}</strong> de ${r}</span>
                <button id="tx-next-page" class="btn-glass-small" ${w>=r?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-right" style="width:14px;"></i></button>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),oe(e,t)},oe=(e,t)=>{let r=e.querySelector(`#tx-search`);if(r){let e;r.oninput=()=>{clearTimeout(e),e=setTimeout(()=>{S.search=r.value,w=1,M()},300)}}let i=e.querySelector(`#tx-date-preset`);i&&(i.onchange=()=>{let e=new Date,t=i.value;if(S.dateFrom=``,S.dateTo=``,t===`today`)S.dateFrom=A(),S.dateTo=A();else if(t===`week`){let t=new Date(e);t.setDate(t.getDate()-7),S.dateFrom=t.toISOString().split(`T`)[0],S.dateTo=A()}else if(t===`month`)S.dateFrom=`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-01`,S.dateTo=A();else if(t===`lastmonth`){let t=new Date(e.getFullYear(),e.getMonth()-1,1);S.dateFrom=t.toISOString().split(`T`)[0];let n=new Date(e.getFullYear(),e.getMonth(),0);S.dateTo=n.toISOString().split(`T`)[0]}w=1,M()}),e.querySelectorAll(`.tx-status-check`).forEach(t=>{t.onchange=()=>{let t=Array.from(e.querySelectorAll(`.tx-status-check:checked`)).map(e=>e.value);S.status=t.length?t:[`pending`,`approved`,`rejected`],w=1,M()}});let a=e.querySelector(`#tx-method`);a&&(a.onchange=()=>{S.method=a.value,w=1,M()});let o=e.querySelector(`#tx-min`),s=e.querySelector(`#tx-max`);o&&(o.onchange=()=>{S.minAmount=o.value,w=1,M()}),s&&(s.onchange=()=>{S.maxAmount=s.value,w=1,M()});let c=e.querySelector(`#tx-clear-filters`);c&&(c.onclick=()=>{S={search:``,status:[`pending`,`approved`,`rejected`],dateFrom:``,dateTo:``,method:``,minAmount:``,maxAmount:``},w=1,M()}),e.querySelectorAll(`th[data-sort]`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-sort`);C.field===t?C.dir=C.dir===`asc`?`desc`:`asc`:(C.field=t,C.dir=`desc`),M()}});let l=e.querySelector(`#tx-prev-page`),u=e.querySelector(`#tx-next-page`),d=e.querySelector(`#tx-per-page`);l&&(l.onclick=()=>{w>1&&(w--,M())}),u&&(u.onclick=()=>{w++,M()}),d&&(d.onchange=()=>{T=parseInt(d.value),w=1,M()}),e.querySelectorAll(`.tx-approve-btn`).forEach(e=>{e.onclick=()=>je(e.getAttribute(`data-id`),`approved`)}),e.querySelectorAll(`.tx-edit-btn`).forEach(e=>{e.onclick=async()=>{let t=prompt(`Nuevo monto (deja vacío para cancelar):`);if(t!==null&&t.trim()!==``)try{await window.supabase.from(`payments`).update({amount:parseFloat(t)}).eq(`id`,e.getAttribute(`data-id`)),window.showToast(`Monto actualizado ✅`,`#22c55e`),await j(),M()}catch{window.showToast(`Error al editar`,`#ef4444`)}}}),e.querySelectorAll(`.tx-revert-btn`).forEach(e=>{e.onclick=()=>je(e.getAttribute(`data-id`),`pending`)}),e.querySelectorAll(`.tx-delete-btn`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Eliminar este registro de pago?`))try{await window.supabase.from(`payments`).delete().eq(`id`,e.getAttribute(`data-id`)),window.showToast(`Registro eliminado ✅`,`#22c55e`),await j(),M()}catch{window.showToast(`Error al eliminar`,`#ef4444`)}}});let f=e.querySelector(`#tx-export-btn`);f&&(f.onclick=()=>{let r=e.querySelector(`#tx-export-format`)?.value||`csv`;n(r,t.map(e=>[ee(e.created_at),e.profiles?.full_name||e.user_name||`N/A`,e.profiles?.email||``,e.concept||e.plan_name||`Membresía`,parseFloat(e.amount||0).toFixed(0),e.payment_method||`manual`,e.status===`approved`?`Aprobado`:e.status===`pending`?`Pendiente`:`Rechazado`,e.coverage_month||``]),[`Fecha`,`Alumno`,`Email`,`Concepto`,`Monto`,`Método`,`Estado`,`Cobertura`],`Transacciones_Amaru_${A()}`),window.showToast&&window.showToast(`Exportado (${r.toUpperCase()}) ✅`,`#22c55e`)})},se=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=y.filter(e=>e.membership_status===`active`||e.membership_status===`frozen`).map(e=>{let i=v.filter(t=>t.user_id===e.id&&t.status===`approved`).sort((e,t)=>new Date(t.created_at)-new Date(e.created_at))[0]||null,a=i?te(i.coverage_month):null,o=`none`,s=`Sin registro`,c=`#9ca3af`,l=`rgba(156,163,175,0.15)`;if(i)if(a&&a.month===n&&a.year===r)o=`ok`,s=`Al día`,c=`#22c55e`,l=`rgba(34,197,94,0.15)`;else{let n=e.membership_expiry?new Date(e.membership_expiry):null,r=n?Math.ceil((n-t)/(1e3*60*60*24)):null;r!==null&&r>0&&r<=5?(o=`warning`,s=`Por vencer`,c=`#fbbf24`,l=`rgba(251,191,36,0.15)`):r!==null&&r<=0?(o=`overdue`,s=`Moroso`,c=`#ef4444`,l=`rgba(239,68,68,0.15)`):(o=`warning`,s=`Pendiente`,c=`#fbbf24`,l=`rgba(251,191,36,0.15)`)}let u=b.find(t=>t.id===e.membership_plan_id);return{profile:e,lastPayment:i,coverageMonth:i?.coverage_month||`—`,status:o,statusLabel:s,statusColor:c,statusBg:l,planName:u?.name||`Sin plan`,planPrice:u?.price||0}}),a=i;E!==`all`&&(a=i.filter(e=>e.status===E));let o={ok:0,warning:0,overdue:0,none:0};i.forEach(e=>o[e.status]++);let s=i.length,c=s>0?(o.ok/s*100).toFixed(0):0;e.innerHTML=`
        <!-- KPIs Cobranza -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px;">
                <span style="font-size:1.2rem; font-weight:900; color:white;">${s}</span>
                <span style="font-size:0.8rem; color:var(--text-gray);">alumnos activos</span>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="cov-filter-btn btn-glass-small ${E===`all`?`active`:``}" data-filter="all" style="font-size:0.75rem; ${E===`all`?`background:rgba(255,255,255,0.1); color:white; border-color:white;`:``}">
                    Todos (${s})
                </button>
                <button class="cov-filter-btn btn-glass-small ${E===`ok`?`active`:``}" data-filter="ok" style="font-size:0.75rem; ${E===`ok`?`background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e;`:`color:#22c55e; border-color:rgba(34,197,94,0.3);`}">
                    🟢 Al día (${o.ok})
                </button>
                <button class="cov-filter-btn btn-glass-small ${E===`warning`?`active`:``}" data-filter="warning" style="font-size:0.75rem; ${E===`warning`?`background:rgba(251,191,36,0.2); color:#fbbf24; border-color:#fbbf24;`:`color:#fbbf24; border-color:rgba(251,191,36,0.3);`}">
                    🟡 Por vencer (${o.warning})
                </button>
                <button class="cov-filter-btn btn-glass-small ${E===`overdue`?`active`:``}" data-filter="overdue" style="font-size:0.75rem; ${E===`overdue`?`background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;`:`color:#ef4444; border-color:rgba(239,68,68,0.3);`}">
                    🔴 Morosos (${o.overdue})
                </button>
                <button class="cov-filter-btn btn-glass-small ${E===`none`?`active`:``}" data-filter="none" style="font-size:0.75rem; ${E===`none`?`background:rgba(156,163,175,0.2); color:#9ca3af; border-color:#9ca3af;`:`color:#9ca3af; border-color:rgba(156,163,175,0.3);`}">
                    ⚪ Sin registro (${o.none})
                </button>
            </div>
            <div style="min-width:150px; text-align:right;">
                <div style="font-size:0.75rem; color:var(--text-gray); margin-bottom:4px;">Cobertura ${k(n)} ${r}</div>
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
                                ${n.email&&!n.email.includes(`@amaru.local`)?n.email:`<span style="color:#fbbf24;">📵 Sin tecnología</span>`}
                                ${r===null?``:` • Vence: ${r>0?r+` días`:`Expirado`}`}
                            </span>
                        </div>
                        <div style="text-align:right; flex-shrink:0; min-width:120px;">
                            <span style="font-size:0.7rem; color:var(--text-gray); display:block;">Último pago</span>
                            <strong style="font-size:0.85rem; color:white;">${e.lastPayment?O(parseFloat(e.lastPayment.amount)||0):`—`}</strong>
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
    `,window.lucide&&window.lucide.createIcons(),e.querySelectorAll(`.cov-filter-btn`).forEach(e=>{e.onclick=()=>{E=e.getAttribute(`data-filter`),M()}}),e.querySelectorAll(`.btn-register-payment`).forEach(e=>{e.onclick=()=>N(e.getAttribute(`data-uid`))})},N=e=>{let t=y.find(t=>t.id===e),n=b.find(e=>e.id===t?.membership_plan_id),r=n?.price||``,a=n?.name||`Membresía`,o=new Date,s=k(o.getMonth()),c=o.getFullYear(),l=document.createElement(`div`);l.className=`glass-container`,l.style.cssText=`
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; padding: 20px; transition: opacity 0.3s ease;
    `,l.innerHTML=`
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
                <input type="text" id="qp-concept" value="${a}" class="login-input" style="width:100%; padding:12px 15px;">
            </div>
            <div style="margin-bottom:15px;">
                <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Método de Pago</label>
                <select id="qp-method" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                    <option value="transferencia" style="background:#111; color:white;">🏦 Transferencia Bancaria</option>
                    <option value="pasarela" style="background:#111; color:white;">💳 Pasarela de Pago (Webpay/Mercado Pago)</option>
                    <option value="efectivo" style="background:#111; color:white;">💵 Efectivo</option>
                </select>
            </div>
            <div style="display:flex; gap:15px; margin-bottom:25px;">
                <div style="flex:2;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Mes de Cobertura</label>
                    <select id="qp-month" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                        ${[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`].map(e=>`<option value="${e}" ${e===s?`selected`:``} style="background:#111; color:white;">${e}</option>`).join(``)}
                    </select>
                </div>
                <div style="flex:1;">
                    <label style="display:block; font-size:0.8rem; margin-bottom:6px; opacity:0.8; font-weight:600;">Año</label>
                    <select id="qp-year" class="login-input" style="width:100%; appearance:none; cursor:pointer; padding:12px 15px;">
                        ${[c-1,c,c+1].map(e=>`<option value="${e}" ${e===c?`selected`:``} style="background:#111; color:white;">${e}</option>`).join(``)}
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
    `,document.body.appendChild(l),window.lucide&&window.lucide.createIcons();let u=()=>{l.style.opacity=`0`,setTimeout(()=>l.remove(),300)};l.querySelectorAll(`.close-quick-modal`).forEach(e=>{e.onclick=u}),document.getElementById(`qp-save-btn`).onclick=async()=>{let t=parseFloat(document.getElementById(`qp-amount`).value),n=document.getElementById(`qp-concept`).value.trim(),r=document.getElementById(`qp-method`).value,a=document.getElementById(`qp-month`).value,o=document.getElementById(`qp-year`).value;if(!t||t<=0){window.showToast(`Ingresa un monto válido`,`#ef4444`);return}try{window.showToast(`Registrando pago...`);let{error:s}=await window.supabase.from(`payments`).insert({user_id:e,amount:t,concept:n,status:`approved`,payment_method:r,coverage_month:`${a} ${o}`,created_at:new Date().toISOString()});if(s)throw s;let c=new Date;c.setDate(c.getDate()+30),await window.supabase.from(`profiles`).update({membership_status:`active`,membership_expiry:c.toISOString(),is_frozen:!1}).eq(`id`,e),window.showToast(`Pago registrado ✅`,`#22c55e`),u(),await j(),M(),i()}catch(e){console.error(e),window.showToast(`Error al registrar pago`,`#ef4444`)}}},ce=e({renderAdminMembers:()=>U}),P=[],F=[],le=[],I=`dashboard`,L={search:``,status:[],plan:``,minDaysLeft:``,maxDaysLeft:``,minLastAttendance:``},R={field:`full_name`,dir:`asc`},z=1,B=25,V=`all`,H=`all`,ue=()=>document.getElementById(`admin-content-area`),de=e=>e?new Date(e).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,fe=e=>[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][e]||``,pe=async()=>{try{let e=await window.supabase.from(`profiles`).select(`*`).eq(`is_deleted`,!1),t=await window.supabase.from(`reservations`).select(`*`),n=await window.supabase.from(`membership_plans`).select(`*`),r=await window.supabase.from(`payments`).select(`*`);P=e.data||[],F=t.data||[],n.data,le=r.data||[]}catch(e){console.error(`[Members] Error fetching data:`,e),window.showToast&&window.showToast(`Error cargando datos de socios`,`#ef4444`)}},U=async()=>{let e=ue(),t=document.getElementById(`admin-revenue-section`);t&&t.classList.add(`hidden`),e.innerHTML=`
        <div class="glass-premium p-20">
            <div class="p-20 text-center">
                <i data-lucide="loader" class="spin"></i>
                <p style="margin-top:10px; opacity:0.7; font-size:0.85rem;">Cargando control de socios...</p>
            </div>
        </div>`,window.lucide&&window.lucide.createIcons(),await pe(),W()},W=()=>{let e=ue();if(!e)return;e.innerHTML=`
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
                <button id="tab-dashboard" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${I===`dashboard`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="layout-dashboard" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Dashboard
                </button>
                <button id="tab-directorio" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${I===`directorio`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="users" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Directorio
                </button>
                <button id="tab-retencion" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${I===`retencion`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="heart-pulse" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Retención
                </button>
                <button id="tab-comunicaciones" class="btn-glass" style="padding:8px 18px; font-size:0.8rem; font-weight:700; ${I===`comunicaciones`?`background:var(--accent-purple); color:#fff; border-color:var(--accent-purple);`:``}">
                    <i data-lucide="message-square" style="width:14px; vertical-align:middle; margin-right:4px;"></i> Comunicaciones
                </button>
            </div>

            <!-- Content area -->
            <div id="members-view-content"></div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),document.getElementById(`tab-dashboard`).onclick=()=>{I=`dashboard`,W()},document.getElementById(`tab-directorio`).onclick=()=>{I=`directorio`,W()},document.getElementById(`tab-retencion`).onclick=()=>{I=`retencion`,W()},document.getElementById(`tab-comunicaciones`).onclick=()=>{I=`comunicaciones`,W()},document.getElementById(`btn-add-member-admin`).onclick=()=>X();let t=document.getElementById(`members-view-content`);I===`dashboard`?me(t):I===`directorio`?ge(t):I===`retencion`?ve(t):ye(t)},me=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=P.map(e=>be(e,t,n,r)),a=i.length,o=i.filter(e=>e._status===`Activo`).length,s=i.filter(e=>e._status===`Inactivo`).length,c=i.filter(e=>e._status===`Moroso`).length,l=i.filter(e=>e._status===`Congelado`).length,u=i.filter(e=>{let t=e.created_at?new Date(e.created_at):null;return t&&t.getMonth()===n&&t.getFullYear()===r}).length,d=i.length>0?Math.round(i.reduce((e,n)=>{let r=n.created_at?new Date(n.created_at):t;return e+Math.floor((t-r)/(1e3*60*60*24))},0)/i.length):0,f=a>0?(o/a*100).toFixed(0):0,p=[...i].filter(e=>e.created_at).sort((e,t)=>new Date(t.created_at)-new Date(e.created_at)).slice(0,5),m=[...le].filter(e=>e.status===`approved`).sort((e,t)=>new Date(t.created_at)-new Date(e.created_at)).slice(0,5),h=[];for(let e=5;e>=0;e--){let t=new Date(r,n-e,1),a=t.getMonth(),o=t.getFullYear(),s=i.filter(e=>{let t=e.created_at?new Date(e.created_at):null;return t&&t.getMonth()===a&&t.getFullYear()===o}).length;h.push({label:fe(a).substring(0,3),count:s})}let g={};i.forEach(e=>{let t=e.membership_plans?.name||`Sin Plan`;g[t]=(g[t]||0)+1});let _=[];for(let e=6;e>=0;e--){let n=new Date(t);n.setDate(n.getDate()-e);let r=n.toISOString().split(`T`)[0],i=F.filter(e=>e.reservation_date===r).length;_.push({label:n.toLocaleDateString(`es-CL`,{weekday:`short`,day:`numeric`}),count:i})}let v=i.filter(e=>e._status===`Activo`&&e._daysLeft!==null&&e._daysLeft>0&&e._daysLeft<=5).slice(0,5),y=i.filter(e=>e._status===`Activo`&&e._daysSinceLastAttendance>14&&e._daysSinceLastAttendance!==-1).slice(0,5),b=i.filter(e=>e._status===`Moroso`).slice(0,5);e.innerHTML=`
        <style>
            @keyframes dashFadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
            .dash-section { animation: dashFadeIn 0.4s ease forwards; }
        </style>

        <!-- KPIs con barras de progreso -->
        <div class="dash-section" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
            <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${a}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Total Socios</span>
                <div style="width:100%; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                    <div style="width:${f}%; height:100%; background:var(--accent-purple); border-radius:2px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${f}% retención • ${u} nuevos</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">${o}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Activos</span>
                <div style="width:100%; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                    <div style="width:${a>0?o/a*100:0}%; height:100%; background:#22c55e; border-radius:2px;"></div>
                </div>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${a>0?Math.round(o/a*100):0}% del total</span>
            </div>
            <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:#3b82f6;">${l}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Congelados</span>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${d} días promedio</span>
            </div>
            <div class="stat-mini-premium ${c>0?`pulse-warning`:``}" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:18px; border-radius:14px; text-align:center;">
                <strong style="display:block; font-size:1.5rem; font-weight:900; color:#ef4444;">${c}</strong>
                <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:8px;">Morosos</span>
                <span style="font-size:0.7rem; color:var(--text-gray); display:block; margin-top:4px;">${s} inactivos totales</span>
            </div>
        </div>

        <!-- Gráficos -->
        <div class="dash-section" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:25px;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="trending-up" style="width:14px; color:var(--accent-purple);"></i> Nuevos Socios (6 meses)</h4>
                <div class="chart-container" style="min-height:160px;"><canvas id="membersEvolutionChart"></canvas></div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="pie-chart" style="width:14px; color:#22c55e;"></i> Distribución por Plan</h4>
                <div class="chart-container" style="min-height:160px;"><canvas id="membersPlanChart"></canvas></div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="calendar-check" style="width:14px; color:var(--accent-cyan);"></i> Asistencia Últimos 7 Días</h4>
                <div class="chart-container" style="min-height:160px;"><canvas id="membersAttendanceChart"></canvas></div>
            </div>
        </div>

        <!-- Actividad Reciente -->
        <div class="dash-section" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:25px;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="user-plus" style="width:14px; color:var(--accent-purple);"></i> Socios Recientes</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${p.length===0?`<p style="opacity:0.5; font-size:0.8rem; padding:10px;">Sin registros recientes</p>`:p.map(e=>`
                            <div style="display:flex; align-items:center; gap:10px; padding:8px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <img src="${e.photo_url||`/assets/unknow-BC4RhdqH.png`}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                                <div style="flex:1; min-width:0;">
                                    <strong style="font-size:0.8rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.full_name||`Sin nombre`}</strong>
                                    <span style="font-size:0.65rem; color:var(--text-gray);">${e._status} • ${e.membership_plans?.name||`Sin plan`}</span>
                                </div>
                                <span style="font-size:0.65rem; color:var(--text-gray); flex-shrink:0;">${e.created_at?new Date(e.created_at).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`}):``}</span>
                            </div>
                        `).join(``)}
                </div>
            </div>
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:15px;">
                <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:6px;"><i data-lucide="receipt" style="width:14px; color:#22c55e;"></i> Pagos Recientes</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${m.length===0?`<p style="opacity:0.5; font-size:0.8rem; padding:10px;">Sin pagos recientes</p>`:m.map(e=>`
                            <div style="display:flex; align-items:center; gap:10px; padding:8px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <div style="width:32px; height:32px; border-radius:50%; background:rgba(34,197,94,0.1); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="dollar-sign" style="width:14px; color:#22c55e;"></i>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <strong style="font-size:0.8rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.find(t=>t.id===e.user_id)?.full_name||`Socio`}</strong>
                                    <span style="font-size:0.65rem; color:var(--text-gray);">${e.concept||`Pago`}</span>
                                </div>
                                <span style="font-size:0.8rem; color:#22c55e; font-weight:700; flex-shrink:0;">$${(parseFloat(e.amount)||0).toLocaleString(`es-CL`)}</span>
                            </div>
                        `).join(``)}
                </div>
            </div>
        </div>

        <!-- Alertas críticas -->
        <div class="dash-section">
            <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-triangle" style="width:16px; color:#ef4444;"></i> Alertas Críticas
            </h4>
            ${v.length===0&&y.length===0&&b.length===0?`<p style="opacity:0.5; font-size:0.85rem; padding:15px;">🎉 No hay alertas críticas. Todo está bajo control.</p>`:`<div style="display:flex; flex-direction:column; gap:8px;">
                    ${v.map(e=>G(e,`expiring`)).join(``)}
                    ${y.map(e=>G(e,`noAttendance`)).join(``)}
                    ${b.map(e=>G(e,`overdue`)).join(``)}
                </div>`}
        </div>
    `,window.lucide&&window.lucide.createIcons(),he(h,g,_),e.querySelectorAll(`.alert-action-renew`).forEach(e=>{e.onclick=()=>xe(e.getAttribute(`data-id`))}),e.querySelectorAll(`.alert-action-register`).forEach(e=>{e.onclick=()=>N(e.getAttribute(`data-uid`))}),e.querySelectorAll(`.alert-action-edit`).forEach(e=>{e.onclick=()=>X(e.getAttribute(`data-id`),P)})},G=(e,t)=>{let n={expiring:{icon:`clock`,color:`#fbbf24`,bg:`rgba(251,191,36,0.08)`,border:`rgba(251,191,36,0.2)`,text:`Vence en ${e._daysLeft} días`},noAttendance:{icon:`user-x`,color:`#f97316`,bg:`rgba(249,115,22,0.08)`,border:`rgba(249,115,22,0.2)`,text:`Sin asistir hace ${e._daysSinceLastAttendance} días`},overdue:{icon:`alert-circle`,color:`#ef4444`,bg:`rgba(239,68,68,0.08)`,border:`rgba(239,68,68,0.2)`,text:`Membresía vencida`}}[t];return`
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
    `},he=(e,t,n)=>{let r=document.getElementById(`membersEvolutionChart`);r&&(window._membersEvolutionChart&&window._membersEvolutionChart.destroy(),window._membersEvolutionChart=new Chart(r,{type:`line`,data:{labels:e.map(e=>e.label),datasets:[{label:`Nuevos`,data:e.map(e=>e.count),borderColor:`var(--accent-purple)`,backgroundColor:`rgba(139,92,246,0.15)`,fill:!0,tension:.4,borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:10}},grid:{display:!1}},y:{ticks:{color:`rgba(255,255,255,0.4)`,font:{size:10}},grid:{color:`rgba(255,255,255,0.06)`},beginAtZero:!0}}}}));let i=document.getElementById(`membersPlanChart`);if(i){window._membersPlanChart&&window._membersPlanChart.destroy();let e=Object.keys(t),n=Object.values(t);window._membersPlanChart=new Chart(i,{type:`doughnut`,data:{labels:e,datasets:[{data:n,backgroundColor:[`#8b5cf6`,`#22c55e`,`#3b82f6`,`#f97316`,`#ef4444`,`#fbbf24`],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:`right`,labels:{color:`rgba(255,255,255,0.7)`,font:{size:10},boxWidth:10}}}}})}let a=document.getElementById(`membersAttendanceChart`);a&&n&&(window._membersAttendanceChart&&window._membersAttendanceChart.destroy(),window._membersAttendanceChart=new Chart(a,{type:`bar`,data:{labels:n.map(e=>e.label),datasets:[{label:`Asistencias`,data:n.map(e=>e.count),backgroundColor:`rgba(6,182,212,0.7)`,borderColor:`rgba(6,182,212,1)`,borderWidth:1,borderRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:9}},grid:{display:!1}},y:{ticks:{color:`rgba(255,255,255,0.4)`,font:{size:9}},grid:{color:`rgba(255,255,255,0.06)`},beginAtZero:!0}}}}))},ge=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=P.map(e=>be(e,t,n,r));if(L.search){let e=L.search.toLowerCase();i=i.filter(t=>(t.full_name||``).toLowerCase().includes(e)||(t.email||``).toLowerCase().includes(e)||(t.phone||``).toLowerCase().includes(e))}L.status.length>0&&(i=i.filter(e=>L.status.includes(e._status))),L.plan&&(i=i.filter(e=>(e.membership_plans?.name||``)===L.plan)),L.minDaysLeft!==``&&(i=i.filter(e=>e._daysLeft!==null&&e._daysLeft>=parseInt(L.minDaysLeft))),L.maxDaysLeft!==``&&(i=i.filter(e=>e._daysLeft!==null&&e._daysLeft<=parseInt(L.maxDaysLeft))),L.minLastAttendance!==``&&(i=i.filter(e=>e._daysSinceLastAttendance>=parseInt(L.minLastAttendance))),i.sort((e,t)=>{let n,r;switch(R.field){case`full_name`:n=e.full_name||``,r=t.full_name||``;break;case`status`:n=e._status,r=t._status;break;case`plan`:n=e.membership_plans?.name||``,r=t.membership_plans?.name||``;break;case`expiry`:n=e._expiryDate||0,r=t._expiryDate||0;break;case`lastAttendance`:n=e._lastAttendance||0,r=t._lastAttendance||0;break;case`level`:n=e.level||0,r=t.level||0;break;default:n=e.full_name||``,r=t.full_name||``}return R.dir===`asc`?n>r?1:-1:n<r?1:-1});let a=Math.max(1,Math.ceil(i.length/B));z=Math.min(z,a);let o=(z-1)*B,s=i.slice(o,o+B),c=[{val:`Activo`,label:`Activo`,color:`#22c55e`},{val:`Inactivo`,label:`Inactivo`,color:`#ef4444`},{val:`Moroso`,label:`Moroso`,color:`#f97316`},{val:`Congelado`,label:`Congelado`,color:`#3b82f6`}],l=[...new Set(P.map(e=>e.membership_plans?.name).filter(Boolean))];e.innerHTML=`
        <!-- Filtros -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:16px; padding:12px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
            <input type="text" id="dir-search" placeholder="🔍 Buscar nombre, email o teléfono..." value="${L.search}" style="flex:1; min-width:180px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 12px; border-radius:8px; font-size:0.8rem; outline:none;">

            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                ${c.map(e=>`
                    <label style="display:flex; align-items:center; gap:4px; font-size:0.7rem; cursor:pointer; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:6px; border:1px solid ${L.status.includes(e.val)?e.color:`rgba(255,255,255,0.1)`};">
                        <input type="checkbox" class="dir-status-check" value="${e.val}" ${L.status.includes(e.val)?`checked`:``} style="accent-color:${e.color};">
                        <span style="color:${L.status.includes(e.val)?e.color:`var(--text-gray)`};">${e.label}</span>
                    </label>
                `).join(``)}
            </div>

            <select id="dir-plan" style="background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <option value="">Todos los planes</option>
                ${l.map(e=>`<option value="${e}" ${L.plan===e?`selected`:``}>${e}</option>`).join(``)}
            </select>

            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="dir-min-days" placeholder="Min días" value="${L.minDaysLeft}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
                <span style="opacity:0.5; font-size:0.75rem;">-</span>
                <input type="number" id="dir-max-days" placeholder="Max días" value="${L.maxDaysLeft}" style="width:80px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">
            </div>

            <input type="number" id="dir-min-attendance" placeholder="Sin asistir ≥ días" value="${L.minLastAttendance}" style="width:120px; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:8px 10px; border-radius:8px; font-size:0.75rem; outline:none;">

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
                                                <span style="font-size:0.7rem; color:var(--text-gray); display:block;">
                                                    ${e.email&&!e.email.includes(`@amaru.local`)?e.email:`<span style="color:#fbbf24;">📵 Sin tecnología</span>`}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding:10px 12px;">${e.membership_plans?.name||`Sin Plan`}</td>
                                    <td style="padding:10px 12px; text-align:center;">
                                        <span style="font-size:0.7rem; background:${n}; color:${t}; padding:3px 10px; border-radius:20px; font-weight:700;">${e._status}</span>
                                    </td>
                                    <td style="padding:10px 12px; white-space:nowrap;">
                                        ${e._expiryDate?de(e._expiryDate.toISOString()):`—`}
                                        ${e._daysLeft===null?``:`<span style="font-size:0.7rem; color:${e._daysLeft<=5?`#ef4444`:`var(--text-gray)`}; display:block;">${e._daysLeft>0?e._daysLeft+` días`:`Expirado`}</span>`}
                                    </td>
                                    <td style="padding:10px 12px; white-space:nowrap;">
                                        ${e._lastAttendance?de(e._lastAttendance.toISOString()):`Nunca`}
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
                    <option value="25" ${B===25?`selected`:``}>25</option>
                    <option value="50" ${B===50?`selected`:``}>50</option>
                    <option value="100" ${B===100?`selected`:``}>100</option>
                </select>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button id="dir-prev-page" class="btn-glass-small" ${z<=1?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-left" style="width:14px;"></i></button>
                <span style="font-size:0.8rem;">Página <strong>${z}</strong> de ${a}</span>
                <button id="dir-next-page" class="btn-glass-small" ${z>=a?`disabled style="opacity:0.3;"`:``} style="font-size:0.75rem;"><i data-lucide="chevron-right" style="width:14px;"></i></button>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),_e(e,i)},_e=(e,n)=>{let r=e.querySelector(`#dir-search`);if(r){let e;r.oninput=()=>{clearTimeout(e),e=setTimeout(()=>{L.search=r.value,z=1,W()},300)}}e.querySelectorAll(`.dir-status-check`).forEach(t=>{t.onchange=()=>{let t=Array.from(e.querySelectorAll(`.dir-status-check:checked`)).map(e=>e.value);L.status=t,z=1,W()}});let i=e.querySelector(`#dir-plan`);i&&(i.onchange=()=>{L.plan=i.value,z=1,W()});let a=e.querySelector(`#dir-min-days`),o=e.querySelector(`#dir-max-days`);a&&(a.onchange=()=>{L.minDaysLeft=a.value,z=1,W()}),o&&(o.onchange=()=>{L.maxDaysLeft=o.value,z=1,W()});let s=e.querySelector(`#dir-min-attendance`);s&&(s.onchange=()=>{L.minLastAttendance=s.value,z=1,W()});let c=e.querySelector(`#dir-clear-filters`);c&&(c.onclick=()=>{L={search:``,status:[],plan:``,minDaysLeft:``,maxDaysLeft:``,minLastAttendance:``},z=1,W()}),e.querySelectorAll(`th[data-sort]`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-sort`);R.field===t?R.dir=R.dir===`asc`?`desc`:`asc`:(R.field=t,R.dir=`asc`),W()}});let l=e.querySelector(`#dir-prev-page`),u=e.querySelector(`#dir-next-page`),d=e.querySelector(`#dir-per-page`);l&&(l.onclick=()=>{z>1&&(z--,W())}),u&&(u.onclick=()=>{z++,W()}),d&&(d.onchange=()=>{B=parseInt(d.value),z=1,W()}),e.querySelectorAll(`.dir-edit-btn`).forEach(e=>{e.onclick=()=>X(e.getAttribute(`data-id`),P)}),e.querySelectorAll(`.dir-renew-btn`).forEach(e=>{e.onclick=()=>xe(e.getAttribute(`data-id`))}),e.querySelectorAll(`.dir-delete-btn`).forEach(e=>{e.onclick=()=>He(e.getAttribute(`data-id`))});let f=e.querySelector(`#dir-export-btn`);f&&(f.onclick=()=>{let r=e.querySelector(`#dir-export-format`)?.value||`csv`;t(n,r),window.showToast&&window.showToast(`Exportado (${r.toUpperCase()}) ✅`,`#22c55e`)})},ve=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=P.map(e=>be(e,t,n,r)).map(e=>{let n=0;return e._status===`Inactivo`&&(n+=80),e._status===`Moroso`&&(n+=60),e._daysSinceLastAttendance>30?n+=40:e._daysSinceLastAttendance>14?n+=25:e._daysSinceLastAttendance>7&&(n+=10),e._daysLeft!==null&&e._daysLeft<=5&&e._daysLeft>0&&(n+=30),e._monthRes<=1&&t.getDate()>15&&(n+=15),e._status===`Congelado`&&(n+=20),{...e,_churnScore:Math.min(100,n)}}),a=i;V===`high`?a=i.filter(e=>e._churnScore>=60):V===`medium`?a=i.filter(e=>e._churnScore>=30&&e._churnScore<60):V===`low`?a=i.filter(e=>e._churnScore>0&&e._churnScore<30):V===`inactive`&&(a=i.filter(e=>e._status===`Inactivo`)),a.sort((e,t)=>t._churnScore-e._churnScore);let o={high:0,medium:0,low:0,inactive:0};i.forEach(e=>{e._status===`Inactivo`?o.inactive++:e._churnScore>=60?o.high++:e._churnScore>=30?o.medium++:e._churnScore>0&&o.low++}),e.innerHTML=`
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:20px;">
            <div style="display:flex; flex-wrap:wrap; gap:10px; padding:15px; background:rgba(255,255,255,0.03); border-radius:12px; border:1px solid rgba(255,255,255,0.06); align-items:center;">
                <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:200px;">
                    <span style="font-size:1.2rem; font-weight:900; color:white;">${i.length}</span>
                    <span style="font-size:0.8rem; color:var(--text-gray);">socios evaluados</span>
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="risk-filter-btn btn-glass-small ${V===`all`?`active`:``}" data-filter="all" style="font-size:0.75rem; ${V===`all`?`background:rgba(255,255,255,0.1); color:white; border-color:white;`:``}">
                    Todos
                </button>
                <button class="risk-filter-btn btn-glass-small ${V===`high`?`active`:``}" data-filter="high" style="font-size:0.75rem; ${V===`high`?`background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;`:`color:#ef4444; border-color:rgba(239,68,68,0.3);`}">
                    🔴 Alto riesgo (${o.high})
                </button>
                <button class="risk-filter-btn btn-glass-small ${V===`medium`?`active`:``}" data-filter="medium" style="font-size:0.75rem; ${V===`medium`?`background:rgba(251,191,36,0.2); color:#fbbf24; border-color:#fbbf24;`:`color:#fbbf24; border-color:rgba(251,191,36,0.3);`}">
                    🟡 Medio riesgo (${o.medium})
                </button>
                <button class="risk-filter-btn btn-glass-small ${V===`low`?`active`:``}" data-filter="low" style="font-size:0.75rem; ${V===`low`?`background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e;`:`color:#22c55e; border-color:rgba(34,197,94,0.3);`}">
                    🟢 Bajo riesgo (${o.low})
                </button>
                <button class="risk-filter-btn btn-glass-small ${V===`inactive`?`active`:``}" data-filter="inactive" style="font-size:0.75rem; ${V===`inactive`?`background:rgba(156,163,175,0.2); color:#9ca3af; border-color:#9ca3af;`:`color:#9ca3af; border-color:rgba(156,163,175,0.3);`}">
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
    `,window.lucide&&window.lucide.createIcons(),e.querySelectorAll(`.risk-filter-btn`).forEach(e=>{e.onclick=()=>{V=e.getAttribute(`data-filter`),W()}}),e.querySelectorAll(`.risk-action-edit`).forEach(e=>{e.onclick=()=>X(e.getAttribute(`data-id`),P)}),e.querySelectorAll(`.risk-action-register`).forEach(e=>{e.onclick=()=>N(e.getAttribute(`data-uid`))})},ye=e=>{let t=new Date,n=t.getMonth(),r=t.getFullYear(),i=P.map(e=>be(e,t,n,r)),a=i;H!==`all`&&(a=i.filter(e=>H===`active`?e._status===`Activo`:H===`inactive`?e._status===`Inactivo`:H===`moroso`?e._status===`Moroso`:H===`expiring`?e._status===`Activo`&&e._daysLeft!==null&&e._daysLeft>0&&e._daysLeft<=7:H===`noAttendance`?e._status===`Activo`&&e._daysSinceLastAttendance>14:!0)),[...new Set(P.map(e=>e.membership_plans?.name).filter(Boolean))],e.innerHTML=`
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
            <div>
                <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:12px;">🎯 Segmento</h4>
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">
                    <button class="comm-segment-btn btn-glass ${H===`all`?`active`:``}" data-segment="all" style="text-align:left; ${H===`all`?`background:var(--accent-purple); color:white; border-color:var(--accent-purple);`:``}">
                        <strong>Todos los socios</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${H===`active`?`active`:``}" data-segment="active" style="text-align:left; ${H===`active`?`background:#22c55e; color:white; border-color:#22c55e;`:``}">
                        <strong>Socios Activos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Activo`).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${H===`moroso`?`active`:``}" data-segment="moroso" style="text-align:left; ${H===`moroso`?`background:#f97316; color:white; border-color:#f97316;`:``}">
                        <strong>Socios Morosos</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Moroso`).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${H===`expiring`?`active`:``}" data-segment="expiring" style="text-align:left; ${H===`expiring`?`background:#fbbf24; color:white; border-color:#fbbf24;`:``}">
                        <strong>Por vencer esta semana</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Activo`&&e._daysLeft!==null&&e._daysLeft>0&&e._daysLeft<=7).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${H===`noAttendance`?`active`:``}" data-segment="noAttendance" style="text-align:left; ${H===`noAttendance`?`background:#ef4444; color:white; border-color:#ef4444;`:``}">
                        <strong>Sin asistir >14 días</strong>
                        <span style="font-size:0.75rem; opacity:0.7; display:block;">${i.filter(e=>e._status===`Activo`&&e._daysSinceLastAttendance>14).length} contactos</span>
                    </button>
                    <button class="comm-segment-btn btn-glass ${H===`inactive`?`active`:``}" data-segment="inactive" style="text-align:left; ${H===`inactive`?`background:#9ca3af; color:white; border-color:#9ca3af;`:``}">
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

                <div style="margin-top:12px; margin-bottom:8px;">
                    <label style="font-size:0.75rem; font-weight:700; color:var(--text-gray); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:6px;">Canal de envío</label>
                    <div style="display:flex; gap:8px;">
                        <label style="flex:1; display:flex; align-items:center; gap:6px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-size:0.8rem;" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.channel-label').forEach(l=>l.style.borderColor='rgba(255,255,255,0.08)'); this.style.borderColor='var(--accent-purple)';">
                            <input type="radio" name="comm-channel" value="inapp" checked style="accent-color:var(--accent-purple);">
                            <span>📱 In-App</span>
                        </label>
                        <label style="flex:1; display:flex; align-items:center; gap:6px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-size:0.8rem;" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.channel-label').forEach(l=>l.style.borderColor='rgba(255,255,255,0.08)'); this.style.borderColor='var(--accent-purple)';">
                            <input type="radio" name="comm-channel" value="email" style="accent-color:var(--accent-purple);">
                            <span>✉️ Email</span>
                        </label>
                        <label style="flex:1; display:flex; align-items:center; gap:6px; padding:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; cursor:pointer; font-size:0.8rem;" onclick="this.querySelector('input').checked=true; document.querySelectorAll('.channel-label').forEach(l=>l.style.borderColor='rgba(255,255,255,0.08)'); this.style.borderColor='var(--accent-purple)';">
                            <input type="radio" name="comm-channel" value="both" style="accent-color:var(--accent-purple);">
                            <span>🔄 Ambos</span>
                        </label>
                    </div>
                </div>

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
                                    <span style="font-size:0.7rem; color:var(--text-gray); display:block;">
                                        ${e.email&&!e.email.includes(`@amaru.local`)?e.email:`<span style="color:#fbbf24;">📵 Sin tecnología</span>`}
                                    </span>
                                </div>
                                <span class="tag" style="background:${e._statusBg}; color:${e._statusColor}; font-size:0.6rem; padding:1px 6px;">${e._status}</span>
                            </div>
                        `).join(``)}
                    ${a.length>50?`<p style="text-align:center; font-size:0.75rem; color:var(--text-gray); padding:10px;">...y ${a.length-50} más</p>`:``}
                </div>
            </div>
        </div>
    `,window.lucide&&window.lucide.createIcons(),e.querySelectorAll(`.comm-segment-btn`).forEach(e=>{e.onclick=()=>{H=e.getAttribute(`data-segment`),W()}});let o=e.querySelector(`#comm-template`),s=e.querySelector(`#comm-message`),c={payment_reminder:`Hola {nombre},

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

Equipo Amaru 🥋`};o&&s&&(o.onchange=()=>{let e=c[o.value];e&&(s.value=e)});let l=e.querySelector(`#btn-send-comm`);l&&(l.onclick=async()=>{let t=s?.value?.trim();if(!t){window.showToast(`Escribe un mensaje antes de enviar`,`#ef4444`);return}let n=e.querySelector(`input[name="comm-channel"]:checked`)?.value||`inapp`,r=o?.value?o.options[o.selectedIndex].text:`Mensaje del equipo Amaru`,i=[],c=n===`email`||n===`both`;c&&a.forEach(e=>{e.email&&e.email.includes(`@`)&&!e.email.includes(`@amaru.local`)&&i.push(e.email)});try{window.showToast(`Enviando a ${a.length} socios vía ${n}...`,`#f59e0b`);let e=0,o=0;if(n===`inapp`||n===`both`)for(let n of a){let i=t.replace(/{nombre}/g,n.full_name||`Atleta`);try{await window.SupabaseService.sendUserNotification(n.id,r,i,`mass`),e++}catch(e){console.warn(`[Comunicaciones] Fallo In-App para ${n.id}:`,e.message)}}if(c&&i.length>0)try{let e=await window.SupabaseService.sendBulkEmail(i,r,t.replace(/{nombre}/g,`Atleta`),null);o=e?.totalSent||0,e?.totalFailed>0&&console.warn(`[Comunicaciones] Emails fallados:`,e.failed)}catch(e){console.error(`[Comunicaciones] Error enviando emails:`,e)}let l=``;l=n===`both`?`${e} In-App + ${o} Email ✅`:n===`email`?`${o} emails enviados ✅`:`${e} notificaciones enviadas ✅`,window.showToast(l,`#22c55e`),s.value=``}catch(e){console.error(`[Comunicaciones] Error enviando:`,e),window.showToast(`Error al enviar notificaciones. Intenta de nuevo.`,`#ef4444`)}})},be=(e,t,n,r)=>{let i=e.membership_expiry?new Date(e.membership_expiry):null,a=i?i-t:null,o=i?Math.ceil(a/(1e3*60*60*24)):null,s=F.filter(t=>t.user_id===e.id);s.sort((e,t)=>new Date(t.reservation_date)-new Date(e.reservation_date));let c=s.length>0?new Date(s[0].reservation_date):null,l=c?Math.floor((t-c)/(1e3*60*60*24)):-1,u=s.filter(e=>{let t=new Date(e.reservation_date);return t.getMonth()===n&&t.getFullYear()===r}).length,d=`Activo`,f=`#22c55e`,p=`rgba(34, 197, 94, 0.15)`;return e.is_frozen?(d=`Congelado`,f=`#3b82f6`,p=`rgba(59, 130, 246, 0.15)`):e.membership_status===`inactive`?(d=`Inactivo`,f=`#ef4444`,p=`rgba(239, 68, 68, 0.15)`):o!==null&&o<=0?o>-30?(d=`Moroso`,f=`#f97316`,p=`rgba(249, 115, 22, 0.15)`):(d=`Inactivo`,f=`#ef4444`,p=`rgba(239, 68, 68, 0.15)`):o===null&&e.membership_status!==`active`&&(d=`Inactivo`,f=`#ef4444`,p=`rgba(239, 68, 68, 0.15)`),{...e,_status:d,_statusColor:f,_statusBg:p,_expiryDate:i,_daysLeft:o,_lastAttendance:c,_daysSinceLastAttendance:l,_monthRes:u,_totalRes:s.length}},xe=async e=>{let t=P.find(t=>t.id===e);if(!t||!t.membership_plan_id){window.showToast(`El socio no tiene un plan asignado para renovar.`,`#ef4444`);return}if(confirm(`¿Renovar el plan de ${t.full_name} por 1 mes más?`))try{let t=new Date;t.setMonth(t.getMonth()+1),await window.supabase.from(`profiles`).update({membership_expiry:t.toISOString(),membership_status:`active`,is_frozen:!1}).eq(`id`,e),window.showToast(`Plan renovado exitosamente ✅`,`#22c55e`),U()}catch(e){console.error(e),window.showToast(`Error al renovar plan.`,`#ef4444`)}},K=window.Swal,q=()=>document.getElementById(`admin-content-area`),Se=async()=>{q().innerHTML=`
        <div class="glass-premium p-20" id="classes-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:180px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:120px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:100px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
                <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:140px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;try{let e=await o.getClasses(),t={},n={};e.forEach(e=>{t[e.type]=(t[e.type]||0)+1;let r=e.days;if(typeof r==`string`)try{r=JSON.parse(r)}catch{r=[]}(Array.isArray(r)?r:[]).forEach(e=>{n[e]=(n[e]||0)+1})});let r=[`Dom`,`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`],i={Striking:`#ef4444`,BJJ:`#8b5cf6`,MMA:`#f97316`,"Funcional Fighter":`#22c55e`,"BJJ Gi":`#8b5cf6`,"No Gi":`#a855f7`},a={Striking:`swords`,BJJ:`shield`,MMA:`flame`,"Funcional Fighter":`zap`,"BJJ Gi":`shield-check`,"No Gi":`shield-off`};q().innerHTML=`
            <div class="glass-premium p-20" id="classes-main">
                <style>
                    @keyframes classFadeIn {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Gestión de Clases</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${e.length} clases configuradas</p>
                    </div>
                    <button class="btn-action-glow" id="btn-add-class-admin"><i data-lucide="plus"></i> Clase</button>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:20px;">
                    ${Object.entries(t).map(([e,t])=>`
                        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px; text-align:center;">
                            <strong style="font-size:1.2rem; color:${i[e]||`var(--accent-cyan)`};">${t}</strong>
                            <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-top:4px;">${e}</span>
                        </div>
                    `).join(``)}
                </div>

                <div style="margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-gray); flex-shrink:0;"></i>
                        <input type="text" id="class-search-input" placeholder="Buscar clase por nombre..." style="flex:1; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;">
                    </div>
                </div>

                <div id="classes-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:14px;">
                    ${e.map((e,t)=>{let n=i[e.type]||`var(--accent-cyan)`,o=a[e.type]||`activity`,s=e.days;if(typeof s==`string`)try{s=JSON.parse(s)}catch{s=[]}let c=Array.isArray(s)?s:[];return`
                        <div class="class-card-item" data-name="${e.name.toLowerCase()}" data-type="${e.type.toLowerCase()}"
                             style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:18px; opacity:0; animation: classFadeIn 0.4s ease forwards ${t*.06}s; transition: all 0.3s;">
                            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                                <div style="width:40px; height:40px; border-radius:10px; background:${n}11; border:1px solid ${n}22; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="${o}" style="width:20px; color:${n};"></i>
                                </div>
                                <div style="flex:1;">
                                    <h4 style="margin:0; font-size:1rem; font-weight:800;">${e.name}</h4>
                                    <span style="font-size:0.7rem; opacity:0.5; font-weight:600;">${e.time}</span>
                                </div>
                            </div>
                            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px;">
                                ${c.map(e=>`
                                    <span style="font-size:0.6rem; font-weight:700; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:3px 8px; border-radius:6px; text-transform:uppercase;">${r[e]||e}</span>
                                `).join(``)}
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="edit-class-btn btn-glass-small" data-id="${e.id}" style="flex:1; justify-content:center;">
                                    <i data-lucide="edit-3" style="width:14px; margin-right:4px;"></i> Editar
                                </button>
                                <button class="delete-class-btn btn-glass-small delete" data-id="${e.id}" style="width:40px; justify-content:center;">
                                    <i data-lucide="trash-2" style="width:14px;"></i>
                                </button>
                            </div>
                        </div>`}).join(``)}
                </div>
            </div>`,window.lucide.createIcons();let s=document.getElementById(`class-search-input`);s&&(s.oninput=()=>{let e=s.value.toLowerCase();document.querySelectorAll(`.class-card-item`).forEach(t=>{let n=t.getAttribute(`data-name`),r=t.getAttribute(`data-type`);t.style.display=n.includes(e)||r.includes(e)?``:`none`})}),document.getElementById(`btn-add-class-admin`).onclick=()=>Pe(),document.querySelectorAll(`.edit-class-btn`).forEach(t=>{t.onclick=n=>{n.stopPropagation();let r=t.getAttribute(`data-id`);e.find(e=>e.id==r)?Pe(r,e):window.showToast(`Clase no encontrada`,`#ef4444`)}}),document.querySelectorAll(`.delete-class-btn`).forEach(e=>{e.onclick=t=>{t.stopPropagation(),Me(e.getAttribute(`data-id`))}})}catch(e){console.error(e),q().innerHTML=`
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar clases</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${e.message||`Ocurrió un problema al obtener los datos.`}</p>
                <button onclick="renderAdminClasses()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`,window.lucide.createIcons()}},Ce=async(e,t)=>{try{let n=await o.getMembershipPlans(),r=n.findIndex(t=>t.id===e);if(r===-1||t<0||t>=n.length||r===t)return;let[i]=n.splice(r,1);n.splice(t,0,i);for(let e=0;e<n.length;e++)await o.updatePlanOrder(n[e].id,e);window.showToast(`Orden actualizado 🔄`,`#8b5cf6`),we()}catch(e){console.error(e),window.showToast(`Error al reordenar plan`,`#ef4444`)}},we=async()=>{q().innerHTML=`
        <div class="glass-premium p-20" id="plans-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:200px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:140px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:100px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
                <div style="height:220px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:220px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:220px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;try{let[e,t]=await Promise.all([o.getMembershipPlans(),o.getAllProfiles()]),n=e.map(e=>{let n=t.filter(t=>t.membership_plan_id===e.id||t.membership_plans?.name===e.name),r=n.filter(e=>e.membership_status===`active`),i=r.length*Number(e.price||0),a=e.monthly>0?Math.round(r.length/Math.max(1,e.monthly)*100):0,o=r.length>0?i/r.length:0;return{...e,_userCount:n.length,_activeCount:r.length,_monthlyRevenue:i,_capacityUsed:Math.min(a,100),_arpu:o,_features:Array.isArray(e.features)?e.features:e.features?String(e.features).split(`,`).map(e=>e.trim()).filter(e=>e):[]}}),r=n.length>0?n.reduce((e,t)=>t._activeCount>e._activeCount?t:e,n[0]):null,i={bronze:{bg:`rgba(205, 127, 50, 0.1)`,border:`rgba(205, 127, 50, 0.3)`,accent:`#cd7f32`,icon:`shield`,gradient:`linear-gradient(135deg, rgba(205,127,50,0.15), rgba(205,127,50,0.05))`},silver:{bg:`rgba(192, 192, 192, 0.1)`,border:`rgba(192, 192, 192, 0.3)`,accent:`#c0c0c0`,icon:`shield-check`,gradient:`linear-gradient(135deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))`},gold:{bg:`rgba(255, 215, 0, 0.08)`,border:`rgba(255, 215, 0, 0.25)`,accent:`#ffd700`,icon:`crown`,gradient:`linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,215,0,0.04))`}},a=n.reduce((e,t)=>e+t._monthlyRevenue,0),s=n.reduce((e,t)=>e+t._activeCount,0),c=s>0?a/s:0,l=[...n].sort((e,t)=>t._activeCount-e._activeCount);q().innerHTML=`
            <div class="glass-premium p-20" id="plans-main">
                <style>
                    @keyframes planFadeIn {
                        from { opacity: 0; transform: translateY(20px) scale(0.96); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    @keyframes planGlow {
                        0%, 100% { box-shadow: 0 0 0 rgba(139,92,246,0); }
                        50% { box-shadow: 0 0 20px rgba(139,92,246,0.15); }
                    }
                    .plan-block-card {
                        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: grab;
                    }
                    .plan-block-card:hover {
                        transform: translateY(-4px);
                    }
                    .plan-block-card:active { cursor: grabbing; }
                    .plan-block-card.drag-over {
                        border-color: var(--accent-purple) !important;
                        transform: scale(1.03);
                        box-shadow: 0 0 40px rgba(139,92,246,0.25);
                    }
                    .plan-block-card.dragging {
                        opacity: 0.4;
                    }
                    .plan-feature-chip {
                        display: inline-flex; align-items: center; gap: 4px;
                        font-size: 0.6rem; background: rgba(255,255,255,0.04);
                        border: 1px solid rgba(255,255,255,0.08);
                        padding: 2px 8px; border-radius: 20px;
                        color: var(--text-gray);
                    }
                    .plan-view-toggle.active {
                        background: var(--accent-purple) !important;
                        color: white !important;
                        border-color: var(--accent-purple) !important;
                    }
                    .compare-row:hover { background: rgba(255,255,255,0.03); }
                </style>

                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">💎 Planes de Membresía</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${e.length} planes • $${a.toLocaleString()}/mes • ARPU $${Math.round(c).toLocaleString()}</p>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:4px 12px;">
                            <i data-lucide="search" style="width:14px; color:var(--text-gray);"></i>
                            <input type="text" id="plan-search-input" placeholder="Buscar plan..." style="background:transparent; border:none; color:white; font-size:0.8rem; outline:none; width:140px;">
                        </div>
                        <button class="btn-action-glow" id="btn-add-plan-admin"><i data-lucide="plus"></i> Plan</button>
                    </div>
                </div>

                <!-- KPIs -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
                    <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${s}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SOCIOS ACTIVOS</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">$${a.toLocaleString()}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">INGRESO MENSUAL</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#fbbf24;">${e.length}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">PLANES</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-cyan);">$${Math.round(c).toLocaleString()}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">ARPU PROMEDIO</span>
                    </div>
                </div>

                <!-- Charts & Distribution -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:25px;">
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px;">
                        <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="pie-chart" style="width:14px; color:var(--accent-purple);"></i> Distribución de Socios
                        </h4>
                        <div style="height:160px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="plans-distribution-chart"></canvas>
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px;">
                        <h4 style="font-size:0.8rem; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="bar-chart-2" style="width:14px; color:#22c55e;"></i> Ingreso por Plan
                        </h4>
                        <div style="height:160px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="plans-revenue-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- View Toggle -->
                <div style="display:flex; gap:8px; margin-bottom:16px; align-items:center;">
                    <span style="font-size:0.7rem; color:var(--text-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.5px;">Vista:</span>
                    <button class="plan-view-toggle active btn-glass-small" data-view="cards" style="font-size:0.75rem; padding:6px 14px;">
                        <i data-lucide="layout-grid" style="width:12px; margin-right:4px;"></i> Tarjetas
                    </button>
                    <button class="plan-view-toggle btn-glass-small" data-view="compare" style="font-size:0.75rem; padding:6px 14px;">
                        <i data-lucide="columns" style="width:12px; margin-right:4px;"></i> Comparar
                    </button>
                    <div style="flex:1;"></div>
                    <span style="font-size:0.65rem; color:var(--text-gray); opacity:0.6;"><i data-lucide="move" style="width:10px; vertical-align:middle;"></i> Arrastra para reordenar</span>
                </div>

                <!-- Cards View -->
                <div id="plans-cards-view">
                    <div id="plans-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
                        ${n.map((e,t)=>{let n=i[e.theme]||i.bronze,a=r&&e.id===r.id,o=e.popular||a?`<span style="position:absolute; top:-8px; right:12px; background:linear-gradient(135deg, #8b5cf6, #a855f7); color:white; font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 4px 15px rgba(139,92,246,0.4); display:flex; align-items:center; gap:4px;"><i data-lucide="flame" style="width:10px;"></i> ${a&&!e.popular?`Más Popular`:`Popular`}</span>`:``,s=e._features.length>0?`<div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:14px;">${e._features.slice(0,4).map(e=>`<span class="plan-feature-chip"><i data-lucide="check" style="width:8px; color:${n.accent};"></i> ${e}</span>`).join(``)}${e._features.length>4?`<span class="plan-feature-chip">+${e._features.length-4}</span>`:``}</div>`:``,c=e.description?`<p style="font-size:0.7rem; color:var(--text-gray); margin-bottom:12px; line-height:1.4; opacity:0.7;">${e.description}</p>`:``;return`
                            <div class="plan-block-card" draggable="true" data-plan-id="${e.id}" data-idx="${t}" data-name="${e.name.toLowerCase()}"
                                 style="position:relative; background:${n.gradient}; border:1px solid ${n.border}; border-radius:20px; padding:22px; opacity:0; animation: planFadeIn 0.5s ease forwards ${t*.08}s;">
                                ${o}
                                <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
                                    <div style="width:48px; height:48px; border-radius:14px; background:${n.bg}; border:1px solid ${n.border}; display:flex; align-items:center; justify-content:center;">
                                        <i data-lucide="${n.icon}" style="width:24px; color:${n.accent};"></i>
                                    </div>
                                    <div style="flex:1; min-width:0;">
                                        <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:${n.accent}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.name}</h4>
                                        <span style="font-size:0.7rem; opacity:0.5; font-weight:600;">${e.monthly||0} clases/mes • Límite ${e.limit||`∞`}</span>
                                    </div>
                                    <div style="text-align:right; flex-shrink:0;">
                                        <div style="font-size:1.4rem; font-weight:900;">$${Number(e.price||0).toLocaleString()}</div>
                                        <div style="font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700;">/MES</div>
                                    </div>
                                </div>

                                ${c}
                                ${s}

                                <div style="margin-bottom:14px;">
                                    <div style="display:flex; justify-content:space-between; font-size:0.7rem; margin-bottom:5px; opacity:0.7;">
                                        <span>Ocupación</span>
                                        <span style="font-weight:700;">${e._capacityUsed}%</span>
                                    </div>
                                    <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                                        <div style="height:100%; width:${e._capacityUsed}%; background:linear-gradient(90deg, ${n.accent}, ${n.accent}88); border-radius:10px; transition:width 1s cubic-bezier(0.34,1.56,0.64,1);"></div>
                                    </div>
                                </div>

                                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:14px;">
                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                        <span style="display:block; font-size:0.55rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Socios</span>
                                        <strong style="font-size:1rem; color:white;">${e._activeCount}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                        <span style="display:block; font-size:0.55rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Ingreso</span>
                                        <strong style="font-size:1rem; color:#22c55e;">$${e._monthlyRevenue.toLocaleString()}</strong>
                                    </div>
                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                        <span style="display:block; font-size:0.55rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">ARPU</span>
                                        <strong style="font-size:1rem; color:var(--accent-cyan);">$${Math.round(e._arpu).toLocaleString()}</strong>
                                    </div>
                                </div>

                                <div style="display:flex; gap:6px;">
                                    <button class="edit-plan-btn btn-glass-small" data-id="${e.id}" style="flex:1; justify-content:center; font-size:0.7rem;">
                                        <i data-lucide="edit-3" style="width:12px; margin-right:3px;"></i> Editar
                                    </button>
                                    <button class="view-plan-users-btn btn-glass-small" data-plan="${e.name}" style="flex:1; justify-content:center; font-size:0.7rem; border-color:var(--accent-purple); color:var(--accent-purple);">
                                        <i data-lucide="users" style="width:12px; margin-right:3px;"></i> Socios
                                    </button>
                                    <button class="delete-plan-btn btn-glass-small delete" data-id="${e.id}" style="width:36px; justify-content:center;">
                                        <i data-lucide="trash-2" style="width:12px;"></i>
                                    </button>
                                </div>
                            </div>`}).join(``)}
                    </div>
                </div>

                <!-- Compare View (Hidden by default) -->
                <div id="plans-compare-view" class="hidden" style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.8rem; min-width:600px;">
                        <thead>
                            <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.08);">
                                <th style="padding:12px; text-align:left; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Plan</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Precio</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Clases/mes</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Socios</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Ingreso</th>
                                <th style="padding:12px; text-align:center; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Ocupación</th>
                                <th style="padding:12px; text-align:left; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Características</th>
                                <th style="padding:12px; text-align:right; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-gray);">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${n.map(e=>{let t=i[e.theme]||i.bronze;return`
                                <tr class="compare-row" style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.2s;">
                                    <td style="padding:12px;">
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="width:32px; height:32px; border-radius:8px; background:${t.bg}; border:1px solid ${t.border}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                                <i data-lucide="${t.icon}" style="width:14px; color:${t.accent};"></i>
                                            </div>
                                            <div>
                                                <strong style="font-size:0.85rem; color:${t.accent};">${e.name}</strong>
                                                ${e.popular?`<span style="font-size:0.6rem; background:linear-gradient(135deg,#8b5cf6,#a855f7); color:white; padding:1px 6px; border-radius:10px; margin-left:4px;">Popular</span>`:``}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding:12px; text-align:center; font-weight:800;">$${Number(e.price||0).toLocaleString()}</td>
                                    <td style="padding:12px; text-align:center;">${e.monthly||0}</td>
                                    <td style="padding:12px; text-align:center;"><strong style="color:white;">${e._activeCount}</strong></td>
                                    <td style="padding:12px; text-align:center; color:#22c55e; font-weight:700;">$${e._monthlyRevenue.toLocaleString()}</td>
                                    <td style="padding:12px; text-align:center;">
                                        <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                                            <div style="width:50px; height:4px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden;">
                                                <div style="width:${e._capacityUsed}%; height:100%; background:${t.accent}; border-radius:2px;"></div>
                                            </div>
                                            <span style="font-size:0.7rem;">${e._capacityUsed}%</span>
                                        </div>
                                    </td>
                                    <td style="padding:12px;">
                                        <div style="display:flex; flex-wrap:wrap; gap:3px;">
                                            ${e._features.slice(0,3).map(e=>`<span class="plan-feature-chip">${e}</span>`).join(``)}
                                            ${e._features.length>3?`<span class="plan-feature-chip">+${e._features.length-3}</span>`:``}
                                        </div>
                                    </td>
                                    <td style="padding:12px; text-align:right;">
                                        <div style="display:flex; gap:4px; justify-content:flex-end;">
                                            <button class="edit-plan-btn btn-glass-small" data-id="${e.id}" style="padding:3px 8px; font-size:0.65rem;"><i data-lucide="edit-3" style="width:10px;"></i></button>
                                            <button class="delete-plan-btn btn-glass-small delete" data-id="${e.id}" style="padding:3px 8px; font-size:0.65rem;"><i data-lucide="trash-2" style="width:10px;"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `}).join(``)}
                        </tbody>
                    </table>
                </div>
            </div>`,window.lucide.createIcons(),Te(l,i);let u=document.getElementById(`plan-search-input`);u&&(u.oninput=()=>{let e=u.value.toLowerCase().trim();document.querySelectorAll(`.plan-block-card`).forEach(t=>{let n=t.getAttribute(`data-name`);t.style.display=!e||n.includes(e)?``:`none`})}),document.querySelectorAll(`.plan-view-toggle`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-view`);document.querySelectorAll(`.plan-view-toggle`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),document.getElementById(`plans-cards-view`).classList.toggle(`hidden`,t!==`cards`),document.getElementById(`plans-compare-view`).classList.toggle(`hidden`,t!==`compare`),window.lucide.createIcons()}}),document.getElementById(`btn-add-plan-admin`).onclick=()=>Fe(),document.querySelectorAll(`.edit-plan-btn`).forEach(t=>{t.onclick=n=>{n.stopPropagation();let r=t.getAttribute(`data-id`);e.find(e=>e.id==r)?Fe(r,e):window.showToast(`Plan no encontrado`,`#ef4444`)}}),document.querySelectorAll(`.delete-plan-btn`).forEach(e=>{e.onclick=t=>{t.stopPropagation(),Ne(e.getAttribute(`data-id`))}}),document.querySelectorAll(`.view-plan-users-btn`).forEach(e=>{e.onclick=t=>{t.stopPropagation();let n=e.getAttribute(`data-plan`);_(()=>Promise.resolve().then(()=>ce).then(e=>{e.renderAdminMembers&&(window.showToast(`Filtrando socios del plan: ${n}`,`#8b5cf6`),e.renderAdminMembers())}),void 0)}});let d=document.getElementById(`plans-grid`),f=null;d.querySelectorAll(`.plan-block-card`).forEach(t=>{t.ondragstart=e=>{f=parseInt(t.getAttribute(`data-idx`)),t.classList.add(`dragging`),e.dataTransfer.effectAllowed=`move`},t.ondragend=()=>{t.classList.remove(`dragging`),d.querySelectorAll(`.plan-block-card`).forEach(e=>e.classList.remove(`drag-over`))},t.ondragover=e=>{e.preventDefault(),t.classList.add(`drag-over`)},t.ondragleave=()=>{t.classList.remove(`drag-over`)},t.ondrop=n=>{n.preventDefault(),t.classList.remove(`drag-over`);let r=parseInt(t.getAttribute(`data-idx`));if(f!==null&&f!==r){let t=e[f]?.id;t&&Ce(t,r)}}})}catch(e){console.error(e),q().innerHTML=`
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar planes</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${e.message||`Ocurrió un problema al obtener los datos.`}</p>
                <button onclick="renderAdminPlans()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`,window.lucide.createIcons()}},Te=(e,t)=>{let n=document.getElementById(`plans-distribution-chart`),r=document.getElementById(`plans-revenue-chart`);if(n&&e.length>0){window._plansDistChart&&window._plansDistChart.destroy();let r=e.map(e=>(t[e.theme]||t.bronze).accent);window._plansDistChart=new Chart(n,{type:`doughnut`,data:{labels:e.map(e=>e.name),datasets:[{data:e.map(e=>e._activeCount),backgroundColor:r,borderWidth:0,hoverOffset:8}]},options:{responsive:!0,maintainAspectRatio:!1,cutout:`65%`,plugins:{legend:{display:!1},tooltip:{backgroundColor:`rgba(13,13,18,0.95)`,callbacks:{label:e=>` ${e.label}: ${e.raw} socios`}}}}})}if(r&&e.length>0){window._plansRevChart&&window._plansRevChart.destroy();let n=e.map(e=>(t[e.theme]||t.bronze).accent);window._plansRevChart=new Chart(r,{type:`bar`,data:{labels:e.map(e=>e.name.length>10?e.name.substring(0,10)+`...`:e.name),datasets:[{label:`Ingreso ($)`,data:e.map(e=>e._monthlyRevenue),backgroundColor:n.map(e=>e+`88`),borderColor:n,borderWidth:1,borderRadius:6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:`rgba(13,13,18,0.95)`,callbacks:{label:e=>` Ingreso: $${e.raw.toLocaleString(`es-CL`)}`}}},scales:{x:{ticks:{color:`rgba(255,255,255,0.4)`,font:{size:9}},grid:{display:!1}},y:{ticks:{color:`rgba(255,255,255,0.3)`,font:{size:9},callback:e=>`$`+(e>=1e3?(e/1e3).toFixed(0)+`k`:e)},grid:{color:`rgba(255,255,255,0.05)`}}}}})}},Ee=async()=>{q().innerHTML=`
        <div class="glass-premium p-20" id="attendance-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:220px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:140px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:120px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:25px;">
                <div style="width:60px; height:32px; background:rgba(255,255,255,0.08); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="width:80px; height:32px; background:rgba(255,255,255,0.06); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="width:60px; height:32px; background:rgba(255,255,255,0.06); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="width:60px; height:32px; background:rgba(255,255,255,0.06); border-radius:10px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:25px;">
                <div style="height:70px; background:rgba(255,255,255,0.05); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.05); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.05); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;try{let{data:e,error:t}=await window.supabase.from(`reservations`).select(`*, profiles(full_name, email)`).order(`reservation_date`,{ascending:!1}).limit(800);if(t)throw t;let r=(t,n=``)=>{let r=new Date,i=r.toISOString().split(`T`)[0],a=r.getDay(),o=[];if(t===`today`)o=e.filter(e=>e.reservation_date===i);else if(t===`week`){let t=new Date(r);t.setDate(t.getDate()-7),o=e.filter(e=>new Date(e.reservation_date)>=t)}else if(t===`month`){let t=new Date(r);t.setMonth(t.getMonth()-1),o=e.filter(e=>new Date(e.reservation_date)>=t)}else o=e;let s;if(t===`today`)s=window.appState.classes.filter(e=>{let t=e.days;if(typeof t==`string`)try{t=JSON.parse(t)}catch(e){console.warn(`Caught empty error`,e)}return Array.isArray(t)&&t.includes(a)}).map(e=>{let t=o.filter(t=>t.class_id===e.id).map(e=>({name:e.profiles?.full_name||e.user_name||`Desconocido`,email:e.profiles?.email||``}));return{date:i,classId:e.id,className:e.name,classTime:e.time,classType:e.type,classTheme:e.theme,attendees:t}});else{let e={};o.forEach(t=>{let n=`${t.reservation_date}||${t.class_id}`;if(!e[n]){let r=window.appState.classes.find(e=>e.id===t.class_id)||{};e[n]={date:t.reservation_date,classId:t.class_id,className:t.class_name||r.name||`Clase`,classTime:t.class_time||r.time||``,classType:t.class_type||r.type||`-`,classTheme:r.theme||`smoke-purple`,attendees:[]}}e[n].attendees.push({name:t.profiles?.full_name||t.user_name||`Desconocido`,email:t.profiles?.email||``})}),s=Object.values(e).sort((e,t)=>t.date.localeCompare(e.date))}let c=n.toLowerCase().trim();c&&(s=s.map(e=>({...e,attendees:e.attendees.filter(e=>e.name.toLowerCase().includes(c)||e.email.toLowerCase().includes(c))})).filter(e=>e.attendees.length>0||e.className.toLowerCase().includes(c)));let l={totalSessions:s.length,totalReservations:o.length,uniqueSocio:new Set(o.map(e=>e.user_id)).size},u=s.length>0?(s.reduce((e,t)=>e+t.attendees.length,0)/s.length).toFixed(1):0,d={};o.forEach(e=>{let t=e.profiles?.full_name||e.user_name||`Desconocido`;d[t]=(d[t]||0)+1});let f=Object.entries(d).sort((e,t)=>t[1]-e[1]).slice(0,3),p={Striking:`#ef4444`,BJJ:`#8b5cf6`,MMA:`#f97316`,"Funcional Fighter":`#22c55e`,"BJJ Gi":`#8b5cf6`,"No Gi":`#a855f7`},m=e=>{let t=e.trim().split(` `);return((t[0]?.[0]||``)+(t[1]?.[0]||``)).toUpperCase()},h=e=>{let t=new Date(e+`T12:00:00`);return e===i?`HOY`:t.toLocaleDateString(`es-ES`,{weekday:`short`,day:`2-digit`,month:`short`}).toUpperCase()},g=``;if((t===`month`||t===`all`)&&o.length>0){let e={},t={},n=0,r=0,i=new Date;i.setDate(i.getDate()-7);let a=new Date;a.setDate(a.getDate()-14),o.forEach(o=>{let s=new Date(o.reservation_date);e[o.user_id]||(e[o.user_id]=0),e[o.user_id]++;let c=s.getDay();t[c]||(t[c]=0),t[c]++,s>=i?n++:s>=a&&s<i&&r++});let s=[`Domingo`,`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`][Object.keys(t).sort((e,n)=>t[n]-t[e])[0]]||`-`,c=(l.totalReservations/Math.max(1,l.uniqueSocio)/4).toFixed(1),u=``;r>0&&n<r*.8?u=`<div style="display:flex; gap:8px;"><i data-lucide="alert-triangle" style="color:#ef4444; width:16px;"></i> <span><strong>¡Alerta!</strong> La asistencia bajó un ${Math.round((1-n/r)*100)}% esta semana.</span></div>`:r>0&&n>r*1.1&&(u=`<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px;"></i> <span><strong>¡Súper!</strong> La asistencia subió esta semana respecto a la anterior.</span></div>`),g=`
                    <div class="glass" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 10px; display: flex; align-items: center; gap: 5px; color: #3b82f6; font-size: 0.9rem;">
                            <i data-lucide="activity" style="width: 16px;"></i> Inteligencia de Asistencia
                        </h4>
                        <div style="font-size: 0.85rem; color: rgba(255,255,255,0.8); line-height: 1.5; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display:flex; gap:8px;"><i data-lucide="calendar" style="color:#a855f7; width:16px;"></i> <span>El día más concurrido es el <strong>${s}</strong>.</span></div>
                            <div style="display:flex; gap:8px;"><i data-lucide="user-check" style="color:#fbbf24; width:16px;"></i> <span>Frecuencia promedio: <strong>${c} clases/sem</strong> por alumno activo.</span></div>
                            ${u}
                        </div>
                    </div>`}let _=``,v=s.length===0?`<div style="text-align:center; padding:60px 0; opacity:0.3;">
                        <i data-lucide="calendar-off" style="width:50px; height:50px; margin-bottom:15px; display:block; margin-inline:auto;"></i>
                        <p>${n?`Ningún alumno coincide con la búsqueda.`:`No se encontraron actividades registradas.`}</p>
                     </div>`:s.map((e,t)=>{let n=``;e.date!==_&&(_=e.date,n=`<div class="att-date-divider" style="font-size:0.65rem; color:var(--text-gray); font-weight:800; letter-spacing:1px; margin: 15px 0 10px;">${h(e.date)}</div>`);let r=p[e.classType]||`var(--accent-cyan)`,i=e.attendees.map(e=>`
                        <div class="attendee-row" data-name="${e.name.toLowerCase()}" style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                            <div style="width:34px;height:34px;border-radius:10px;background:${r}11;border:1px solid ${r}22;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;color:${r};flex-shrink:0;">
                                ${m(e.name)}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:0.85rem; font-weight:600;">${e.name}</div>
                                <div style="font-size:0.7rem; opacity:0.4;">${e.email||`socio@amaru.app`}</div>
                            </div>
                            <div style="width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 10px #22c55e77;"></div>
                        </div>
                    `).join(``)||`<p style="font-size:0.75rem; opacity:0.4; text-align:center; padding:15px 0;">Nadie registrado todavía</p>`;return`
                        ${n}
                        <div class="att-panel-card" data-idx="${t}" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; margin-bottom:12px; transition:0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer; overflow:hidden; opacity:0; animation: staggerFadeIn 0.4s ease forwards ${t*.05}s;">
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
                    ${g}
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:12px; margin-bottom:25px;">
                        <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${l.totalSessions}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SESIONES</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-cyan);">${l.totalReservations}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">RESERVAS</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">${l.uniqueSocio}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">SOCIOS ÚNICOS</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#fbbf24;">${u}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">PROMEDIO/CLASE</span>
                        </div>
                    </div>
                    ${f.length>0?`
                    <div style="margin-bottom:20px; padding:12px 15px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
                        <span style="font-size:0.7rem; color:var(--text-gray); font-weight:700; text-transform:uppercase; letter-spacing:1px;">🏆 Socios más activos</span>
                        <div style="display:flex; gap:15px; margin-top:8px; flex-wrap:wrap;">
                            ${f.map((e,t)=>`
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="font-size:0.9rem;">${t===0?`🥇`:t===1?`🥈`:`🥉`}</span>
                                    <span style="font-size:0.8rem; font-weight:600;">${e[0]}</span>
                                    <span style="font-size:0.7rem; color:var(--accent-cyan); font-weight:700;">${e[1]} asist.</span>
                                </div>
                            `).join(``)}
                        </div>
                    </div>`:``}
                    ${v}
                `,window.lucide.createIcons(),document.querySelectorAll(`.att-panel-card`).forEach(e=>{e.onclick=t=>{if(t.target.closest(`.attendee-row`))return;let n=e.getAttribute(`data-idx`),r=document.getElementById(`att-detail-${n}`),i=e.querySelector(`.chevron-${n}`),a=r.style.display===`block`;r.style.display=a?`none`:`block`,i&&(i.style.transform=a?`rotate(0deg)`:`rotate(90deg)`,i.style.opacity=a?`0.2`:`0.6`),e.style.background=a?`rgba(255,255,255,0.02)`:`rgba(255,255,255,0.05)`,e.style.borderColor=a?`rgba(255,255,255,0.06)`:`rgba(255,255,255,0.15)`}}),window._attExportData={reservations:o,groups:s,periodLabel:t}};q().innerHTML=`
            <div class="glass-premium p-20" id="attendance-main">
                <style>
                    @keyframes staggerFadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Control de Asistencia</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${e.length} asistencias en historial</p>
                    </div>
                    <button id="btn-manual-attendance" class="btn-primary" style="padding: 8px 15px; font-size: 0.8rem; background: var(--accent-cyan); color: #000;">
                        <i data-lucide="plus-circle" style="width:16px; margin-right:5px; vertical-align:middle;"></i> Ingreso Manual
                    </button>
                </div>

                <div style="display:flex; gap:8px; margin-bottom:20px; background:rgba(255,255,255,0.03); padding:6px; border-radius:14px; width:fit-content;">
                    <button class="att-period-btn active" data-period="today" style="border:none; background:var(--accent-purple); color:white; padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Hoy</button>
                    <button class="att-period-btn" data-period="week" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Semana</button>
                    <button class="att-period-btn" data-period="month" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Mes</button>
                    <button class="att-period-btn" data-period="all" style="border:none; background:transparent; color:var(--text-gray); padding:8px 18px; border-radius:10px; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.2s;">Todo</button>
                </div>

                <div style="margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-gray); flex-shrink:0;"></i>
                        <input type="text" id="att-search-input" placeholder="Buscar alumno por nombre o email..." style="flex:1; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;">
                    </div>
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
            </div>`;let i=document.getElementById(`btn-manual-attendance`);i&&(i.onclick=async()=>{try{let e=await o.getAllProfiles(),t=await o.getClasses(),n=e.map(e=>`<option value="${e.id}">${e.full_name||e.email}</option>`).join(``),r=t.map(e=>`<option value="${e.id}">${e.name} (${e.type})</option>`).join(``),{value:i}=await K.fire({title:`Ingreso Manual`,html:`
                            <div style="text-align: left; font-size: 0.9rem;">
                                <label>Usuario</label>
                                <select id="swal-manual-user" class="swal2-input" style="width: 100%; height: 40px; margin-bottom: 15px; background: rgba(0,0,0,0.1); color: white;">
                                    <option value="" disabled selected>Seleccionar Atleta</option>
                                    ${n}
                                </select>
                                <label>Clase</label>
                                <select id="swal-manual-class" class="swal2-input" style="width: 100%; height: 40px; margin-bottom: 15px; background: rgba(0,0,0,0.1); color: white;">
                                    <option value="" disabled selected>Seleccionar Clase</option>
                                    ${r}
                                </select>
                                <label>Fecha</label>
                                <input type="date" id="swal-manual-date" class="swal2-input" style="width: 100%; height: 40px; background: rgba(0,0,0,0.1); color: white;" value="${new Date().toISOString().split(`T`)[0]}">
                            </div>`,focusConfirm:!1,showCancelButton:!0,confirmButtonText:`Registrar`,cancelButtonText:`Cancelar`,background:`#1f1f2e`,color:`#fff`,preConfirm:()=>{let e=document.getElementById(`swal-manual-user`).value,t=document.getElementById(`swal-manual-class`).value,n=document.getElementById(`swal-manual-class`).options[document.getElementById(`swal-manual-class`).selectedIndex]?.text,r=document.getElementById(`swal-manual-date`).value;return!e||!t||!r?(K.showValidationMessage(`Por favor completa todos los campos`),!1):{user:e,classId:t,className:n,date:r}}});if(i){K.fire({title:`Procesando...`,allowOutsideClick:!1,didOpen:()=>{K.showLoading();let e=K.getPopup().querySelector(`.swal2-loader`);e&&(e.style.borderColor=`var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent`)},background:`#1f1f2e`,color:`#fff`});try{await o.createReservation(i.user,i.classId,i.className,i.date),K.close(),window.showToast(`✅ Asistencia manual registrada con éxito`,`#22c55e`),Ee()}catch(e){K.close(),console.error(`Error registrando asistencia manual:`,e),window.showToast(`Error al registrar asistencia: `+(e.message||`Error desconocido`),`#ef4444`)}}}catch(e){console.error(e),window.showToast(`Error al cargar datos para ingreso manual`,`#ef4444`)}}),window.lucide.createIcons();let a=`today`;r(a),document.querySelectorAll(`.att-period-btn`).forEach(e=>{e.onclick=e=>{document.querySelectorAll(`.att-period-btn`).forEach(e=>{e.classList.remove(`active`),e.style.background=`transparent`,e.style.color=`var(--text-gray)`}),e.target.classList.add(`active`),e.target.style.background=`var(--accent-purple)`,e.target.style.color=`white`,a=e.target.getAttribute(`data-period`);let t=document.getElementById(`att-search-input`)?.value||``;r(a,t)}});let s=document.getElementById(`att-search-input`);if(s){let e;s.oninput=()=>{clearTimeout(e),e=setTimeout(()=>{r(a,s.value)},250)}}document.getElementById(`btn-export-attendance`).onclick=()=>{let e=document.getElementById(`att-export-format`).value,t=window._attExportData;if(!t||t.reservations.length===0)return window.showToast(`No hay datos para exportar`,`#ef4444`);let r=[`Fecha`,`Clase`,`Horario`,`Alumno`,`Email`],i=[];t.groups.forEach(e=>{e.attendees.forEach(t=>{i.push([e.date,e.className,e.classTime,t.name,t.email])})}),n(e,i,r,`Asistencia_${t.periodLabel}_Amaru`)}}catch(e){console.error(e),q().innerHTML=`
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar asistencia</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${e.message||`Ocurrió un problema al obtener los datos.`}</p>
                <button onclick="renderAdminAttendance()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`,window.lucide.createIcons()}},De=async()=>{let e=document.getElementById(`admin-revenue-section`);e&&e.classList.add(`hidden`),q().innerHTML=`
        <div class="glass-premium p-20" id="discounts-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:200px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:140px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px;">
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:70px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="height:200px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;try{let{data:e,error:t}=await window.supabase.from(`discounts`).select(`*`).order(`created_at`,{ascending:!1});if(t)throw t;let n=e||[],{data:r}=await window.supabase.from(`profiles`).select(`id, full_name, active_promo`).not(`active_promo`,`is`,null),i=r||[],a=i.length,o=n.length>0?Math.round(n.reduce((e,t)=>e+t.percent,0)/n.length):0,s=n.filter(e=>e.expiresAt&&new Date(e.expiresAt)<new Date).length,c=n.length-s;q().innerHTML=`
            <div class="glass-premium p-20" id="discounts-main">
                <style>
                    @keyframes discountFadeIn {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                    <div>
                        <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Códigos de Descuento</h2>
                        <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${n.length} códigos • ${a} socios con promo activa</p>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:10px; margin-bottom:20px;">
                    <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-purple);">${n.length}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">CÓDIGOS</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#22c55e;">${c}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">ACTIVOS</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#fbbf24;">${o}%</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">PROMEDIO</span>
                    </div>
                    <div class="stat-mini-premium" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:15px; border-radius:16px; text-align:center;">
                        <strong style="display:block; font-size:1.5rem; font-weight:900; color:#ef4444;">${s}</strong>
                        <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">EXPIRADOS</span>
                    </div>
                </div>

                <div class="admin-form glass mb-20" style="padding:20px; border-radius:16px; border:1px solid rgba(255,255,255,0.06);">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                        <input type="text" id="new-promo-code" placeholder="CÓDIGO (ej. AMOR20)" class="input-glass" style="text-transform: uppercase;">
                        <input type="number" id="new-promo-perc" placeholder="% Dcto" class="input-glass" min="1" max="100">
                    </div>
                    <input type="date" id="new-promo-exp" class="input-glass" style="margin-bottom:12px;" title="Expiración (opcional)">
                    <div id="promo-plans-checkboxes" style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                        ${window.appState.plans.map(e=>`
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem; cursor:pointer; background:rgba(255,255,255,0.03); padding:5px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
                                <input type="checkbox" class="promo-plan-checkbox" value="${e.id}">
                                ${e.name}
                            </label>
                        `).join(``)}
                    </div>
                    <button class="btn-primary w-full" id="btn-create-promo" style="padding:10px;">Crear Código</button>
                </div>

                <div style="margin-bottom:15px;">
                    <div style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-gray); flex-shrink:0;"></i>
                        <input type="text" id="discount-search-input" placeholder="Buscar código..." style="flex:1; background:transparent; border:none; color:white; font-size:0.85rem; outline:none;">
                    </div>
                </div>

                <div id="discounts-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px;">
                    ${n.length===0?`<p class="opacity-50" style="grid-column:1/-1; text-align:center; padding:40px 0;">No hay códigos creados.</p>`:``}
                    ${n.map((e,t)=>{let n=i.filter(t=>t.active_promo===e.code),r=e.expiresAt&&new Date(e.expiresAt)<new Date,a=e.expiresAt?Math.ceil((new Date(e.expiresAt)-new Date)/(1e3*60*60*24)):null,o=r?`#ef4444`:a&&a<=7?`#f59e0b`:`#22c55e`,s=r?`EXPIRADO`:a&&a<=7?`Vence en ${a}d`:`ACTIVO`;return`
                        <div class="discount-card-item" data-code="${e.code.toLowerCase()}"
                             style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:18px; opacity:0; animation: discountFadeIn 0.4s ease forwards ${t*.06}s;">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                                <div>
                                    <h4 style="margin:0; font-size:1.1rem; font-weight:800; color:var(--accent-purple);">${e.code}</h4>
                                    <span style="font-size:0.7rem; opacity:0.5; font-weight:600;">${e.percent}% de descuento</span>
                                </div>
                                <span style="font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; background:${o}22; color:${o}; border:1px solid ${o}33;">${s}</span>
                            </div>

                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
                                ${e.plans&&e.plans.length>0?e.plans.map(e=>{let t=window.appState.plans.find(t=>t.id===e);return`<span style="font-size:0.6rem; background:rgba(139,92,246,0.1); color:var(--accent-purple); padding:2px 8px; border-radius:6px; font-weight:700;">${t?t.name:e}</span>`}).join(``):`<span style="font-size:0.6rem; background:rgba(255,255,255,0.05); color:var(--text-gray); padding:2px 8px; border-radius:6px; font-weight:700;">Todos los planes</span>`}
                            </div>

                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                    <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Usuarios</span>
                                    <strong style="font-size:1rem; color:white;">${n.length}</strong>
                                </div>
                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:8px; text-align:center;">
                                    <span style="display:block; font-size:0.6rem; opacity:0.4; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Ahorro</span>
                                    <strong style="font-size:1rem; color:#22c55e;">${e.percent}%</strong>
                                </div>
                            </div>

                            <div style="display:flex; gap:8px;">
                                ${n.length>0?`
                                <button class="btn-glass-small" style="flex:1; justify-content:center; font-size:0.7rem;" onclick="this.nextElementSibling.classList.toggle('hidden');">
                                    <i data-lucide="users" style="width:12px; margin-right:4px;"></i> Ver ${n.length}
                                </button>
                                <div class="hidden" style="position:absolute; background:rgba(13,13,18,0.95); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; z-index:100; max-width:220px; backdrop-filter:blur(20px);">
                                    <p style="font-size:0.7rem; font-weight:700; margin-bottom:6px;">Usando este código:</p>
                                    ${n.map(e=>`<div style="font-size:0.75rem; padding:3px 0;">${e.full_name||`Usuario`}</div>`).join(``)}
                                </div>`:``}
                                <button class="btn-glass-small delete btn-delete-promo" data-id="${e.id}" style="width:40px; justify-content:center;">
                                    <i data-lucide="trash-2" style="width:14px;"></i>
                                </button>
                            </div>
                        </div>`}).join(``)}
                </div>
            </div>`,window.lucide.createIcons();let l=document.getElementById(`discount-search-input`);l&&(l.oninput=()=>{let e=l.value.toLowerCase();document.querySelectorAll(`.discount-card-item`).forEach(t=>{t.style.display=t.getAttribute(`data-code`).includes(e)?``:`none`})}),document.getElementById(`btn-create-promo`).onclick=async()=>{let e=document.getElementById(`new-promo-code`).value.trim().toUpperCase(),t=parseInt(document.getElementById(`new-promo-perc`).value),r=document.getElementById(`new-promo-exp`).value,i=document.querySelectorAll(`.promo-plan-checkbox:checked`),a=Array.from(i).map(e=>e.value);if(!e||isNaN(t)||t<=0||t>100)return window.showToast(`Código o porcentaje inválido`,`#ef4444`);if(n.find(t=>t.code===e))return window.showToast(`Ese código ya existe`,`#ef4444`);try{let n={code:e,percent:t,plans:a.length>0?a:null,expiresAt:r?new Date(r+`T23:59:59`).toISOString():null},{error:i}=await window.supabase.from(`discounts`).insert(n);if(i)throw i;window.showToast(`Código ${e} creado ✅`,`#22c55e`),De()}catch(e){console.error(e),window.showToast(`Error al crear código`,`#ef4444`)}},document.querySelectorAll(`.btn-delete-promo`).forEach(e=>{e.onclick=async t=>{if(t.stopPropagation(),confirm(`¿Eliminar este código? Los usuarios perderán el descuento.`))try{let{error:t}=await window.supabase.from(`discounts`).delete().eq(`id`,e.getAttribute(`data-id`));if(t)throw t;window.showToast(`Código eliminado`),De()}catch{window.showToast(`Error al eliminar`,`#ef4444`)}}})}catch(e){console.error(e),q().innerHTML=`
            <div class="glass-premium p-20" style="text-align:center;">
                <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                <h3 style="margin-bottom:8px;">Error al cargar descuentos</h3>
                <p style="opacity:0.6; margin-bottom:20px;">${e.message||`Ocurrió un problema.`}</p>
                <button onclick="renderAdminDiscounts()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
            </div>`,window.lucide.createIcons()}},Oe=()=>{let e=document.getElementById(`admin-revenue-section`);e&&e.classList.add(`hidden`),q().innerHTML=`
        <div class="glass-premium p-20" id="notifs-skeleton">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <div style="width:180px; height:22px; background:rgba(255,255,255,0.08); border-radius:6px; margin-bottom:8px; animation:skeletonPulse 1.5s infinite;"></div>
                    <div style="width:120px; height:12px; background:rgba(255,255,255,0.05); border-radius:4px; animation:skeletonPulse 1.5s infinite;"></div>
                </div>
                <div style="width:120px; height:32px; background:rgba(255,255,255,0.08); border-radius:8px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="height:80px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:80px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
                <div style="height:80px; background:rgba(255,255,255,0.04); border-radius:16px; animation:skeletonPulse 1.5s infinite;"></div>
            </div>
            <style>@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }</style>
        </div>`;let t=async()=>{try{let e=await o.getNotifications(),n={};e.forEach(e=>{n[e.type]=(n[e.type]||0)+1});let r=e.length,i=e.length>0?new Date(Math.max(...e.map(e=>new Date(e.created_at)))):null,a={info:{color:`var(--accent-cyan)`,label:`INFO`,icon:`bell`,bg:`rgba(6,182,212,0.08)`,border:`rgba(6,182,212,0.2)`},alert:{color:`#ef4444`,label:`URGENTE`,icon:`alert-triangle`,bg:`rgba(239,68,68,0.08)`,border:`rgba(239,68,68,0.2)`},calendar:{color:`#f59e0b`,label:`FECHA`,icon:`calendar`,bg:`rgba(251,191,36,0.08)`,border:`rgba(251,191,36,0.2)`}};q().innerHTML=`
                <div class="glass-premium p-20" id="notifs-main">
                    <style>
                        @keyframes notifFadeIn {
                            from { opacity: 0; transform: translateX(-10px); }
                            to { opacity: 1; transform: translateX(0); }
                        }
                    </style>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
                        <div>
                            <h2 style="font-size:1.4rem; font-weight:900; margin:0;">Avisos Globales</h2>
                            <p style="font-size:0.75rem; opacity:0.4; margin-top:2px;">${r} avisos publicados ${i?`• Último: `+i.toLocaleDateString():``}</p>
                        </div>
                        <button id="btn-create-notification" class="btn-primary" style="padding:8px 18px; font-size:0.85rem;">
                            <i data-lucide="plus" style="width:16px; margin-right:5px; vertical-align:middle;"></i> NUEVO AVISO
                        </button>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:10px; margin-bottom:20px;">
                        <div class="stat-mini-premium" style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:var(--accent-cyan);">${r}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">TOTAL</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#ef4444;">${n.alert||0}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">URGENTES</span>
                        </div>
                        <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:16px; text-align:center;">
                            <strong style="display:block; font-size:1.5rem; font-weight:900; color:#f59e0b;">${n.calendar||0}</strong>
                            <span style="font-size:0.65rem; opacity:0.4; text-transform:uppercase; font-weight:700;">FECHAS</span>
                        </div>
                    </div>

                    <div id="notifs-list" style="display:flex; flex-direction:column; gap:12px;">
                        ${e.length===0?`<p class="opacity-50" style="text-align:center; padding:40px 0;">No hay avisos globales activos.</p>`:``}
                        ${e.map((e,t)=>{let n=a[e.type]||a.info,r=e.message&&e.message.length>120;return`
                            <div class="notif-card-item" data-notif-id="${e.id}"
                                 style="background:${n.bg}; border:1px solid ${n.border}; border-radius:16px; padding:18px; opacity:0; animation: notifFadeIn 0.4s ease forwards ${t*.07}s; transition: all 0.3s; cursor:pointer;"
                                 onmouseover="this.style.transform='translateX(4px)'; this.style.borderColor='${n.color}55';"
                                 onmouseout="this.style.transform='translateX(0)'; this.style.borderColor='${n.border}';">
                                <div style="display:flex; align-items:flex-start; gap:14px;">
                                    <div style="width:40px; height:40px; border-radius:10px; background:${n.color}11; border:1px solid ${n.color}22; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                        <i data-lucide="${n.icon}" style="width:20px; color:${n.color};"></i>
                                    </div>
                                    <div style="flex:1; min-width:0;">
                                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                            <h4 style="margin:0; font-size:0.95rem; font-weight:800;">${e.title||`Sin título`}</h4>
                                            <span style="font-size:0.6rem; font-weight:800; padding:2px 8px; border-radius:20px; background:${n.color}22; color:${n.color};">${n.label}</span>
                                        </div>
                                        <p class="notif-message" style="font-size:0.8rem; color:rgba(255,255,255,0.7); margin:0; line-height:1.4; ${r?`display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;`:``}">${e.message||``}</p>
                                        ${r?`<span class="notif-expand" style="font-size:0.7rem; color:var(--accent-purple); cursor:pointer; margin-top:4px; display:inline-block;">Ver más...</span>`:``}
                                        <span style="display:block; font-size:0.65rem; color:var(--text-gray); margin-top:8px; opacity:0.6;">${new Date(e.created_at).toLocaleString()}</span>
                                    </div>
                                    <button class="btn-delete-notif btn-glass-small delete" data-id="${e.id}" style="flex-shrink:0; width:36px; height:36px; justify-content:center; padding:0;">
                                        <i data-lucide="trash-2" style="width:14px;"></i>
                                    </button>
                                </div>
                            </div>`}).join(``)}
                    </div>
                </div>

                <!-- Modal -->
                <div id="modal-notif" class="overlay">
                    <div class="glass" style="max-width: 500px; padding: 30px; border-radius: 20px; width: 90%;">
                        <h3>Publicar Aviso Global</h3>
                        <div class="form-group mt-20">
                            <label>Título</label>
                            <input type="text" id="notif-title" placeholder="Ej: Clase Especial de Seminario">
                        </div>
                        <div class="form-group mt-15">
                            <label>Tipo</label>
                            <select id="notif-type" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white;">
                                <option value="info" style="color: black;">Aviso General</option>
                                <option value="calendar" style="color: black;">Recordatorio</option>
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
                </div>`,window.lucide.createIcons(),document.querySelectorAll(`.notif-expand`).forEach(e=>{e.onclick=()=>{let t=e.previousElementSibling;t.style.webkitLineClamp===`unset`?(t.style.webkitLineClamp=`2`,e.textContent=`Ver más...`):(t.style.webkitLineClamp=`unset`,e.textContent=`Ver menos`)}}),document.querySelectorAll(`.btn-delete-notif`).forEach(e=>{e.onclick=async n=>{n.stopPropagation();let r=e.getAttribute(`data-id`);confirm(`¿Eliminar este aviso global?`)&&(window.showToast(`Eliminando...`,`#f59e0b`),await o.deleteNotification(r),window.showToast(`Aviso eliminado.`,`#ef4444`),t())}});let s=document.getElementById(`modal-notif`);document.getElementById(`btn-create-notification`).onclick=()=>{document.getElementById(`notif-title`).value=``,document.getElementById(`notif-message`).value=``,document.getElementById(`notif-type`).value=`info`,s.classList.add(`active`)},document.getElementById(`btn-close-notif`).onclick=()=>s.classList.remove(`active`),document.getElementById(`btn-save-notif`).onclick=async()=>{let e=document.getElementById(`notif-title`).value.trim(),n=document.getElementById(`notif-message`).value.trim(),r=document.getElementById(`notif-type`).value;if(!e||!n)return window.showToast(`Completa título y mensaje.`,`#ef4444`);try{window.showToast(`Publicando...`,`#f59e0b`),await o.addNotification(e,n,r),window.showToast(`Aviso publicado ✅`,`#22c55e`),s.classList.remove(`active`),t()}catch{window.showToast(`Error publicando`,`#ef4444`)}}}catch(e){console.error(e),q().innerHTML=`
                <div class="glass-premium p-20" style="text-align:center;">
                    <i data-lucide="alert-circle" style="width:48px; height:48px; color:#ef4444; margin-bottom:15px;"></i>
                    <h3 style="margin-bottom:8px;">Error al cargar avisos</h3>
                    <p style="opacity:0.6; margin-bottom:20px;">${e.message||`Ocurrió un problema.`}</p>
                    <button onclick="renderAdminNotifications()" class="btn-primary" style="padding:10px 24px;">🔄 Reintentar</button>
                </div>`,window.lucide.createIcons()}};t()},ke=e=>e==null?`$0`:`$`+Math.round(e).toLocaleString(`es-CL`);window.currentEditingMemberId=null;var Ae=()=>{document.querySelectorAll(`.overlay`).forEach(e=>{e.classList.remove(`active`),e.style.display=``})},je=async(e,t)=>{try{if(await o.updatePaymentStatus(e,t),t===`approved`){let t=await o.getPayment(e);if(t&&t.user_id){let e=new Date;e.setDate(e.getDate()+30),await o.updateProfile(t.user_id,{membership_status:`active`,membership_expiry:e.toISOString(),membership_plan_id:t.plan_id||null,updated_at:new Date().toISOString()}),await o.deletePendingPayments(t.user_id)}}window.showToast(`Pago ${t===`approved`?`aprobado`:`rechazado`} ✅`,t===`approved`?`#22c55e`:`#ef4444`),ne(),i()}catch(e){console.error(e),window.showToast(`Error al actualizar pago`,`#ef4444`)}},Me=async e=>{if(confirm(`¿Eliminar esta clase?`))try{await o.deleteClass(e),window.showToast(`Clase eliminada ✅`,`#22c55e`),Se()}catch(e){console.error(e),window.showToast(`Error al eliminar clase`,`#ef4444`)}},Ne=async e=>{if(confirm(`¿Eliminar este plan?`))try{await o.deletePlan(e),window.showToast(`Plan eliminado ✅`,`#22c55e`),we()}catch(e){console.error(e),window.showToast(`Error al eliminar plan`,`#ef4444`)}},Pe=(e=null,t=[])=>{let n=document.getElementById(`class-modal`),r=document.getElementById(`class-form`),i=document.getElementById(`class-modal-title`);r.reset(),i.innerText=e?`Editar Clase 🥋`:`Nueva Clase 🥋`;let a=e&&t.find(t=>t.id==e)||{};document.getElementById(`cls-name`).value=a.name||``,document.getElementById(`cls-coach`).value=a.coach||``,document.getElementById(`cls-time`).value=a.time||``,document.getElementById(`cls-type`).value=a.type||`Striking`,document.getElementById(`cls-theme`).value=a.theme||`smoke-purple`,document.getElementById(`cls-capacity`)&&(document.getElementById(`cls-capacity`).value=a.capacity||20);let s=document.getElementById(`cls-days-container`);if(s){let e=[`Dom`,`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`],t=a.days||[];s.innerHTML=e.map((e,n)=>`
                <label class="day-check" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <input type="checkbox" name="cls-day" value="${n}" ${t.includes(n)?`checked`:``}>
                    <span>${e}</span>
                </label>
            `).join(``)}n.classList.add(`active`),r.onsubmit=async t=>{t.preventDefault();let i=Array.from(r.querySelectorAll(`input[name="cls-day"]:checked`)).map(e=>parseInt(e.value)),s={name:document.getElementById(`cls-name`).value.trim(),coach:document.getElementById(`cls-coach`).value.trim(),time:document.getElementById(`cls-time`).value,type:document.getElementById(`cls-type`).value,theme:document.getElementById(`cls-theme`).value,days:i.length>0?i:[1,2,3,4,5],img:a.img||`https://images.unsplash.com/photo-1552072092-7f9b8d63efcb?auto=format&fit=crop&q=80&w=500`};s.id=e||(typeof crypto<`u`&&crypto.randomUUID?crypto.randomUUID():Date.now().toString());try{window.showLoading(`Guardando clase...`),await o.upsertClass(s),window.hideLoading(),window.showToast(`Clase guardada ✅`,`#22c55e`),window.appState.classes=await o.getClasses(),n.classList.remove(`active`),Se()}catch(e){console.error(e),window.hideLoading(),window.showToast(`Fallo al guardar clase ❌`,`#ef4444`)}}},Fe=(e=null,t=[])=>{let n=document.getElementById(`plan-modal`),r=document.getElementById(`plan-form`),i=document.getElementById(`plan-modal-title`);r.reset(),i.innerText=e?`Editar Plan 💎`:`Nuevo Plan 💎`;let a=e&&t.find(t=>t.id==e)||{};document.getElementById(`plan-name`).value=a.name||``,document.getElementById(`plan-price`).value=a.price||``,document.getElementById(`plan-limit`).value=a.limit||0,document.getElementById(`plan-monthly`).value=a.monthly||0,document.getElementById(`plan-subtitle`)&&(document.getElementById(`plan-subtitle`).value=a.subtitle||``),document.getElementById(`plan-theme`).value=a.theme||`bronze`,document.getElementById(`plan-features`)&&(document.getElementById(`plan-features`).value=a.features?a.features.join(`, `):``),document.getElementById(`plan-popular`)&&(document.getElementById(`plan-popular`).checked=a.popular||!1),document.getElementById(`plan-desc`)&&(document.getElementById(`plan-desc`).value=a.description||``);let s=document.getElementById(`plan-days-container`);if(s){let e=[`Dom`,`Lun`,`Mar`,`Mié`,`Jue`,`Vie`,`Sáb`],t=Array.isArray(a.days)?a.days:[];s.innerHTML=e.map((e,n)=>`
                <label class="day-check" style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; cursor: pointer; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                    <input type="checkbox" name="plan-day" value="${n}" ${t.includes(n)?`checked`:``}>
                    <span>${e}</span>
                </label>
            `).join(``)}n.classList.add(`active`),r.onsubmit=async i=>{i.preventDefault();let s=document.getElementById(`plan-features`),c=s?s.value.split(`,`).map(e=>e.trim()).filter(e=>e):[],l=Array.from(r.querySelectorAll(`input[name="plan-day"]:checked`)).map(e=>parseInt(e.value)),u={name:document.getElementById(`plan-name`).value.trim(),price:parseFloat(document.getElementById(`plan-price`).value),monthly:parseInt(document.getElementById(`plan-monthly`).value),limit:parseInt(document.getElementById(`plan-limit`).value),theme:document.getElementById(`plan-theme`).value.trim(),subtitle:document.getElementById(`plan-subtitle`)?document.getElementById(`plan-subtitle`).value.trim():``,features:c,popular:document.getElementById(`plan-popular`)?document.getElementById(`plan-popular`).checked:!1,days:l,description:document.getElementById(`plan-desc`)?document.getElementById(`plan-desc`).value.trim():``};u.id=e||(typeof crypto<`u`&&crypto.randomUUID?crypto.randomUUID():Date.now().toString()),u.sort_order=e?a.sort_order||0:t.length;try{window.showLoading(`Guardando plan...`),await o.upsertPlan(u),window.hideLoading(),window.showToast(`Plan guardado ✅`,`#22c55e`),n.classList.remove(`active`),we()}catch(e){console.error(e),window.hideLoading(),window.showToast(`Fallo al guardar plan ❌`,`#ef4444`)}}};window.currentEditingMemberId=null;var J=[],Y=(e,t)=>{let n=document.getElementById(e);n&&(n.value=t||``)},Ie=e=>{document.querySelectorAll(`.mem-tab`).forEach(e=>{e.style.background=`transparent`,e.style.color=`var(--text-gray)`,e.style.borderColor=`transparent`});let t=document.querySelector(`.mem-tab[data-tab="${e}"]`);t&&(t.style.background=`var(--accent-purple)`,t.style.color=`white`,t.style.borderColor=`var(--accent-purple)`),[`profile`,`membership`,`attendance`,`payments`,`notes`].forEach(t=>{let n=document.getElementById(`mem-tab-${t}`);n&&n.classList.toggle(`hidden`,t!==e)})},X=async(e=null,t=[])=>{try{window.currentEditingMemberId=e,J=t;let n=document.getElementById(`member-modal`);if(!n){console.error(`Modal 'member-modal' not found!`);return}document.querySelectorAll(`.overlay`).forEach(e=>e.classList.remove(`active`)),n.classList.add(`active`),n.style.display=`flex`,window.lucide.createIcons();let r=document.getElementById(`member-modal-title`),i=document.getElementById(`member-form`),a=document.getElementById(`mem-profile-summary`),o=document.getElementById(`mem-modal-tabs`),s=document.getElementById(`mem-plan`),c=document.getElementById(`mem-risk-banner`);if(s&&(s.innerHTML=`<option value="" style="color: black;">Sin Plan (Inactivo)</option>`,(window.appState.plans||[]).forEach(e=>{let t=document.createElement(`option`);t.value=e.id,t.text=e.name,t.style.color=`black`,s.appendChild(t)})),document.querySelectorAll(`.mem-tab`).forEach(e=>{e.onclick=t=>{t.preventDefault(),Ie(e.getAttribute(`data-tab`))}}),e){let n=t.find(t=>t.id===e);if(!n){console.warn(`User not found in array:`,e),window.showToast(`Socio no encontrado`,`#ef4444`);return}r&&(r.innerText=`Editar Socio`),a&&(a.classList.remove(`hidden`),a.style.display=`flex`);let i=document.getElementById(`mem-avatar-preview`);i&&(i.src=n.photo_url||`/assets/unknow-BC4RhdqH.png`);let s=document.getElementById(`mem-status-indicator`),l=n.membership_expiry?new Date(n.membership_expiry):null,u=new Date,d=l?Math.ceil((l-u)/(1e3*60*60*24)):0,f=`#ef4444`;n.is_frozen?f=`#3b82f6`:d>0?f=`#22c55e`:d>-30&&(f=`#f97316`),s&&(s.style.background=f);let p=document.getElementById(`mem-display-name`);p&&(p.textContent=n.full_name||`Sin Nombre`);let m=document.getElementById(`mem-display-email`);m&&(m.textContent=n.email||``);let h=document.getElementById(`mem-display-status-badge`);if(h){let e=`Inactivo`;n.is_frozen?e=`Congelado`:d>0?e=`Activo`:d>-30&&(e=`Moroso`),h.textContent=e,h.style.background=`${f}20`,h.style.color=f,h.style.borderColor=`${f}40`}let g=document.getElementById(`mem-display-plan`);g&&(g.textContent=n.membership_plans?.name||`Sin Plan`);let _=document.getElementById(`mem-display-level`);_&&(_.textContent=`LVL ${n.level||0}`);let v=document.getElementById(`mem-display-expiry`);if(v&&(d>0?v.textContent=`${d} días restantes`:d>-30?v.textContent=`Moroso`:v.textContent=`Expirado`,v.style.color=d<=5?`#ef4444`:`#fbbf24`,v.style.background=d<=5?`rgba(239,68,68,0.1)`:`rgba(251,191,36,0.1)`,v.style.borderColor=d<=5?`rgba(239,68,68,0.2)`:`rgba(251,191,36,0.2)`),c){let e=[];d!==null&&d<=5&&d>0&&e.push(`Vence en ${d} días`),d<=0&&d>-30&&e.push(`Membresía vencida`);let t=n._lastAttendance,r=t?Math.floor((u-new Date(t))/(1e3*60*60*24)):-1;r>14&&e.push(`Sin asistir ${r} días`),e.length>0?(c.classList.remove(`hidden`),document.getElementById(`mem-risk-text`).textContent=`⚠️ ${e.join(` • `)}`):c.classList.add(`hidden`)}let y=document.getElementById(`mem-quick-actions`);y&&(y.style.display=`flex`,document.getElementById(`btn-mem-renew`).onclick=()=>Re(n.id),document.getElementById(`btn-mem-freeze`).onclick=()=>ze(n.id,!n.is_frozen),document.getElementById(`btn-mem-message`).onclick=async()=>{let e=prompt(`Enviar mensaje a ${n.full_name}\n\nElige canal:\n1 = 📱 In-App\n2 = ✉️ Email\n3 = 🔄 Ambos`);if(!e)return;let t=e.trim(),r=t===`1`||t===`3`,i=t===`2`||t===`3`;if(!r&&!i){window.showToast(`Opción inválida. Usa 1, 2 o 3.`,`#ef4444`);return}let a=prompt(`Mensaje para ${n.full_name}:`);if(a)try{window.showToast(`Enviando mensaje...`,`#f59e0b`),r&&await window.SupabaseService.sendUserNotification(n.id,`Mensaje directo del equipo Amaru`,a,`direct`),i&&n.email&&n.email.includes(`@`)&&await window.SupabaseService.sendBulkEmail([n.email],`Mensaje de Amaru`,a,null),window.showToast(`Mensaje enviado a ${n.full_name} ✅`,`#22c55e`)}catch(e){console.error(`[adminModals] Error enviando mensaje:`,e),window.showToast(`Error al enviar mensaje. Intenta de nuevo.`,`#ef4444`)}},document.getElementById(`btn-mem-delete`).onclick=()=>He(n.id)),o&&(o.classList.remove(`hidden`),o.style.display=`flex`),Y(`mem-name`,n.full_name),Y(`mem-rut`,n.rut),Y(`mem-email`,n.email),Y(`mem-phone`,n.phone),Y(`mem-level`,n.level||0),Y(`mem-xp`,n.xp||0),Y(`mem-entry-date`,n.created_at?n.created_at.split(`T`)[0]:``),Y(`mem-birthdate`,n.birthdate),Y(`mem-address`,n.address),Y(`mem-emergency-contact`,n.emergency_contact),Y(`mem-admin-notes`,n.admin_notes),Y(`mem-plan`,n.membership_plan_id);let b=document.getElementById(`mem-status`);b&&(n.is_frozen?b.value=`frozen`:n.membership_status===`active`&&d>0?b.value=`active`:b.value=`inactive`),Y(`mem-expiry`,n.membership_expiry?n.membership_expiry.split(`T`)[0]:``),Y(`mem-class-limit`,n.membership_limit||2),Y(`mem-surcharge`,n.surcharge_pct||30);let x=document.getElementById(`mem-status-display`);if(x)if(l&&n.membership_status===`active`){x.classList.remove(`hidden`);let e=Math.ceil((l-u)/(1e3*60*60*24)),t=document.getElementById(`mem-days-left`),n=document.getElementById(`mem-progress-bar`),r=document.getElementById(`mem-progress-start`),i=document.getElementById(`mem-progress-end`);if(t&&(t.textContent=e>0?`${e} días restantes`:`Expirado`,t.style.color=e<=5?`#ef4444`:e<=10?`#fbbf24`:`#22c55e`),n){let t=Math.max(0,Math.min(100,(30-e)/30*100));n.style.width=`${t}%`,n.style.background=e<=5?`linear-gradient(90deg, #ef4444, #f97316)`:`linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))`}if(r){let e=new Date(l);e.setDate(e.getDate()-30),r.textContent=e.toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`})}i&&(i.textContent=l.toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`}))}else x.classList.add(`hidden`);let S=document.getElementById(`btn-mem-extend-7`),C=document.getElementById(`btn-mem-extend-30`);S&&(S.onclick=()=>Le(n.id,7)),C&&(C.onclick=()=>Le(n.id,30));let w=document.getElementById(`admin-pass-tools`);if(w){w.classList.remove(`hidden`);let e=document.getElementById(`btn-admin-reset-pass`);e&&(e.onclick=async()=>{if(confirm(`¿Enviar email de restablecimiento a ${n.email}?`))try{let{error:e}=await window.supabase.auth.resetPasswordForEmail(n.email,{redirectTo:window.location.origin+`/app/`});if(e)throw e;window.showToast(`Email enviado correctamente 📧`,`#22c55e`)}catch(e){console.error(e),window.showToast(`Error al enviar email ❌`,`#ef4444`)}})}Be(n.id),Ve(n.id),Ie(`profile`)}else{r&&(r.innerText=`Nuevo Socio`),i&&i.reset(),Y(`mem-entry-date`,new Date().toISOString().split(`T`)[0]),Y(`mem-xp`,0),Y(`mem-level`,0),a&&a.classList.add(`hidden`),o&&o.classList.add(`hidden`);let e=document.getElementById(`mem-risk-banner`);e&&e.classList.add(`hidden`);let t=document.getElementById(`mem-quick-actions`);t&&(t.style.display=`none`),Ie(`profile`)}}catch(e){console.error(`Error opening member modal:`,e),window.showToast(`Error crítico al abrir editor ❌`,`#ef4444`)}},Le=async(e,t)=>{try{let n=J.find(t=>t.id===e),r=n?.membership_expiry?new Date(n.membership_expiry):new Date;r<new Date&&r.setTime(Date.now()),r.setDate(r.getDate()+t),await o.updateProfile(e,{membership_expiry:r.toISOString(),membership_status:`active`,is_frozen:!1}),window.showToast(`Membresía extendida +${t} días ✅`,`#22c55e`);let i=await window.supabase.from(`profiles`).select(`*`);i.data&&(J=i.data,i.data.find(t=>t.id===e)&&X(e,i.data))}catch(e){console.error(e),window.showToast(`Error al extender membresía ❌`,`#ef4444`)}},Re=async e=>{let t=J.find(t=>t.id===e);if(!t||!t.membership_plan_id){window.showToast(`El socio no tiene un plan asignado para renovar.`,`#ef4444`);return}if(confirm(`¿Renovar el plan de ${t.full_name} por 1 mes más?`))try{let n=new Date;n.setMonth(n.getMonth()+1),await window.supabase.from(`profiles`).update({membership_expiry:n.toISOString(),membership_status:`active`,is_frozen:!1}).eq(`id`,e);let r=(window.appState.plans||[]).find(e=>e.id===t.membership_plan_id),a=r?.price||r?.monthly||0;if(a>0){let t=new Date,n=[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][t.getMonth()],{error:o}=await window.supabase.from(`payments`).insert({user_id:e,amount:a,concept:`Renovación ${r?.name||`Membresía`}`,status:`approved`,payment_method:`efectivo`,coverage_month:`${n} ${t.getFullYear()}`,created_at:new Date().toISOString()});o?console.warn(`[AdminModals] Renewal payment insert failed:`,o):(window.showToast(`Pago de ${ke(a)} registrado ✅`,`#22c55e`),i())}window.showToast(`Plan renovado exitosamente ✅`,`#22c55e`);let o=await window.supabase.from(`profiles`).select(`*`);o.data&&X(e,o.data)}catch(e){console.error(e),window.showToast(`Error al renovar plan.`,`#ef4444`)}},ze=async(e,t)=>{try{await window.supabase.from(`profiles`).update({is_frozen:t}).eq(`id`,e),window.showToast(t?`Membresía congelada 🧊`:`Membresía descongelada ✅`,t?`#3b82f6`:`#22c55e`);let n=await window.supabase.from(`profiles`).select(`*`);n.data&&X(e,n.data)}catch(e){console.error(e),window.showToast(`Error al cambiar estado ❌`,`#ef4444`)}},Be=async e=>{let t=document.getElementById(`mem-attendance-list`),n=document.getElementById(`mem-stat-total`),r=document.getElementById(`mem-stat-month`),i=document.getElementById(`mem-stat-week`),a=document.getElementById(`mem-attendance-heatmap`);t&&(t.innerHTML=`<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>`),window.lucide.createIcons();try{let s=await o.getAttendance(e),c=new Date,l=c.getMonth(),u=c.getFullYear(),d=s?s.length:0,f=s?s.filter(e=>{let t=new Date(e.attended_at);return t.getMonth()===l&&t.getFullYear()===u}).length:0,p=new Date;p.setDate(p.getDate()-7);let m=s?s.filter(e=>new Date(e.attended_at)>=p).length:0;if(n&&(n.textContent=d),r&&(r.textContent=f),i&&(i.textContent=m),a){let e=[];for(let t=27;t>=0;t--){let n=new Date;n.setDate(n.getDate()-t);let r=n.toISOString().split(`T`)[0],i=s?s.filter(e=>e.attended_at&&e.attended_at.startsWith(r)).length:0;e.push({date:n,count:i})}a.innerHTML=e.map(e=>{let t=e.count===0?.05:e.count===1?.3:e.count===2?.6:1;return`<div title="${`${e.date.toLocaleDateString(`es-CL`)} — ${e.count} asistencia${e.count===1?``:`s`}`}" style="aspect-ratio:1; border-radius:4px; background:rgba(139,92,246,${t}); cursor:pointer; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>`}).join(``)}if(s&&s.length>0){let e=[...s].sort((e,t)=>new Date(t.attended_at)-new Date(e.attended_at));t&&(t.innerHTML=e.slice(0,50).map(e=>{let t=new Date(e.attended_at),n=t.toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}),r=t.toLocaleTimeString(`es-CL`,{hour:`2-digit`,minute:`2-digit`}),i=t.toLocaleDateString(`es-CL`,{weekday:`short`});return`<div style="display:flex; align-items:center; gap:12px; padding:10px; border-radius:10px; margin-bottom:6px; background:rgba(6,182,212,0.06); border:1px solid rgba(255,255,255,0.04);">
                        <div style="width:36px; height:36px; border-radius:8px; background:var(--accent-cyan)15; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="calendar-check" style="width:14px; color:var(--accent-cyan);"></i></div>
                        <div style="flex:1; min-width:0;"><strong style="font-size:0.85rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.class_name||`Clase`}</strong><span style="font-size:0.7rem; color:var(--text-gray);">${i} — ${n}</span></div>
                        <span style="font-size:0.7rem; color:rgba(255,255,255,0.4); flex-shrink:0;">${r}</span>
                    </div>`}).join(``))}else t&&(t.innerHTML=`<div style="text-align:center; padding:30px; color:var(--text-gray);"><i data-lucide="inbox" style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;"></i><p style="font-size:0.85rem;">Sin asistencias registradas</p></div>`);window.lucide.createIcons()}catch(e){console.error(`Error loading member attendance:`,e),t&&(t.innerHTML=`<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar asistencias</p>`)}},Ve=async e=>{let t=document.getElementById(`mem-payments-list`),n=document.getElementById(`mem-pay-total`),r=document.getElementById(`mem-pay-pending`),i=document.getElementById(`mem-pay-amount`);t&&(t.innerHTML=`<p style="text-align:center; color:var(--text-gray); font-size:0.8rem; padding:20px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Cargando...</p>`),window.lucide.createIcons();try{let a=await o.getPayments(e),s=a?a.length:0,c=a?a.filter(e=>e.status===`pending`).length:0,l=a?a.filter(e=>e.status===`approved`).reduce((e,t)=>e+(parseFloat(t.amount)||0),0):0;if(n&&(n.textContent=s),r&&(r.textContent=c),i&&(i.textContent=`$${l.toLocaleString(`es-CL`)}`),a&&a.length>0){let e=[...a].sort((e,t)=>new Date(t.created_at)-new Date(e.created_at));t&&(t.innerHTML=e.map(e=>{let t=new Date(e.created_at).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}),n=e.status===`approved`,r=n?`#22c55e`:`#fbbf24`,i=n?`rgba(34,197,94,0.06)`:`rgba(251,191,36,0.06)`,a=n?`check-circle`:`clock`,o=n?`Aprobado`:`Pendiente`,s=parseFloat(e.amount)||0,c={transferencia:`Transferencia Bancaria`,pasarela:`Pasarela de Pago`,efectivo:`Efectivo`,mercadopago:`Mercado Pago`,webpay:`Webpay`,manual:`Transferencia/Manual`},l=c[e.payment_method]||c[e.method]||`Transferencia`;return`<div style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:10px; margin-bottom:6px; background:${i}; border:1px solid rgba(255,255,255,0.04);">
                        <div style="width:36px; height:36px; border-radius:8px; background:${r}15; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><i data-lucide="${a}" style="width:14px; color:${r};"></i></div>
                        <div style="flex:1; min-width:0;">
                            <strong style="font-size:0.85rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${e.concept||`Pago`}</strong>
                            <span style="font-size:0.7rem; color:var(--text-gray);">${o} — ${t}</span>
                        </div>
                        <div style="text-align:right; flex-shrink:0;">
                            <span style="font-size:0.9rem; font-weight:800; color:${r}; display:block;">$${s.toLocaleString(`es-CL`)}</span>
                            <span style="font-size:0.6rem; color:rgba(255,255,255,0.3);">${l}</span>
                        </div>
                    </div>`}).join(``))}else t&&(t.innerHTML=`<div style="text-align:center; padding:30px; color:var(--text-gray);"><i data-lucide="inbox" style="width:40px; height:40px; opacity:0.3; margin-bottom:10px;"></i><p style="font-size:0.85rem;">Sin pagos registrados</p></div>`);window.lucide.createIcons()}catch(e){console.error(`Error loading member payments:`,e),t&&(t.innerHTML=`<p style="text-align:center; color:#ef4444; font-size:0.8rem; padding:20px;">Error al cargar pagos</p>`)}},He=async e=>{if(confirm(`¿Eliminar socio definitivamente? Todo su progreso y reservas se borrarán.`))try{await o.softDeleteUser(e),window.showToast(`Socio eliminado correctamente 🗑️`,`#ef4444`),U(),Ae()}catch(e){console.error(e),window.showToast(`Error al eliminar socio ❌`,`#ef4444`)}},Ue=()=>{document.addEventListener(`click`,e=>{(e.target.closest(`.btn-close-modal`)||e.target.closest(`.btn-close`)||e.target.closest(`.btn-action-cancel`))&&Ae(),e.target.classList.contains(`overlay`)&&Ae()});let e=document.getElementById(`member-form`);e&&(e.onsubmit=async e=>{e.preventDefault();let t=document.getElementById(`mem-name`).value.trim(),n=document.getElementById(`mem-rut`)?.value.trim()||``,r=document.getElementById(`mem-email`).value.trim(),a=document.getElementById(`mem-phone`).value.trim(),s=parseInt(document.getElementById(`mem-level`).value)||0,c=parseInt(document.getElementById(`mem-xp`).value)||0,l=document.getElementById(`mem-entry-date`).value,u=document.getElementById(`mem-birthdate`).value,d=document.getElementById(`mem-address`)?.value.trim()||``,f=document.getElementById(`mem-emergency-contact`).value.trim(),p=document.getElementById(`mem-admin-notes`).value.trim(),m=document.getElementById(`mem-plan`).value,h=document.getElementById(`mem-status`).value,g=document.getElementById(`mem-expiry`).value,_=parseInt(document.getElementById(`mem-class-limit`).value)||2,v=parseInt(document.getElementById(`mem-surcharge`).value)||30;if(!t){window.showToast(`El nombre completo es obligatorio ⚠️`,`#eab308`);return}let y=r;if(!y){let e=Date.now();y=`socio.${t.toLowerCase().replace(/[^a-z0-9]/g,``).substring(0,20)}.${e}@amaru.local`}let b={full_name:t,rut:n||null,email:y,phone:a||null,level:s,xp:c,birthdate:u||null,address:d||null,emergency_contact:f||null,admin_notes:p||null,membership_plan_id:m||null,membership_limit:_,surcharge_pct:v,is_frozen:h===`frozen`};if(l&&(b.created_at=new Date(l).toISOString()),h===`active`)if(b.membership_status=`active`,g)b.membership_expiry=new Date(g).toISOString();else{let e=new Date;e.setDate(e.getDate()+30),b.membership_expiry=e.toISOString()}else h===`frozen`?(b.membership_status=`active`,g&&(b.membership_expiry=new Date(g).toISOString())):(b.membership_status=`inactive`,b.membership_expiry=g?new Date(g).toISOString():null);try{if(window.currentEditingMemberId){let e=J.find(e=>e.id===window.currentEditingMemberId),t=!e||e.membership_status!==`active`,n=b.membership_status===`active`,r=!!b.membership_plan_id;if(await o.updateProfile(window.currentEditingMemberId,b),t&&n&&r){let e=(window.appState.plans||[]).find(e=>e.id===b.membership_plan_id),t=e?.price||e?.monthly||0;if(t>0){let n=new Date,r=[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][n.getMonth()],{error:a}=await window.supabase.from(`payments`).insert({user_id:window.currentEditingMemberId,amount:t,concept:e?.name||`Membresía`,status:`approved`,payment_method:`efectivo`,coverage_month:`${r} ${n.getFullYear()}`,created_at:new Date().toISOString()});a?console.warn(`[AdminModals] Auto-payment insert failed:`,a):(window.showToast(`Pago de ${ke(t)} registrado ✅`,`#22c55e`),i())}}window.showToast(`Datos de socio actualizados ✅`,`#22c55e`)}else{window.showToast(`Creando nuevo socio... 🥋`,`#8b5cf6`);let{data:e,error:r}=await window.supabase.functions.invoke(`create-user`,{body:{email:y,password:`Amaru123!`,full_name:t,memberData:{rut:n||null,phone:a||null,level:s,xp:c,birthdate:u||null,address:d||null,emergency_contact:f||null,admin_notes:p||null,membership_plan_id:m||null,membership_limit:_,surcharge_pct:v,is_frozen:h===`frozen`,membership_status:b.membership_status,membership_expiry:b.membership_expiry,created_at:b.created_at}}});if(r)throw r;if(!e||!e.success)throw Error(e?.error||`Error al crear socio via Edge Function`);if(e.userId&&h===`active`&&m){let t=(window.appState.plans||[]).find(e=>e.id===m),n=t?.price||t?.monthly||0;if(n>0){let r=new Date,a=[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][r.getMonth()],{error:o}=await window.supabase.from(`payments`).insert({user_id:e.userId,amount:n,concept:t?.name||`Membresía`,status:`approved`,payment_method:`efectivo`,coverage_month:`${a} ${r.getFullYear()}`,created_at:new Date().toISOString()});o?console.warn(`[AdminModals] Auto-payment insert failed:`,o):(window.showToast(`Pago de ${ke(n)} registrado ✅`,`#22c55e`),i())}}window.showToast(`Socio creado exitosamente ✅`,`#22c55e`)}document.getElementById(`member-modal`).classList.remove(`active`),U()}catch(e){console.error(e),window.showToast(`Error al guardar socio ❌`,`#ef4444`)}});let t=document.getElementById(`btn-mem-save-notify`);t&&(t.onclick=()=>{let e=document.getElementById(`member-form`);e&&(e.dataset.notify=`true`,e.dispatchEvent(new Event(`submit`)),e.dataset.notify=``)})},Z=async()=>{let e=document.querySelector(`.class-timeline`),t=document.querySelector(`.date-carousel-premium`);if(!e)return;let{appState:n,auth:r,showLoading:i,hideLoading:a,toggleReservation:s,openClassModal:c,SkeletonLoader:l}=window;if(t){t.innerHTML=``;for(let e=0;e<7;e++){let s=new Date;s.setHours(12,0,0,0),s.setDate(s.getDate()+e);let c=s.toISOString().split(`T`)[0],l=s.toLocaleDateString(`es-ES`,{weekday:`short`}).toUpperCase(),u=s.getDate(),d=c===n.selectedDate,f=document.createElement(`div`);f.className=`date-chip ${d?`active`:``}`,f.innerHTML=`<span>${l}</span><p>${u}</p>`,f.onclick=async()=>{n.selectedDate=c,i&&i(`Cargando clases... ⏳`);try{n.reservations=(await o.getReservations(c)||[]).filter(e=>e.user_id===r.currentUser?.uid).map(e=>e.class_id)}catch(e){console.error(`[Schedule] Error fetching reservations:`,e),n.reservations=[]}a&&a(),Z()},t.appendChild(f)}}let u=[`Domingo`,`Lunes`,`Martes`,`Miércoles`,`Jueves`,`Viernes`,`Sábado`],d=new Date(n.selectedDate+`T12:00:00`).getDay(),f=u[d];console.log(`[Schedule] Rendering for ${n.selectedDate} (${f}, index: ${d})`),console.log(`[Schedule] Total classes in state: ${n.classes?.length}`);let p=[];try{p=await o.getReservations(n.selectedDate)}catch(e){console.warn(`[Schedule] Could not fetch reservations for date:`,e)}let m=n.classes.filter(e=>{let t=n.activeFilter===`Todas`||e.type===n.activeFilter,r=e.days;if(typeof r==`string`)try{r=JSON.parse(r)}catch{r=r.split(`,`).map(e=>e.trim())}let i=!1;return Array.isArray(r)&&(i=r.some(e=>e===d||String(e)===String(d)||String(e).toLowerCase()===f.toLowerCase()||String(e).toLowerCase().startsWith(f.substring(0,3).toLowerCase()))),t&&i});if(console.log(`[Schedule] Filtered classes: ${m.length}`),m.length===0){if(n.classes.length===0&&l){l.showFor(`schedule`);return}e.innerHTML=`
            <div style="text-align:center; padding:40px 20px; color:var(--text-gray);">
                <i data-lucide="calendar-x" style="width:40px; height:40px; opacity:0.3; margin-bottom:15px;"></i>
                <p>No hay clases programadas para este día.</p>
                <span style="font-size:0.8rem; opacity:0.6;">(Filtro: ${n.activeFilter})</span>
            </div>`,window.lucide&&window.lucide.createIcons();return}l&&l.hideAll(),e.innerHTML=m.map((e,t)=>{let r=n.reservations.includes(e.id),i=p.filter(t=>t.class_id===e.id),a=i.length,o=i.map(e=>e.user_name||e.profiles?.full_name||`Atleta`).slice(0,5),s=i.length>5,c={Striking:`#ef4444`,BJJ:`#8b5cf6`,MMA:`#f97316`,"Funcional Fighter":`#22c55e`,"BJJ Gi":`#8b5cf6`,"No Gi":`#a855f7`}[e.type]||`var(--accent-cyan)`;return`
            <div class="stitch-class-card ${r?`booked`:``} ${e.theme}" data-class-id="${e.id}" style="opacity:0; animation: elegantFadeIn 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${.04+t*.08}s forwards; cursor: pointer; transition: all 0.3s;"
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 40px rgba(0,0,0,0.3)';"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='';">
                <div class="smoke-layer"></div>
                <div class="stitch-class-content">
                    <div class="cls-info-main" style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                            <span class="tag" style="background:${c}22; color:${c}; border:1px solid ${c}44;">${e.type}</span>
                            ${r?`<span class="tag" style="background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3);">✓ Reservado</span>`:``}
                        </div>
                        <h4 style="margin:0; font-size:1.05rem; font-weight:800;">${e.name}</h4>
                        <p style="margin:4px 0 0; font-size:0.8rem; opacity:0.7;">${e.time} • Coach ${e.coach}</p>
                        <div style="display:flex; align-items:center; gap:6px; margin-top:8px; flex-wrap:wrap;">
                            <span style="font-size:0.7rem; opacity:0.5; display:flex; align-items:center; gap:4px;">
                                <i data-lucide="users" style="width:12px;"></i> ${a} inscrito${a===1?``:`s`}
                            </span>
                            ${a>0?`<span style="font-size:0.65rem; opacity:0.4;">• ${o.join(`, `)}${s?`...`:``}</span>`:``}
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                        ${n.role===`admin`?`
                        <button class="btn-view-attendees" data-class-id="${e.id}" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-gray); padding:8px 14px; border-radius:10px; font-size:0.7rem; font-weight:700; cursor:pointer; min-width:100px;"
                            onclick="event.stopPropagation();">
                            <i data-lucide="eye" style="width:12px; margin-right:4px;"></i> Ver asistencia
                        </button>`:`
                        <button class="btn-reserve-stitch ${r?`booked`:``}" data-id="${e.id}" style="min-width:100px;"
                            onclick="event.stopPropagation();">
                            ${r?`CANCELAR`:`RESERVAR`}
                        </button>
                        `}
                    </div>
                </div>
                <div class="class-attendees-detail" id="attendees-${e.id}" style="display:none; padding:12px 20px 16px; border-top:1px solid rgba(255,255,255,0.05);">
                    <p style="font-size:0.7rem; opacity:0.5; margin-bottom:8px; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Lista de asistentes</p>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${i.length===0?`<span style="font-size:0.8rem; opacity:0.4;">Nadie inscrito todavía</span>`:i.map((e,t)=>`
                            <div style="display:flex; align-items:center; gap:8px; padding:6px 0; ${t<i.length-1?`border-bottom:1px solid rgba(255,255,255,0.03);`:``}">
                                <div style="width:26px; height:26px; border-radius:8px; background:${c}15; border:1px solid ${c}30; display:flex; align-items:center; justify-content:center; font-size:0.6rem; font-weight:800; color:${c};">
                                    ${(e.profiles?.full_name||e.user_name||`A`).split(` `).map(e=>e[0]).join(``).substring(0,2).toUpperCase()}
                                </div>
                                <span style="font-size:0.8rem; font-weight:600;">${e.profiles?.full_name||e.user_name||`Atleta`}</span>
                            </div>
                        `).join(``)}
                    </div>
                </div>
            </div>`}).join(``),window.lucide&&window.lucide.createIcons(),document.querySelectorAll(`.stitch-class-card`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-class-id`),n=document.getElementById(`attendees-${t}`);if(n){let e=n.style.display===`block`;n.style.display=e?`none`:`block`}}}),document.querySelectorAll(`.btn-reserve-stitch`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-id`);n.role===`admin`?c?c(t,n.classes):window.showToast(`Función de edición no disponible`,`#ef4444`):s&&s(t)}}),document.querySelectorAll(`.btn-view-attendees`).forEach(e=>{e.onclick=()=>{let t=e.getAttribute(`data-class-id`),n=document.getElementById(`attendees-${t}`);n&&(n.style.display=n.style.display===`block`?`none`:`block`)}})},We=null,Q=()=>{let e=document.getElementById(`tourney-list`);if(!e)return;let{appState:t,auth:n,showToast:r}=window,i=new Date,a=t.tournaments.filter(e=>new Date(e.date)>=i).sort((e,t)=>new Date(e.date)-new Date(t.date)),s=t.tournaments.filter(e=>new Date(e.date)<i).sort((e,t)=>new Date(t.date)-new Date(e.date));Ge(a);let c=document.querySelector(`.tournament-selector .sel-tab.active`)?.getAttribute(`data-tab`)||`upcoming`,l=c===`upcoming`?a:s;l.length===0?e.innerHTML=`
            <div style="padding: 40px 20px; text-align: center; opacity: 0.4;">
                <i data-lucide="trophy" style="width: 40px; height: 40px; margin-bottom: 12px;"></i>
                <p style="font-size: 0.85rem; font-weight: 700;">${c===`upcoming`?`No hay torneos próximos`:`No hay torneos pasados`}</p>
                <p style="font-size: 0.7rem; color: var(--text-gray); margin-top: 4px;">${c===`upcoming`?`Agrega tu primer torneo con el botón +`:`Los torneos pasados aparecerán aquí`}</p>
            </div>
        `:e.innerHTML=l.map((e,n)=>{let r=new Date(e.date),a=r-i,o=a<0,s=o?Math.floor(Math.abs(a)/(1e3*60*60*24)):Math.ceil(a/(1e3*60*60*24)),c=r.toLocaleDateString(`es-ES`,{weekday:`long`,day:`numeric`,month:`long`}),l=o?`#22c55e`:s<=7?`#ef4444`:`#fbbf24`,u=o?`rgba(34,197,94,0.1)`:s<=7?`rgba(239,68,68,0.1)`:`rgba(251,191,36,0.1)`,d=o?`rgba(34,197,94,0.2)`:s<=7?`rgba(239,68,68,0.2)`:`rgba(251,191,36,0.2)`,f=o?`Completado`:`En ${s} días`,p=o?`check-circle`:s<=7?`flame`:`calendar`;return`
            <div style="display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; transition: all 0.3s; animation: elegantFadeIn 0.45s ease ${.04+n*.1}s both; cursor: pointer;"
                onmouseenter="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(4px)';"
                onmouseleave="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateX(0)';">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: ${u}; border: 1px solid ${d}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i data-lucide="${p}" style="width: 20px; color: ${l};"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.9rem; font-weight: 800; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${e.name}</p>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                        <span style="font-size: 0.7rem; color: var(--text-gray); display: flex; align-items: center; gap: 3px;">
                            <i data-lucide="map-pin" style="width: 10px;"></i> ${e.place}
                        </span>
                        <span style="font-size: 0.65rem; color: var(--text-gray); opacity: 0.6;">• ${c}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span style="font-size: 0.6rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: ${u}; color: ${l}; border: 1px solid ${d}; text-transform: uppercase; letter-spacing: 0.5px;">${f}</span>
                    ${t.role===`admin`?`
                    <button class="edit-tourney-btn" data-id="${e.id}" style="background:none; border:none; color:white; cursor:pointer; padding: 4px; opacity: 0.6; transition: opacity 0.3s;" onclick="event.stopPropagation();">
                        <i data-lucide="edit-3" style="width:14px;"></i>
                    </button>
                    <button class="delete-tourney-btn" data-id="${e.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; padding: 4px; opacity: 0.6; transition: opacity 0.3s;" onclick="event.stopPropagation();">
                        <i data-lucide="trash-2" style="width:14px;"></i>
                    </button>
                    `:``}
                </div>
            </div>`}).join(``),window.lucide&&window.lucide.createIcons(),document.querySelectorAll(`.edit-tourney-btn`).forEach(e=>{e.onclick=()=>{let n=e.getAttribute(`data-id`),r=t.tournaments.find(e=>e.id===n);r&&(document.getElementById(`tourney-id`).value=r.id,document.getElementById(`tourney-name`).value=r.name,document.getElementById(`tourney-place`).value=r.place,document.getElementById(`tourney-date`).value=r.date,document.getElementById(`tourney-modal-title`).innerText=`Editar Torneo`,document.getElementById(`tourney-modal`).classList.add(`active`))}}),document.querySelectorAll(`.delete-tourney-btn`).forEach(e=>{e.onclick=async()=>{if(confirm(`¿Eliminar este torneo de tu lista?`)){let i=e.getAttribute(`data-id`);try{await o.deleteTournament(i),t.tournaments=await o.getTournaments(n.currentUser.uid),Q(),r&&r(`Torneo eliminado 🗑️`,`#ef4444`)}catch(e){r&&r(`Error al eliminar torneo ❌`,`#ef4444`),console.error(e)}}}}),document.querySelectorAll(`.tournament-selector .sel-tab`).forEach(e=>{e.onclick=()=>{document.querySelectorAll(`.tournament-selector .sel-tab`).forEach(e=>{e.classList.remove(`active`),e.style.background=`transparent`,e.style.color=`var(--text-gray)`}),e.classList.add(`active`),e.style.background=`var(--accent-purple)`,e.style.color=`white`,Q()}})},Ge=e=>{let t=document.getElementById(`tournament-next-countdown`),n=document.getElementById(`tournament-no-events`),r=document.getElementById(`tournament-hero-name`),i=document.getElementById(`tournament-hero-place`),a=document.getElementById(`tourney-cd-days`),o=document.getElementById(`tourney-cd-hours`),s=document.getElementById(`tourney-cd-mins`);if(!t||!n)return;if(We&&=(clearInterval(We),null),e.length===0){t.style.display=`none`,n.style.display=`block`;return}let c=e[0];t.style.display=`block`,n.style.display=`none`,r&&(r.innerText=c.name),i&&(i.innerText=c.place);let l=()=>{let e=new Date,t=new Date(c.date)-e;if(t<=0){a&&(a.innerText=`0`),o&&(o.innerText=`0`),s&&(s.innerText=`0`);return}let n=Math.floor(t/(1e3*60*60*24)),r=Math.floor(t%(1e3*60*60*24)/(1e3*60*60)),i=Math.floor(t%(1e3*60*60)/(1e3*60));a&&(a.innerText=n),o&&(o.innerText=r),s&&(s.innerText=i)};l(),We=setInterval(l,6e4)},Ke={tpl:{hero:`<div class="skeleton" style="height:140px;border-radius:20px;margin-bottom:16px"><div class="skeleton" style="width:60%;height:18px;margin:0 0 10px 12px"></div><div class="skeleton" style="width:40%;height:14px;margin:0 0 8px 12px"></div><div class="skeleton" style="width:75%;height:12px;margin-left:12px"></div></div>`,stats:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px"><div class="skeleton" style="height:100px;border-radius:16px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div></div>`,list:`<div class="skeleton" style="height:60px;border-radius:12px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:12px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:12px"></div>`,quote:`<div class="skeleton" style="height:50px;border-radius:12px;margin-bottom:16px"></div>`,schedule:`<div class="skeleton" style="height:100px;border-radius:16px;margin-bottom:12px"></div><div class="skeleton" style="height:100px;border-radius:16px;margin-bottom:12px"></div><div class="skeleton" style="height:100px;border-radius:16px"></div>`},showDashboard(){let e=document.getElementById(`dashboard`);if(!e)return;let t=e.querySelector(`#dynamic-next-class`),n=e.querySelector(`#activity-feed-list`),r=e.querySelector(`#premium-stats-grid`),i=e.querySelector(`.daily-motivation`);t&&(t.dataset.o=t.innerHTML,t.innerHTML=this.tpl.hero),i&&(i.dataset.o=i.innerHTML,i.innerHTML=this.tpl.quote),n&&(n.dataset.o=n.innerHTML,n.innerHTML=this.tpl.list),r&&(r.dataset.o=r.innerHTML,r.innerHTML=this.tpl.stats)},hideDashboard(){let e=document.getElementById(`dashboard`);e&&[`#dynamic-next-class`,`#activity-feed-list`,`#premium-stats-grid`,`.daily-motivation`].forEach(t=>{let n=e.querySelector(t);n&&n.dataset.o&&(n.innerHTML=n.dataset.o)})},showSchedule(){let e=document.querySelector(`.class-timeline`);e&&(e.dataset.o=e.innerHTML,e.innerHTML=this.tpl.schedule)},hideSchedule(){let e=document.querySelector(`.class-timeline`);e&&e.dataset.o&&(e.innerHTML=e.dataset.o)},init(){},showFor(e){e===`schedule`?this.showSchedule():e===`dashboard`&&this.showDashboard()},hideAll(){this.hideSchedule(),this.hideDashboard()}},qe={init(){this.enhanceChips(),this.enhanceFilters(),this.addNavArrows()},enhanceChips(){document.querySelectorAll(`.date-chip`).forEach(e=>{e.addEventListener(`click`,function(){document.querySelectorAll(`.date-chip`).forEach(e=>e.classList.remove(`active`)),this.classList.add(`active`)})})},enhanceFilters(){document.querySelectorAll(`.filter-tag`).forEach(e=>{e.addEventListener(`click`,function(){document.querySelectorAll(`.filter-tag`).forEach(e=>e.classList.remove(`active`)),this.classList.add(`active`);let e=this.textContent.trim();document.querySelectorAll(`.class-card-premium, .class-card`).forEach((t,n)=>{let r=e===`Todas`||(t.dataset.type||``).includes(e);t.style.display=r?``:`none`,r&&(t.style.animation=`fadeSlideUp .4s ease ${n*.05}s both`)})})})},addNavArrows(){let e=document.querySelector(`.date-carousel-premium`);if(!e||e.parentNode.querySelector(`.carousel-nav-btn`))return;let t=e.parentNode,n=document.createElement(`button`);n.className=`carousel-nav-btn carousel-prev`,n.innerHTML=`<i data-lucide="chevron-left"></i>`,n.setAttribute(`aria-label`,`Anterior`);let r=document.createElement(`button`);r.className=`carousel-nav-btn carousel-next`,r.innerHTML=`<i data-lucide="chevron-right"></i>`,r.setAttribute(`aria-label`,`Siguiente`),n.onclick=()=>e.scrollBy({left:-80,behavior:`smooth`}),r.onclick=()=>e.scrollBy({left:80,behavior:`smooth`}),t.insertBefore(n,e),t.insertBefore(r,e.nextSibling),window.lucide&&window.lucide.createIcons()},animateEntry(){document.querySelectorAll(`.class-card-premium, .class-card`).forEach((e,t)=>{e.style.opacity=`0`,e.style.transform=`translateY(20px)`,setTimeout(()=>{e.style.transition=`all .4s cubic-bezier(.34,1.56,.64,1)`,e.style.opacity=`1`,e.style.transform=`translateY(0)`},t*80)})}};console.log(`[INIT] Amaru App Logic Loaded - V1.4.6 (Robust Login & Background Load)`);var $={get currentUser(){return window.appState?.user||null}};window.auth=$,document.addEventListener(`DOMContentLoaded`,()=>{window.buyDailyPass=()=>{document.getElementById(`upsell-modal`).classList.add(`hidden`),document.getElementById(`pay-concept`).value=`Pase Diario / Clase Extra`,document.getElementById(`pay-amount`).value=`5000`,document.getElementById(`payment-modal`).classList.add(`active`)},window.upgradePlan=()=>{document.getElementById(`upsell-modal`).classList.add(`hidden`),document.querySelectorAll(`.nav-item`).forEach(e=>e.classList.remove(`active`)),document.querySelectorAll(`.screen`).forEach(e=>e.classList.remove(`active`)),document.getElementById(`membership-selection-screen`).classList.remove(`hidden`),document.getElementById(`membership-selection-screen`).classList.add(`active`),document.getElementById(`app-container`).classList.add(`hidden`)},lucide.createIcons(),window.onerror=(e,t,n)=>{showToast(`Error: ${e}`,`#ef4444`),console.error(`Critical Error:`,e,`at`,t,`:`,n)};let e=document.getElementById(`btn-apply-promo`);e&&(e.onclick=async()=>{let e=document.getElementById(`promo-code-input`).value.trim().toUpperCase(),t=document.getElementById(`promo-code-message`);if(!e){t.style.display=`block`,t.style.color=`#ef4444`,t.innerText=`Ingresa un código.`;return}try{showToast(`Validando código...`);let{data:n,error:r}=await window.supabase.from(`discounts`).select(`*`).eq(`code`,e).maybeSingle();if(r)throw Error(`Error consultando código`);if(n){if(n.expiresAt){let e=new Date(n.expiresAt);if(e.setDate(e.getDate()+1),e<new Date)throw Error(`Este código ha expirado`)}u.activePromo=n,t.style.display=`block`,t.style.color=`#22c55e`,t.innerText=`¡Código '${n.code}' aplicado! ${n.percent}% de descuento.`,typeof G==`function`&&G(),showToast(`Descuento del ${n.percent}% aplicado ✨`,`#22c55e`)}else throw Error(`Código no válido`)}catch{u.activePromo=null,t.style.display=`block`,t.style.color=`#ef4444`,t.innerText=`Código inválido o expirado.`,typeof G==`function`&&G()}});let t=document.createElement(`div`);t.id=`toast-stack-container`,t.style.cssText=`
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
        `,r.innerHTML=`<span>${e}</span>`,t.appendChild(r),requestAnimationFrame(()=>{r.style.transform=`translateX(0)`}),setTimeout(()=>{r.style.transform=`translateX(120%)`,r.style.opacity=`0`,setTimeout(()=>r.remove(),500)},4e3)},window.showLoading=(e=`Cargando...`)=>{typeof Swal<`u`&&Swal.fire({title:e,allowOutsideClick:!1,background:`#1f1f2e`,color:`#fff`,didOpen:()=>{Swal.showLoading();let e=Swal.getPopup().querySelector(`.swal2-loader`);e&&(e.style.borderColor=`var(--accent-cyan, #00f0ff) transparent var(--accent-cyan, #00f0ff) transparent`)}})},window.hideLoading=()=>{typeof Swal<`u`&&Swal.close()};let n=new URLSearchParams(window.location.search);n.get(`payment`)===`success`?(showToast(`¡Pago procesado con éxito! Bienvenido 🥋`,`#22c55e`),window.history.replaceState({},document.title,window.location.pathname)):n.get(`payment`)===`failure`&&(showToast(`El pago no pudo completarse. Intenta de nuevo. ❌`,`#ef4444`),window.history.replaceState({},document.title,window.location.pathname)),Object.assign(u,{attendance:0,attendanceGoal:4,membershipLimit:2,reservations:[],tournaments:[],classes:[],plans:[],isAdminMode:localStorage.getItem(`isAdminMode`)===`true`,activeFilter:`Todas`,selectedDate:new Date().toISOString().split(`T`)[0],role:`athlete`,level:0,xp:0,notifications:[],membershipExpiry:`2026-02-28`,attendanceHistoryCount:0,surchargePct:30,unsubscribeReservations:null,activePromo:null,proRataPreference:null}),window.appState=u;let r=[`El único entrenamiento malo es el que no sucedió.`,`No entrenas para ser mejor que otros, entrenas para que tu 'yo' de ayer no pueda alcanzarte.`,`La disciplina es el puente entre la intención y el cinturón negro.`,`El sudor es la tinta con la que escribes tu propia historia de superación.`,`En el dojo, el ego es el primer oponente que debes derribar antes de saludar al maestro.`,`La mente domina, el cuerpo obedece; si la mente no se rinde, el cuerpo es invencible.`,`La calma en el combate no nace de la falta de miedo, sino del exceso de preparación.`,`Caer siete veces y levantarse ocho no es solo una técnica de Jiu Jitsu/Judo/Wrestling, es una filosofía de vida.`,`El dolor del entrenamiento es temporal, pero el orgullo de la victoria sobre ti mismo es eterno.`,`No busques una vida fácil, busca la fortaleza mental para superar una difícil.`,`Tu mayor rival no está frente a ti con guantes, está dentro de ti pidiendo que te detengas. No lo escuches.`],i=()=>{let e=document.getElementById(`motivational-quote`);e&&(e.innerText=`"${r[Math.floor(Math.random()*r.length)]}"`)},m=()=>{let e=document.getElementById(`nav-admin`),t=document.getElementById(`btn-back-admin`),n=document.getElementById(`btn-dashboard-back-admin`);u.role===`admin`?u.isAdminMode?(e&&e.classList.remove(`hidden`),t&&t.classList.remove(`hidden`),n&&n.classList.remove(`hidden`)):(e&&e.classList.add(`hidden`),t&&t.classList.remove(`hidden`),n&&n.classList.remove(`hidden`)):(e&&e.classList.add(`hidden`),t&&t.classList.add(`hidden`),n&&n.classList.add(`hidden`))},h=e=>{`${e}`,u.isAdminMode=e,localStorage.setItem(`isAdminMode`,e),m(),e?(b(`admin-panel`),showToast(`Modo Administrador Activo 🛡️`,`#ef4444`)):(b(`dashboard`),showToast(`Modo Usuario Activo 👤`))};typeof MercadoPago<`u`&&new MercadoPago(`APP_USR-126c732c-4185-4911-82a0-e7452c2f1243`,{locale:`es-CL`});let g={async createPreference(e){console.log(`Creando Preferencia de Mercado Pago para:`,e.name),showToast(`Conectando con Mercado Pago... 💳`,`#22c55e`);let t=$.currentUser;if(!t)return showToast(`Debes iniciar sesión`,`#ef4444`);try{let{data:n,error:r}=await window.supabase.functions.invoke(`create-mp-preference`,{body:{plan:e,userId:t.uid,userEmail:t.email}});if(r)throw Error(`Error en el servidor al generar el pago: `+r.message);if(u.activePromo&&await window.supabase.from(`profiles`).update({active_promo:u.activePromo.code}).eq(`id`,t.uid),n&&n.init_point)showToast(`Redirigiendo a entorno seguro... 🔒`,`#22c55e`),window.location.href=n.init_point;else throw Error(`No se pudo obtener el link de pago`)}catch(e){console.error(`Payment creation error:`,e),showToast(`Fallo al conectar con la pasarela de pagos ❌`,`#ef4444`)}}},_=document.querySelectorAll(`.nav-item`),v=document.querySelectorAll(`.screen`),y=e=>{e&&(e.classList.remove(`screen-appear`),e.offsetWidth,e.classList.add(`screen-appear`))},b=e=>{`${e}`,_.forEach(t=>{t.getAttribute(`data-screen`)===e?t.classList.add(`active`):t.classList.remove(`active`)}),v.forEach(e=>{e.classList.remove(`active`),e.classList.remove(`screen-appear`)});let t=document.getElementById(e);t&&(t.classList.add(`active`),y(t));let n=document.getElementById(`bottom-nav`);n&&(n.style.transform=e===`dashboard`?`translateY(100%)`:`translateY(0)`,n.style.transition=`transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)`),e===`dashboard`&&(F(),I(),R(),i(),V(),H(),de()),e===`schedule`&&Z(),e===`tournaments`&&Q(),e===`notifications`&&W(),e===`profile`&&(S(),me())},x=e=>{if(u.attendanceHistoryCount=e.length,!e||e.length===0){u.currentMonthAttendance=0,u.currentStreak=0;return}let t=new Date,n=t.getMonth(),r=t.getFullYear();u.currentMonthAttendance=e.filter(e=>{let t=new Date(e.attended_at);return t.getMonth()===n&&t.getFullYear()===r}).length;let i=[...new Set(e.map(e=>new Date(e.attended_at).toISOString().split(`T`)[0]))].sort().reverse(),a=0,o=new Date,s=o.toISOString().split(`T`)[0];if(i.includes(s))a++,o.setDate(o.getDate()-1);else{let e=new Date;e.setDate(e.getDate()-1);let t=e.toISOString().split(`T`)[0];i.includes(t)&&(a++,o.setDate(o.getDate()-2))}if(a>0)for(;;){let e=o.toISOString().split(`T`)[0];if(i.includes(e))a++,o.setDate(o.getDate()-1);else break}u.currentStreak=a},S=async()=>{let e=$.currentUser;if(e)try{let t=await o.getAttendance(e.uid);x(t);let n=new Date,r=[0,0,0,0];t.forEach(e=>{let t=new Date(e.attended_at),i=Math.floor((n-t)/(1e3*60*60*24)),a=Math.floor(i/7);a>=0&&a<4&&r[3-a]++}),z(),N(r)}catch(e){console.error(`Error updating profile stats:`,e)}},C=0,w=null;_.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-screen`);if(u.role===`admin`)if(t===`dashboard`){if(C++,`${C}`,clearTimeout(w),C>=3){h(!0),C=0;return}w=setTimeout(()=>{C=0},1e3)}else C=0;if(t===`admin-panel`)if(u.role===`admin`)h(!0);else{showToast(`Acceso restringido 🔒`,`#ef4444`);return}b(t)})});let T=!1,E=null,D=!1,O=!1,ee=(e=`CARGANDO DATOS...`,t=!1,n=``)=>{let r=document.getElementById(`auth-loading-overlay`);r||(r=document.createElement(`div`),r.id=`auth-loading-overlay`,r.style.cssText=`
                position: fixed; inset: 0; z-index: 9999;
                background: rgba(13,13,18,0.95); backdrop-filter: blur(20px);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                padding: 20px; transition: opacity 0.4s ease;
            `,document.body.appendChild(r)),r.innerHTML=`
            <div style="display:flex; flex-direction:column; align-items:center; max-width: 320px; width: 100%;">
                <div style="width: 60px; height: 60px; border-radius: 20px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: pulseIcon 2s infinite;">
                    <i data-lucide="loader-2" style="width: 28px; color: var(--accent-purple); animation: spin 1s linear infinite;"></i>
                </div>
                <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 700; letter-spacing: 1px; text-align: center; margin-bottom: 8px;">${e}</p>
                ${n?`<p style="color: #ef4444; font-size: 0.75rem; text-align: center; opacity: 0.8; margin-bottom: 12px;">${n}</p>`:``}
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                    <div style="height: 100%; background: linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); border-radius: 10px; animation: loadBar 1.5s infinite ease-in-out; width: 60%;"></div>
                </div>
                ${t?`<button id="btn-auth-retry" style="padding: 10px 24px; background: rgba(139,92,246,0.2); border: 1px solid var(--accent-purple); color: white; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: all 0.3s; margin-bottom: 10px;">🔄 Reintentar</button>`:``}
                <button id="btn-auth-skip" style="padding: 8px 20px; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-gray); border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.7rem; transition: all 0.3s;">Saltar carga →</button>
                <style>
                @keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(150%); } }
                @keyframes pulseIcon { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                </style>
            </div>`,r.style.opacity=`1`,r.style.pointerEvents=`auto`;let i=document.getElementById(`btn-auth-retry`);i&&(i.onmouseover=()=>{i.style.background=`var(--accent-purple)`},i.onmouseout=()=>{i.style.background=`rgba(139,92,246,0.2)`},i.onclick=()=>{window.supabase.auth.getSession().then(({data:e})=>{M(e.session)})});let a=document.getElementById(`btn-auth-skip`);a&&(a.onmouseover=()=>{a.style.borderColor=`rgba(255,255,255,0.3)`,a.style.color=`white`},a.onmouseout=()=>{a.style.borderColor=`rgba(255,255,255,0.1)`,a.style.color=`var(--text-gray)`},a.onclick=()=>{k(),showToast(`Carga omitida. Algunos datos pueden no estar disponibles.`,`#eab308`)}),window.lucide&&window.lucide.createIcons()},k=()=>{let e=document.getElementById(`auth-loading-overlay`);e&&(e.style.opacity=`0`,e.style.pointerEvents=`none`,setTimeout(()=>{e.remove()},400))},A=(e,t)=>{u._channels&&u._channels.forEach(e=>{try{window.supabase.removeChannel(e)}catch{}}),u._channels=[];let n=document.getElementById(`user-combat-style`),r=window.supabase.channel(`profile:${e.uid}`).on(`postgres_changes`,{event:`UPDATE`,filter:`id=eq.${e.uid}`,schema:`public`,table:`profiles`},e=>{let r=e.new;Object.assign(t,r),u.level=r.level,u.xp=r.xp,u.membershipLimit=r.membership_limit,u.membershipStatus=r.membership_status||`inactive`,n&&r.combat_style&&(n.value=r.combat_style),z(),m()}).subscribe();u._channels.push(r);let i=window.supabase.channel(`global-data`).on(`postgres_changes`,{event:`*`,schema:`public`,table:`classes`},async()=>{try{u.classes=await o.getClasses(),Z()}catch(e){console.error(`Realtime classes error:`,e)}}).on(`postgres_changes`,{event:`*`,schema:`public`,table:`membership_plans`},async()=>{try{u.plans=await o.getPlans()}catch(e){console.error(`Realtime plans error:`,e)}}).on(`postgres_changes`,{event:`*`,schema:`public`,table:`tournaments`,filter:`user_id=eq.${e.uid}`},async()=>{try{u.tournaments=await o.getTournaments(e.uid),Q(),R()}catch(e){console.error(`Realtime tournaments error:`,e)}}).subscribe();if(u._channels.push(i),u.role===`admin`){let e=window.supabase.channel(`admin-payments`).on(`postgres_changes`,{event:`*`,schema:`public`,table:`payments`},async()=>{let e=document.querySelector(`#admin-content-area h3`)?.innerText;e&&(e.includes(`Validación de Pagos`)||e.includes(`Pagos`))&&ne(),showToast(`¡Actualización de pago detectada! 💳`,`#22c55e`)}).subscribe();u._channels.push(e)}u.unsubscribeReservations&&u.unsubscribeReservations();let a=window.supabase.channel(`reservations:${e.uid}`).on(`postgres_changes`,{event:`*`,filter:`user_id=eq.${e.uid}`,schema:`public`,table:`reservations`},async()=>{try{u.reservations=(await o.getReservations(u.selectedDate)).filter(t=>t.user_id===e.uid).map(e=>e.class_id),u.allUserReservations=await o.getUserReservations(e.uid),u.xp=(t.xp||0)+(u.allUserReservations?.length||0)*50,z(),Z(),F()}catch(e){console.error(`Realtime reservations error:`,e)}}).subscribe();u.unsubscribeReservations=()=>{window.supabase.removeChannel(a)},u._channels.push(a)},te=async(e,t)=>{try{x(await d(o.getAttendance(e.uid),8e3,`Asistencia`)||[]),F()}catch(e){console.warn(`[Background] Error loading attendance:`,e.message)}try{u.role===`admin`?u.notifications=await d(o.getNotifications(),8e3,`Notificaciones admin`):u.notifications=(await d(o.getNotifications(),8e3,`Notificaciones`)).filter(e=>e.is_active!==!1)}catch(e){console.warn(`[Background] Error loading notifications:`,e.message)}try{u.userNotifications=await d(o.getUserNotifications(e.uid),8e3,`Notificaciones personales`),U()}catch(e){console.warn(`[Background] Error loading user notifications:`,e.message)}try{let[t,n,r,i]=await Promise.all([d(o.getClasses(),8e3,`Clases`),d(o.getPlans(),8e3,`Planes`),d(o.getTournaments(e.uid),8e3,`Torneos`),d(o.getUserReservations(e.uid),8e3,`Reservas`)]);t&&(u.classes=t),n&&(u.plans=n,window.renderPaymentTabs&&window.renderPaymentTabs()),r&&(u.tournaments=r),i&&(u.allUserReservations=i,u.xp=(u.xp||0)+i.length*50),Z(),Q(),I(),F()}catch(e){console.warn(`[Background] Error fetching initial data:`,e.message),showToast(`Algunos datos no cargaron. Intenta refrescar. 🔄`,`#eab308`)}try{u.reservations=(await d(o.getReservations(u.selectedDate),8e3,`Reservas iniciales`)).filter(t=>t.user_id===e.uid).map(e=>e.class_id),Z(),F()}catch(e){console.warn(`[Background] Error loading initial reservations:`,e.message)}A(e,t)},j=null,M=async e=>{if(console.log(`[Auth] handleAuthSession called. Session exists:`,!!e,`User exists:`,!!e?.user),O){console.log(`[Auth] handleAuthSession already running, skipping concurrent call`);return}O=!0;try{k(),j&&=(clearTimeout(j),null);let t=e?.user,n=null;t&&(n={...t,uid:t.id,email:t.email});let r=document.getElementById(`auth-screen`),i=document.getElementById(`app-container`);if(!n){console.log(`[Auth] No user in session, showing auth screen`),r.classList.remove(`hidden`),y(r),i.classList.add(`hidden`),T=!1,E=null,u.user=null;return}if(E===n.uid&&u.user&&!D){console.log(`[Auth] Same user already logged in with successful profile load, skipping duplicate`);return}D=!0,u.user=n,E=n.uid,console.log(`[Auth] User found:`,n.email,`- starting profile load...`),ee(`CARGANDO DATOS...`),j=setTimeout(()=>{console.warn(`[Auth] Safety timeout triggered — forcing overlay hide`),k(),showToast(`Carga completada (timeout de seguridad)`,`#eab308`)},4e4);let a=null;try{if(a=await f(()=>d(o.getProfile(n.uid),1e4,`Perfil`),{maxRetries:2,delayMs:1500,context:`Cargar perfil`}),a||=(await f(()=>d(o.createProfile(n),1e4,`Crear perfil`),{maxRetries:2,delayMs:1500,context:`Crear perfil`}),await d(o.getProfile(n.uid),1e4,`Perfil recién creado`)),sessionStorage.getItem(`mp_payment_success`)===`true`){sessionStorage.removeItem(`mp_payment_success`);try{let e=(await o.getPayments(n.uid)).find(e=>e.status===`pending`);if(e){await o.updatePaymentStatus(e.id,`approved`,`mercadopago`),showToast(`Pago validado automáticamente ✨`,`#22c55e`);let t=new Date;t.setMonth(t.getMonth()+1),await o.updateProfile(n.uid,{membership_status:`active`,membership_expiry:t.toISOString().split(`T`)[0]}),a=await o.getProfile(n.uid)}}catch(e){console.error(`Error confirmando pago:`,e)}}u.role=a.role||`athlete`,u.isAdminMode=u.role===`admin`,u.level=a.level||0,u.xp=a.xp||0,u.membershipLimit=a.membership_limit||2,u.membershipStatus=a.membership_status||`inactive`,u.planTheme=a.membership_plans?.theme||`bronze`,u.plan=a.membership_plan_id,u.photoURL=a.photo_url||`../images/icon-192.png`;let e=document.querySelector(`.greeting`);e&&(e.textContent=`¡Hola, ${a.full_name||n.displayName||`Atleta`}!`);let t=document.getElementById(`profile-plan-name`),s=document.getElementById(`profile-plan-status`),c=document.getElementById(`profile-plan-remaining`),l=document.getElementById(`profile-plan-progress`);if(t&&(t.textContent=a.membership_plans?.name||(a.membership_status===`active`?`PLAN ACTIVO`:`SIN PLAN`),a.membership_expiry)){let e=new Date(a.membership_expiry),t=new Date;if(e>t){s.textContent=`ACTIVO`,s.style.background=`#22c55e`;let n=Math.ceil((e-t)/(1e3*60*60*24));c.textContent=`${n} Días restantes`;let r=Math.max(0,Math.min(100,(30-n)/30*100));l&&(l.style.width=`${r}%`)}else s.textContent=`INACTIVO`,s.style.background=`#ef4444`,c.textContent=`Renovación requerida`}z();let p=document.getElementById(`user-combat-style`);p&&(p.value=a.combat_style||`striker`,p.onchange=async e=>{let t=e.target.value;window.showLoading(`Guardando estilo...`);try{await o.updateProfile(n.uid,{combat_style:t}),window.hideLoading(),showToast(`¡Estilo actualizado!`,`#22c55e`)}catch(e){console.error(e),showToast(`Error al guardar estilo`,`#ef4444`)}});let g=document.getElementById(`nav-admin`),_=document.querySelectorAll(`.nav-item:not(#nav-admin)`);u.role===`admin`?_.forEach(e=>e.classList.remove(`hidden`)):g&&g.classList.add(`hidden`),m(),ce();let v=document.getElementById(`btn-back-admin`),x=document.getElementById(`btn-dashboard-back-admin`);if(v&&(v.onclick=()=>h(!0)),x&&(x.onclick=()=>h(!0)),D=!1,k(),j&&=(clearTimeout(j),null),u.role!==`admin`&&a.membership_status!==`active`){i.classList.add(`hidden`);let e=new Date,t=`${e.getMonth()}-${e.getFullYear()}`,r=a.proRataMonthYear||``;a.proRataPreference&&r===t?u.proRataPreference=a.proRataPreference:a.proRataPreference&&(u.proRataPreference=null,typeof db<`u`&&db.collection&&db.collection(`users`).doc(n.uid).set({proRataPreference:null,proRataMonthYear:null,proRataSelectionDate:null,proRataExpiredInMonth:!0},{merge:!0}).catch(e=>console.error(`Error resetting data:`,e))),a.proRataExpiredInMonth&&(showToast(`⚠️ Tu opción proporcional anterior expiró al terminar el mes. Se ha restablecido a pago de mes completo.`,`#8b5cf6`),window.supabase.from(`profiles`).update({pro_rata_expired_in_month:null}).eq(`id`,n.uid).catch(e=>console.error(`Error clearing expiration flag:`,e))),G();let o=e.getDate();if(!u.proRataPreference&&o>=15){let r=document.getElementById(`pro-rata-info-screen`),i=document.getElementById(`membership-selection-screen`);r&&(r.classList.remove(`hidden`),y(r)),i&&i.classList.add(`hidden`);let a=async a=>{try{u.proRataPreference=a,typeof db<`u`&&db.collection&&await db.collection(`users`).doc(n.uid).set({proRataPreference:a,proRataMonthYear:t,proRataSelectionDate:e.toISOString()},{merge:!0}),G(),r&&r.classList.add(`hidden`),i&&(i.classList.remove(`hidden`),y(i))}catch(e){console.error(`Error saving preference:`,e),showToast(`Error al guardar preferencia`,`#ef4444`)}};document.getElementById(`btn-option-proportional`).onclick=()=>a(`proportional`),document.getElementById(`btn-option-full`).onclick=()=>a(`full`)}else{document.getElementById(`pro-rata-info-screen`).classList.add(`hidden`);let e=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),y(e))}}else{if(r.classList.add(`hidden`),i.classList.remove(`hidden`),window.location.hash===`#payments`)b(`profile`),document.getElementById(`payment-modal`)?.classList.add(`active`);else if(b(u.isAdminMode?`admin-panel`:`dashboard`),u.isAdminMode){let e=document.getElementById(`admin-content-area`);e&&(e.innerHTML=`<div class="p-20 text-center glass" style="border-radius: 12px; margin-top: 20px;">
                                <i data-lucide="shield-check" style="width: 48px; height: 48px; color: var(--accent-purple); margin-bottom: 10px;"></i>
                                <h3>Panel de Control</h3>
                                <p style="color: var(--text-gray); font-size: 0.9rem;">Selecciona una opción del menú superior para comenzar.</p>
                            </div>`,window.lucide&&window.lucide.createIcons())}te(n,a),pe(n.uid).catch(()=>{})}}catch(e){console.error(`[Auth] Critical error during login:`,e),ee(`Error al cargar`,!0,p(e)?`Parece que hay un problema de conexión. Verifica tu red e intenta de nuevo.`:e.message||`Error desconocido al iniciar sesión.`);return}let s=document.getElementById(`profile-user-name`),c=document.getElementById(`nav-user-name`),l=n.displayName||(u.role===`admin`?`Administrador`:`Atleta`);s&&(s.innerText=l),c&&(c.innerText=l);let g=document.getElementById(`profile-avatar`);g&&(g.src=u.photoURL||`../images/icon-192.png`)}finally{O=!1}};window.supabase.auth.onAuthStateChange(async(e,t)=>{if(e===`SIGNED_IN`){T=!0,await M(t);return}e===`INITIAL_SESSION`&&T||(e===`INITIAL_SESSION`&&(T=!0),await M(t))}),(async()=>{let e=0,t=null;for(;!window.supabase&&e<20;)console.log(`[Auth] Waiting for window.supabase to be ready...`),await new Promise(e=>setTimeout(e,500)),e++;if(!window.supabase){console.error(`[Auth] window.supabase never became available. Check supabase-config.js loading.`);return}e=0;let n=async()=>{try{let{data:e,error:t}=await window.supabase.auth.getSession();return t?(console.error(`[Auth] getSession error:`,t),!1):e.session&&!T?(console.log(`[Auth] Session found via getSession(), triggering handleAuthSession...`),T=!0,await M(e.session),!0):!1}catch(e){return console.error(`[Auth] Critical error calling getSession():`,e),!1}};await n()||(t=setInterval(async()=>{if(e++,T){clearInterval(t);return}if(await n()){clearInterval(t);return}if(e>=20){clearInterval(t),console.log(`[Auth] No active session found after polling.`);let e=document.getElementById(`auth-screen`),n=document.getElementById(`app-container`);e&&(e.classList.remove(`hidden`),y(e)),n&&n.classList.add(`hidden`)}},500))})(),l(b,G);try{a!==void 0&&a.init(),s!==void 0&&s.init(),c!==void 0&&c.init(),qe!==void 0&&qe.init(),console.log(`[INIT] All enhancement modules initialized`)}catch(e){console.error(`[INIT] Error initializing enhancement modules:`,e)}let re=document.getElementById(`btn-edit-avatar`),ie=document.getElementById(`btn-delete-avatar`),ae=document.getElementById(`avatar-input`);re&&ae&&(re.onclick=()=>ae.click(),ae.onchange=async e=>{let t=e.target.files[0];if(!t)return;let n=$.currentUser;if(n){showToast(`Subiendo imagen... 📸`);try{let e=await o.uploadAvatar(n.uid,t);await n.updateProfile({photoURL:e}),await o.updateProfile(n.uid,{photo_url:e});let r=document.getElementById(`profile-avatar`);r&&(r.src=e),showToast(`Foto de perfil actualizada ✨`,`#22c55e`)}catch(e){console.error(e),showToast(`Error al subir foto ❌`,`#ef4444`)}}}),ie&&(ie.onclick=async()=>{let e=$.currentUser;if(e){showToast(`Eliminando foto... 🗑️`);try{await e.updateProfile({photoURL:``}),await o.updateProfile(e.uid,{photo_url:null});let t=document.getElementById(`profile-avatar`);t&&(t.src=`../images/icon-192.png`),showToast(`Foto eliminada ✅`)}catch(e){console.error(e),showToast(`Error al eliminar ❌`,`#ef4444`)}}});let oe=document.getElementById(`btn-exit-admin-mode`);oe&&(oe.onclick=()=>h(!1));let se=null,N=(e=[0,0,0,0])=>{let t=document.getElementById(`attendanceChart`);if(!t)return;se&&se.destroy();let n=e.every(e=>e===0)?[0,0,0,0]:e;se=new Chart(t,{type:`line`,data:{labels:[`Sem 1`,`Sem 2`,`Sem 3`,`Sem 4`],datasets:[{label:`Clases`,data:n,borderColor:`#CBF2F0`,tension:.4,fill:!0,backgroundColor:`rgba(203, 242, 240, 0.1)`}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{y:{display:!1,beginAtZero:!0},x:{grid:{display:!1}}}}})},ce=()=>{let e=document.querySelector(`.date-carousel-premium`);if(!e)return;let t=[`DOM`,`LUN`,`MAR`,`MIÉ`,`JUE`,`VIE`,`SÁB`],n=new Date,r=``;for(let e=0;e<7;e++){let i=new Date;i.setDate(n.getDate()+e);let a=i.toISOString().split(`T`)[0],o=a===u.selectedDate;r+=`
                <div class="date-chip ${o?`active`:``}" data-date="${a}">
                    <span>${t[i.getDay()]}</span>
                    <p>${i.getDate()}</p>
                </div>
            `}e.innerHTML=r,e.querySelectorAll(`.date-chip`).forEach(e=>{e.onclick=async()=>{u.selectedDate=e.getAttribute(`data-date`),ce();let t=$.currentUser;t&&(u.reservations=(await o.getReservations(u.selectedDate)).filter(e=>e.user_id===t.uid).map(e=>e.class_id),Z())}})},P=!1;window.toggleReservation=async e=>{if(P)return;let t=$.currentUser;if(!t){showToast(`Inicia sesión 🔒`,`#ef4444`);return}let n=new Date,r=n.getFullYear()+`-`+String(n.getMonth()+1).padStart(2,`0`)+`-`+String(n.getDate()).padStart(2,`0`);if(u.role!==`admin`&&u.selectedDate!==r){showToast(`Solo puedes agendar clases para el día de hoy 📅`,`#ef4444`);return}let i=u.classes.find(t=>t.id===e);if(!i)return;let a=u.reservations.includes(e);P=!0;try{if(a){let n=new Date,r=(new Date(`${u.selectedDate}T${i.time}`)-n)/(1e3*60*60);if(u.role!==`admin`&&r<1){showToast(`No puedes cancelar a menos de 1 hr ⏳`,`#ef4444`);return}await o.deleteReservation(t.uid,e,u.selectedDate),u.reservations=u.reservations.filter(t=>t!==e),u.allUserReservations&&=u.allUserReservations.filter(t=>!(t.class_id===e&&t.reservation_date===u.selectedDate)),setTimeout(()=>{Z(),F(),I()},0),showToast(`Reserva cancelada 🗓️`,`#71717A`)}else{if(u.membershipStatus!==`active`&&u.role!==`admin`){showToast(`Membresía inactiva. ¡Actívala ahora! 🔒`,`#f59e0b`),b(`membership`);return}if(u.plan){let e=u.plans.find(e=>e.name===u.plan||e.id===u.plan);if(e&&e.days&&e.days.length>0){let t=new Date(u.selectedDate+`T12:00:00`).getDay();if(!e.days.includes(t))return showToast(`Plan no válido para este día 🗓️`,`#ef4444`)}let t=u.selectedDate.substring(0,7),n=u.allUserReservations?u.allUserReservations.filter(e=>e.reservation_date&&e.reservation_date.startsWith(t)):[],r=999;if(e&&(r=e.monthly||999),n.length>=r){let e=document.getElementById(`upsell-modal`);return e&&(e.classList.remove(`hidden`),lucide.createIcons()),P=!1,showToast(`Límite mensual agotado ⚠️`,`#eab308`)}}if(u.reservations.length>=u.membershipLimit){let e=document.getElementById(`upsell-modal`);return e&&(e.classList.remove(`hidden`),lucide.createIcons()),P=!1,showToast(`Límite diario alcanzado ⚠️`,`#eab308`)}await o.createReservation(t.uid,e,i.name,u.selectedDate),u.reservations.includes(e)||u.reservations.push(e),u.allUserReservations&&u.allUserReservations.push({user_id:t.uid,class_id:e,class_name:i.name,reservation_date:u.selectedDate}),setTimeout(()=>{Z(),F(),I()},0);let n=10,r=(i.type||``).toLowerCase();(r.includes(`gi`)||r.includes(`no-gi`))&&(n=15),r.includes(`open`)&&(n=5),await o.updateProfile(t.uid,{xp:(u.xp||0)+n}),u.xp=(u.xp||0)+n,z(),showToast(`¡Clase reservada con éxito! 🥋`,`#22c55e`)}}catch(e){console.error(`Supabase Reservation Error:`,e),showToast(`Error procesando reserva ❌`,`#ef4444`)}finally{P=!1}},window.renderSchedule=Z,window.renderTournaments=Q;let F=()=>{let e=document.getElementById(`attendance-circle`),t=document.getElementById(`attendance-percent`),n=document.getElementById(`completed-classes-count`),r=document.getElementById(`user-streak-text`);if(r&&(r.innerText=`${u.currentStreak||0} Días`),e&&t){let r=u.membershipLimit||5;r>10&&(r=5);let i=r*4,a=u.currentMonthAttendance||0,o=Math.min(100,Math.round(a/i*100)),s=`var(--amaru-gold)`;s=o<50?`#ef4444`:o<100?`#eab308`:`#22c55e`,e.style.stroke=s;let c=188.5-o/100*188.5;if(e.style.strokeDashoffset=c,t.innerText=`${o}%`,n){let e=a,t=0,r=e=>{n.innerHTML=`${e} <span style="font-size: 1rem; color: var(--text-gray); font-weight: 600;">/ ${i}</span>`};if(e>0){let n=Math.max(1,Math.ceil(e/(1500/30))),i=setInterval(()=>{if(t+=n,t>=e){if(t=e,clearInterval(i),r(t),o>=100&&$.currentUser){let e=`goal_reward_${new Date().getFullYear()}_${new Date().getMonth()}_${$.currentUser.uid}`;localStorage.getItem(e)||le(e)}}else r(t)},30)}else r(0)}}},le=async e=>{typeof confetti==`function`&&confetti({particleCount:150,spread:80,origin:{y:.6},colors:[`#D4AF37`,`#ffffff`,`#22c55e`]}),showToast(`¡Meta Mensual Alcanzada! +500 XP Extra 🏆`,`var(--amaru-gold)`);try{let t=$.currentUser;t&&(u.xp=(u.xp||0)+500,await o.updateProfile(t.uid,{xp:u.xp}),z(),localStorage.setItem(e,`true`))}catch(e){console.error(`Error giving month reward`,e)}},I=()=>{let e=document.getElementById(`dynamic-next-class`);if(!e)return;let t=new Date,n=t.toISOString().split(`T`)[0],r=t.getHours()*60+t.getMinutes();t.getDay();let i=null,a=!1;if(u.allUserReservations&&u.allUserReservations.length>0){let e=u.allUserReservations.filter(e=>e.reservation_date>=n).map(e=>{let t=u.classes.find(t=>t.id===e.class_id);if(!t)return null;let[n,r]=t.time.split(`:`).map(Number);return{...e,classData:t,totalMinutes:n*60+r}}).filter(e=>e!==null).sort((e,t)=>e.reservation_date===t.reservation_date?e.totalMinutes-t.totalMinutes:e.reservation_date.localeCompare(t.reservation_date)).find(e=>e.reservation_date>n?!0:e.totalMinutes>r+10);e&&(i=e.classData,a=!0)}if(!i&&u.classes.length>0)for(let e=0;e<7;e++){let n=new Date;n.setDate(t.getDate()+e);let a=n.getDay(),o=u.classes.filter(e=>{let t=e.days;if(typeof t==`string`)try{t=JSON.parse(t)}catch{}return Array.isArray(t)&&t.includes(a)}).sort((e,t)=>{let[n,r]=e.time.split(`:`).map(Number),[i,a]=t.time.split(`:`).map(Number);return n*60+r-(i*60+a)});if(e===0){let e=o.find(e=>{let[t,n]=e.time.split(`:`).map(Number);return t*60+n>r});if(e){i=e;break}}else if(o.length>0){i=o[0];break}}if(i){if(e.classList.remove(`smoke-purple`,`smoke-cyan`,`smoke-gold`,`smoke-crimson`),i.theme&&e.classList.add(i.theme),e.innerHTML=`
                <div class="card-overlay" style="backdrop-filter: blur(12px); background: linear-gradient(90deg, rgba(8, 8, 10, 0.95) 0%, rgba(8, 8, 10, 0.45) 100%);"></div>
                <div class="hero-content">
                    <span class="tag" style="background: rgba(0,0,0,0.6); color: white; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(4px); font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        ${a?`TU PRÓXIMA CITA`:`PRÓXIMA CLASE`}
                    </span>
                    <h2 style="color: white; font-weight: 900; margin: 10px 0 5px; font-size: 1.8rem; text-shadow: 0 4px 10px rgba(0,0,0,0.5);">${i.name}</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem; font-weight: 500;"><i data-lucide="clock" style="width:14px; vertical-align: middle; margin-right: 4px;"></i> ${i.time} • Coach ${i.coach}</p>
                    <div style="display:flex; gap:12px; margin-top:20px;">
                        ${a?`<button class="btn-primary" id="btn-checkin-dash" style="background:white; color:black; padding: 12px 24px; font-size:0.8rem; border-radius:100px; border:none; font-weight:900; box-shadow: 0 4px 15px rgba(255,255,255,0.2);">MARCAR ASISTENCIA (+25 XP)</button>`:``}
                        <button class="btn-glass" id="btn-dashboard-go-schedule" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 12px 24px; font-size: 0.8rem; border-radius: 100px;">VER AGENDA</button>
                    </div>
                </div>
            `,lucide.createIcons(),a){let e=document.getElementById(`btn-checkin-dash`);e&&(e.onclick=()=>L(i))}document.getElementById(`btn-dashboard-go-schedule`).onclick=()=>{let e=document.querySelector(`[data-screen="schedule"]`);e&&e.click()}}else e.innerHTML=`<div class="p-30 text-center opacity-50">No hay clases programadas próximamente</div>`},L=async e=>{let t=$.currentUser;if(t){showToast(`Registrando asistencia... 🥋`);try{await o.logAttendance(t.uid,e.id,e.name);let n=(u.xp||0)+25;await o.updateProfile(t.uid,{xp:n}),u.xp=n,u.attendanceHistoryCount++,showToast(`¡Asistencia confirmada! +25 XP 🔥`,`#22c55e`),z(),I(),F()}catch(e){console.error(`Check-in error:`,e),showToast(`Ya registraste asistencia hoy o hubo un error 🛡️`,`#eab308`)}}},R=()=>{let e=document.getElementById(`motivation-container`);if(!e)return;e.innerHTML=``;let t=u.tournaments[0];if(t){let n=new Date(t.date)-new Date,r=Math.floor(n/(1e3*60*60*24));if(r>0){let n=document.createElement(`div`);n.className=`glass-premium tournament-countdown-card`,n.style.margin=`0 20px 20px`,n.style.position=`relative`,n.style.overflow=`hidden`,n.innerHTML=`
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
                `,e.prepend(n)}}lucide.createIcons()},z=()=>{let e=document.getElementById(`user-rank-status`),t=u.planTheme===`gold`?100:u.planTheme===`silver`?30:10,n=Math.floor(u.xp||0),r=Math.min(Math.floor(n/100),t),i=Math.min(n%100/100*100,100);r>=t&&(i=100);let a=r<10?`Nomad`:r<30?`Warrior`:r<50?`Elite`:`Legend`;u.level=r;let o={Nomad:`#fbbf24`,Warrior:`#f97316`,Elite:`#a855f7`,Legend:`#22c55e`}[a]||`#fbbf24`;e&&(e.innerText=u.role===`admin`?`Admin`:a,e.style.color=u.role===`admin`?`#ef4444`:o,e.style.background=u.role===`admin`?`rgba(239,68,68,0.15)`:`${o}22`,e.style.borderColor=u.role===`admin`?`rgba(239,68,68,0.3)`:`${o}44`);let s=document.getElementById(`profile-user-level`);s&&(s.innerText=u.role===`admin`?`Administrador`:`Nivel ${r}`);let c=document.getElementById(`profile-xp-text`);c&&(c.innerText=`${n} / ${(r+1)*100} XP`);let l=document.getElementById(`profile-rank-bar`);l&&requestAnimationFrame(()=>{l.style.width=`${i}%`});let d=document.getElementById(`profile-plan-chip`);if(d){let e=u.membershipStatus===`active`||u.role===`admin`;d.innerText=e?`Activo`:`Inactivo`,d.style.background=e?`rgba(34,197,94,0.15)`:`rgba(239,68,68,0.15)`,d.style.color=e?`#22c55e`:`#ef4444`,d.style.borderColor=e?`rgba(34,197,94,0.3)`:`rgba(239,68,68,0.3)`}let f=document.getElementById(`prof-stat-classes`),p=document.getElementById(`prof-stat-streak`),m=document.getElementById(`prof-stat-xp`),h=document.getElementById(`prof-stat-reserv`);f&&(f.innerText=u.attendanceHistoryCount||0),p&&(p.innerText=u.currentStreak||0),m&&(m.innerText=n),h&&(h.innerText=u.allUserReservations?.length||0);let g=document.querySelector(`.rank-bar-fill`),_=document.querySelector(`.rank-info-text`);g&&(g.style.width=`${i}%`),_&&(_.innerHTML=`<span>${n} / ${t*100} XP Max</span><strong>${Math.floor(i)}% Lvl Up</strong>`);let v=document.querySelector(`#profile-user-level span`);v&&(v.innerText=u.role===`admin`?`MAX`:r);let y=document.querySelector(`.lvl-fill`),b=document.querySelector(`.level-indicator span`);y&&(y.style.width=u.role===`admin`?`100%`:`${i}%`),b&&(b.innerText=u.role===`admin`?`LVL MAX`:`NVL ${r}`),fe(),ue(r,n,t*100,i,a),B()},B=()=>{let e=document.getElementById(`profile-activity-timeline`);if(!e)return;let t=[];if(u.allUserReservations&&u.allUserReservations.length>0&&[...u.allUserReservations].sort((e,t)=>new Date(t.reservation_date)-new Date(e.reservation_date)).slice(0,5).forEach(e=>{let n=new Date(e.reservation_date),r=n.toLocaleDateString(`es-ES`,{weekday:`short`}),i=n.getDate();t.push({type:`reserva`,icon:`calendar-check`,color:`#22c55e`,title:`Reserva: ${e.class_name||`Clase`}`,desc:`${r.charAt(0).toUpperCase()+r.slice(1)} ${i}`,date:n})}),u.level>0&&t.push({type:`nivel`,icon:`zap`,color:`#fbbf24`,title:`¡Nivel ${u.level} alcanzado!`,desc:`Subiste de rango`,date:new Date}),t.sort((e,t)=>t.date-e.date),t.length===0){e.innerHTML=`<div style="padding: 20px; text-align: center; opacity: 0.4;"><p style="font-size: 0.75rem;">Sin actividad reciente</p></div>`;return}e.innerHTML=t.map((e,n)=>`
            <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; ${n<t.length-1?`border-bottom: 1px solid rgba(255,255,255,0.03);`:``}">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: ${e.color}15; border: 1px solid ${e.color}30; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                    <i data-lucide="${e.icon}" style="width: 14px; color: ${e.color};"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.8rem; font-weight: 700; color: white; margin: 0;">${e.title}</p>
                    <p style="font-size: 0.7rem; color: var(--text-gray); margin: 2px 0 0;">${e.desc}</p>
                </div>
            </div>
        `).join(``),window.lucide&&window.lucide.createIcons()},V=()=>{let e=$.currentUser;if(!e)return;let t=document.getElementById(`dash-avatar`);t&&(t.src=u.photoURL||`../images/icon-192.png`);let n=document.getElementById(`dash-name`);n&&(n.innerText=e.displayName||`Atleta`);let r=document.getElementById(`dash-plan-chip`);if(r){let e=u.membershipStatus===`active`||u.role===`admin`;r.innerText=e?`Activo`:`Inactivo`,r.style.background=e?`rgba(34,197,94,0.15)`:`rgba(239,68,68,0.15)`,r.style.color=e?`#22c55e`:`#ef4444`,r.style.borderColor=e?`rgba(34,197,94,0.3)`:`rgba(239,68,68,0.3)`}},H=()=>{document.querySelectorAll(`.quick-btn`).forEach(e=>{let t=e.getAttribute(`data-nav`),n=e.getAttribute(`data-action`);e.onmouseenter=()=>{e.style.background=`rgba(255,255,255,0.08)`,e.style.transform=`translateY(-2px)`},e.onmouseleave=()=>{e.style.background=`rgba(255,255,255,0.03)`,e.style.transform=`translateY(0)`},e.onclick=()=>{t&&(b(t),n===`reserve`&&t===`schedule`&&showToast(`Selecciona una clase para reservar 🥋`,`#22c55e`))}})},ue=(e,t,n,r,i)=>{let a=document.getElementById(`streak-weekly-dots`);if(a){let e=[`L`,`M`,`M`,`J`,`V`,`S`,`D`],t=new Date,n=t.getDay()===0?6:t.getDay()-1,r=new Date(t);r.setDate(t.getDate()-n),r.setHours(0,0,0,0);let i=new Date(r);i.setDate(r.getDate()+6),i.setHours(23,59,59,999);let o=u.currentStreak||0;a.innerHTML=e.map((e,t)=>{let r=t<=n&&t>=n-Math.min(o-1,n);return`<div style="width: 28px; height: 28px; border-radius: 50%; background: ${r?`rgba(34,197,94,0.2)`:`rgba(255,255,255,0.05)`}; border: ${r?`1px solid rgba(34,197,94,0.4)`:`1px solid rgba(255,255,255,0.08)`}; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; font-weight: 700; color: ${r?`#22c55e`:`var(--text-gray)`}; transition: all 0.3s;">${e}</div>`}).join(``)}let o=document.getElementById(`streak-count-label`);o&&(o.innerText=`${u.currentStreak||0} días seguidos`);let s=document.getElementById(`dash-xp-current`),c=document.getElementById(`dash-xp-target`),l=document.getElementById(`dash-xp-bar`),d=document.getElementById(`dash-xp-percent`);s&&(s.innerText=t),c&&(c.innerText=n),l&&requestAnimationFrame(()=>{l.style.width=`${r}%`}),d&&(d.innerText=`${Math.floor(r)}% para subir`);let f=document.getElementById(`dash-classes-count`),p=document.getElementById(`dash-classes-sparkline`);if(f&&(f.innerText=u.currentMonthAttendance||0),p){let e=[.3,.5,.4,.7];if(u.currentMonthAttendance>0){let t=Math.min(1,u.currentMonthAttendance*.2/5+.2),n=Math.min(1,u.currentMonthAttendance*.3/5+.2),r=Math.min(1,u.currentMonthAttendance*.25/5+.2),i=Math.min(1,u.currentMonthAttendance*.25/5+.2);e[0]=t,e[1]=n,e[2]=r,e[3]=i}p.innerHTML=e.map(e=>`
                <div style="width: 6px; background: linear-gradient(to top, var(--accent-cyan), var(--accent-purple)); border-radius: 2px; height: ${Math.round(e*100)}%; transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 0.7;"></div>
            `).join(``)}let m=document.getElementById(`dash-rank-name`),h=document.getElementById(`dash-rank-level`),g=document.querySelector(`#dash-rank-icon i`);if(m){m.innerText=i;let e={Nomad:`#fbbf24`,Warrior:`#f97316`,Elite:`#a855f7`,Legend:`#22c55e`};m.style.color=e[i]||`#fbbf24`}h&&(h.innerText=`Nivel ${e}`),g&&g.setAttribute(`data-lucide`,{Nomad:`shield`,Warrior:`sword`,Elite:`zap`,Legend:`crown`}[i]||`shield`)},de=()=>{let e=document.getElementById(`activity-feed-list`);if(!e)return;let t=[];if(u.allUserReservations&&u.allUserReservations.length>0&&[...u.allUserReservations].sort((e,t)=>new Date(t.reservation_date)-new Date(e.reservation_date)).slice(0,3).forEach(e=>{let n=new Date(e.reservation_date),r=Math.floor((new Date-n)/(1e3*60*60*24)),i=r===0?`Hoy`:r===1?`Ayer`:`Hace ${r} días`;t.push({icon:`calendar-check`,color:`#22c55e`,bg:`rgba(34,197,94,0.1)`,border:`rgba(34,197,94,0.2)`,title:`Reserva confirmada`,desc:`${e.class_name||`Clase`} — ${i}`,time:i})}),u.attendanceHistoryCount>0&&t.push({icon:`check-circle`,color:`#a855f7`,bg:`rgba(168,85,247,0.1)`,border:`rgba(168,85,247,0.2)`,title:`Asistencia registrada`,desc:`+25 XP obtenidos`,time:`Reciente`}),u.level>0&&t.push({icon:`zap`,color:`#fbbf24`,bg:`rgba(251,191,36,0.1)`,border:`rgba(251,191,36,0.2)`,title:`¡Subiste de nivel!`,desc:`Nivel ${u.level} alcanzado`,time:`Reciente`}),u.tournaments&&u.tournaments.length>0){let e=u.tournaments[0],n=Math.ceil((new Date(e.date)-new Date)/(1e3*60*60*24));n>0&&n<=30&&t.push({icon:`trophy`,color:`#f97316`,bg:`rgba(249,115,22,0.1)`,border:`rgba(249,115,22,0.2)`,title:`Torneo próximo`,desc:`${e.name} — ${n} días`,time:`Próximamente`})}u.membershipStatus===`active`&&t.push({icon:`shield-check`,color:`#06b6d4`,bg:`rgba(6,182,212,0.1)`,border:`rgba(6,182,212,0.2)`,title:`Plan activo`,desc:`Membresía al día`,time:`Actual`}),t.length===0?e.innerHTML=`
                <div style="padding: 20px; text-align: center; opacity: 0.4;">
                    <i data-lucide="activity" style="width: 24px; height: 24px; margin-bottom: 8px;"></i>
                    <p style="font-size: 0.75rem;">Sin actividad reciente</p>
                </div>
            `:e.innerHTML=t.map((e,t)=>`
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.3s; animation: elegantFadeIn 0.4s ease ${t*.08}s both;"
                    onmouseenter="this.style.background='rgba(255,255,255,0.05)'; this.style.transform='translateX(4px)';"
                    onmouseleave="this.style.background='rgba(255,255,255,0.02)'; this.style.transform='translateX(0)';">
                    <div style="width: 34px; height: 34px; border-radius: 10px; background: ${e.bg}; border: 1px solid ${e.border}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i data-lucide="${e.icon}" style="width: 16px; color: ${e.color};"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <p style="font-size: 0.8rem; font-weight: 700; color: white; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${e.title}</p>
                        <p style="font-size: 0.7rem; color: var(--text-gray); margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${e.desc}</p>
                    </div>
                    <span style="font-size: 0.6rem; color: var(--text-gray); opacity: 0.5; flex-shrink: 0;">${e.time}</span>
                </div>
            `).join(``),window.lucide&&window.lucide.createIcons()};window.markNotifRead=async e=>{try{if(await o.markNotificationRead(e),u.userNotifications){let t=u.userNotifications.find(t=>t.id===e);t&&(t.is_read=!0)}U(),W()}catch(e){console.error(`[markNotifRead] Error:`,e)}},window.renderActivityFeed=de;let fe=()=>{let e=document.getElementById(`user-badges-container`);if(!e)return;let t=[{id:`Novato`,icon:`shield`,unlocked:u.role===`admin`||u.attendanceHistoryCount>=5,desc:`5 Clases tomadas`,msg:`¡El inicio de la grandeza empieza con el primer paso!`},{id:`Constante`,icon:`calendar-check`,unlocked:u.role===`admin`||u.attendanceHistoryCount>=20,desc:`20 Clases tomadas`,msg:`La disciplina es el puente entre metas y logros.`},{id:`Guerrero`,icon:`zap`,unlocked:u.role===`admin`||u.level>=10,desc:`Alcanza Nivel 10`,msg:`Tus rivales tiemblan ante tu poder.`},{id:`Elite`,icon:`crown`,unlocked:u.role===`admin`||u.level>=50,desc:`Alcanza Nivel 50`,msg:`¡Eres una leyenda viviente en el tatami!`}],n=t.filter(e=>e.unlocked).length,r=document.getElementById(`badges-progress-text`);r&&(r.innerText=`${n} / ${t.length}`),e.innerHTML=t.map(e=>`
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
        `).join(``),lucide.createIcons()},pe=async e=>{try{console.log(`Firebase Messaging removed. Push notifications require Supabase/OneSignal setup.`)}catch(e){console.error(`Error initializing Firebase Messaging:`,e)}},U=()=>{let e=document.getElementById(`nav-notif-badge`),t=(u.userNotifications||[]).filter(e=>!e.is_read).length;e&&(t>0?(e.textContent=t>99?`99+`:t,e.style.display=`flex`):e.style.display=`none`)},W=()=>{let e=document.getElementById(`notifications-list`);if(!e)return;let t=[];if((u.userNotifications||[]).map(e=>{let t=!e.is_read,n=e.type===`mass`?`#f59e0b`:e.type===`direct`?`#8b5cf6`:`var(--accent-cyan)`,r=e.type===`mass`?`Comunicación`:e.type===`direct`?`Mensaje Directo`:`Sistema`,i=e.type===`mass`?`megaphone`:e.type===`direct`?`message-circle`:`bell`,a=new Date(e.created_at),o=new Date-a,s=Math.floor(o/(1e3*60)),c=Math.floor(o/(1e3*60*60)),l=Math.floor(o/(1e3*60*60*24)),u;return u=s<1?`Recién ahora`:s<60?`Hace ${s} min`:c<24?`Hace ${c} h`:l<7?`Hace ${l} d`:a.toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`}),`
            <div class="notification-item glass ${t?`critical`:``}" data-notif-id="${e.id}" style="border-left-color: ${n}; cursor: pointer; ${t?`background: rgba(139,92,246,0.04);`:``}"
                onclick="markNotifRead('${e.id}')">
                <div class="notif-icon ${t?`pulse`:``}" style="color: ${n};">
                    <i data-lucide="${i}"></i>
                </div>
                <div class="notif-content">
                    <h4>${e.title} ${t?`<span style="font-size:0.6rem; background:#ef4444; color:white; padding:2px 6px; border-radius:8px; margin-left:6px; vertical-align:middle;">NUEVO</span>`:``}</h4>
                    <p>${e.message}</p>
                    <span class="notif-time">${r} — ${u}</span>
                </div>
                ${t?`<div class="critical-badge" style="background:${n}">NUEVO</div>`:``}
            </div>
            `}),u.membershipExpiry){let e=new Date(u.membershipExpiry)-new Date,n=Math.ceil(e/(1e3*60*60*24));if(n<=10&&n>=0){let e=n<=3;t.push(`
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
                `)}}u.level===0&&(u.xp||0)<5&&t.push(`
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
            `);let n=u.notifications.map(e=>{let t=`bell`,n=`var(--accent-purple)`,r=``;return e.type===`welcome`?t=`sparkles`:e.type===`alert`?(t=`alert-triangle`,n=`#ef4444`,r=`<div class="critical-badge" style="background:#ef4444">URGENTE</div>`):e.type===`calendar`&&(t=`calendar`,n=`#f59e0b`,r=`<div class="critical-badge" style="background:#f59e0b">IMPORTANTE</div>`),`
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
            `}),r=u.tournaments.map(e=>{let t=Math.ceil((new Date(e.date)-new Date)/(1e3*60*60*24)),n=t<=7;return`
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
            </div>`});e.innerHTML=[...t,...n,...r].join(``)||`<div class="p-20 text-center opacity-50">No hay notificaciones nuevas.</div>`,lucide.createIcons()},me=async()=>{let e=document.getElementById(`payment-history-list`),t=document.getElementById(`current-membership-progress`),n=document.getElementById(`btn-view-plans`);if(n&&(n.onclick=()=>{let e=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),y(e)),typeof G==`function`&&G()}),!(!e||!$.currentUser)){if(t)try{let e=await o.getProfile($.currentUser.uid);if(e&&e.membership_status===`active`){let n=e.membership_plans?.name||`PLAN ACTIVO`;e.membership_plans?.theme;let r=e.membership_plans?.class_limit||e.membership_limit||0,i=0,a=0;if(e.membership_expiry){let t=new Date(e.membership_expiry);a=Math.max(0,Math.ceil((t-new Date)/(1e3*60*60*24)));let n=new Date(t);n.setDate(n.getDate()-30),u.allUserReservations&&(i=u.allUserReservations.filter(e=>{let r=new Date(e.reservation_date);return r>=n&&r<=t}).length)}let o=r>0?Math.min(i/r*100,100):i>0?100:0;t.innerHTML=`
                        <div class="membership-card-interactive" id="membership-main-info" style="cursor:pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 5px; border-radius: 12px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                                <div style="display:flex; flex-direction:column; gap:2px;">
                                    <span style="font-size:0.95rem; font-weight:800; color:var(--accent-purple); letter-spacing: 0.5px;">${n}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); font-weight:600; text-transform: uppercase;">Estado: Activo</span>
                                </div>
                                <div style="text-align: right;">
                                    <span style="font-size:0.85rem; color: #fff; font-weight: 800;">${a}</span>
                                    <span style="font-size:0.7rem; color:var(--text-gray); display: block;">días restantess</span>
                                </div>
                            </div>
                            
                            <div class="progress-bar-bg" style="height:10px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
                                <div class="progress-bar-fill" style="height:100%; width:${o}%; background: linear-gradient(90deg, var(--accent-purple), #fff); border-radius:10px; transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
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
                                    <strong style="font-size:1.6rem; color: white; font-weight: 900;">${u.allUserReservations?.length||0}</strong>
                                    <p style="font-size:0.6rem; color:var(--accent-purple); font-weight: 700; margin-top: 4px;">Total Histórico</p>
                                </div>
                                <div class="detail-stat glass" style="padding:15px; text-align:center; border-radius: 18px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);">
                                    <span style="display:block; font-size:0.6rem; color:var(--text-gray); text-transform:uppercase; font-weight:800; margin-bottom:6px; letter-spacing: 1px;">Clases Activas</span>
                                    <strong style="font-size:1.6rem; color: #fff; font-weight: 900;">${u.attendanceHistoryCount||0}</strong>
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
                    `;let s=t.querySelector(`#membership-main-info`),c=t.querySelector(`#membership-extra-details`),l=t.querySelector(`#toggle-membership-indicator`);s&&c&&(s.onclick=()=>{c.classList.contains(`hidden`)?(c.classList.remove(`hidden`),l&&(l.style.transform=`rotate(180deg)`),s.style.background=`rgba(255,255,255,0.03)`):(c.classList.add(`hidden`),l&&(l.style.transform=`rotate(0deg)`),s.style.background=`transparent`),lucide.createIcons()});let d=t.querySelector(`#btn-renew-advance-plan`);d&&(d.onclick=()=>{let e=document.getElementById(`membership-selection-screen`);e&&(e.classList.remove(`hidden`),y(e)),typeof G==`function`&&G()}),lucide.createIcons()}else t.innerHTML=`<p style="text-align:center; font-size:0.8rem; color:var(--text-gray);">No tienes una membresía activa actualmente.</p>`}catch(e){console.error(`Error setting membership progress:`,e),t.innerHTML=`<p style="text-align:center; font-size:0.8rem; color:var(--text-gray);">Error al cargar progreso.</p>`}try{let t=await o.getPayments($.currentUser.uid),n=document.getElementById(`payments-count`);n&&(n.innerText=`${t.length} pago${t.length===1?``:`s`}`),e.innerHTML=t.length===0?`<div style="padding: 24px; text-align: center; opacity: 0.4;">
                        <i data-lucide="receipt" style="width: 24px; height: 24px; margin-bottom: 8px;"></i>
                        <p style="font-size: 0.75rem;">No hay pagos registrados</p>
                    </div>`:t.map((e,t)=>{let n=e.status===`approved`||e.status===`active`,r=n?`#22c55e`:`#eab308`,i=n?`rgba(34,197,94,0.1)`:`rgba(234,179,8,0.1)`,a=n?`rgba(34,197,94,0.2)`:`rgba(234,179,8,0.2)`,o=n?`Aprobado`:`Pendiente`,s=n?`check-circle`:`clock`,c=e.created_at?new Date(e.created_at).toLocaleDateString(`es-ES`,{day:`numeric`,month:`short`}):``;return`
                    <div style="display: flex; align-items: center; gap: 12px; padding: 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; transition: all 0.3s; animation: elegantFadeIn 0.4s ease ${t*.08}s both;"
                        onmouseenter="this.style.background='rgba(255,255,255,0.05)';"
                        onmouseleave="this.style.background='rgba(255,255,255,0.02)';">
                        <div style="width: 40px; height: 40px; border-radius: 12px; background: ${i}; border: 1px solid ${a}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i data-lucide="${s}" style="width: 18px; color: ${r};"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <p style="font-size: 0.85rem; font-weight: 700; color: white; margin: 0;">$${parseFloat(e.amount||0).toLocaleString()}</p>
                            <p style="font-size: 0.7rem; color: var(--text-gray); margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${e.concept||`Plan Amaru`} ${c?`• ${c}`:``}</p>
                        </div>
                        <span style="font-size: 0.6rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; background: ${i}; color: ${r}; border: 1px solid ${a}; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;">${o}</span>
                    </div>
                    `}).join(``),window.lucide&&window.lucide.createIcons()}catch(e){console.error(`Error rendering payments:`,e)}}};document.getElementById(`admin-content-area`);function G(){let e=document.getElementById(`membership-plans-container`);if(!e)return;let t=u.plans||[];if(t.length===0){e.innerHTML=`<p style="text-align:center; padding:40px; opacity:0.5;">No hay planes disponibles.</p>`;return}let n=t.reduce((e,t)=>t.popular?t:e,t[0]),r={bronze:{accent:`#cd7f32`,icon:`shield`,gradient:`linear-gradient(135deg, rgba(205,127,50,0.15), rgba(205,127,50,0.05))`},silver:{accent:`#c0c0c0`,icon:`shield-check`,gradient:`linear-gradient(135deg, rgba(192,192,192,0.15), rgba(192,192,192,0.05))`},gold:{accent:`#ffd700`,icon:`crown`,gradient:`linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))`}};e.innerHTML=t.map((e,t)=>{let i=e.price,a=``,o=e.subtitle||``,s=`/ MES`,c=``,l=``,d=r[e.theme]||r.bronze,f=e.popular||n&&e.id===n.id;if(u.proRataPreference===`proportional`){let t=new Date,n=t.getDate(),r=new Date(t.getFullYear(),t.getMonth()+1,0).getDate(),l=r-n+1,d=e.price/r,f=1+u.surchargePct/100;i=Math.round(d*l*f),a=`<span style="text-decoration:line-through; opacity:0.4; font-size:0.75em; margin-right:6px;">$${e.price.toLocaleString()}</span>`,o=`Proporcional (${l} días)`,s=``,c=`<span style="font-size:0.6rem; background:rgba(251,191,36,0.15); color:#fbbf24; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(251,191,36,0.3);">⚡ Prorrateado</span>`}else if(u.activePromo){let t=!0,n=!1;if(u.activePromo.plans&&u.activePromo.plans.length>0&&(t=u.activePromo.plans.includes(e.id)),u.activePromo.expiresAt){let e=new Date(u.activePromo.expiresAt);e.setDate(e.getDate()+1),n=e<new Date}if(t&&!n){let t=u.activePromo.percent,n=Math.round(e.price*(t/100));i=e.price-n,a=`<span style="text-decoration:line-through; opacity:0.4; font-size:0.75em; margin-right:6px;">$${e.price.toLocaleString()}</span>`,c=`<span style="font-size:0.6rem; background:rgba(34,197,94,0.15); color:#22c55e; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(34,197,94,0.3);">🎉 -${t}%</span>`,l=`<span style="font-size:0.7rem; color:#22c55e; font-weight:700;">Ahorras $${n.toLocaleString()}</span>`}}else u.proRataPreference===`full`&&(c=`<span style="font-size:0.6rem; background:rgba(59,130,246,0.15); color:#3b82f6; padding:2px 8px; border-radius:10px; font-weight:700; border:1px solid rgba(59,130,246,0.3);">📅 Mes completo</span>`);let p=Array.isArray(e.features)?e.features:e.features?String(e.features).split(`,`).map(e=>e.trim()).filter(e=>e):[],m=p.length>0?`<div style="display:flex; flex-wrap:wrap; gap:4px; margin:10px 0; justify-content:center;">${p.slice(0,3).map(e=>`<span style="font-size:0.6rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:2px 8px; border-radius:20px; color:var(--text-gray);">${e}</span>`).join(``)}${p.length>3?`<span style="font-size:0.6rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:2px 8px; border-radius:20px; color:var(--text-gray);">+${p.length-3}</span>`:``}</div>`:``,h=e.description?`<p style="font-size:0.7rem; color:var(--text-gray); margin:6px 12px 0; line-height:1.4; opacity:0.8; min-height:30px;">${e.description}</p>`:``;return`
            <div id="plan-card-${e.id}" class="plan-card ${e.theme} ${f?`popular`:``}" style="opacity:0; animation: elegantFadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${.05+t*.12}s forwards;">
                <div class="plan-card-inner">
                    <!-- Front Side -->
                    <div class="plan-card-front" style="background:${d.gradient};">
                        ${f?`<div style="position:absolute; top:-8px; right:12px; background:linear-gradient(135deg, #8b5cf6, #a855f7); color:white; font-size:0.6rem; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; box-shadow:0 4px 15px rgba(139,92,246,0.4); display:flex; align-items:center; gap:4px; z-index:20;"><i data-lucide="flame" style="width:10px;"></i> ${e.popular?`Recomendado`:`Más Popular`}</div>`:``}

                        <div class="plan-icon-wrapper" onclick="togglePlanFlip('${e.id}')" style="cursor:pointer; position:relative; z-index:10;">
                            <i data-lucide="${d.icon}" class="main-shield" style="color:${d.accent};"></i>
                            <div class="tap-hint"><i data-lucide="mouse-pointer-2"></i></div>
                        </div>

                        <h2 style="color:${d.accent};">${e.name}</h2>

                        <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap; margin-bottom:4px;">
                            ${c}
                        </div>

                        <p class="plan-subtitle" style="font-size:0.75rem; margin:4px 0;">${o}</p>

                        ${h}
                        ${m}

                        <div style="margin:10px 0;">
                            <div style="display:flex; align-items:center; justify-content:center; gap:4px; flex-wrap:wrap;">
                                ${a}
                                <span style="font-size:1.6rem; font-weight:900; color:white;">$${i.toLocaleString()}</span>
                            </div>
                            <span style="font-size:0.65rem; color:var(--text-gray); text-transform:uppercase; font-weight:700; letter-spacing:1px;">${s}</span>
                            ${l?`<div style="margin-top:4px;">${l}</div>`:``}
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 12px; padding:8px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                            <div style="text-align:center;">
                                <span style="font-size:0.55rem; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Clases/día</span>
                                <strong style="font-size:0.9rem; color:white; display:block;">${e.limit||`∞`}</strong>
                            </div>
                            <div style="text-align:center;">
                                <span style="font-size:0.55rem; color:var(--text-gray); text-transform:uppercase; font-weight:700;">Clases/mes</span>
                                <strong style="font-size:0.9rem; color:white; display:block;">${e.monthly||0}</strong>
                            </div>
                        </div>

                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${e.id}')" style="margin-top:auto;">SELECCIONAR PLAN</button>
                    </div>

                    <!-- Back Side (Details) -->
                    <div class="plan-card-back">
                        <div class="plan-icon-wrapper back-trigger" onclick="togglePlanFlip('${e.id}')" style="cursor:pointer; background:rgba(203,242,240,0.2); border-color:rgba(203,242,240,0.5);">
                            <i data-lucide="chevron-left"></i>
                        </div>
                        <h3 style="color:var(--accent-purple); margin-bottom:15px; font-weight:800; letter-spacing:1px; font-size:1rem;">DETALLES DEL PLAN</h3>

                        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:15px;">
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span style="font-size:0.75rem; color:var(--text-gray);">Precio mensual</span>
                                <strong style="font-size:0.8rem; color:white;">$${e.price.toLocaleString()}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span style="font-size:0.75rem; color:var(--text-gray);">Clases por día</span>
                                <strong style="font-size:0.8rem; color:white;">${e.limit||`Ilimitado`}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <span style="font-size:0.75rem; color:var(--text-gray);">Clases por mes</span>
                                <strong style="font-size:0.8rem; color:white;">${e.monthly||0}</strong>
                            </div>
                            ${e.description?`<div style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);"><span style="font-size:0.7rem; color:var(--text-gray);">${e.description}</span></div>`:``}
                        </div>

                        <h4 style="font-size:0.75rem; color:var(--accent-purple); margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Incluye</h4>
                        <ul class="plan-features" style="text-align:left; margin-bottom:15px; flex:1; overflow-y:auto;">
                            ${p.map(e=>`<li style="display:flex; align-items:center; gap:8px; padding:3px 0; font-size:0.8rem;"><i data-lucide="check-circle-2" style="width:14px; color:#22c55e; flex-shrink:0;"></i> ${e}</li>`).join(``)}
                        </ul>

                        <button class="btn-select-plan" onclick="event.stopPropagation(); selectMembershipPlan('${e.id}')" style="margin-top:auto;">SELECCIONAR Y PAGAR</button>
                    </div>
                </div>
            </div>
        `}).join(``),lucide.createIcons()}window.togglePlanFlip=e=>{let t=document.getElementById(`plan-card-${e}`);t&&t.classList.toggle(`flipped`)},window.selectMembershipPlan=async e=>{let t=u.plans.find(t=>t.id==e);if(!t)return;let n=$.currentUser;if(!n)return showToast(`Debes iniciar sesión para continuar`,`#ef4444`);let r={...t};if(u.activePromo){let e=!0;u.activePromo.plans&&u.activePromo.plans.length>0&&(e=u.activePromo.plans.includes(t.id)),e&&(r.price-=r.price*(u.activePromo.percent/100),r.name=`${r.name} (Promo: ${u.activePromo.code})`)}let i=async e=>{try{if(showToast(`Iniciando pago para ${e.name}... 💳`,`#22c55e`),g!==void 0&&typeof g.createPreference==`function`)await g.createPreference(e);else throw Error(`Servicio de pagos no disponible`)}catch(e){console.error(`Auto-payment error:`,e),showToast(`No se pudo iniciar el pago automático. Intenta de nuevo.`,`#ef4444`)}},a=new Date,o=a.getDate(),s=!1;try{let e=await db.collection(`users`).doc(n.uid).get();if(e.exists){let t=e.data();(!t.membership_status||t.membership_status===`pending`)&&(s=!0)}}catch(e){console.error(`Error checking user plan status:`,e)}if(s&&o>=15){let e=new Date(a.getFullYear(),a.getMonth()+1,0).getDate(),t=e-o+1,n=r.price/e,s=1+u.surchargePct/100,c=Math.round(n*t*s),l={...r,price:c,name:`${r.name} (Proporcional resto del mes)`},d={...r,name:`${r.name} (Mes Completo)`};if(u.proRataPreference===`proportional`)return await i(l);if(u.proRataPreference===`full`)return await i(d);if(document.getElementById(`proportional-modal`))document.getElementById(`btn-pay-proportional`).innerHTML=`<strong style="font-size: 1rem;">Pagar Proporcional ($${c.toLocaleString()})</strong><span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Lo que resta del mes (incluye recargo)</span>`,document.getElementById(`btn-pay-full`).innerHTML=`<strong style="font-size: 1rem;">Pagar Mes Completo ($${r.price.toLocaleString()})</strong><span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Se cobrará el mes entero desde hoy</span>`,document.getElementById(`proportional-modal`).style.display=`flex`;else{let e=`
                <div id="proportional-modal" class="overlay" style="display:flex; z-index: 10000; align-items: center; justify-content: center; background: rgba(0,0,0,0.8);">
                    <div class="modal-content glass" style="max-width:350px; text-align:center; padding: 25px; border-radius: 20px;">
                        <h3 style="margin-bottom:15px; color:var(--accent-yellow); font-size: 1.2rem; font-weight: 800;">Bienvenido a Amaru</h3>
                        <p style="font-size:0.9rem; margin-bottom: 20px; color: #ddd;">Como ingresas pasado el día 15, puedes elegir cómo pagar tu primera membresía:</p>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            <button id="btn-pay-proportional" class="btn-primary" style="padding:15px; font-size:0.85rem; border-radius:12px; display: flex; flex-direction: column; align-items: center;">
                                <strong style="font-size: 1rem;">Pagar Proporcional ($${c.toLocaleString()})</strong>
                                <span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Lo que resta del mes (incluye recargo)</span>
                            </button>
                            <button id="btn-pay-full" class="btn-secondary" style="padding:15px; font-size:0.85rem; border-radius:12px; background:rgba(255,255,255,0.05); color:white; border:1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; align-items: center; transition: all 0.2s;">
                                <strong style="font-size: 1rem;">Pagar Mes Completo ($${r.price.toLocaleString()})</strong>
                                <span style="font-size:0.7rem; font-weight:normal; opacity: 0.8; margin-top: 3px;">Se cobrará el mes entero desde hoy</span>
                            </button>
                            <button id="btn-cancel-proportional" style="margin-top:10px; background:none; color:var(--text-gray); border:none; text-decoration:underline; font-weight: 600; cursor: pointer;">Cancelar</button>
                        </div>
                    </div>
                </div>`;document.body.insertAdjacentHTML(`beforeend`,e)}document.getElementById(`btn-pay-proportional`).onclick=async()=>{document.getElementById(`proportional-modal`).style.display=`none`,await i(l)},document.getElementById(`btn-pay-full`).onclick=async()=>{document.getElementById(`proportional-modal`).style.display=`none`,await i(d)},document.getElementById(`btn-cancel-proportional`).onclick=()=>{document.getElementById(`proportional-modal`).style.display=`none`};return}if(u.role===`admin`)return showToast(`El administrador no realiza pagos ⚙️`,`#fbbf24`);await i(r)};let he=document.getElementById(`btn-skip-membership`);he&&(he.onclick=async()=>{document.getElementById(`membership-selection-screen`).classList.add(`hidden`),document.getElementById(`app-container`).classList.remove(`hidden`),b(`dashboard`);let e=$.currentUser;if(e&&u.role!==`admin`)try{let{data:t}=await window.supabase.from(`payments`).select(`id`).eq(`user_id`,e.uid).eq(`status`,`pending`);(!t||t.length===0)&&await o.recordPayment(e.uid,{amount:0,concept:`Registro - Pago Omitido`,receipt_url:null,status:`pending`,payment_method:`manual`,currency:`COP`})}catch(e){console.error(`Error al registrar el pago omitido:`,e)}showToast(`¡Explora AmaruApp! 🥋`)})}),document.addEventListener(`DOMContentLoaded`,()=>{if(Ue(),(()=>{let e=document.getElementById(`manage-classes-btn`),t=document.getElementById(`manage-users-btn`),n=document.getElementById(`manage-active-users-btn`),i=document.getElementById(`view-attendance-btn`),a=document.getElementById(`manage-payments-btn`),o=document.getElementById(`view-revenue-btn`),s=document.getElementById(`manage-discounts-btn`),c=document.getElementById(`manage-notifications-btn`);document.getElementById(`btn-export-revenue`),e&&(e.onclick=()=>{let e=document.getElementById(`admin-revenue-section`);e&&e.classList.add(`hidden`),Se()}),t&&(t.onclick=()=>we()),n&&(n.onclick=()=>U()),i&&(i.onclick=()=>Ee()),a&&(a.onclick=()=>ne()),o&&(o.onclick=()=>r()),s&&(s.onclick=()=>De()),c&&(c.onclick=()=>Oe())})(),a!==void 0&&a.init(),s!==void 0&&s.init(),c!==void 0&&c.init(),qe!==void 0&&qe.init(),Ke!==void 0){Ke.init();let e=window.showLoading;window.showLoading=(t=`Cargando...`)=>{document.querySelector(`.class-timeline`)&&t.includes(`clases`)?Ke.showFor(`schedule`):typeof Swal<`u`&&e(t)};let t=window.hideLoading;window.hideLoading=()=>{Ke.hideAll(),t()}}}),`serviceWorker`in navigator&&(window.location.hostname===`localhost`?(console.log(`Service Worker no registrado en localhost para evitar problemas de caché.`),navigator.serviceWorker.getRegistrations().then(function(e){for(let t of e)t.unregister()})):window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`/app/sw.js`,{scope:`/app/`}).then(e=>{console.log(`Service Worker Registrado: `,e),e.active?typeof initMessaging==`function`&&initMessaging():e.addEventListener(`updatefound`,()=>{let t=e.installing;t.addEventListener(`statechange`,()=>{t.state===`activated`&&typeof initMessaging==`function`&&initMessaging()})})}).catch(e=>console.error(`Error de Service Worker: `,e))}));