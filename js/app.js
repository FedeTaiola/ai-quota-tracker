// ── DATA & SERVICES ────────────────────────────────────────────────────────
const STORAGE_KEY = 'ai_quota_tracker_v4';
const SERVICES_KEY = 'ai_quota_services_v1';

function loadServices() {
  try {
    const s = JSON.parse(localStorage.getItem(SERVICES_KEY));
    if (s && s.length) return s;
  } catch(e) {}
  // Default fallback for retro-compatibility
  return [
    { id: 'ag', name: 'Antigravity', icon: '⚡', colorFrom: '#6c63ff', colorTo: '#a78bfa', freeDays: 7, proDays: 7 },
    { id: 'cx', name: 'Codex', icon: '🤖', colorFrom: '#06b6d4', colorTo: '#22d3ee', freeDays: 30, proDays: 30 }
  ];
}
function saveServices(s) { localStorage.setItem(SERVICES_KEY, JSON.stringify(s)); }

let services = loadServices();

function injectDynamicCSS() {
  let styleEl = document.getElementById('dynamic-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-styles';
    document.head.appendChild(styleEl);
  }
  let css = '';
  services.forEach(s => {
    css += `
      .tag-${s.id} { background:rgba(255,255,255,.08); color:${s.colorFrom}; }
      body.day-mode .tag-${s.id} { background:rgba(0,0,0,.05); color:${s.colorFrom}; }
      .avatar.${s.id} { background:linear-gradient(135deg, ${s.colorFrom}, ${s.colorTo}); color:#fff; }
      .account-card.${s.id}::before { background:linear-gradient(180deg, ${s.colorFrom}, transparent); }
      .quota-bar-fill.${s.id} { background:linear-gradient(90deg, ${s.colorFrom}, ${s.colorTo}); }
    `;
  });
  styleEl.innerHTML = css;
}

function load()     { try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[];}catch{return[];} }
function save(list) { localStorage.setItem(STORAGE_KEY,JSON.stringify(list)); }
function newId()    { return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

function getServiceDef(id) { return services.find(x => x.id === id) || services[0]; }
function getResetMs(a) { 
  const svc = getServiceDef(a.service);
  return (a.plan === 'pro' ? svc.proDays : svc.freeDays) * 86400000; 
}
function getResetDate(a){ return new Date(new Date(a.cycleStartedAt).getTime()+getResetMs(a)); }
function getMsToReset(a){ return getResetDate(a)-Date.now(); }
function cycleElapsedPct(a){ return Math.min(100,(((Date.now()-new Date(a.cycleStartedAt).getTime())/getResetMs(a))*100)).toFixed(1); }

// combined status for sorting/display
function cardStatus(a){
  const msLeft = getMsToReset(a);
  if(msLeft <= 0) return 'cycle-done';          // reset dovuto
  if(a.quotaStatus === 'exhausted') return 'exhausted';
  if(msLeft < 86400000*1.5) return 'expiring';  // < 1.5 giorni al reset
  return 'available';
}

let accounts  = load();
let sortState = {};
services.forEach(s => sortState[s.id] = 'reset');
let editingId = null;

// ── FORMAT ────────────────────────────────────────────────────────────────
function fmt(ms){
  if(ms<=0) return '🔄 RESET OGGI!';
  const s=Math.floor(ms/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60),sec=s%60;
  const p=n=>n.toString().padStart(2,'0');
  return d>0?`${d}g ${p(h)}:${p(m)}:${p(sec)}`:`${p(h)}:${p(m)}:${p(sec)}`;
}
function fmtDate(dt){
  return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(dt));
}
function fmtDateShort(dt){
  return new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(dt));
}
function initials(n){ return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function toLocal(dt){ const d=new Date(dt); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16); }

function sorted(list,key){
  const c=[...list];
  if(key==='reset') c.sort((a,b)=>getMsToReset(a)-getMsToReset(b));
  else if(key==='name') c.sort((a,b)=>a.name.localeCompare(b.name));
  else if(key==='status'){
    const o={'exhausted':0,'expiring':1,'available':2,'cycle-done':3};
    c.sort((a,b)=>o[cardStatus(a)]-o[cardStatus(b)]);
  }
  return c;
}

