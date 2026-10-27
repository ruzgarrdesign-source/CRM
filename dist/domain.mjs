/**
 * Browser-local demonstration domain. These checks model product behavior;
 * they are not authentication or a security boundary for production data.
 */
export const STATUS_LABELS = Object.freeze({
  draft: 'Taslak', pending: 'İncelemede', revision: 'Revizyon istendi', approved: 'Onaylandı',
  waiting: 'Beklemede', design: 'Tasarım aşamasında', canceled: 'İptal', completed: 'Tamamlandı',
});
export const VISUAL_TYPES = Object.freeze({ social: 'Sosyal', match: 'Maç', site: 'Site', full_package: 'Full Paket' });
export const OFFICE_CATEGORIES = Object.freeze({
  income: ['Müşteri ödemesi', 'Diğer gelir'],
  expense: ['Kira', 'Personel', 'Yazılım', 'Ekipman', 'Vergi', 'Diğer gider'],
});

const clone = value => structuredClone(value);
const fail = message => { throw new Error(message); };
const text = value => typeof value === 'string' ? value.trim() : '';
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const now = action => action.at || new Date().toISOString();
const elevated = user => ['admin', 'operations_manager'].includes(user?.role);
const manager = user => elevated(user) || user?.role === 'team_lead';
export const canAccessOffice = state => elevated(currentUser(state));
const idFor = (items, prefix) => {
  const taken = new Set(items.map(item => item.id));
  let number = items.length + 1;
  while (taken.has(`${prefix}${number}`)) number += 1;
  return `${prefix}${number}`;
};

export function currentUser(state) {
  return state.users.find(user => user.id === state.currentUserId) || null;
}

function visibleTo(user, record, ownerKey) {
  if (!user) return false;
  if (elevated(user)) return true;
  if (user.role === 'team_lead') return record.teamId === user.teamId || record[ownerKey] === user.id;
  return record[ownerKey] === user.id;
}

export function visibleReports(state) {
  const user = currentUser(state);
  return state.reports.filter(report => visibleTo(user, report, 'authorId'));
}

export function visibleTasks(state) {
  const user = currentUser(state);
  return state.tasks.filter(task => visibleTo(user, task, 'assigneeId'));
}

export function visibleShifts(state) {
  const user = currentUser(state);
  return state.shifts.filter(shift => visibleTo(user, shift, 'userId'));
}

export function taskDurations(task, asOf = new Date().toISOString()) {
  const history = (task.statusHistory || []).slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!history.length || task.timingApproximate) return { deliveryMs: null, waitingMs: null, designMs: null, approximate: true };
  let waitingMs = 0, designMs = 0;
  const end = Math.max(Date.parse(asOf), Date.parse(history.at(-1).at));
  for (let i = 0; i < history.length; i++) {
    const from = Date.parse(history[i].at);
    const to = i + 1 < history.length ? Date.parse(history[i + 1].at) : end;
    const duration = Math.max(0, to - from);
    if (history[i].status === 'waiting') waitingMs += duration;
    if (history[i].status === 'design') designMs += duration;
  }
  const completed = history.findLast(item => item.status === 'completed');
  return { deliveryMs: completed ? Math.max(0, Date.parse(completed.at) - Date.parse(task.createdAt)) : null,
    waitingMs, designMs, approximate: false };
}

