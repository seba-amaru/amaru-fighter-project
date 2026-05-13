import{t as e}from"./main-jiITlyvp.js";import{t}from"./exportUtils-C7VMJtui.js";var n=e({renderRevenueSection:()=>h}),r=null,i=[],a={year:new Date().getFullYear(),month:new Date().getMonth()},o=null,s=20,c=null,l=e=>e==null?`$0`:`$`+Math.round(e).toLocaleString(`es-CL`),u=e=>e?new Date(e).toLocaleDateString(`es-CL`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`,d=e=>[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`][e]||``,f=async()=>{try{let{data:e,error:t}=await window.supabase.from(`payments`).select(`
                *,
                profiles:profiles(id, full_name, email, membership_plan_id, membership_status, membership_expiry)
            `).eq(`status`,`approved`).order(`created_at`,{ascending:!1});if(t)throw t;let{data:n}=await window.supabase.from(`membership_plans`).select(`*`),r=new Map((n||[]).map(e=>[e.id,e]));return(e||[]).map(e=>{let t=null,i=(e.concept||e.plan_name||``).toLowerCase();return i&&n&&(t=n.find(e=>i.includes((e.name||``).toLowerCase()))),!t&&e.profiles?.membership_plan_id&&(t=r.get(e.profiles.membership_plan_id)||null),{...e,plan:t}})}catch(e){return console.error(`[Revenue] Error fetching data:`,e),window.showToast&&window.showToast(`Error cargando ingresos`,`#ef4444`),[]}},p=()=>{c&&c.unsubscribe(),c=window.supabase.channel(`revenue-payments-updates`).on(`postgres_changes`,{event:`*`,schema:`public`,table:`payments`,filter:`status=eq.approved`},e=>{console.log(`[Revenue] Realtime update received:`,e),m()}).subscribe(e=>{e===`SUBSCRIBED`?console.log(`[Revenue] Realtime subscription active`):console.warn(`[Revenue] Realtime subscription status:`,e)})},m=async()=>{try{i=await f(),g(),window.showToast&&window.showToast(`Nuevo pago detectado - Actualizando...`,`#22c55e`)}catch(e){console.error(`[Revenue] Error refreshing data:`,e)}},h=async()=>{let e=document.getElementById(`admin-revenue-section`),t=document.getElementById(`admin-content-area`);e&&e.classList.add(`hidden`),t&&(t.innerHTML=`<div class="p-20 text-center"><i data-lucide="loader" class="spin"></i> Cargando inteligencia financiera...</div>`),window.lucide&&window.lucide.createIcons(),i=await f(),await v(),g(),p()},g=()=>{let e=document.getElementById(`admin-content-area`);if(!e)return;let t=new Date,n=t.getMonth(),r=t.getFullYear();a||={year:r,month:n};let c=S(i,a.year,a.month),u=o?S(i,o.year,o.month):C(i,a.year,a.month),f=c.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),p=u.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),m=p>0?(f-p)/p*100:f>0?100:0,h=new Set(c.map(e=>e.user_id)).size,g=c.length>0?f/c.length:0,_={};c.forEach(e=>{let t=e.plan?.name||e.concept||`Otro`;_[t]||(_[t]={count:0,total:0}),_[t].count++,_[t].total+=parseFloat(e.amount)||0});let v=w(i,6);e.innerHTML=`
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
                            ${[0,1,2,3,4,5,6,7,8,9,10,11].map(e=>`<option value="${e}" ${e===a.month?`selected`:``} style="color:black;">${d(e)}</option>`).join(``)}
                        </select>
                        <select id="rev-filter-year" style="background:transparent; color:white; border:none; font-size:0.75rem; font-weight:600; outline:none; cursor:pointer;">
                            ${[r-1,r,r+1].map(e=>`<option value="${e}" ${e===a.year?`selected`:``} style="color:black;">${e}</option>`).join(``)}
                        </select>
                    </div>
                    <button id="btn-compare-prev" class="btn-glass" style="padding:6px 14px; font-size:0.7rem; ${o?`background:var(--accent-purple); color:white; border-color:var(--accent-purple);`:``}">
                        <i data-lucide="git-compare" style="width:12px;"></i> Comparar
                    </button>
                    <button id="btn-refresh-rev" class="btn-glass" style="padding:6px 14px; font-size:0.7rem;" title="Actualizar datos">
                        <i data-lucide="refresh-cw" style="width:12px;"></i>
                    </button>
                    <span id="realtime-status" style="display:flex; align-items:center; gap:4px; font-size:0.65rem; color:#22c55e; background:rgba(34,197,94,0.1); padding:4px 8px; border-radius:20px;">
                        <span style="width:6px; height:6px; background:#22c55e; border-radius:50%;"></span> Live
                    </span>
                </div>
            </div>

            <!-- KPIs -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:25px;">
                <div class="stat-mini-premium" style="background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ingresos ${d(a.month)}</span>
                    <strong style="font-size:1.4rem; color:var(--accent-purple); font-weight:900;">${l(f)}</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Crecimiento</span>
                    <strong style="font-size:1.4rem; color:${m>=0?`#22c55e`:`#ef4444`}; font-weight:900;">${m>=0?`+`:``}${m.toFixed(1)}%</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Pagadores</span>
                    <strong style="font-size:1.4rem; color:#3b82f6; font-weight:900;">${h}</strong>
                </div>
                <div class="stat-mini-premium" style="background:rgba(251,191,36,0.08); border:1px solid rgba(251,191,36,0.2); padding:15px; border-radius:14px; text-align:center;">
                    <span style="font-size:0.65rem; opacity:0.6; text-transform:uppercase; font-weight:700; letter-spacing:1px; display:block; margin-bottom:6px;">Ticket Promedio</span>
                    <strong style="font-size:1.4rem; color:#fbbf24; font-weight:900;">${l(g)}</strong>
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
                    ${Object.keys(_).length===0?`<p style="opacity:0.5; font-size:0.8rem;">Sin ingresos registrados en este periodo.</p>`:Object.entries(_).sort((e,t)=>t[1].total-e[1].total).map(([e,t])=>{let n=f>0?(t.total/f*100).toFixed(1):0;return`
                                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                                    <div style="flex:1;">
                                        <strong style="font-size:0.85rem;">${e}</strong>
                                        <span style="font-size:0.7rem; color:var(--text-gray); margin-left:8px;">${t.count} pago${t.count===1?``:`s`}</span>
                                    </div>
                                    <div style="width:100px; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                        <div style="width:${n}%; height:100%; background:var(--accent-purple); border-radius:3px;"></div>
                                    </div>
                                    <strong style="font-size:0.9rem; min-width:70px; text-align:right;">${l(t.total)}</strong>
                                    <span style="font-size:0.7rem; color:var(--accent-purple); min-width:40px; text-align:right;">${n}%</span>
                                </div>
                            `}).join(``)}
                </div>
            </div>

            <!-- Lista detallada de pagadores -->
            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                    <h4 style="font-size:0.9rem; font-weight:700;">👥 Detalle de Pagos — ${d(a.month)} ${a.year}</h4>
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
                    ${y(c)}
                </div>
                ${c.length>s?`
                    <div style="text-align:center; margin-top:15px;">
                        <button id="btn-load-more-rev" class="btn-glass" style="padding:8px 20px; font-size:0.75rem;">
                            Ver más (${c.length-s} restantes)
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
                    ${b(c,u,f,p,m,_)}
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
    `,window.lucide&&window.lucide.createIcons(),x(v),T(c)},_=null,v=async()=>{if(_)return _;try{let{data:e}=await window.supabase.from(`discounts`).select(`*`);return _=e||[],_}catch{return[]}},y=e=>{let t=(document.getElementById(`rev-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`rev-sort-select`)?.value||`date-desc`,r=[...e];t&&(r=r.filter(e=>{let n=(e.profiles?.full_name||``).toLowerCase(),r=(e.profiles?.email||``).toLowerCase(),i=(e.concept||``).toLowerCase();return n.includes(t)||r.includes(t)||i.includes(t)})),r.sort((e,t)=>{switch(n){case`date-desc`:return new Date(t.created_at)-new Date(e.created_at);case`date-asc`:return new Date(e.created_at)-new Date(t.created_at);case`amount-desc`:return(parseFloat(t.amount)||0)-(parseFloat(e.amount)||0);case`amount-asc`:return(parseFloat(e.amount)||0)-(parseFloat(t.amount)||0);case`name-asc`:return(e.profiles?.full_name||``).localeCompare(t.profiles?.full_name||``);default:return 0}});let i=r.slice(0,s);return i.length===0?`<div style="text-align:center; padding:30px; opacity:0.4;">
            <i data-lucide="inbox" style="width:40px; height:40px; margin-bottom:10px; display:block; margin-inline:auto;"></i>
            <p style="font-size:0.85rem;">No hay pagos que coincidan con los filtros.</p>
        </div>`:i.map((e,t)=>{let n=e.profiles?.full_name||`Usuario sin nombre`,r=e.profiles?.email||``,i=e.plan?.name||e.concept||`—`,a=parseFloat(e.amount)||0,o=u(e.created_at),s=e.payment_method||`manual`,c=s===`mercadopago`?`Mercado Pago`:s===`webpay`?`Webpay`:`Transferencia/Manual`,d=e.profiles?.active_promo,f=a,p=``;if(d&&_){let e=_.find(e=>e.code===d);e&&e.percent>0&&(f=a*(1-e.percent/100),p=`<span class="tag" style="background:rgba(251,191,36,0.1); color:#fbbf24; font-size:0.6rem; padding:1px 6px; border:1px solid rgba(251,191,36,0.2);">-${e.percent}% ${d}</span>`)}return`
            <div class="admin-item-card glass" style="flex-direction:row; align-items:center; gap:12px; padding:12px 15px; border:1px solid rgba(255,255,255,0.05); border-left:3px solid var(--accent-purple); animation: slideInUp 0.3s ease ${t*.03}s both;">
                <div style="width:36px; height:36px; border-radius:50%; background:rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="user" style="width:16px; color:var(--accent-purple);"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <strong style="font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${n}</strong>
                        <span class="tag" style="background:rgba(139,92,246,0.15); color:var(--accent-purple); font-size:0.65rem; padding:2px 8px;">${i}</span>
                        ${p}
                    </div>
                    <span style="font-size:0.7rem; color:var(--text-gray); opacity:0.7;">${r}</span>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <strong style="font-size:1rem; color:white; display:block;">${l(f)}</strong>
                    ${d?`<span style="font-size:0.6rem; color:var(--text-gray); text-decoration:line-through; opacity:0.5;">${l(a)}</span>`:``}
                    <span style="font-size:0.65rem; color:var(--text-gray);">${o}</span>
                </div>
                <div style="text-align:right; flex-shrink:0; min-width:90px;">
                    <span class="tag" style="background:rgba(34,197,94,0.15); color:#22c55e; font-size:0.65rem; padding:2px 8px;">Aprobado</span>
                    <span style="font-size:0.6rem; color:var(--text-gray); display:block; margin-top:2px;">${c}</span>
                </div>
            </div>
        `}).join(``)},b=(e,t,n,r,i,a)=>{let o=[];i>10?o.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-up" style="color:#22c55e; width:16px; flex-shrink:0;"></i> <span>¡Excelente crecimiento! Ingresos subieron un <strong>${i.toFixed(1)}%</strong> vs periodo anterior.</span></div>`):i<-10?o.push(`<div style="display:flex; gap:8px;"><i data-lucide="trending-down" style="color:#ef4444; width:16px; flex-shrink:0;"></i> <span>Alerta: ingresos bajaron un <strong>${Math.abs(i).toFixed(1)}%</strong>. Considera una promoción o campaña de reactivación.</span></div>`):i===0?o.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:var(--text-gray); width:16px; flex-shrink:0;"></i> <span>No hay datos suficientes para comparar con el periodo anterior.</span></div>`):o.push(`<div style="display:flex; gap:8px;"><i data-lucide="minus" style="color:#fbbf24; width:16px; flex-shrink:0;"></i> <span>Ingresos estables con variación del <strong>${i.toFixed(1)}%</strong>.</span></div>`);let s=Object.entries(a).sort((e,t)=>t[1].total-e[1].total)[0];if(s&&o.push(`<div style="display:flex; gap:8px;"><i data-lucide="award" style="color:#fbbf24; width:16px; flex-shrink:0;"></i> <span>El plan más rentable es <strong>${s[0]}</strong> con ${l(s[1].total)} (${s[1].count} pagos).</span></div>`),e.length>5){let t={};e.forEach(e=>{let n=e.user_id;t[n]||(t[n]=0),t[n]+=parseFloat(e.amount)||0});let r=Object.values(t).sort((e,t)=>t-e),i=Math.max(1,Math.ceil(r.length*.2)),a=r.slice(0,i).reduce((e,t)=>e+t,0),s=n>0?(a/n*100).toFixed(0):0;s>50&&o.push(`<div style="display:flex; gap:8px;"><i data-lucide="users" style="color:#3b82f6; width:16px; flex-shrink:0;"></i> <span>El <strong>${s}%</strong> de ingresos proviene del 20% de tus alumnos (alta concentración).</span></div>`)}if(r>0){let e=n-r;o.push(`<div style="display:flex; gap:8px;"><i data-lucide="scale" style="color:#8b5cf6; width:16px; flex-shrink:0;"></i> <span>Diferencia vs anterior: <strong style="color:${e>=0?`#22c55e`:`#ef4444`}">${e>=0?`+`:``}${l(e)}</strong></span></div>`)}return o.join(``)||`<p style="opacity:0.5;">Sin insights disponibles para este periodo.</p>`},x=e=>{let t=document.getElementById(`revenueChart`);if(!t)return;r&&r.destroy();let n=e.map(e=>`${d(e.month).substring(0,3)} ${String(e.year).slice(2)}`),i=e.map(e=>e.total),a=e.map(e=>e.count);r=new Chart(t,{type:`bar`,data:{labels:n,datasets:[{label:`Ingresos ($)`,data:i,backgroundColor:`rgba(139, 92, 246, 0.7)`,borderColor:`rgba(139, 92, 246, 1)`,borderWidth:1,borderRadius:6,yAxisID:`y`},{label:`Cant. Pagos`,data:a,type:`line`,borderColor:`#22c55e`,backgroundColor:`rgba(34, 197, 94, 0.1)`,borderWidth:2,pointRadius:3,pointBackgroundColor:`#22c55e`,tension:.4,yAxisID:`y1`}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:`index`,intersect:!1},plugins:{legend:{labels:{color:`rgba(255,255,255,0.7)`,font:{size:11}}},tooltip:{backgroundColor:`rgba(13,13,18,0.95)`,titleColor:`#fff`,bodyColor:`#ccc`,borderColor:`rgba(255,255,255,0.1)`,borderWidth:1,callbacks:{label:e=>e.dataset.label===`Ingresos ($)`?` Ingresos: ${l(e.raw)}`:` ${e.dataset.label}: ${e.raw}`}}},scales:{x:{ticks:{color:`rgba(255,255,255,0.5)`,font:{size:10}},grid:{display:!1}},y:{type:`linear`,display:!0,position:`left`,ticks:{color:`rgba(255,255,255,0.4)`,font:{size:10},callback:e=>`$`+(e>=1e3?(e/1e3).toFixed(0)+`k`:e)},grid:{color:`rgba(255,255,255,0.06)`}},y1:{type:`linear`,display:!0,position:`right`,ticks:{color:`rgba(34,197,94,0.6)`,font:{size:10}},grid:{display:!1}}}}})},S=(e,t,n)=>e.filter(e=>{let r=e.created_at;if(!r)return!1;let i=r.split(`T`)[0],a=new Date(i+`T00:00:00`);return a.getFullYear()===t&&a.getMonth()===n}),C=(e,t,n)=>{let r=n===0?11:n-1;return S(e,n===0?t-1:t,r)},w=(e,t)=>{let n=[],r=new Date;for(let i=t-1;i>=0;i--){let t=new Date(r.getFullYear(),r.getMonth()-i,1),a=S(e,t.getFullYear(),t.getMonth());n.push({year:t.getFullYear(),month:t.getMonth(),total:a.reduce((e,t)=>e+(parseFloat(t.amount)||0),0),count:a.length})}return n},T=e=>{let n=document.getElementById(`rev-filter-month`),r=document.getElementById(`rev-filter-year`);n&&(n.onchange=()=>{a.month=parseInt(n.value),a.year=parseInt(r.value),s=20,g()}),r&&(r.onchange=()=>{a.month=parseInt(n.value),a.year=parseInt(r.value),s=20,g()});let i=document.getElementById(`btn-compare-prev`);i&&(i.onclick=()=>{if(o)o=null;else{let e=a.month===0?11:a.month-1;o={year:a.month===0?a.year-1:a.year,month:e}}g()});let c=document.getElementById(`btn-refresh-rev`);c&&(c.onclick=async()=>{c.style.animation=`spin 1s linear infinite`,window.showToast(`Actualizando datos...`,`#f59e0b`),await m(),setTimeout(()=>{c.style.animation=``},500)});let l=document.getElementById(`rev-search-input`);if(l){let t;l.oninput=()=>{clearTimeout(t),t=setTimeout(()=>{let t=document.getElementById(`revenue-payments-list`);t&&(t.innerHTML=y(e)),window.lucide&&window.lucide.createIcons()},300)}}let f=document.getElementById(`rev-sort-select`);f&&(f.onchange=()=>{let t=document.getElementById(`revenue-payments-list`);t&&(t.innerHTML=y(e)),window.lucide&&window.lucide.createIcons()});let p=document.getElementById(`btn-load-more-rev`);p&&(p.onclick=()=>{s+=20,g()});let h=document.getElementById(`btn-export-revenue`);h&&(h.onclick=()=>{let n=document.getElementById(`rev-export-format`)?.value||`csv`,r=(document.getElementById(`rev-search-input`)?.value||``).toLowerCase(),i=document.getElementById(`rev-sort-select`)?.value||`date-desc`,o=[...e];r&&(o=o.filter(e=>{let t=(e.profiles?.full_name||``).toLowerCase(),n=(e.profiles?.email||``).toLowerCase(),i=(e.concept||``).toLowerCase();return t.includes(r)||n.includes(r)||i.includes(r)})),o.sort((e,t)=>{switch(i){case`date-desc`:return new Date(t.created_at)-new Date(e.created_at);case`date-asc`:return new Date(e.created_at)-new Date(t.created_at);case`amount-desc`:return(parseFloat(t.amount)||0)-(parseFloat(e.amount)||0);case`amount-asc`:return(parseFloat(e.amount)||0)-(parseFloat(t.amount)||0);case`name-asc`:return(e.profiles?.full_name||``).localeCompare(t.profiles?.full_name||``);default:return 0}}),t(n,o.map(e=>[u(e.created_at),e.profiles?.full_name||`N/A`,e.profiles?.email||``,e.plan?.name||e.concept||`—`,parseFloat(e.amount||0).toFixed(0),e.payment_method||`manual`,e.status===`approved`?`Aprobado`:e.status]),[`Fecha`,`Alumno`,`Email`,`Plan/Concepto`,`Monto`,`Método`,`Estado`],`Ingresos_${d(a.month)}_${a.year}_Amaru`),window.showToast&&window.showToast(`Exportado (${n.toUpperCase()}) ✅`,`#22c55e`)})};export{n,h as t};