// ── RENDER CARD ───────────────────────────────────────────────────────────
function renderCard(a){
  const svcDef   = getServiceDef(a.service);
  const msLeft   = getMsToReset(a);
  const st       = cardStatus(a);
  const resetDt  = getResetDate(a);
  const cyclePct = cycleElapsedPct(a);
  const qpct     = a.quotaPercent ?? 100;
  const qLow     = qpct < 25;

  const pillMap = {
    'available': ['available','✅ Disponibile'],
    'exhausted': ['exhausted pulsing','🔴 Quota esaurita'],
    'expiring':  ['expiring','⚠️ Reset imminente'],
    'cycle-done':['available','🔄 Ciclo scaduto'],
  };
  const [pillCls, pillTxt] = pillMap[st];

  const cdLabelMap = {
    'available':  'Prossimo reset del ciclo tra',
    'exhausted':  'Sbloccato tra',
    'expiring':   'Reset tra',
    'cycle-done': 'Il ciclo è scaduto —',
  };
  const cdSubMap = {
    'available': `Data reset: ${fmtDateShort(resetDt)}`,
    'exhausted': `Sei bloccato fino al ${fmtDateShort(resetDt)}`,
    'expiring':  `Reset il ${fmtDateShort(resetDt)}`,
    'cycle-done':'avvia un nuovo ciclo',
  };
  const cdClass = st === 'available' ? 'available' : st === 'exhausted' ? 'exhausted' : st === 'expiring' ? 'expiring' : 'available';

  let actionBtns = '';
  if(st === 'cycle-done'){
    actionBtns = `<button class="action-btn new-cycle" data-newcycle="${a.id}">🔄 Ho mandato il 1° msg (Inizia Timer)</button>`;
  } else if(st === 'exhausted'){
    actionBtns = `
      <button class="action-btn restore" data-restore="${a.id}">✅ Quota ripristinata</button>
      <button class="action-btn new-cycle" data-newcycle="${a.id}">🔄 Nuovo ciclo</button>`;
  } else {
    actionBtns = `<button class="action-btn exhaust" data-exhaust="${a.id}">🔴 Quota esaurita ora</button>`;
  }

  const cycleDays = a.plan === 'pro' ? svcDef.proDays : svcDef.freeDays;

  return `<div class="account-card ${a.service} ${st==='exhausted'?'exhausted':st==='expiring'?'expiring':''}" data-id="${a.id}">
    <div class="card-header">
      <div class="avatar ${a.service}">${initials(a.name)}</div>
      <div class="card-info">
        <div class="card-name">${a.name}</div>
        <div class="card-email">${a.email||'—'}</div>
        <div class="card-meta">
          <span class="tag tag-${a.service}">${svcDef.icon} ${svcDef.name}</span>
          <span class="tag tag-${a.plan}">${a.plan==='free'?'Free':'Pro'}</span>
          <span class="status-pill ${pillCls}">${pillTxt}</span>
        </div>
        ${a.notes?`<div class="notes-line">💬 ${a.notes}</div>`:''}
      </div>
    </div>

    <div class="countdown-area">
      <div class="cd-row">
        <span class="cd-label">${cdLabelMap[st]}</span>
        <span class="cd-date">reset: ${fmtDateShort(resetDt)}</span>
      </div>
      <div class="cd-time ${cdClass}" data-cd="${a.id}">${st==='cycle-done'?'—':fmt(msLeft)}</div>
      <div class="cd-sublabel ${cdClass}">${cdSubMap[st]}</div>

      <div class="cycle-progress">
        <div class="cycle-progress-header">
          <span>Inizio ciclo: ${fmtDateShort(a.cycleStartedAt)}</span>
          <span>${cyclePct}% del ciclo trascorso</span>
        </div>
        <div class="cycle-bar-bg"><div class="cycle-bar-fill" style="width:${cyclePct}%"></div></div>
      </div>
    </div>

    <div class="quota-bar-wrap">
      <div class="quota-bar-header"><span>Quota rimanente</span><span style="color:${qLow?'var(--danger)':'var(--text-secondary)'};font-weight:700" id="card-qpct-${a.id}">${qpct}%</span></div>
      <div class="quota-bar-bg" style="position:relative;">
        <div class="quota-bar-fill ${qLow?'low':a.service}" style="width:${qpct}%" id="card-qfill-${a.id}"></div>
        <input type="range" class="inline-quota-slider" data-iqs="${a.id}" min="0" max="100" step="1" value="${qpct}" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0;" title="Trascina per modificare" />
      </div>
    </div>

    <div class="card-actions-row" style="margin-top:12px">${actionBtns}</div>

    <div class="card-footer">
      <div class="card-footer-info">⏱ Ciclo di ${cycleDays} giorni</div>
      <div class="icon-btns">
        <button class="icon-btn edit" data-edit="${a.id}" title="Modifica">✏️</button>
        <button class="icon-btn del"  data-del="${a.id}"  title="Elimina">🗑</button>
      </div>
    </div>
  </div>`;
}