export function migrateState(saved) {
  if (!saved || saved.version === 3) return saved;
  if (saved.version === 2) {
    const next = clone(saved);
    const originalTypes = { t1: ['Forma', 'social'], t2: ['Atölye', 'site'], t3: ['Rota', 'match'],
      t4: ['Forma', 'full_package'], t5: ['Atölye', 'social'], t6: ['Rota', 'full_package'] };
    next.tasks = next.tasks.map(task => {
      const original = originalTypes[task.id];
      const seeded = original && task.title.startsWith(`${original[0]} · `);
      return seeded ? { ...task, company: task.company || original[0], visualType: task.visualType || original[1] } : task;
    });
    if (!next.officeEntries?.length && next.tasks.some(task => originalTypes[task.id])) {
      const date = new Date().toISOString().slice(0, 10), at = new Date().toISOString();
      next.officeEntries = [
        { id: 'o1', kind: 'income', date, amount: 18000, category: 'Müşteri ödemesi', description: 'Örnek aylık proje ödemesi', createdAt: at, byId: 'manager' },
        { id: 'o2', kind: 'expense', date, amount: 3600, category: 'Yazılım', description: 'Örnek yazılım gideri', createdAt: at, byId: 'manager' },
      ];
    }
    next.version = 3;
    return next;
  }
  if (saved.version !== 1) return null;
  const next = clone(saved);
  const statusMap = { todo: 'waiting', doing: 'design', done: 'completed' };
  const originalTypes = { t1: ['Forma', 'social'], t2: ['Atölye', 'site'], t3: ['Rota', 'match'],
    t4: ['Forma', 'full_package'], t5: ['Atölye', 'social'], t6: ['Rota', 'full_package'] };
  next.tasks = (next.tasks || []).map(task => {
    const createdAt = next.reports?.filter(report => report.taskId === task.id)
      .map(report => report.createdAt).sort()[0] || new Date().toISOString();
    const original = originalTypes[task.id];
    const seeded = original && task.title.startsWith(`${original[0]} · `);
    return { ...task, company: task.company || (seeded ? original[0] : ''), visualType: task.visualType || (seeded ? original[1] : ''),
      status: statusMap[task.status] || task.status, createdAt,
      statusHistory: [{ status: statusMap[task.status] || task.status, at: createdAt, byId: 'migration' }],
      timingApproximate: true };
  });
  next.shifts = (next.shifts || []).map(shift => ({ kind: 'shift', reason: '', ...shift }));
  next.officeEntries ||= [];
  next.version = 2;
  return migrateState(next);
}

export function canReview(state, report) {
  const user = currentUser(state);
  return Boolean(report && user && report.status === 'pending' && report.authorId !== user.id &&
    manager(user) && visibleTo(user, report, 'authorId'));
}

function history(report, user, action, description, at) {
  report.history.push({ id: idFor(report.history, 'h'), byId: user.id, action, text: description, at });
}

function notify(state, userId, description, reportId, at) {
  state.notifications.push({ id: idFor(state.notifications, 'n'), userId, text: description, reportId, read: false, at });
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validTime(value) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || ''); }

function sanitizeImages(images) {
  if (!Array.isArray(images)) fail('Görsel listesi geçersiz.');
  if (images.length > 30) fail('Bir rapora en fazla 30 görsel ekleyebilirsiniz.');
  const ids = new Set();
  return images.map(image => {
    if (!image || !text(image.id) || ids.has(image.id)) fail('Görsellerin kimlikleri boş veya tekrar ediyor.');
    ids.add(image.id);
    const src = text(image.src);
    // User uploads are raster data; bundled SVGs are controlled local demo assets.
    const bundled = /^assets\/demo-0[1-4]\.svg$/.test(src);
    const raster = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/.test(src);
    if (!bundled && !raster) fail('Görsel kaynağı desteklenmiyor. PNG, JPEG veya WebP yükleyin.');
    if (!text(image.name)) fail('Görselin dosya adı eksik.');
    const size = Number(image.size || 0);
    if (!Number.isFinite(size) || size < 0 || size > 10 * 1024 * 1024) fail('Görsel boyutu 10 MB sınırını aşıyor veya geçersiz.');
    return { id: image.id, name: text(image.name), src, type: bundled ? 'image/svg+xml' : src.slice(5, src.indexOf(';')), size };
  });
}

function ownTask(state, user, taskId) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task || task.assigneeId !== user.id) fail('Yalnızca size atanmış bir iş için rapor hazırlayabilirsiniz.');
  return task;
}

function ownShift(state, user, shiftId) {
  if (!shiftId) return null;
  const shift = state.shifts.find(item => item.id === shiftId);
  if (!shift || shift.userId !== user.id) fail('Bu vardiya size ait değil.');
  return shift;
}

