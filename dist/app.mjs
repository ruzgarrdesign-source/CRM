import {createInitialState,currentUser,visibleReports,visibleTasks,visibleShifts,canReview,canAccessOffice,reduceState,migrateState,taskDurations,STATUS_LABELS,VISUAL_TYPES,OFFICE_CATEGORIES} from './domain.mjs';

const $ = (q, root=document) => root.querySelector(q);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
 check:'m5 12 4 4L19 6', reviews:'M9 5H5v16h14V5h-4 M9 3h6v4H9z m0 11 2 2 4-4',
 tasks:'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
 report:'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h6',
 calendar:'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M7 14h2 M13 14h2 M7 18h2',
 image:'M3 3h18v18H3z m0 14 6-6 4 4 3-3 5 5 M15 7h.01',
 users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M19 8a3 3 0 0 1 0 6 M22 21v-2a4 4 0 0 0-3-3 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
 search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
 arrow:'M5 12h14 m-5-5 5 5-5 5', left:'M19 12H5 m5-5-5 5 5 5',
 plus:'M12 5v14 M5 12h14', close:'m6 6 12 12 M6 18 18 6',
 upload:'M12 16V3 m-5 5 5-5 5 5 M4 15v6h16v-6',
 cloud:'M5 18a5 5 0 1 1 1-10 6 6 0 0 1 12 1 4.5 4.5 0 1 1 1 9 M8 18h8',
 expand:'M8 3H3v5 M16 3h5v5 M3 16v5h5 M16 21h5v-5',
 zoom:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M10 6v8 M6 10h8',
 clock:'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 menu:'M4 6h16 M4 12h16 M4 18h16', lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',
 download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5', refresh:'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 2 M18 18a8 8 0 0 1-13-2'
};
const icon = name => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(paths[name]||paths.grid)+'"/></svg>';
const roleNames={admin:'Sistem yöneticisi',operations_manager:'Operasyon yöneticisi',team_lead:'Ekip lideri',employee:'Çalışan'};
const dateFmt=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const dt=v=>v ? dateFmt.format(new Date(v)) : '—';
const shortDate=v=>v ? new Date(v+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'}) : '—';
const avatar=u=>'<span class="avatar">'+esc(u?.initials||'?')+'</span>';
const badge=status=>'<span class="pill '+esc(status)+'">'+esc(STATUS_LABELS[status]||status)+'</span>';
const button=(action,label,style='secondary',ico='',extra='')=>'<button type="button" class="btn '+style+'" data-action="'+action+'" '+extra+'>'+(ico?icon(ico):'')+label+'</button>';
const empty=(title,detail)=>'<div class="empty">'+icon('reviews')+'<h2>'+esc(title)+'</h2><p>'+esc(detail)+'</p></div>';
let state, db, inMemory=false, busy=false;
let ui={page:'review',selectedId:null,imageIndex:0,search:'',team:'',person:'',status:'pending',zoom:false,version:'',navOpen:false,formId:null,taskId:'',formImages:[],taskForm:false,shiftForm:false,shiftEventForm:false,reportStatus:'all',archiveStatus:'all',formError:'',shiftMonth:new Date().toISOString().slice(0,7),reportMonth:'all',officeMonth:new Date().toISOString().slice(0,7)};
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('gorsel-operasyon-v1') : null;
function notify(message,error=false){const el=$('#toast');el.textContent=message;el.className='show'+(error?' error':'');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.className='',4800)}
function user(id){return state.users.find(u=>u.id===id)}
function task(id){return state.tasks.find(t=>t.id===id)}
function taskDisplayTitle(t){return t.company && !t.title.startsWith(t.company+' · ')?t.company+' · '+t.title:t.title}
function teamName(id){return state.teams.find(t=>t.id===id)?.name||'—'}
function isManager(){return currentUser(state).role!=='employee'}
function officeAllowed(){return canAccessOffice(state)}
const money=value=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(value||0);
const duration=ms=>ms===null||ms===undefined?'—':ms<3600000?Math.round(ms/60000)+' dk':(ms/3600000).toLocaleString('tr-TR',{maximumFractionDigits:1})+' sa';
const monthTitle=month=>new Date(month+'-01T12:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
function scopeUsers(){const u=currentUser(state);return state.users.filter(p=>u.role==='employee'?p.id===u.id:u.role==='team_lead'?p.teamId===u.teamId:true)}
function selectableWorkers(){return scopeUsers().filter(u=>u.role==='employee'||u.role==='team_lead')}
function selectedReport(){return visibleReports(state).find(r=>r.id===ui.selectedId)}
function ownNotifications(){return state.notifications.filter(n=>n.userId===state.currentUserId)}
function ownReports(){return visibleReports(state)}
function imageSource(src){return /^(assets\/demo-0[1-4]\.svg|data:image\/(?:png|jpeg|webp);base64,)/.test(src||'')?src:''}
function selectedImages(r){if(ui.version){return r.versions?.find(v=>String(v.revision)===ui.version)?.images||r.images}return r.images}
function feedbackImage(r,id){return r.images.find(im=>im.id===id)||r.versions?.flatMap(v=>v.images).find(im=>im.id===id)}

async function openStorage(){
  return new Promise((resolve,reject)=>{const req=indexedDB.open('gorsel-operasyon-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('workspace');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
}
async function readState(){return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readonly');const req=tx.objectStore('workspace').get('state');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function persistAction(action){
  if(inMemory){state=reduceState(state,action);return}
  const next=await new Promise((resolve,reject)=>{
    const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace');let nextState,problem;
    const req=store.get('state');
    req.onsuccess=()=>{try{nextState=reduceState(req.result||state,action);store.put(nextState,'state')}catch(e){problem=e;tx.abort()}};
    tx.oncomplete=()=>resolve(nextState);tx.onerror=()=>reject(problem||tx.error);tx.onabort=()=>reject(problem||tx.error||new Error('Değişiklik kaydedilemedi.'));
  });
  state=next;channel?.postMessage('changed');
}
async function dispatch(action,message,{renderAfter=true}={}){
  if(busy)return false;busy=true;
  try{await persistAction(action);if(renderAfter)render();if(message)notify(message);return true}
  catch(e){notify(e.message||'Değişiklik kaydedilemedi. Depolama alanını kontrol et.',true);return false}
  finally{busy=false}
}
async function replaceState(next){
  if(inMemory){state=next;return}
  await new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(next,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});state=next;channel?.postMessage('changed');
}

const pageInfo={
 review:['İnceleme','Görselleri incele, geri bildirim ver ve üretimi ilerlet.'],
 tasks:['İşler','Üretimin her adımı, tek bir yerde.'],
 reports:['Raporlar','Teslim, bekleme ve tasarım sürelerini iş kayıtlarıyla birlikte incele.'],
 shifts:['Vardiyalar','Aylık vardiyaları, ek mesai ve izin kayıtlarını yönet.'],
 office:['Ofis','Gelir ve gider kayıtlarını yalnız yönetici rollerinde takip et.'],
 archive:['Görsel arşiv','Her görselin arkasındaki işe ve rapora ulaş.'],
 team:['Ekip ve özetler','Üretim kayıtlarını gör. Sayılar bir performans puanı değildir.'],
 settings:['Ayarlar','Çalışma alanı, demo rolleri ve entegrasyon durumu.'],
 form:['Rapor hazırla','Görsellerini ve üretim notunu aynı raporda topla.'],
 notifications:['Bildirimler','İş akışındaki son gelişmeler.']
};
function navItem(page,label,ico,count=''){
  return '<button class="nav-btn '+(ui.page===page?'active':'')+'" data-page="'+page+'" title="'+esc(label)+'" '+(ui.page===page?'aria-current="page"':'')+'>'+icon(ico)+'<span class="nav-label">'+esc(label)+'</span>'+(count!==''?'<span class="count">'+count+'</span>':'')+'</button>';
}
function actorOptions(){return state.users.map(u=>'<option value="'+esc(u.id)+'" '+(u.id===state.currentUserId?'selected':'')+'>'+esc(u.name)+' · '+esc(roleNames[u.role])+'</option>').join('')}
function shell(content){
  const me=currentUser(state),pending=ownReports().filter(r=>r.status==='pending').length,unread=ownNotifications().filter(n=>!n.read).length;
  let info=pageInfo[ui.page]||pageInfo.review;
  let title=info[0];if(me.role==='employee')title=({tasks:'İşlerim',reports:'Raporlarım',shifts:'Vardiyalarım',team:'Üretim özetim'}[ui.page]||title);
  return '<div class="shell '+(ui.navOpen?'nav-open':'')+'">'+(ui.navOpen?'<button type="button" class="nav-backdrop" data-action="close-menu" aria-label="Menüyü kapat"></button>':'')+'<aside id="sidebar-menu" class="sidebar" aria-label="Ana gezinme"><button type="button" class="icon-btn sidebar-close" data-action="close-menu" aria-label="Menüyü kapat">'+icon('close')+'</button><div class="brand"><span class="brand-mark"><i></i><i></i><i></i><i></i></span><div class="brand-text">Görsel Operasyon<small>Üretim çalışma alanı</small></div></div><nav class="nav">'+
  (isManager()?navItem('review','İnceleme','reviews',pending):'')+
  navItem('tasks',me.role==='employee'?'İşlerim':'İşler','tasks')+navItem('reports',me.role==='employee'?'Raporlarım':'Raporlar','report')+navItem('shifts',me.role==='employee'?'Vardiyalarım':'Vardiyalar','calendar')+
  '<div class="nav-separator"></div>'+navItem('archive','Görsel arşiv','image')+navItem('team',me.role==='employee'?'Üretim özetim':'Ekip ve özetler','users')+(officeAllowed()?navItem('office','Ofis','grid'):'')+navItem('settings','Ayarlar','settings')+
  '</nav><div class="sidebar-foot"><div class="connection">'+icon('cloud')+'<div><strong>Yerel demo arşivi</strong><span>Drive henüz bağlı değil</span></div></div><div class="actor"><label for="actor">DEMO · ROLÜ DENE</label><select id="actor" data-control="actor">'+actorOptions()+'</select></div><div class="user-line">'+avatar(me)+'<div>'+esc(me.name)+'<small>'+esc(roleNames[me.role])+'</small></div></div></div></aside>'+
  '<div class="workspace"><header class="topbar"><button class="icon-btn menu-toggle" data-action="menu" aria-controls="sidebar-menu" aria-expanded="'+ui.navOpen+'" aria-label="Menüyü aç veya kapat">'+icon('menu')+'</button><div class="breadcrumb">Çalışma alanı <span aria-hidden="true"> / </span> <strong>'+esc(title)+'</strong></div><div class="topbar-actions"><span class="demo-tag">DEMO · ÖRNEK VERİLER</span><button class="icon-btn notification-button" data-page="notifications" aria-label="Bildirimler'+(unread?', '+unread+' okunmamış':'')+'">'+icon('bell')+(unread?'<span class="notification-dot"></span>':'')+'</button>'+avatar(me)+'</div></header>'+
  '<main id="main"><div class="page-head"><div><h1>'+esc(title)+'</h1><p>'+esc(info[1])+'</p></div><div class="head-date">'+new Date().toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',weekday:'long'})+'</div></div><div class="page-content">'+(inMemory?'<div class="notice warning">Tarayıcı depolaması kullanılamıyor. Bu oturumdaki değişiklikler sayfa kapanınca silinir.</div>':'')+content+'</div></main></div></div>';
}
function filters(){
  const teams=state.teams.filter(t=>scopeUsers().some(u=>u.teamId===t.id));
  return '<div class="filters"><label class="search">'+icon('search')+'<input id="queue-search" data-control="search" aria-label="Rapor veya çalışan ara" placeholder="Rapor veya çalışan ara…" value="'+esc(ui.search)+'"></label><select data-control="team" aria-label="Ekip filtresi"><option value="">Tüm ekipler</option>'+teams.map(t=>'<option value="'+t.id+'" '+(ui.team===t.id?'selected':'')+'>'+esc(t.name)+'</option>').join('')+'</select><select data-control="person" aria-label="Çalışan filtresi"><option value="">Tüm çalışanlar</option>'+scopeUsers().map(u=>'<option value="'+u.id+'" '+(ui.person===u.id?'selected':'')+'>'+esc(u.name)+'</option>').join('')+'</select><select data-control="status" aria-label="Rapor durumu">'+['pending','revision','approved','draft','all'].map(s=>'<option value="'+s+'" '+(ui.status===s?'selected':'')+'>'+esc(s==='all'?'Tüm durumlar':STATUS_LABELS[s])+'</option>').join('')+'</select><span class="filter-total">'+filteredReports().length+' rapor</span></div>';
}
function filteredReports(){const q=ui.search.toLocaleLowerCase('tr');return ownReports().filter(r=>(ui.status==='all'||r.status===ui.status)&&(!ui.team||r.teamId===ui.team)&&(!ui.person||r.authorId===ui.person)&&(!q||(r.title+' '+user(r.authorId)?.name+' '+r.id).toLocaleLowerCase('tr').includes(q))).sort((a,b)=>new Date(a.submittedAt||a.createdAt)-new Date(b.submittedAt||b.createdAt))}
function reportCard(r){const u=user(r.authorId);return '<button class="report-card '+(ui.selectedId===r.id?'selected':'')+'" data-action="select-report" data-id="'+r.id+'" aria-pressed="'+(ui.selectedId===r.id)+'"><div class="report-card-top">'+avatar(u)+'<div><div class="report-card-name">'+esc(u?.name)+'</div><div class="report-card-time">'+esc(dt(r.submittedAt||r.createdAt))+'</div></div></div><h3>'+esc(r.title)+'</h3><div class="report-card-foot">'+badge(r.status)+'<span class="asset-count">'+icon('image')+r.images.length+' görsel</span></div></button>'}
function reviewPage(){
  const list=filteredReports();
  if(!ui.selectedId || !ownReports().some(r=>r.id===ui.selectedId))ui.selectedId=list[0]?.id||null;
  const r=selectedReport();
  return filters()+'<section class="review" aria-label="Rapor inceleme"><div class="queue"><div class="pane-title">Rapor kuyruğu <span>'+list.length+' kayıt</span></div>'+list.map(reportCard).join('')+(list.length?'':'<div class="empty inset"><h2>Rapor bulunamadı</h2><p>Bu filtrelerde kayıt yok.</p>'+button('clear-filters','Filtreleri temizle','secondary compact')+'</div>')+'</div>'+
  (r?viewer(r)+detail(r):'<div class="viewer">'+empty('İncelenecek rapor yok','Yeni raporlar gönderildiğinde burada görünecek.')+'</div><div class="details">'+empty('Bir rapor seç','İş bilgileri ve karar alanı burada açılacak.')+'</div>')+'</section><div class="review-foot"><span>'+icon('lock')+'Yalnızca rolünün kapsamındaki kayıtlar gösterilir.</span><span>Demo kayıtları bu tarayıcıda saklanır · Drive bağlı değil</span></div>';
}
function viewer(r){
  const images=selectedImages(r);ui.imageIndex=Math.min(ui.imageIndex,Math.max(images.length-1,0));const im=images[ui.imageIndex];
  return '<div class="viewer"><div class="viewer-toolbar"><span class="filename" title="'+esc(im?.name||'')+'">'+esc(im?.name||'Görsel yok')+'</span><button class="btn compact '+(!ui.zoom?'soft':'secondary')+'" data-action="fit" aria-pressed="'+!ui.zoom+'">Sığdır</button><button class="icon-btn" data-action="zoom" aria-label="Gerçek boyutta göster" aria-pressed="'+ui.zoom+'">'+icon('zoom')+'</button><button class="icon-btn" data-action="fullscreen" aria-label="Görseli tam ekran aç">'+icon('expand')+'</button></div><div class="canvas '+(ui.zoom?'zoomed':'')+'">'+(im?'<img id="main-image" src="'+esc(imageSource(im.src))+'" alt="'+esc(im.name)+'">':'<div class="image-empty">Bu rapora henüz görsel eklenmemiş.</div>')+'</div><div class="canvas-caption"><span>'+(im?String(ui.imageIndex+1)+' / '+images.length+' görsel':'Görsel bekleniyor')+'</span><span>'+esc(ui.version?'Gönderim v'+ui.version:'Güncel gönderim · v'+r.revision)+'</span></div><div class="strip" aria-label="Rapordaki görseller">'+images.map((a,i)=>'<button class="thumbnail '+(i===ui.imageIndex?'active':'')+'" data-action="select-image" data-index="'+i+'" aria-label="'+esc(a.name)+' görselini aç" aria-pressed="'+(i===ui.imageIndex)+'"><img src="'+esc(imageSource(a.src))+'" alt=""><span class="thumb-index">'+(i+1)+'</span></button>').join('')+'</div></div>';
}
function detail(r){
  const v=ui.version?r.versions?.find(item=>String(item.revision)===ui.version):null,view=v||r;
  const u=user(r.authorId),t=task(view.taskId),shift=state.shifts.find(s=>s.id===view.shiftId),reviewable=canReview(state,r)&&!ui.version;
  return '<aside class="details" aria-label="Rapor bilgileri ve karar"><div class="pane-title">Rapor bilgileri '+badge(r.status)+'</div><div class="detail-body"><div class="report-id">Rapor '+esc(r.id.toUpperCase())+(v?' · Önceki gönderim v'+v.revision:'')+'</div><h2>'+esc(view.title)+'</h2><div class="person">'+avatar(u)+'<div><strong style="font-size:12px">'+esc(u?.name)+'</strong><div class="muted" style="font-size:10px">'+esc(teamName(r.teamId))+'</div></div></div><dl class="metadata"><dt>Firma</dt><dd>'+esc(t?.company||'—')+'</dd><dt>Görsel türü</dt><dd>'+esc(VISUAL_TYPES[t?.visualType]||'—')+'</dd><dt>İş</dt><dd>'+esc(t?.title||'—')+'</dd><dt>Vardiya</dt><dd>'+esc(shift?shortDate(shift.date)+' · '+shift.start+'–'+shift.end:'Belirtilmedi')+'</dd><dt>Gönderim</dt><dd>'+esc(dt(view.submittedAt))+'</dd><dt>Dosya</dt><dd>'+view.images.length+' görsel</dd></dl><hr class="section-rule"><h3>Üretim notu</h3><p class="note">'+esc(view.note||'Üretim notu eklenmemiş.')+'</p>'+
  (t?.description?'<hr class="section-rule"><h3>İşin kapsamı</h3><p class="note">'+esc(t.description)+'</p>':'')+
  (r.versions?.length>1?'<hr class="section-rule"><label for="version-select">Gönderim sürümü</label><div class="field"><select id="version-select" data-control="version"><option value="">Güncel gönderim · v'+r.revision+'</option>'+r.versions.filter(v=>v.revision<r.revision).map(v=>'<option value="'+v.revision+'" '+(ui.version===String(v.revision)?'selected':'')+'>Önceki v'+v.revision+' · '+esc(dt(v.submittedAt))+'</option>').join('')+'</select></div>':'')+
  (r.feedback.length?'<hr class="section-rule"><h3>Geri bildirim</h3>'+r.feedback.map(f=>'<div class="history-entry">'+esc(f.text)+(f.imageIds?.length?'<div class="feedback-images">'+f.imageIds.map(id=>{const im=feedbackImage(r,id);return im?'<button type="button" class="feedback-image" data-action="open-feedback-image" data-report="'+r.id+'" data-image="'+esc(id)+'" title="'+esc(im.name)+' görselini aç"><img src="'+esc(imageSource(im.src))+'" alt=""><span>'+esc(im.name)+'</span>'+icon('expand')+'</button>':''}).join('')+'</div>':'')+'<time>'+esc(user(f.byId)?.name)+' · '+esc(dt(f.at))+'</time></div>').join(''):'')+
  '<hr class="section-rule"><details><summary style="font-size:11px;cursor:pointer">İşlem geçmişi ('+r.history.length+')</summary>'+r.history.map(h=>'<div class="history-entry">'+esc(h.text||h.action)+'<time>'+esc(user(h.byId)?.name)+' · '+esc(dt(h.at))+'</time></div>').join('')+'</details></div>'+
  '<div class="decision">'+(reviewable?'<label for="review-note">İnceleme notu</label><textarea id="review-note" placeholder="Revizyon gerekiyorsa nedenini yaz…"></textarea><label class="scope-check"><input id="note-image" type="checkbox">Notu seçili görsele bağla</label><div class="decision-actions">'+button('request-revision','Revizyon iste','secondary','refresh')+button('approve','Raporu onayla','','check')+'</div><small>Karar, bu gönderimdeki '+r.images.length+' görselin tamamına uygulanır.</small>':
  (r.authorId===state.currentUserId&&['draft','revision'].includes(r.status)?button('edit-report','Raporu düzenle','','report','data-id="'+r.id+'"'): '<p class="muted" style="font-size:11px">'+(ui.version?'Önceki sürüm görüntüleniyor. Karar için güncel gönderime dön.':r.authorId===state.currentUserId&&r.status==='pending'?'Kendi raporun başka bir yetkili tarafından incelenecek.':r.status==='approved'?'Bu rapor onaylandı. Karar ve gönderim geçmişi korunuyor.':r.status==='revision'?'Düzeltmelerden sonra rapor yeniden gönderilecek.':'Bu kayıt için onay yetkin bulunmuyor.')+'</p>'))+
  (r.status!=='pending'?'<div style="margin-top:12px">'+button('next-report','Sonraki rapor','secondary full','arrow')+'</div>':'')+'</div></aside>';
}
function tasksPage(){
  const list=visibleTasks(state),manager=isManager();
  return '<div class="list-toolbar"><div class="tabs"><span class="muted">'+list.length+' iş · '+list.filter(t=>t.status==='design').length+' tasarım aşamasında</span></div>'+(manager?button('toggle-task','İş talebi oluştur','','plus'):'')+'</div>'+
  (ui.taskForm?taskForm():'')+(list.length?'<div class="table-wrap"><table class="task-table"><thead><tr><th>Firma ve iş</th><th>Görsel türü</th><th>Atanan</th><th>Durum</th><th>Teslim tarihi</th><th>İşlem</th></tr></thead><tbody>'+list.map(t=>'<tr><td><strong>'+esc(taskDisplayTitle(t))+'</strong><small>'+esc(t.company?'': 'Firma eklenmedi · ')+esc(t.description)+'</small></td><td>'+esc(VISUAL_TYPES[t.visualType]||'Belirtilmedi')+'</td><td><div class="person">'+avatar(user(t.assigneeId))+esc(user(t.assigneeId)?.name)+'</div></td><td><label class="sr-only" for="task-status-'+esc(t.id)+'">'+esc(t.title)+' durumu</label><select id="task-status-'+esc(t.id)+'" class="status-select" data-control="task-status" data-id="'+esc(t.id)+'">'+Object.entries(STATUS_LABELS).filter(([key])=>['waiting','design','canceled','completed'].includes(key)).map(([key,label])=>'<option value="'+key+'" '+(t.status===key?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select></td><td>'+esc(shortDate(t.dueDate))+'</td><td>'+(t.assigneeId===state.currentUserId?button('new-report','Rapor hazırla','soft compact','','data-task="'+t.id+'"'):'<span class="muted">—</span>')+'</td></tr>').join('')+'</tbody></table></div>':empty('Henüz iş yok',manager?'İlk iş talebini oluşturup bir çalışana atayabilirsin.':'Sana atanan işler burada görünecek.'))+
  '<p class="local-note">Çalışan kendi işinin durumunu doğrudan değiştirebilir. Durum geçmişi süre raporuna yansır; rapor onayı ayrı bir karardır.</p>';
}
function taskForm(){return '<form id="task-form" class="panel inline-form"><h2>Yeni iş talebi</h2><div class="field-row"><div class="field"><label for="task-company">Firma adı</label><input id="task-company" name="company" required maxlength="120" placeholder="Örn. Forma"></div><div class="field"><label for="task-visual">Görsel türü</label><select id="task-visual" name="visualType" required><option value="">Tür seçin</option>'+Object.entries(VISUAL_TYPES).map(([key,label])=>'<option value="'+key+'">'+esc(label)+'</option>').join('')+'</select></div></div><div class="field"><label for="task-title">İş başlığı</label><input id="task-title" name="title" required maxlength="180"></div><div class="field"><label for="task-description">İşin kapsamı</label><textarea id="task-description" name="description" required maxlength="2000"></textarea></div><div class="field-row"><div class="field"><label for="task-assignee">Atanan kişi</label><select id="task-assignee" name="assigneeId">'+selectableWorkers().map(u=>'<option value="'+u.id+'">'+esc(u.name)+'</option>').join('')+'</select></div><div class="field"><label for="task-due">Teslim tarihi</label><input type="date" id="task-due" name="dueDate"></div></div><div class="form-actions">'+button('toggle-task','Vazgeç','secondary')+'<button class="btn" type="submit">Talebi oluştur</button></div></form>'}
function reportsPage(){
  const list=ownReports().filter(r=>ui.reportStatus==='all'||r.status===ui.reportStatus).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const tasks=visibleTasks(state).filter(t=>ui.reportMonth==='all'||t.createdAt?.startsWith(ui.reportMonth));
  const measured=tasks.map(t=>({task:t,times:taskDurations(t)}));
  const exact=measured.filter(item=>!item.times.approximate);
  const completed=exact.filter(item=>item.times.deliveryMs!==null);
  const avg=completed.length?completed.reduce((sum,item)=>sum+item.times.deliveryMs,0)/completed.length:null;
  const totalWaiting=exact.reduce((sum,item)=>sum+item.times.waitingMs,0);
  const totalDesign=exact.reduce((sum,item)=>sum+item.times.designMs,0);
  const max=Math.max(1,...exact.map(item=>Math.max(item.times.waitingMs,item.times.designMs)));
  const chart=measured.length?measured.map(({task:t,times})=>'<div class="duration-row"><div class="duration-name"><strong>'+esc(taskDisplayTitle(t))+'</strong><span>'+esc(user(t.assigneeId)?.name)+' · '+esc(VISUAL_TYPES[t.visualType]||'Tür belirtilmedi')+'</span></div>'+(times.approximate?'<span class="muted">Eski kayıtta süre geçmişi yok</span>':'<div class="duration-bars"><div><span>Bekleme</span><div class="bar-track"><i class="bar waiting-bar" style="width:'+Math.max(times.waitingMs?2:0,100*times.waitingMs/max)+'%"></i></div><b>'+duration(times.waitingMs)+'</b></div><div><span>Tasarım</span><div class="bar-track"><i class="bar design-bar" style="width:'+Math.max(times.designMs?2:0,100*times.designMs/max)+'%"></i></div><b>'+duration(times.designMs)+'</b></div></div>')+'<div class="delivery-cell">Teslim <strong>'+duration(times.deliveryMs)+'</strong></div></div>').join(''):empty('Bu ay için ölçüm yok','Başka bir ay seçebilir veya yeni iş talebi oluşturabilirsin.');
  return '<div class="report-toolbar"><div class="field compact-field"><label for="report-month">İş oluşturma ayı</label><select id="report-month" data-control="report-month"><option value="all">Tüm zamanlar</option>'+[...new Set(visibleTasks(state).map(t=>t.createdAt?.slice(0,7)).filter(Boolean))].sort().reverse().map(month=>'<option value="'+month+'" '+(ui.reportMonth===month?'selected':'')+'>'+esc(monthTitle(month))+'</option>').join('')+'</select></div>'+button('export-excel','Excel için CSV indir','secondary','download')+'</div><div class="metric-strip"><div><span>İş sayısı</span><strong>'+tasks.length+'</strong></div><div><span>Ortalama teslim</span><strong>'+duration(avg)+'</strong></div><div><span>Toplam bekleme</span><strong>'+duration(totalWaiting)+'</strong></div><div><span>Toplam tasarım</span><strong>'+duration(totalDesign)+'</strong></div></div><section class="panel report-analysis"><div class="section-heading"><div><h2>İş süreleri</h2><p>İş talebinden tamamlanmaya kadar geçen süre ile durumlarda geçirilen süreler.</p></div><div class="chart-legend"><span><i class="legend-waiting"></i> Bekleme</span><span><i class="legend-design"></i> Tasarım</span></div></div>'+chart+'<p class="local-note">Açık işlerde teslim süresi boş kalır. Eski demo kayıtları durum geçmişi içermediği için süre hesabına katılmaz. Süreler iş durumu değişikliklerinden hesaplanır.</p></section><div class="list-toolbar"><div class="tabs">'+['all','draft','pending','revision','approved'].map(s=>'<button class="tab '+(ui.reportStatus===s?'active':'')+'" data-action="report-tab" data-value="'+s+'">'+(s==='all'?'Tümü':esc(STATUS_LABELS[s]))+'</button>').join('')+'</div>'+button('new-report','Rapor hazırla','','plus')+'</div>'+
  (list.length?'<div class="table-wrap"><table><thead><tr><th>Rapor</th><th>Firma / tür</th><th>Çalışan</th><th>Görsel</th><th>Durum</th><th>Gönderim</th><th>İşlem</th></tr></thead><tbody>'+list.map(r=>{const t=task(r.taskId);return '<tr><td><strong>'+esc(r.title)+'</strong><small>'+esc(r.id.toUpperCase())+' · v'+r.revision+'</small></td><td>'+esc(t?.company||'—')+'<small>'+esc(VISUAL_TYPES[t?.visualType]||'—')+'</small></td><td>'+esc(user(r.authorId)?.name)+'</td><td>'+r.images.length+'</td><td>'+badge(r.status)+'</td><td>'+esc(dt(r.submittedAt))+'</td><td>'+button('open-report','Raporu aç','secondary compact','arrow','data-id="'+r.id+'"')+'</td></tr>'}).join('')+'</tbody></table></div>':empty('Bu durumda rapor yok','Diğer durumları seçebilir veya yeni rapor hazırlayabilirsin.'));
}
function prepareForm(id=null,taskId=''){
  const r=ownReports().find(r=>r.id===id);
  if(r && (r.authorId!==state.currentUserId||!['draft','revision'].includes(r.status)))return notify('Bu rapor düzenlemeye açık değil.',true);
  ui.formId=id;ui.taskId=taskId||r?.taskId||'';ui.formImages=r?structuredClone(r.images):[];ui.formError='';navigate('form');
}
function formPage(){
  const r=ownReports().find(r=>r.id===ui.formId),tasks=visibleTasks(state).filter(t=>t.assigneeId===state.currentUserId&&t.status!=='canceled'),shifts=visibleShifts(state).filter(s=>s.userId===state.currentUserId&&(!s.kind||s.kind==='shift'));
  if(!tasks.length)return empty('Sana atanmış iş bulunmuyor','Rapor hazırlayabilmek için bir iş atanmalı. Demo rol seçicisinden Ayşe Demir veya Can Öz ile çalışan akışını deneyebilirsin.');
  return '<div class="notice">'+icon('cloud')+'<div>Demo arşivi: Yüklenen dosyalar yalnızca bu tarayıcıda saklanır. Google Drive’a aktarılmaz.</div></div><div class="form-layout"><form id="report-form" class="panel">'+
  (r?.status==='revision'?'<div class="notice warning"><div><strong>Bu rapor için revizyon istendi.</strong>'+r.feedback.slice(-1).map(f=>'<p>'+esc(f.text)+'</p>').join('')+'</div></div>':'')+
  '<h2>'+(r?'Raporu düzenle':'Yeni üretim raporu')+'</h2><div class="field"><label for="report-title">Rapor başlığı</label><input id="report-title" name="title" required maxlength="180" placeholder="Örn. FORMA sosyal medya görselleri" value="'+esc(r?.title||'')+'"></div><div class="field-row"><div class="field"><label for="report-task">İlgili iş</label><select name="taskId" id="report-task" required>'+tasks.map(t=>'<option value="'+t.id+'" '+(t.id===(ui.taskId||r?.taskId)?'selected':'')+'>'+esc(t.title)+'</option>').join('')+'</select></div><div class="field"><label for="report-shift">İlgili vardiya</label><select name="shiftId" id="report-shift"><option value="">Vardiya seçilmedi</option>'+shifts.map(s=>'<option value="'+s.id+'" '+(r?.shiftId===s.id?'selected':'')+'>'+shortDate(s.date)+' · '+s.start+'–'+s.end+'</option>').join('')+'</select></div></div><div class="field"><label for="report-note">Üretim notu</label><textarea id="report-note" name="note" maxlength="4000" placeholder="Neler hazırladın? Kontrol edilmesini istediğin bir detay var mı?">'+esc(r?.note||'')+'</textarea></div><div class="field"><label>Görseller</label><label class="upload-area" for="file-input">'+icon('upload')+'<strong>Görsellerini ekle</strong><span>PNG, JPG veya WebP · Dosya başına en fazla 10 MB · En fazla 30 görsel</span><input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" multiple></label><div id="upload-list" class="upload-list">'+uploadItems()+'</div><div id="upload-status" class="selected-file-note" role="status"></div></div><div class="form-actions">'+button('cancel-form','Vazgeç','secondary')+'<button class="btn secondary" type="submit" name="intent" value="save">Taslağı kaydet</button><button class="btn" type="submit" name="intent" value="send">'+icon('arrow')+'İncelemeye gönder</button></div></form><aside class="panel form-aside"><h2>Teslim akışı</h2><ol class="step-list"><li>İşi seç<small>Raporunu sana atanmış bir işle ilişkilendir.</small></li><li>Görselleri ekle<small>Her dosyanın yüklenmesini bekle.</small></li><li>İncelemeye gönder<small>Raporun yetkili kişinin kuyruğuna girer.</small></li><li>Geri bildirimi takip et<small>Revizyon notları ilgili görsele bağlanabilir.</small></li></ol><p class="local-note">Gönderilen rapor inceleme bitene kadar düzenlenemez. Revizyon istendiğinde yeni sürüm hazırlayabilirsin.</p></aside></div>';
}
function uploadItems(){return ui.formImages.map((im,i)=>'<div class="upload-item"><img src="'+esc(imageSource(im.src))+'" alt="'+esc(im.name)+'"><p title="'+esc(im.name)+'">'+esc(im.name)+'</p><button type="button" data-action="remove-upload" data-index="'+i+'">Kaldır</button></div>').join('')}
function shiftsPage(){
  const list=visibleShifts(state).filter(s=>s.date.startsWith(ui.shiftMonth)).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start));
  const [year,month]=ui.shiftMonth.split('-').map(Number),days=new Date(year,month,0).getDate(),offset=(new Date(year,month-1,1).getDay()+6)%7;
  const calendar=Array.from({length:offset},()=>'<div class="calendar-day outside" aria-hidden="true"></div>').join('')+Array.from({length:days},(_,i)=>{const day=i+1,date=ui.shiftMonth+'-'+String(day).padStart(2,'0'),items=list.filter(s=>s.date===date);return '<div class="calendar-day"><div class="calendar-date">'+day+'</div>'+items.slice(0,3).map(s=>'<span class="calendar-entry '+esc(s.kind||'shift')+'" title="'+esc(user(s.userId)?.name)+' · '+esc(s.kind==='leave'?'İzin · '+s.reason:s.start+'–'+s.end+(s.reason?' · '+s.reason:''))+'">'+esc(user(s.userId)?.name?.split(' ')[0])+' · '+(s.kind==='leave'?'İzin':s.kind==='overtime'?'Mesai':'Vardiya')+'</span>').join('')+(items.length>3?'<small>+'+(items.length-3)+' kayıt</small>':'')+'</div>'}).join('');
  return '<div class="list-toolbar"><div class="field compact-field"><label for="shift-month">Ay seç</label><input id="shift-month" type="month" data-control="shift-month" value="'+esc(ui.shiftMonth)+'"></div><div class="toolbar-actions">'+(isManager()?button('toggle-shift','Aylık düzen ekle','','plus')+button('toggle-shift-event','Mesai / izin ekle','secondary','clock'):'')+'</div></div>'+
  (ui.shiftForm?'<form class="panel inline-form" id="monthly-shift-form"><h2>Aylık vardiya düzeni</h2><div class="field-row"><div class="field"><label for="shift-user">Çalışan</label><select id="shift-user" name="userId">'+selectableWorkers().map(u=>'<option value="'+u.id+'">'+esc(u.name)+'</option>').join('')+'</select></div><div class="field"><label for="shift-plan-month">Ay</label><input id="shift-plan-month" type="month" name="month" value="'+esc(ui.shiftMonth)+'" required></div></div><fieldset class="weekday-set"><legend>Çalışma günleri</legend>'+['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map((label,i)=>'<label><input type="checkbox" name="weekday" value="'+((i+1)%7)+'" '+(i<5?'checked':'')+'>'+label+'</label>').join('')+'</fieldset><div class="field-row"><div class="field"><label for="shift-start">Başlangıç</label><input id="shift-start" type="time" name="start" value="09:00" required></div><div class="field"><label for="shift-end">Bitiş</label><input id="shift-end" type="time" name="end" value="18:00" required></div></div><small>Aynı gün biten vardiyalar eklenir. Çakışan günler atlanır.</small><div class="form-actions">'+button('toggle-shift','Vazgeç','secondary')+'<button class="btn" type="submit">Ayı planla</button></div></form>':'')+
  (ui.shiftEventForm?'<form class="panel inline-form" id="shift-event-form"><h2>Ek mesai / izin kaydı</h2><div class="field-row"><div class="field"><label for="event-user">Çalışan</label><select id="event-user" name="userId">'+selectableWorkers().map(u=>'<option value="'+u.id+'">'+esc(u.name)+'</option>').join('')+'</select></div><div class="field"><label for="event-kind">Kayıt türü</label><select id="event-kind" name="kind" data-control="event-kind"><option value="overtime">Ek mesai</option><option value="leave">İzin</option></select></div></div><div class="field-row"><div class="field"><label for="event-date">Tarih</label><input id="event-date" type="date" name="date" required></div><div class="field event-time"><label for="event-start">Başlangıç</label><input id="event-start" type="time" name="start" value="18:00" required></div><div class="field event-time"><label for="event-end">Bitiş</label><input id="event-end" type="time" name="end" value="20:00" required></div></div><div class="field"><label for="event-reason">Neden / açıklama</label><textarea id="event-reason" name="reason" maxlength="500" required placeholder="Mesai veya izin nedenini yazın"></textarea></div><div class="form-actions">'+button('toggle-shift-event','Vazgeç','secondary')+'<button class="btn" type="submit">Kaydı ekle</button></div></form>':'')+
  '<section class="month-calendar" aria-label="'+esc(monthTitle(ui.shiftMonth))+' vardiya takvimi"><div class="calendar-heading">'+['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'].map(label=>'<span>'+label+'</span>').join('')+'</div><div class="calendar-grid">'+calendar+'</div></section>'+
  (list.length?'<div class="table-wrap"><table><thead><tr><th>Çalışan</th><th>Tarih</th><th>Kayıt</th><th>Saat</th><th>Neden</th></tr></thead><tbody>'+list.map(s=>'<tr><td><div class="person">'+avatar(user(s.userId))+'<strong>'+esc(user(s.userId)?.name)+'</strong></div></td><td>'+shortDate(s.date)+'</td><td>'+esc(s.kind==='overtime'?'Ek mesai':s.kind==='leave'?'İzin':'Vardiya')+'</td><td>'+esc(s.kind==='leave'?'Tam gün':s.start+'–'+s.end)+'</td><td>'+esc(s.reason||'—')+'</td></tr>').join('')+'</tbody></table></div>':empty('Bu ay kayıt yok','Ayı değiştirebilir veya aylık vardiya düzeni ekleyebilirsin.'))+'<p class="local-note">Planlanan vardiyalar gerçekleşmiş çalışma süresi veya puantaj olarak sayılmaz.</p>';
}
function officePage(){
  if(!officeAllowed())return empty('Bu panele erişim yok','Ofis gelir ve giderlerini yalnız sistem ve operasyon yöneticileri görebilir.');
  const list=(state.officeEntries||[]).filter(item=>item.date.startsWith(ui.officeMonth)).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
  const income=list.filter(item=>item.kind==='income').reduce((sum,item)=>sum+item.amount,0);
  const expense=list.filter(item=>item.kind==='expense').reduce((sum,item)=>sum+item.amount,0);
  return '<div class="report-toolbar"><div class="field compact-field"><label for="office-month">Dönem</label><input id="office-month" type="month" data-control="office-month" value="'+esc(ui.officeMonth)+'"></div>'+button('export-office','Ofis kayıtlarını CSV indir','secondary','download')+'</div><div class="metric-strip office-metrics"><div><span>Gelir</span><strong>'+money(income)+'</strong></div><div><span>Gider</span><strong>'+money(expense)+'</strong></div><div><span>Net</span><strong>'+money(income-expense)+'</strong></div></div><form id="office-form" class="panel inline-form office-form"><h2>Gelir / gider ekle</h2><div class="field-row"><div class="field"><label for="office-kind">Kayıt türü</label><select id="office-kind" name="kind" data-control="office-kind"><option value="income">Gelir</option><option value="expense">Gider</option></select></div><div class="field"><label for="office-date">Tarih</label><input id="office-date" type="date" name="date" required value="'+new Date().toISOString().slice(0,10)+'"></div><div class="field"><label for="office-amount">Tutar (₺)</label><input id="office-amount" type="number" name="amount" min="0.01" max="100000000" step="0.01" required></div></div><div class="field-row"><div class="field"><label for="office-category">Kategori</label><select id="office-category" name="category">'+OFFICE_CATEGORIES.income.map(item=>'<option>'+esc(item)+'</option>').join('')+'</select></div><div class="field"><label for="office-description">Açıklama</label><input id="office-description" name="description" maxlength="500" required placeholder="Kayıt nedeni"></div></div><div class="form-actions"><button class="btn" type="submit">Kaydı ekle</button></div></form>'+
  (list.length?'<div class="table-wrap"><table><thead><tr><th>Tarih</th><th>Tür</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th><th>Ekleyen</th></tr></thead><tbody>'+list.map(item=>'<tr><td>'+esc(shortDate(item.date))+'</td><td><span class="pill '+(item.kind==='income'?'approved':'canceled')+'">'+(item.kind==='income'?'Gelir':'Gider')+'</span></td><td>'+esc(item.category)+'</td><td>'+esc(item.description)+'</td><td><strong>'+money(item.amount)+'</strong></td><td>'+esc(user(item.byId)?.name||'—')+'</td></tr>').join('')+'</tbody></table></div>':empty('Bu ay ofis kaydı yok','İlk gelir veya gider kaydını ekleyebilirsin.'))+'<p class="local-note">Bu panel demo verilerini tarayıcıda saklar; muhasebe kaydı veya ortak ofis veritabanı değildir.</p>';
}
function archivePage(){
  const list=ownReports().filter(r=>r.status!=='draft'&&(ui.archiveStatus==='all'||r.status===ui.archiveStatus));
  return '<div class="list-toolbar"><div class="tabs">'+['all','approved','pending','revision'].map(s=>'<button class="tab '+(ui.archiveStatus===s?'active':'')+'" data-action="archive-tab" data-value="'+s+'">'+(s==='all'?'Tüm görseller':esc(STATUS_LABELS[s]))+'</button>').join('')+'</div><span class="muted">'+list.reduce((n,r)=>n+r.images.length,0)+' görsel</span></div><div class="archive-grid">'+list.flatMap(r=>r.images.map((im,i)=>'<article class="archive-item"><button class="archive-image" data-action="archive-preview" data-id="'+r.id+'" data-index="'+i+'" aria-label="'+esc(im.name)+' görselini büyüt"><img src="'+esc(imageSource(im.src))+'" alt="'+esc(im.name)+'" loading="lazy"></button><div class="archive-info"><h3 title="'+esc(im.name)+'">'+esc(im.name)+'</h3><p>'+esc(user(r.authorId)?.name)+' · v'+r.revision+'</p><div class="archive-bottom">'+badge(r.status)+button('open-report','Rapora git','secondary compact','','data-id="'+r.id+'"')+'</div></div></article>')).join('')+'</div>'+(!list.length?empty('Bu görünümde görsel yok','Başka bir durum seçebilir veya ilk raporu gönderebilirsin.'):'')+'<p class="local-note">Bu arşiv demoya aittir. Görsellerin Drive hesabında bulunduğu veya senkronize edildiği anlamına gelmez.</p>';
}
function teamPage(){
  const reports=ownReports(),people=scopeUsers().filter(u=>reports.some(r=>r.authorId===u.id)||u.role==='employee');
  return '<div class="notice">'+icon('report')+'<div>Tüm demo kayıtları gösteriliyor. Rapor adedi, onay ve revizyon ayrı sayılır; görsel sürümleri yeni üretim olarak sayılmaz.</div></div><div class="table-wrap"><table><thead><tr><th>Çalışan</th><th>Ekip</th><th>Gönderilmiş rapor</th><th>Onaylı</th><th>Revizyonda</th><th>İncelemede</th></tr></thead><tbody>'+people.map(u=>{const rs=reports.filter(r=>r.authorId===u.id);return '<tr><td><div class="person">'+avatar(u)+'<div><strong>'+esc(u.name)+'</strong><small>'+esc(roleNames[u.role])+'</small></div></div></td><td>'+esc(teamName(u.teamId))+'</td><td>'+rs.filter(r=>r.status!=='draft').length+'</td><td>'+rs.filter(r=>r.status==='approved').length+'</td><td>'+rs.filter(r=>r.status==='revision').length+'</td><td>'+rs.filter(r=>r.status==='pending').length+'</td></tr>'}).join('')+'</tbody></table></div><p class="local-note">Bunlar iş akışı sayılarıdır. İşin zorluğunu, emeği veya görsel kalitesini ölçmez; çalışanları puanlamak için kullanılmaz.</p>';
}
function settingsPage(){
  return '<div class="notice warning">'+icon('lock')+'<div><strong>Özel demo çalışma alanı</strong><p>Rol seçimi bir giriş sistemi değildir. Gerçek personelle ortak kullanım için sunucu üzerinde kimlik doğrulama, kayıt yetkileri ve Drive entegrasyonu kurulmalıdır.</p></div></div><div class="settings-grid"><section class="panel"><h2>Çalışma alanı</h2><div class="field"><label for="settings-actor">Demo kullanıcısını değiştir</label><select id="settings-actor" data-control="actor">'+actorOptions()+'</select><small>Rollerin ekranlara etkisini aynı tarayıcıda deneyebilirsin.</small></div><div class="setting-row"><h3>Kayıtların saklanması</h3><p>Raporlar ve yüklediğin görseller bu cihazdaki tarayıcının IndexedDB alanında saklanır. Başka cihazla paylaşılmaz; tarayıcı verileri temizlenirse silinir.</p>'+button('export','Görünen kayıtları indir','secondary','download')+'</div><div class="setting-row"><h3>Demo verilerini sıfırla</h3><p>Bu tarayıcıdaki eklediğin raporlar, görseller, işler ve kararlar silinir; örnek veriler geri gelir.</p>'+button('reset','Demoyu sıfırla','secondary','refresh')+'</div></section><section class="panel"><h2>Entegrasyonlar</h2><div class="setting-row"><h3>Google Drive <span class="pill draft">Bağlı değil</span></h3><p>Gerçek bağlantı için kullanılacak Google hesabı, arşiv klasörü ve dosya erişim yöntemi belirlenmeli. Bu prototip Drive’a veri göndermez.</p></div><div class="setting-row"><h3>Uygulama içi bildirimler <span class="pill approved">Demo içinde etkin</span></h3><p>Rapor gönderimi yetkili kişiye; onay ve revizyon kararı raporu hazırlayan kişiye bildirilir.</p></div><div class="setting-row"><h3>Sonraki kurulum adımları</h3><ol style="font-size:12px;padding-left:19px;color:var(--muted);line-height:1.9"><li>Gerçek kullanıcılar ve giriş yöntemi</li><li>Paylaşılan veritabanı ve sunucu yetkileri</li><li>Google Drive hesabı ve arşiv klasörü</li><li>Dosya saklama ve yedekleme kuralları</li></ol></div></section></div>';
}
function notificationsPage(){
  const list=ownNotifications().slice().sort((a,b)=>new Date(b.at)-new Date(a.at));
  return '<div class="list-toolbar"><p class="muted">'+list.filter(n=>!n.read).length+' okunmamış bildirim</p>'+button('read-notifications','Tümünü okundu işaretle','secondary','check')+'</div>'+(list.length?'<div class="panel notifications" style="padding:0">'+list.map(n=>'<div class="notification-row '+(!n.read?'unread':'')+'">'+icon('bell')+'<div><p>'+esc(n.text)+'</p><small>'+esc(dt(n.at))+'</small></div>'+button('open-report','Aç','secondary compact','arrow','data-id="'+n.reportId+'"')+'</div>').join('')+'</div>':empty('Henüz bildirim yok','Gönderim ve inceleme kararlarının bildirimleri burada görünecek.'));
}
function render(){
  if(ui.page==='office'&&!officeAllowed())ui.page='tasks';
  const pages={review:reviewPage,tasks:tasksPage,reports:reportsPage,form:formPage,shifts:shiftsPage,office:officePage,archive:archivePage,team:teamPage,settings:settingsPage,notifications:notificationsPage};
  $('#app').innerHTML=shell((pages[ui.page]||reviewPage)());document.title=(pageInfo[ui.page]?.[0]||'İnceleme')+' — Görsel Operasyon';
  $('#main-image')?.addEventListener('error',()=>{const canvas=$('.canvas');if(canvas)canvas.innerHTML='<div class="image-empty">Görsel açılamadı. Dosyayı kontrol et veya yeniden yükle.</div>';$('#app [data-action="approve"]')?.setAttribute('disabled','')});
}
function navigate(page){ui.page=page;ui.navOpen=false;render();window.scrollTo({top:0});}
function openReport(id){const r=ownReports().find(x=>x.id===id);if(!r)return notify('Bu rapora erişimin yok.',true);ui.selectedId=id;ui.status='all';ui.search='';ui.team='';ui.person='';ui.imageIndex=0;ui.version='';ui.zoom=false;navigate('review')}
function showImage(src,name){
  const d=$('#lightbox');d.innerHTML='<div class="lightbox-top"><strong>'+esc(name)+'</strong><div>'+button('lightbox-zoom','%100 / Sığdır','secondary compact')+' <button class="icon-btn" data-action="close-lightbox" aria-label="Tam ekranı kapat">'+icon('close')+'</button></div></div><div class="lightbox-image"><img src="'+esc(imageSource(src))+'" alt="'+esc(name)+'"></div>';d.showModal();
}
function exportData(){
  const reports=ownReports(),payload={exportedAt:new Date().toISOString(),demo:true,scope:currentUser(state).name,reports,tasks:visibleTasks(state),shifts:visibleShifts(state)},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='gorsel-operasyon-demo-kayitlari.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Görünür kayıtlar indirildi. Dosya yüklenen görselleri de içerir.');
}
function downloadCsv(filename,columns,rows){
  const safe=value=>{
    const raw=String(value??'');
    const guarded=/^[\s\t\r\n]*[=+\-@]/.test(raw)?"'"+raw:raw;
    return '"'+guarded.replace(/"/g,'""')+'"';
  };
  const csv='\uFEFF'+[columns,...rows].map(row=>row.map(safe).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportExcel(){
  const list=visibleTasks(state).filter(t=>ui.reportMonth==='all'||t.createdAt?.startsWith(ui.reportMonth));
  downloadCsv('gorsel-operasyon-is-sureleri.csv',['Firma','Görsel türü','İş','Çalışan','İş durumu','Oluşturulma','Teslim tarihi','Teslim süresi (saat)','Bekleme (saat)','Tasarım (saat)','Rapor sayısı'],list.map(t=>{
    const m=taskDurations(t),hours=value=>value===null||m.approximate?'':(value/3600000).toLocaleString('tr-TR',{maximumFractionDigits:2});
    return [t.company||'',VISUAL_TYPES[t.visualType]||'',t.title,user(t.assigneeId)?.name||'',STATUS_LABELS[t.status],t.createdAt||'',t.dueDate||'',hours(m.deliveryMs),hours(m.waitingMs),hours(m.designMs),ownReports().filter(r=>r.taskId===t.id).length];
  }));
  notify('Excel ile açılabilen CSV indirildi.');
}
function exportOffice(){
  if(!officeAllowed())return notify('Ofis kayıtlarına erişim yetkin yok.',true);
  const list=(state.officeEntries||[]).filter(item=>item.date.startsWith(ui.officeMonth));
  downloadCsv('gorsel-operasyon-ofis-'+ui.officeMonth+'.csv',['Tarih','Tür','Kategori','Açıklama','Tutar (TRY)','Ekleyen'],list.map(item=>[item.date,item.kind==='income'?'Gelir':'Gider',item.category,item.description,item.amount.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2}),user(item.byId)?.name||'']));
  notify('Ofis kayıtları CSV olarak indirildi.');
}

document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-action],[data-page]');if(!el||el.disabled)return;
  if(el.dataset.page){if(ui.page==='form'&&uploading)return notify('Görsellerin eklenmesi bitince sayfadan ayrılabilirsin.',true);if(ui.page==='form'&&!confirm('Kaydetmediğin değişiklikler kaybolacak. Sayfadan ayrılsın mı?'))return;navigate(el.dataset.page);return}
  const a=el.dataset.action,r=selectedReport();
  try{
    if(a==='menu'){ui.navOpen=!ui.navOpen;render()}
    if(a==='close-menu'){ui.navOpen=false;render()}
    if(a==='select-report'){ui.selectedId=el.dataset.id;ui.imageIndex=0;ui.version='';ui.zoom=false;render()}
    if(a==='select-image'){const note=$('#review-note')?.value||'',checked=$('#note-image')?.checked;ui.imageIndex=Number(el.dataset.index);ui.zoom=false;render();if($('#review-note'))$('#review-note').value=note;if($('#note-image'))$('#note-image').checked=checked}
    if(a==='fit'||a==='zoom'){ui.zoom=a==='zoom'?!ui.zoom:false;$('.canvas')?.classList.toggle('zoomed',ui.zoom);el.setAttribute('aria-pressed',String(ui.zoom))}
    if(a==='fullscreen'&&r){const im=selectedImages(r)[ui.imageIndex];if(im)showImage(im.src,im.name)}
    if(a==='close-lightbox')$('#lightbox').close();
    if(a==='lightbox-zoom')$('.lightbox-image').classList.toggle('zoomed');
    if(a==='clear-filters'){ui.status='all';ui.team='';ui.person='';ui.search='';ui.selectedId=null;render()}
    if(a==='approve'||a==='request-revision'){
      if(!r||!canReview(state,r)||ui.version)return;
      const text=$('#review-note')?.value.trim()||'',scope=$('#note-image')?.checked;
      if(a==='request-revision'&&!text){notify('Revizyon için bir açıklama yaz.',true);$('#review-note').focus();return}
      if(a==='approve'){const imgs=r.images;for(const im of imgs){await new Promise((resolve,reject)=>{const check=new Image();check.onload=resolve;check.onerror=()=>reject(new Error('Rapordaki bir görsel açılamıyor. Onaydan önce dosyayı kontrol et.'));check.src=imageSource(im.src)})}}
      await dispatch({type:'decideReport',reportId:r.id,decision:a==='approve'?'approve':'revision',text,imageIds:scope&&r.images[ui.imageIndex]?[r.images[ui.imageIndex].id]:[],expectedRevision:r.revision},a==='approve'?'Rapor onaylandı. Çalışana bildirim eklendi.':'Rapor revizyona gönderildi. Gerekçe çalışana iletildi.');
    }
    if(a==='next-report'){const next=filteredReports().find(x=>x.id!==ui.selectedId);ui.selectedId=next?.id||null;ui.imageIndex=0;ui.version='';render()}
    if(a==='open-report')openReport(el.dataset.id);
    if(a==='new-report')prepareForm(null,el.dataset.task||'');
    if(a==='edit-report')prepareForm(el.dataset.id);
    if(a==='cancel-form'){if(uploading)return notify('Görsellerin eklenmesi bitince formdan ayrılabilirsin.',true);if(confirm('Kaydetmediğin değişiklikler kaybolacak. Raporlardan devam edilsin mi?'))navigate('reports')}
    if(a==='remove-upload'){ui.formImages.splice(Number(el.dataset.index),1);$('#upload-list').innerHTML=uploadItems()}
    if(a==='toggle-task'){ui.taskForm=!ui.taskForm;render()}
    if(a==='toggle-shift'){ui.shiftForm=!ui.shiftForm;render()}
    if(a==='toggle-shift-event'){ui.shiftEventForm=!ui.shiftEventForm;render()}
    if(a==='export-excel')exportExcel();
    if(a==='export-office')exportOffice();
    if(a==='report-tab'){ui.reportStatus=el.dataset.value;render()}
    if(a==='archive-tab'){ui.archiveStatus=el.dataset.value;render()}
    if(a==='archive-preview'){const report=ownReports().find(x=>x.id===el.dataset.id),im=report?.images[Number(el.dataset.index)];if(im)showImage(im.src,im.name)}
    if(a==='open-feedback-image'){const report=ownReports().find(x=>x.id===el.dataset.report),im=report&&feedbackImage(report,el.dataset.image);if(im)showImage(im.src,im.name)}
    if(a==='read-notifications')await dispatch({type:'markNotificationsRead'},'Bildirimler okundu olarak işaretlendi.');
    if(a==='export')exportData();
    if(a==='reset'&&confirm('Bu tarayıcıdaki tüm demo değişiklikleri ve yüklenen görseller silinecek. Örnek veriler geri yüklensin mi?')){await replaceState(createInitialState());ui.selectedId=null;navigate('review');notify('Örnek çalışma alanı geri yüklendi.')}
  }catch(err){notify(err.message||'İşlem tamamlanamadı.',true)}
});
document.addEventListener('change',async e=>{
  const el=e.target,key=el.dataset.control;
  if(key==='actor'){
    if(ui.page==='form'&&uploading){el.value=state.currentUserId;notify('Görsellerin eklenmesi bitince rol değiştirebilirsin.',true);return}
    if(ui.page==='form'&&!confirm('Kaydedilmemiş değişiklikler kaybolacak. Demo kullanıcısı değişsin mi?')){el.value=state.currentUserId;return}
    if(await dispatch({type:'switchUser',userId:el.value},'',{renderAfter:false})){ui.selectedId=null;ui.search='';ui.team='';ui.person='';ui.status='pending';ui.version='';ui.taskForm=false;ui.shiftForm=false;navigate(isManager()?'review':'tasks');notify('Demo rolü: '+roleNames[currentUser(state).role]);}
  }else if(['team','person','status'].includes(key)){ui[key]=el.value;ui.selectedId=null;ui.imageIndex=0;ui.version='';render()}
  else if(key==='version'){ui.version=el.value;ui.imageIndex=0;render()}
  else if(key==='task-status')await dispatch({type:'setTaskStatus',taskId:el.dataset.id,status:el.value},'İş durumu güncellendi.');
  else if(key==='shift-month'){ui.shiftMonth=el.value;render()}
  else if(key==='report-month'){ui.reportMonth=el.value;render()}
  else if(key==='office-month'){ui.officeMonth=el.value;render()}
  else if(key==='office-kind'){$('#office-category').innerHTML=OFFICE_CATEGORIES[el.value].map(item=>'<option>'+esc(item)+'</option>').join('')}
  else if(key==='event-kind'){const leave=el.value==='leave';document.querySelectorAll('.event-time').forEach(field=>{field.hidden=leave;field.querySelector('input').required=!leave})}
  if(el.id==='file-input')await addFiles(el.files);
});
document.addEventListener('input',e=>{
  if(e.target.dataset.control==='search'){const input=e.target,pos=input.selectionStart;ui.search=input.value;ui.selectedId=null;ui.imageIndex=0;ui.version='';render();const next=$('#queue-search');next.focus();next.setSelectionRange(pos,pos);}
});
let uploading=false;
async function addFiles(files){
  if(uploading)return;const chosen=[...files];
  if(ui.formImages.length+chosen.length>30)return notify('Bir rapora en fazla 30 görsel ekleyebilirsin.',true);
  uploading=true;$('#file-input').disabled=true;$('#upload-status').textContent='Görseller bu tarayıcıya ekleniyor…';
  try{
    for(const file of chosen){
      if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Desteklenmeyen dosya: '+file.name+'. PNG, JPG veya WebP kullan.');
      if(file.size>10*1024*1024)throw new Error(file.name+' 10 MB sınırını aşıyor.');
      const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Dosya okunamadı.'));reader.readAsDataURL(file)});
      await new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=()=>reject(new Error(file.name+' geçerli bir görsel olarak açılamadı.'));im.src=src});
      ui.formImages.push({id:'img-'+crypto.randomUUID(),name:file.name,src,type:file.type,size:file.size});
    }
    $('#upload-list').innerHTML=uploadItems();$('#upload-status').textContent=ui.formImages.length+' görsel hazır. Kalıcı saklamak için taslağı kaydet.';
  }catch(err){notify(err.message,true);$('#upload-list').innerHTML=uploadItems();$('#upload-status').textContent='Eklenemeyen dosyayı kontrol ederek tekrar dene.'}
  finally{uploading=false;if($('#file-input')){$('#file-input').disabled=false;$('#file-input').value=''}}
}
document.addEventListener('submit',async e=>{
  const form=e.target;if(!['report-form','task-form','shift-form','monthly-shift-form','shift-event-form','office-form'].includes(form.id))return;e.preventDefault();
  const data=Object.fromEntries(new FormData(form));const submitter=e.submitter;submitter.disabled=true;
  try{
    if(form.id==='task-form'){if(await dispatch({type:'createTask',...data},'İş oluşturuldu.',{renderAfter:false})){ui.taskForm=false;render()}}
    if(form.id==='shift-form'){if(await dispatch({type:'createShift',...data},'Vardiya planlandı.',{renderAfter:false})){ui.shiftForm=false;render()}}
    if(form.id==='monthly-shift-form'){const weekdays=[...form.querySelectorAll('[name="weekday"]:checked')].map(input=>Number(input.value));if(await dispatch({type:'createMonthlyShifts',...data,weekdays},'Aylık vardiya düzeni eklendi.',{renderAfter:false})){ui.shiftForm=false;ui.shiftMonth=data.month;render()}}
    if(form.id==='shift-event-form'){if(await dispatch({type:'createShiftEvent',...data},'Mesai / izin kaydı eklendi.',{renderAfter:false})){ui.shiftEventForm=false;ui.shiftMonth=data.date.slice(0,7);render()}}
    if(form.id==='office-form'){if(await dispatch({type:'createOfficeEntry',...data},'Ofis kaydı eklendi.',{renderAfter:false})){ui.officeMonth=data.date.slice(0,7);render()}}
    if(form.id==='report-form'){
      if(uploading){notify('Görsellerin eklenmesini bekle.',true);return}
      const send=submitter.value==='send';
      if(send&&!ui.formImages.length){notify('Göndermek için en az bir görsel ekle.',true);return}
      const wasNew=!ui.formId;
      if(await dispatch({type:'saveReport',...(ui.formId?{id:ui.formId}:{}),...data,images:ui.formImages},'',{renderAfter:false})){
        if(wasNew)ui.formId=state.reports[state.reports.length-1].id;
        if(send){if(await dispatch({type:'submitReport',reportId:ui.formId},'Rapor incelemeye gönderildi.',{renderAfter:false})){ui.reportStatus='all';navigate('reports')}}
        else{notify('Taslak bu tarayıcıya kaydedildi.');navigate('reports')}
      }
    }
  }finally{if(document.contains(submitter))submitter.disabled=false}
});
window.addEventListener('beforeunload',e=>{if(ui.page==='form'){e.preventDefault();e.returnValue=''}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.navOpen){ui.navOpen=false;render()}});
channel?.addEventListener('message',async()=>{if(ui.page==='form')return;try{const current=await readState();if(current){state=current;render();notify('Çalışma alanı diğer sekmedeki değişikliklerle güncellendi.')}}catch{}});
try{
  db=await openStorage();state=await readState();const migrated=migrateState(state);if(!migrated)await replaceState(createInitialState());else if(migrated!==state)await replaceState(migrated);
}catch(err){inMemory=true;state=createInitialState()}
ui.page=isManager()?'review':'tasks';render();