// ── RENDER DYNAMIC SECTIONS ───────────────────────────────────────────────
function renderDashboardStructure() {
  const container = document.getElementById('dashboard-sections');
  container.innerHTML = '';
  
  services.forEach(svc => {
    container.innerHTML += `
      <div class="section-header">
        <span style="font-size:1.1rem">${svc.icon}</span>
        <h2>${svc.name}</h2>
        <span class="section-badge tag-${svc.id}" id="${svc.id}-count" style="margin-left:auto">0 account</span>
      </div>
      <div class="controls-bar">
        <span class="sort-label">Ordina:</span>
        <button class="sort-btn active" data-section="${svc.id}" data-sort="reset">Prossimo reset</button>
        <button class="sort-btn" data-section="${svc.id}" data-sort="status">Stato</button>
        <button class="sort-btn" data-section="${svc.id}" data-sort="name">Nome</button>
      </div>
      <div class="cards-grid" id="${svc.id}-grid"></div>
    `;
    if(!sortState[svc.id]) sortState[svc.id] = 'reset';
  });

  // Re-bind sort buttons
  document.querySelectorAll('.sort-btn').forEach(b=>b.addEventListener('click',()=>{
    const s=b.dataset.section,k=b.dataset.sort;
    sortState[s]=k;
    document.querySelectorAll(`[data-section="${s}"]`).forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderSection(s); bindCards();
  }));
}

function renderSection(svcId){
  const list = accounts.filter(a=>a.service===svcId);
  const grid = document.getElementById(`${svcId}-grid`);
  if(!grid) return;
  const countEl = document.getElementById(`${svcId}-count`);
  if(countEl) countEl.textContent=`${list.length} account`;
  
  const svcDef = getServiceDef(svcId);

  if(!list.length){
    grid.innerHTML=`<div class="empty-state"><div class="icon">${svcDef.icon}</div><p>Nessun account ancora.</p><button class="btn btn-ghost btn-sm" onclick="openAdd('${svcId}')">+ Aggiungi il primo</button></div>`;
    return;
  }
  grid.innerHTML=sorted(list,sortState[svcId]).map(renderCard).join('');
}

function renderStats(){
  const tot  = accounts.length;
  const avail= accounts.filter(a=>a.quotaStatus!=='exhausted'&&getMsToReset(a)>0).length;
  const exh  = accounts.filter(a=>a.quotaStatus==='exhausted').length;
  document.getElementById('stat-total').textContent    =tot;
  document.getElementById('stat-available').textContent=avail;
  document.getElementById('stat-exhausted').textContent=exh;
  const blocked=accounts.filter(a=>a.quotaStatus==='exhausted'&&getMsToReset(a)>0).sort((a,b)=>getMsToReset(a)-getMsToReset(b));
  if(blocked.length){
    document.getElementById('stat-next').textContent    =fmt(getMsToReset(blocked[0]));
    document.getElementById('stat-next-who').textContent=blocked[0].name;
  } else {
    document.getElementById('stat-next').textContent    ='—';
    document.getElementById('stat-next-who').textContent='nessun account bloccato';
  }
}

function renderAll(){ 
  injectDynamicCSS();
  renderDashboardStructure();
  services.forEach(s => renderSection(s.id)); 
  renderStats(); 
  bindCards(); 
  populateServiceSelect();
}