function snapshot(report) {
  return clone({ revision: report.revision, title: report.title, note: report.note, images: report.images,
    taskId: report.taskId, shiftId: report.shiftId, submittedAt: report.submittedAt });
}

export function reduceState(state, action) {
  if (!action || typeof action.type !== 'string') fail('İşlem türü belirtilmedi.');
  const next = clone(state);
  const user = currentUser(next);
  if (!user) fail('Aktif demo kullanıcısı bulunamadı.');
  const at = now(action);

  switch (action.type) {
    case 'switchUser': {
      if (!next.users.some(item => item.id === action.userId)) fail('Kullanıcı bulunamadı.');
      next.currentUserId = action.userId;
      return next;
    }
    case 'saveReport': {
      let report = action.id ? next.reports.find(item => item.id === action.id) : null;
      if (action.id && !report) fail('Rapor bulunamadı.');
      if (report && (report.authorId !== user.id || !['draft', 'revision'].includes(report.status))) {
        fail('Yalnızca kendi taslak veya revizyon bekleyen raporunuzu düzenleyebilirsiniz.');
      }
      const taskId = hasOwn(action, 'taskId') ? action.taskId : report?.taskId;
      const task = ownTask(next, user, taskId);
      const shiftId = hasOwn(action, 'shiftId') ? action.shiftId : report?.shiftId || '';
      ownShift(next, user, shiftId);
      const title = hasOwn(action, 'title') ? text(action.title) : report?.title || '';
      if (title.length > 180) fail('Rapor başlığı en fazla 180 karakter olabilir.');
      const note = hasOwn(action, 'note') ? text(action.note) : report?.note || '';
      if (note.length > 10000) fail('Rapor notu en fazla 10.000 karakter olabilir.');
      const images = hasOwn(action, 'images') ? sanitizeImages(action.images) : report?.images || [];
      if (!report) {
        report = { id: idFor(next.reports, 'r'), taskId, shiftId, authorId: user.id, teamId: task.teamId,
          title, note, status: 'draft', createdAt: at, submittedAt: null, revision: 1,
          images, feedback: [], history: [], versions: [] };
        next.reports.push(report);
        history(report, user, 'created', 'Rapor taslağı oluşturuldu.', at);
      } else {
        Object.assign(report, { taskId, shiftId, teamId: task.teamId, title, note, images });
        history(report, user, 'saved', 'Rapor taslağı kaydedildi.', at);
      }
      return next;
    }
    case 'submitReport': {
      const report = next.reports.find(item => item.id === action.reportId);
      if (!report || report.authorId !== user.id) fail('Bu raporu gönderme yetkiniz yok.');
      if (!['draft', 'revision'].includes(report.status)) fail('Bu rapor zaten gönderilmiş; yeniden gönderilemez.');
      if (!text(report.title) || !report.taskId) fail('Göndermek için rapor başlığı ve iş seçimi gereklidir.');
      ownTask(next, user, report.taskId);
      ownShift(next, user, report.shiftId);
      if (!report.images.length) fail('Göndermeden önce en az bir görsel ekleyin.');
      sanitizeImages(report.images);
      if (report.status === 'revision') report.revision += 1;
      report.status = 'pending';
      report.submittedAt = at;
      report.versions ||= [];
      report.versions.push(snapshot(report));
      history(report, user, 'submitted', `Raporun ${report.revision}. sürümü incelemeye gönderildi.`, at);
      for (const reviewer of next.users) {
        if (reviewer.id !== user.id && manager(reviewer) && visibleTo(reviewer, report, 'authorId')) {
          notify(next, reviewer.id, `${user.name}, “${report.title}” raporunu incelemeye gönderdi.`, report.id, at);
        }
      }
      return next;
    }
    case 'decideReport': {
      const report = next.reports.find(item => item.id === action.reportId);
      if (!report) fail('Rapor bulunamadı.');
      if (!manager(user) || !visibleTo(user, report, 'authorId')) fail('Bu raporu inceleme yetkiniz yok.');
      if (report.authorId === user.id) fail('Kendi raporunuzu onaylayamaz veya revizyona gönderemezsiniz.');
      if (report.status !== 'pending') fail('Rapor artık inceleme beklemiyor. Güncel durumu açın.');
      if (action.expectedRevision !== report.revision) fail('Rapor sürümü değişti. Güncel sürümü yeniden inceleyin.');
      if (!['approve', 'revision'].includes(action.decision)) fail('İnceleme kararı geçersiz.');
      const note = text(action.text);
      if (action.decision === 'revision' && !note) fail('Revizyon için bir açıklama yazın.');
      if (note.length > 5000) fail('İnceleme notu en fazla 5.000 karakter olabilir.');
      const imageIds = action.imageIds || [];
      if (!Array.isArray(imageIds) || imageIds.some(id => !report.images.some(image => image.id === id))) {
        fail('Geri bildirim için seçilen görsel bu raporda yok.');
      }
      if (!report.images.length) fail('Görsel içermeyen rapor için karar verilemez.');
      report.status = action.decision === 'approve' ? 'approved' : 'revision';
      if (note) report.feedback.push({ id: idFor(report.feedback, 'f'), byId: user.id, text: note, imageIds: [...new Set(imageIds)], at, revision: report.revision });
      history(report, user, action.decision === 'approve' ? 'approved' : 'revision_requested',
        action.decision === 'approve' ? `Raporun ${report.revision}. sürümü onaylandı.` : `Raporun ${report.revision}. sürümü için revizyon istendi.`, at);
      notify(next, report.authorId,
        action.decision === 'approve' ? `“${report.title}” raporunuz onaylandı.` : `“${report.title}” raporunuz için revizyon istendi${note ? `: ${note}` : '.'}`,
        report.id, at);
      return next;
    }
    case 'setTaskStatus': {
      const task = next.tasks.find(item => item.id === action.taskId);
      if (!task || !visibleTo(user, task, 'assigneeId')) fail('Bu işi değiştirme yetkiniz yok.');
      if (!['waiting', 'design', 'canceled', 'completed'].includes(action.status)) fail('İş durumu geçersiz.');
      if (task.status === action.status) return next;
      task.status = action.status;
      task.statusHistory ||= [];
      task.statusHistory.push({ status: action.status, at, byId: user.id });
      return next;
    }
    case 'createTask': {
      if (!manager(user)) fail('İş oluşturma yetkiniz yok.');
      const assignee = next.users.find(item => item.id === action.assigneeId);
      if (!assignee || !assignee.teamId) fail('Geçerli bir ekip üyesi seçin.');
      if (!elevated(user) && assignee.teamId !== user.teamId) fail('Yalnızca kendi ekibinize iş atayabilirsiniz.');
      const title = text(action.title);
      if (!title || title.length > 180) fail('İş başlığı 1–180 karakter olmalıdır.');
      const company = text(action.company);
      if (!company || company.length > 120) fail('Firma adı 1–120 karakter olmalıdır.');
      if (!hasOwn(VISUAL_TYPES, action.visualType)) fail('Görsel türünü seçin.');
      const dueDate = text(action.dueDate);
      if (dueDate && !validDate(dueDate)) fail('Teslim tarihi geçersiz.');
      next.tasks.push({ id: idFor(next.tasks, 't'), title, description: text(action.description),
        company, visualType: action.visualType, assigneeId: assignee.id, teamId: assignee.teamId,
        status: 'waiting', dueDate, createdAt: at, statusHistory: [{ status: 'waiting', at, byId: user.id }] });
      return next;
    }
    case 'createShift': {
      if (!manager(user)) fail('Vardiya planlama yetkiniz yok.');
      const member = next.users.find(item => item.id === action.userId);
      if (!member || !member.teamId) fail('Geçerli bir ekip üyesi seçin.');
      if (!elevated(user) && member.teamId !== user.teamId) fail('Yalnızca kendi ekibinizin vardiyasını planlayabilirsiniz.');
      if (!validDate(action.date) || !validTime(action.start) || !validTime(action.end)) fail('Vardiya tarihi veya saati geçersiz.');
      if (action.end <= action.start) fail('Bu demoda vardiya bitişi aynı gün başlangıçtan sonra olmalıdır.');
      if (next.shifts.some(shift => shift.userId === member.id && shift.date === action.date && action.start < shift.end && action.end > shift.start)) {
        fail('Bu çalışanın aynı saatlerle çakışan bir vardiyası var.');
      }
      next.shifts.push({ id: idFor(next.shifts, 's'), userId: member.id, teamId: member.teamId,
        date: action.date, start: action.start, end: action.end, kind: 'shift', reason: '' });
      return next;
    }
    case 'createMonthlyShifts': {
      if (!manager(user)) fail('Vardiya planlama yetkiniz yok.');
      const member = next.users.find(item => item.id === action.userId);
      if (!member?.teamId || (!elevated(user) && member.teamId !== user.teamId)) fail('Bu çalışan için vardiya planlayamazsınız.');
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(action.month || '') || !validTime(action.start) || !validTime(action.end) || action.end <= action.start) fail('Ay veya vardiya saatleri geçersiz.');
      const weekdays = [...new Set(action.weekdays || [])].map(Number);
      if (!weekdays.length || weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) fail('En az bir geçerli hafta günü seçin.');
      const [year, month] = action.month.split('-').map(Number);
      const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const proposed = [];
      for (let day = 1; day <= days; day++) {
        const date = `${action.month}-${String(day).padStart(2, '0')}`;
        if (!weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())) continue;
        const overlap = next.shifts.some(shift => shift.userId === member.id && shift.date === date &&
          (shift.kind === 'leave' || (action.start < shift.end && action.end > shift.start)));
        if (!overlap) proposed.push(date);
      }
      if (!proposed.length) fail('Bu ay için eklenebilecek boş vardiya bulunamadı.');
      for (const date of proposed) next.shifts.push({ id: idFor(next.shifts, 's'), userId: member.id, teamId: member.teamId,
        date, start: action.start, end: action.end, kind: 'shift', reason: '' });
      return next;
    }
    case 'createShiftEvent': {
      if (!manager(user)) fail('Mesai veya izin kaydı ekleme yetkiniz yok.');
      const member = next.users.find(item => item.id === action.userId);
      if (!member?.teamId || (!elevated(user) && member.teamId !== user.teamId)) fail('Bu çalışan için kayıt ekleyemezsiniz.');
      if (!['overtime', 'leave'].includes(action.kind) || !validDate(action.date)) fail('Kayıt türü veya tarih geçersiz.');
      const reason = text(action.reason);
      if (!reason || reason.length > 500) fail('Mesai veya izin nedeni 1–500 karakter olmalıdır.');
      const start = action.kind === 'overtime' ? action.start : '';
      const end = action.kind === 'overtime' ? action.end : '';
      if (action.kind === 'overtime' && (!validTime(start) || !validTime(end) || end <= start)) fail('Ek mesai saatleri aynı gün içinde ve geçerli olmalıdır.');
      if (action.kind === 'leave' && next.shifts.some(shift => shift.userId === member.id && shift.date === action.date && shift.kind === 'leave')) fail('Bu gün için izin kaydı zaten var.');
      next.shifts.push({ id: idFor(next.shifts, 's'), userId: member.id, teamId: member.teamId, date: action.date,
        start, end, kind: action.kind, reason });
      return next;
    }
    case 'createOfficeEntry': {
      if (!elevated(user)) fail('Ofis paneline erişim yetkiniz yok.');
      if (!['income', 'expense'].includes(action.kind) || !validDate(action.date)) fail('Gelir/gider türü veya tarih geçersiz.');
      const amount = Number(action.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) fail('Tutar pozitif ve geçerli olmalıdır.');
      const category = text(action.category), description = text(action.description);
      if (!OFFICE_CATEGORIES[action.kind].includes(category)) fail('Geçerli bir kategori seçin.');
      if (!description || description.length > 500) fail('Açıklama 1–500 karakter olmalıdır.');
      next.officeEntries ||= [];
      next.officeEntries.push({ id: idFor(next.officeEntries, 'o'), kind: action.kind, date: action.date,
        amount: Math.round(amount * 100) / 100, category, description, createdAt: at, byId: user.id });
      return next;
    }
    case 'markNotificationsRead': {
      for (const notification of next.notifications) if (notification.userId === user.id) notification.read = true;
      return next;
    }
    default: fail('Bu işlem desteklenmiyor.');
  }
}