function populateServiceSelect() {
  const sel = document.getElementById('field-service');
  sel.innerHTML = '';
  services.forEach(s => {
    sel.innerHTML += `<option value="${s.id}">${s.icon} ${s.name}</option>`;
  });
}

// ── TICK ──────────────────────────────────────────────────────────────────
function tick(){
  accounts.forEach(a=>{
    const el=document.querySelector(`[data-cd="${a.id}"]`);
    if(!el) return;
    const st=cardStatus(a);
    el.textContent = st==='cycle-done'?'—':fmt(getMsToReset(a));
    el.className   = `cd-time ${st==='exhausted'?'exhausted':st==='expiring'?'expiring':'available'}`;
  });
  renderStats();
  const n=new Date();
  document.getElementById('header-clock').textContent=
    n.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})+' · '+
    n.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(tick,1000); tick();

// ── CARD EVENTS ───────────────────────────────────────────────────────────
function bindCards(){
  document.querySelectorAll('[data-exhaust]').forEach(b=>b.addEventListener('click',()=>{
    const a=accounts.find(x=>x.id===b.dataset.exhaust);
    if(!a) return;
    if(confirm(`Segnare "${a.name}" come quota ESAURITA?\nIl countdown mostrerà quanto manca al reset (${fmtDateShort(getResetDate(a))}).`)){
      a.quotaStatus='exhausted'; save(accounts); renderAll(); toast(`🔴 ${a.name} — quota segnata come esaurita`);
    }
  }));
  document.querySelectorAll('[data-restore]').forEach(b=>b.addEventListener('click',()=>{
    const a=accounts.find(x=>x.id===b.dataset.restore);
    if(!a) return;
    a.quotaStatus='available'; save(accounts); renderAll(); toast(`✅ ${a.name} — quota ripristinata!`);
  }));
  document.querySelectorAll('[data-newcycle]').forEach(b=>b.addEventListener('click',()=>{
    const a=accounts.find(x=>x.id===b.dataset.newcycle);
    if(!a) return;
    const svc = getServiceDef(a.service);
    const days= a.plan === 'pro' ? svc.proDays : svc.freeDays;
    if(confirm(`Avviare un nuovo ciclo di ${days} giorni per "${a.name}" a partire da ADESSO?`)){
      a.cycleStartedAt=new Date().toISOString(); a.quotaStatus='available'; a.quotaPercent=100;
      save(accounts); renderAll(); toast(`🔄 Nuovo ciclo avviato per ${a.name}!`);
    }
  }));
  document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openEdit(b.dataset.edit)));
  document.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
    if(confirm('Eliminare questo account?')){ accounts=accounts.filter(a=>a.id!==b.dataset.del); save(accounts); renderAll(); toast('🗑 Account eliminato'); }
  }));
  document.querySelectorAll('.inline-quota-slider').forEach(s=>{
    s.addEventListener('input', function(){
      const a = accounts.find(x=>x.id===this.dataset.iqs); if(!a) return;
      const v = this.value;
      const pctEl = document.getElementById(`card-qpct-${a.id}`);
      const fillEl = document.getElementById(`card-qfill-${a.id}`);
      if(pctEl){ pctEl.textContent = v + '%'; pctEl.style.color = v < 25 ? 'var(--danger)' : 'var(--text-secondary)'; }
      if(fillEl){ fillEl.style.width = v + '%'; fillEl.className = `quota-bar-fill ${v < 25 ? 'low' : a.service}`; }
    });
    s.addEventListener('change', function(){
      const a = accounts.find(x=>x.id===this.dataset.iqs);
      if(a){ a.quotaPercent = parseInt(this.value); save(accounts); }
    });
  });
}

// ── MODAL ACCOUNT ─────────────────────────────────────────────────────────
const overlay=document.getElementById('modal-overlay');
const form=document.getElementById('account-form');

function closeModal(){ overlay.classList.remove('open'); form.reset(); editingId=null; document.getElementById('field-id').value=''; document.getElementById('modal-title').textContent='Aggiungi Account'; document.getElementById('modal-save').textContent='Salva Account'; document.getElementById('quota-pct-input').value='100'; }
function openModal(){ overlay.classList.add('open'); }

function openAdd(svcId){
  closeModal();
  document.getElementById('field-service').value=svcId || services[0].id;
  document.getElementById('field-cycle-start').value=toLocal(new Date());
  document.getElementById('field-quota-pct').value=100;
  document.getElementById('quota-pct-input').value='100';
  openModal();
}
function openEdit(id){
  const a=accounts.find(x=>x.id===id); if(!a) return;
  editingId=id;
  document.getElementById('modal-title').textContent='Modifica Account';
  document.getElementById('modal-save').textContent='Aggiorna';
  document.getElementById('field-id').value=id;
  document.getElementById('field-service').value=a.service;
  document.getElementById('field-plan').value=a.plan;
  document.getElementById('field-name').value=a.name;
  document.getElementById('field-email').value=a.email||'';
  document.getElementById('field-notes').value=a.notes||'';
  document.getElementById('field-cycle-start').value=toLocal(a.cycleStartedAt);
  document.getElementById('field-quota-status').value=a.quotaStatus||'available';
  const qp=a.quotaPercent??100;
  document.getElementById('field-quota-pct').value=qp;
  document.getElementById('quota-pct-input').value=qp;
  openModal();
}

// chips
function setCS(dt){ document.getElementById('field-cycle-start').value=toLocal(dt); }
if(document.getElementById('chip-now')) {
  document.getElementById('chip-now').addEventListener('click',()=>setCS(new Date()));
  document.getElementById('chip-1h').addEventListener('click',()=>setCS(new Date(Date.now()-3600000)));
  document.getElementById('chip-today').addEventListener('click',()=>{const d=new Date();d.setHours(8,0,0,0);setCS(d);});
  document.getElementById('chip-yesterday').addEventListener('click',()=>setCS(new Date(Date.now()-86400000)));
  document.getElementById('chip-standby').addEventListener('click',()=>setCS(new Date(Date.now()-(40*86400000)))); // 40 giorni fa per farlo scadere subito
}

// slider ↔ numero input — sincronizzazione bidirezionale
if(document.getElementById('field-quota-pct')) {
  document.getElementById('field-quota-pct').addEventListener('input', function(){
    document.getElementById('quota-pct-input').value = this.value;
  });
  function syncFromInput(){
    let v = parseInt(document.getElementById('quota-pct-input').value);
    if(isNaN(v)) return;
    v = Math.max(0, Math.min(100, v));
    document.getElementById('quota-pct-input').value = v;
    document.getElementById('field-quota-pct').value  = v;
  }
  document.getElementById('quota-pct-input').addEventListener('input',  syncFromInput);
  document.getElementById('quota-pct-input').addEventListener('change', syncFromInput);
  document.getElementById('quota-pct-input').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); syncFromInput(); } });

  form.addEventListener('submit',e=>{
    e.preventDefault();
    const id     =document.getElementById('field-id').value||newId();
    const service=document.getElementById('field-service').value;
    const plan   =document.getElementById('field-plan').value;
    const name   =document.getElementById('field-name').value.trim();
    const email  =document.getElementById('field-email').value.trim();
    const notes  =document.getElementById('field-notes').value.trim();
    const cs     =document.getElementById('field-cycle-start').value;
    const qs     =document.getElementById('field-quota-status').value;
    const qp     =parseInt(document.getElementById('field-quota-pct').value);
    if(!name||!cs) return;
    const acc={id,service,plan,name,email,notes,cycleStartedAt:new Date(cs).toISOString(),quotaStatus:qs,quotaPercent:qp};
    if(editingId){ accounts=accounts.map(a=>a.id===editingId?acc:a); toast('✅ Account aggiornato!'); }
    else         { accounts.push(acc); toast('🎉 Account aggiunto!'); }
    save(accounts); closeModal(); renderAll();
  });
}

document.getElementById('btn-add').addEventListener('click',()=>openAdd(services[0].id));
document.getElementById('fab-add').addEventListener('click',()=>openAdd(services[0].id));
document.getElementById('modal-close').addEventListener('click',closeModal);
document.getElementById('modal-cancel').addEventListener('click',closeModal);
overlay.addEventListener('click',e=>{ if(e.target===overlay) closeModal(); });