export function createInitialState() {
  const date = new Date();
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const stamp = hour => new Date(`${day}T${hour}:00`).toISOString();
  const users = [
    { id: 'manager', name: 'Elif Yılmaz', role: 'operations_manager', teamId: 'design', initials: 'EY' },
    { id: 'admin', name: 'Deniz Acar', role: 'admin', teamId: 'design', initials: 'DA' },
    { id: 'lead', name: 'Selin Kaya', role: 'team_lead', teamId: 'design', initials: 'SK' },
    { id: 'ayse', name: 'Ayşe Demir', role: 'employee', teamId: 'design', initials: 'AD' },
    { id: 'can', name: 'Can Öz', role: 'employee', teamId: 'design', initials: 'CÖ' },
    { id: 'zeynep', name: 'Zeynep Arslan', role: 'employee', teamId: 'motion', initials: 'ZA' },
  ];
  const tasks = [
    { id: 't1', company: 'Forma', visualType: 'social', title: 'Sosyal medya serisi', description: 'Yeni sezon için üç kare görsel. Başlık okunaklı, yerleşim seri boyunca tutarlı olmalı. Demo iş.', assigneeId: 'ayse', teamId: 'design', status: 'design', dueDate: day },
    { id: 't2', company: 'Atölye', visualType: 'site', title: 'Etkinlik afişi', description: 'Dijital etkinlik afişinin ana kompozisyonu ve alternatif renk uygulaması. Demo iş.', assigneeId: 'can', teamId: 'design', status: 'design', dueDate: day },
    { id: 't3', company: 'Rota', visualType: 'match', title: 'Kampanya görseli', description: 'Kampanya duyurusu için statik ana görsel. Demo iş.', assigneeId: 'zeynep', teamId: 'motion', status: 'design', dueDate: day },
    { id: 't4', company: 'Forma', visualType: 'full_package', title: 'Dikey uyarlama', description: 'Onaylı ana fikrin dikey formata uyarlanması. Demo iş.', assigneeId: 'ayse', teamId: 'design', status: 'design', dueDate: day },
    { id: 't5', company: 'Atölye', visualType: 'social', title: 'Duyuru görseli', description: 'Etkinlik duyurusu için kare format. Demo iş.', assigneeId: 'can', teamId: 'design', status: 'completed', dueDate: day },
    { id: 't6', company: 'Rota', visualType: 'full_package', title: 'Yeni seri hazırlığı', description: 'Bir sonraki görsel serisi için iki kompozisyon hazırlayın. Demo iş.', assigneeId: 'ayse', teamId: 'design', status: 'waiting', dueDate: day },
  ];
  for (const task of tasks) {
    task.createdAt = stamp('08:00');
    task.statusHistory = [{ status: 'waiting', at: stamp('08:00'), byId: 'manager' }];
    if (task.status === 'design' || task.status === 'completed') task.statusHistory.push({ status: 'design', at: stamp('08:40'), byId: task.assigneeId });
    if (task.status === 'completed') task.statusHistory.push({ status: 'completed', at: stamp('09:35'), byId: task.assigneeId });
  }
  const shifts = users.map((user, index) => ({ id: `s${index + 1}`, userId: user.id, teamId: user.teamId, date: day, start: '09:00', end: '18:00', kind: 'shift', reason: '' }));
  const image = (n, id) => ({ id, name: `demo-${String(n).padStart(2, '0')}.svg`, src: `assets/demo-${String(n).padStart(2, '0')}.svg`, type: 'image/svg+xml', size: 2400 + n * 400 });
  const definitions = [
    { id: 'r1', taskId: 't1', authorId: 'ayse', status: 'pending', hour: '10:15', note: 'Ana kompozisyon ve iki renk uygulaması hazır. Seri tutarlılığı ve metin okunabilirliği için kontrol rica ederim.', images: [image(1, 'i11'), image(2, 'i12'), image(3, 'i13')] },
    { id: 'r2', taskId: 't2', authorId: 'can', status: 'pending', hour: '10:42', note: 'Afişin ana versiyonunu tamamladım. Başlık ve tarih alanlarını kontrol edebilirsiniz.', images: [image(2, 'i21'), image(4, 'i22')] },
    { id: 'r3', taskId: 't3', authorId: 'zeynep', status: 'pending', hour: '11:05', note: 'Kampanya görselinin ilk teslimi. İki yerleşim alternatifi eklendi.', images: [image(3, 'i31'), image(1, 'i32')] },
    { id: 'r4', taskId: 't4', authorId: 'ayse', status: 'revision', hour: '09:45', note: 'Dikey uyarlama tamamlandı; metin yerleşimi yeniden kontrol edilecek.', images: [image(4, 'i41')] },
    { id: 'r5', taskId: 't5', authorId: 'can', status: 'approved', hour: '09:20', note: 'Duyuru görselinin son teslimi hazır.', images: [image(2, 'i51')] },
  ];
  const reports = definitions.map(definition => {
    const task = tasks.find(item => item.id === definition.taskId);
    const report = { id: definition.id, taskId: task.id, shiftId: shifts.find(shift => shift.userId === definition.authorId).id,
      authorId: definition.authorId, teamId: task.teamId, title: task.title, note: definition.note,
      status: definition.status, createdAt: stamp('09:00'), submittedAt: stamp(definition.hour), revision: 1,
      images: definition.images, feedback: [], history: [
        { id: 'h1', byId: definition.authorId, action: 'created', text: 'Demo rapor oluşturuldu.', at: stamp('09:00') },
        { id: 'h2', byId: definition.authorId, action: 'submitted', text: 'Raporun 1. sürümü incelemeye gönderildi.', at: stamp(definition.hour) },
      ], versions: [] };
    report.versions.push(snapshot(report));
    if (definition.status === 'revision') {
      report.feedback.push({ id: 'f1', byId: 'lead', text: 'Başlık ile alt açıklama arasındaki boşluğu artırabilir misin? Dikey formatta metin çok yakın duruyor.', imageIds: ['i41'], at: stamp('10:00'), revision: 1 });
      report.history.push({ id: 'h3', byId: 'lead', action: 'revision_requested', text: 'Raporun 1. sürümü için revizyon istendi.', at: stamp('10:00') });
    }
    if (definition.status === 'approved') report.history.push({ id: 'h3', byId: 'manager', action: 'approved', text: 'Raporun 1. sürümü onaylandı.', at: stamp('09:35') });
    return report;
  });
  return { version: 3, currentUserId: 'manager', users, teams: [{ id: 'design', name: 'Tasarım ekibi' }, { id: 'motion', name: 'İçerik ekibi' }],
    tasks, shifts, reports, officeEntries: [
      { id: 'o1', kind: 'income', date: day, amount: 18000, category: 'Müşteri ödemesi', description: 'Örnek aylık proje ödemesi', createdAt: stamp('10:00'), byId: 'manager' },
      { id: 'o2', kind: 'expense', date: day, amount: 3600, category: 'Yazılım', description: 'Örnek yazılım gideri', createdAt: stamp('10:10'), byId: 'manager' },
    ], notifications: [
      { id: 'n1', userId: 'ayse', text: '“Forma · Dikey uyarlama” raporunuz için revizyon istendi.', reportId: 'r4', read: false, at: stamp('10:00') },
      { id: 'n2', userId: 'can', text: '“Atölye · Duyuru görseli” raporunuz onaylandı.', reportId: 'r5', read: false, at: stamp('09:35') },
      { id: 'n3', userId: 'manager', text: 'İncelemenizi bekleyen üç demo rapor bulunuyor.', reportId: 'r1', read: false, at: stamp('11:05') },
    ] };
}