// ── MODAL SETTINGS (SERVIZI CUSTOM) ───────────────────────────────────────
const settingsOverlay = document.getElementById('settings-overlay');
function closeSettings() { settingsOverlay.classList.remove('open'); }
function openSettings() { renderSettingsList(); settingsOverlay.classList.add('open'); }

if (document.getElementById('btn-settings')) {
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click',e=>{ if(e.target===settingsOverlay) closeSettings(); });
}

function renderSettingsList() {
  const listEl = document.getElementById('settings-services-list');
  listEl.innerHTML = '';
  services.forEach((s, idx) => {
    listEl.innerHTML += `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,.03); padding:10px 14px; border-radius:8px; margin-bottom:8px; border:1px solid var(--border);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.4rem;">${s.icon}</span>
          <div>
            <div style="font-weight:600; font-size:.9rem;">${s.name}</div>
            <div style="font-size:.7rem; color:var(--text-muted);">Free: ${s.freeDays}g | Pro: ${s.proDays}g</div>
          </div>
        </div>
        <button class="icon-btn del btn-del-svc" data-idx="${idx}" title="Elimina servizio" style="width:28px;height:28px;font-size:.8rem;">🗑</button>
      </div>
    `;
  });
  document.querySelectorAll('.btn-del-svc').forEach(b => {
    b.addEventListener('click', function() {
      const idx = this.dataset.idx;
      if (confirm(`Eliminare il servizio "${services[idx].name}"? Gli account associati a questo servizio potrebbero non funzionare correttamente finché non li riassegni.`)) {
        services.splice(idx, 1);
        saveServices(services);
        renderSettingsList();
        renderAll();
      }
    });
  });
}

if(document.getElementById('settings-form')) {
  document.getElementById('settings-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('svc-name').value.trim();
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0,6) + Math.floor(Math.random()*100);
    const icon = document.getElementById('svc-icon').value.trim() || '⚙️';
    const colorFrom = document.getElementById('svc-color-from').value;
    const colorTo = document.getElementById('svc-color-to').value;
    const freeDays = parseInt(document.getElementById('svc-free').value) || 30;
    const proDays = parseInt(document.getElementById('svc-pro').value) || 30;

    if(!name) return;
    services.push({ id, name, icon, colorFrom, colorTo, freeDays, proDays });
    saveServices(services);
    document.getElementById('settings-form').reset();
    renderSettingsList();
    renderAll();
    toast('✅ Nuovo servizio aggiunto!');
  });
}

// ── EXPORT / IMPORT ───────────────────────────────────────────────────────
document.getElementById('btn-export').addEventListener('click',()=>{
  const data = { accounts, services };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:`ai-quota-backup-${new Date().toISOString().slice(0,10)}.json`});
  a.click(); URL.revokeObjectURL(url); toast('📤 Backup esportato!');
});
document.getElementById('btn-import').addEventListener('click',()=>document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change',e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const imp=JSON.parse(ev.target.result);
      if(Array.isArray(imp)) {
        // Vecchio formato (solo account)
        if(confirm(`Importare ${imp.length} account? I dati attuali verranno sostituiti.`)){ accounts=imp; save(accounts); renderAll(); toast(`📥 ${imp.length} account importati!`); }
      } else if (imp.accounts && imp.services) {
        // Nuovo formato
        if(confirm(`Importare backup completo? I dati attuali verranno sostituiti.`)){ 
          accounts=imp.accounts; services=imp.services; 
          save(accounts); saveServices(services); 
          renderAll(); toast(`📥 Backup importato!`); 
        }
      } else throw 0;
    }catch{ toast('❌ File non valido!',true); }
  };
  r.readAsText(f); e.target.value='';
});

// ── TOAST ─────────────────────────────────────────────────────────────────
function toast(msg,err=false){
  const el=document.createElement('div');
  el.className='toast'+(err?' error':'');
  el.textContent=msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),350); },3000);
}

// ── DAY/NIGHT MODE ─────────────────────────────────────────────────────────
function updateTheme(){
  const h=new Date().getHours();
  if(h>=7 && h<19) document.body.classList.add('day-mode');
  else document.body.classList.remove('day-mode');
}
updateTheme(); setInterval(updateTheme, 60000);

// ── INIT ──────────────────────────────────────────────────────────────────
renderAll();
