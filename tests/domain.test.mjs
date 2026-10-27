import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, currentUser, visibleReports, visibleTasks, visibleShifts, canReview, canAccessOffice, migrateState, taskDurations, reduceState } from '../dist/domain.mjs';

const act = (state, type, props = {}) => reduceState(state, { type, at: '2026-10-27T12:00:00.000Z', ...props });
const as = (state, userId) => act(state, 'switchUser', { userId });

test('employee scopes are limited to own reports, tasks and shifts; managers see all', () => {
  const initial = createInitialState();
  const state = as(initial, 'ayse');
  assert.equal(currentUser(state).name, 'Ayşe Demir');
  assert.deepEqual(visibleReports(state).map(r => r.id), ['r1', 'r4']);
  assert.ok(visibleTasks(state).every(t => t.assigneeId === 'ayse'));
  assert.ok(visibleShifts(state).every(s => s.userId === 'ayse'));
  assert.equal(visibleReports(initial).length, 5);
  assert.equal(initial.currentUserId, 'manager');
});

test('team lead cannot inspect or change another team', () => {
  const state = as(createInitialState(), 'lead');
  assert.ok(!visibleReports(state).some(r => r.id === 'r3'));
  assert.equal(canReview(state, state.reports.find(r => r.id === 'r3')), false);
  assert.throws(() => act(state, 'decideReport', { reportId: 'r3', decision: 'approve', expectedRevision: 1 }), /yetkiniz/);
  assert.throws(() => act(state, 'setTaskStatus', { taskId: 't3', status: 'completed' }), /yetkiniz/);
  assert.throws(() => act(state, 'createTask', { title: 'Başka ekip', assigneeId: 'zeynep' }), /kendi ekibinize/);
});

test('approval changes only report state and not task completion; repeated or stale decisions fail', () => {
  const state = createInitialState();
  assert.throws(() => act(state, 'decideReport', { reportId: 'r1', decision: 'approve', expectedRevision: 0 }), /sürümü değişti/);
  const approved = act(state, 'decideReport', { reportId: 'r1', decision: 'approve', expectedRevision: 1 });
  assert.equal(approved.reports[0].status, 'approved');
  assert.equal(approved.tasks[0].status, 'design');
  assert.equal(state.reports[0].status, 'pending');
  assert.ok(approved.notifications.some(n => n.userId === 'ayse' && n.reportId === 'r1' && /onaylandı/.test(n.text)));
  assert.throws(() => act(approved, 'decideReport', { reportId: 'r1', decision: 'approve', expectedRevision: 1 }), /artık inceleme beklemiyor/);
});

test('self-review is blocked even for administrators', () => {
  const initial = createInitialState();
  initial.reports[0].authorId = 'admin';
  const state = as(initial, 'admin');
  assert.equal(canReview(state, state.reports[0]), false);
  assert.throws(() => act(state, 'decideReport', { reportId: 'r1', decision: 'approve', expectedRevision: 1 }), /Kendi raporunuzu/);
});

test('revision needs a reason and references only current report images', () => {
  const state = createInitialState();
  assert.throws(() => act(state, 'decideReport', { reportId: 'r1', decision: 'revision', expectedRevision: 1, text: ' ' }), /açıklama/);
  assert.throws(() => act(state, 'decideReport', { reportId: 'r1', decision: 'revision', expectedRevision: 1, text: 'Düzeltin', imageIds: ['i21'] }), /bu raporda yok/);
  const revised = act(state, 'decideReport', { reportId: 'r1', decision: 'revision', expectedRevision: 1, text: 'Başlığı büyüt.', imageIds: ['i11'] });
  assert.equal(revised.reports[0].status, 'revision');
  assert.deepEqual(revised.reports[0].feedback.at(-1).imageIds, ['i11']);
});

test('revision resubmission increments version and preserves original content', () => {
  let state = as(createInitialState(), 'ayse');
  const prior = state.reports.find(r => r.id === 'r4');
  const oldNote = prior.note;
  state = act(state, 'saveReport', { id: 'r4', note: 'Geri bildirime göre düzeltildi.' });
  state = act(state, 'submitReport', { reportId: 'r4' });
  const report = state.reports.find(r => r.id === 'r4');
  assert.equal(report.revision, 2);
  assert.equal(report.status, 'pending');
  assert.equal(report.versions.length, 2);
  assert.equal(report.versions[0].note, oldNote);
  assert.equal(report.versions[1].note, 'Geri bildirime göre düzeltildi.');
  assert.equal(report.feedback.length, 1);
});

test('employees cannot edit another person, submitted report, or create report for an unassigned task', () => {
  const state = as(createInitialState(), 'ayse');
  assert.throws(() => act(state, 'saveReport', { id: 'r2', title: 'Değiştir' }), /kendi taslak/);
  assert.throws(() => act(state, 'saveReport', { id: 'r1', title: 'Değiştir' }), /kendi taslak/);
  assert.throws(() => act(state, 'saveReport', { taskId: 't2', title: 'Yeni rapor' }), /size atanmış/);
  assert.throws(() => act(state, 'submitReport', { reportId: 'r2' }), /yetkiniz/);
});

test('new draft can remain incomplete but submission needs title and images', () => {
  let state = as(createInitialState(), 'ayse');
  state = act(state, 'saveReport', { taskId: 't6', title: '', note: '', images: [] });
  const id = state.reports.at(-1).id;
  assert.throws(() => act(state, 'submitReport', { reportId: id }), /başlığı/);
  state = act(state, 'saveReport', { id, title: 'Yeni seri' });
  assert.throws(() => act(state, 'submitReport', { reportId: id }), /en az bir görsel/);
  state = act(state, 'saveReport', { id, images: [{ id: 'newimage', name: 'demo.svg', src: 'assets/demo-01.svg', type: 'image/svg+xml', size: 2000 }] });
  state = act(state, 'submitReport', { reportId: id });
  assert.equal(state.reports.at(-1).status, 'pending');
  assert.ok(state.notifications.some(n => n.userId === 'lead' && n.reportId === id));
});

test('unsafe image sources and duplicate image ids are rejected', () => {
  const state = as(createInitialState(), 'ayse');
  const image = { id: 'i', name: 'bad.svg', src: 'javascript:alert(1)', size: 1 };
  assert.throws(() => act(state, 'saveReport', { taskId: 't6', title: 'Rapor', images: [image] }), /desteklenmiyor/);
  image.src = 'data:image/svg+xml;base64,PHN2Zz4=';
  assert.throws(() => act(state, 'saveReport', { taskId: 't6', title: 'Rapor', images: [image] }), /desteklenmiyor/);
  image.src = 'assets/demo-01.svg';
  assert.throws(() => act(state, 'saveReport', { taskId: 't6', title: 'Rapor', images: [image, image] }), /tekrar/);
});

test('scheduling checks dates, overlap, role scope, and same-day boundaries', () => {
  const state = createInitialState();
  const date = state.shifts[0].date;
  assert.throws(() => act(as(state, 'ayse'), 'createShift', { userId: 'ayse', date, start: '19:00', end: '20:00' }), /yetkiniz/);
  assert.throws(() => act(state, 'createShift', { userId: 'ayse', date, start: '10:00', end: '12:00' }), /çakışan/);
  assert.throws(() => act(state, 'createShift', { userId: 'ayse', date: '2026-02-31', start: '19:00', end: '20:00' }), /geçersiz/);
  assert.throws(() => act(state, 'createShift', { userId: 'ayse', date, start: '22:00', end: '06:00' }), /aynı gün/);
  const next = act(state, 'createShift', { userId: 'ayse', date, start: '18:00', end: '19:00' });
  assert.equal(next.shifts.length, state.shifts.length + 1);
});

test('notification read action affects only the current user', () => {
  const state = as(createInitialState(), 'ayse');
  const next = act(state, 'markNotificationsRead');
  assert.ok(next.notifications.filter(n => n.userId === 'ayse').every(n => n.read));
  assert.equal(next.notifications.find(n => n.userId === 'can').read, false);
});

test('work request requires firm and type; assigned employee controls status and measured time', () => {
  const initial = createInitialState();
  assert.throws(() => act(initial, 'createTask', { title: 'Yeni görsel', assigneeId: 'ayse' }), /Firma adı/);
  assert.throws(() => act(initial, 'createTask', { title: 'Yeni görsel', company: 'Forma', visualType: 'banner', assigneeId: 'ayse' }), /Görsel türünü/);
  let state = act(initial, 'createTask', { title: 'Maç duyurusu', company: 'Forma', visualType: 'match', assigneeId: 'ayse', dueDate: '2026-10-29' });
  const id = state.tasks.at(-1).id;
  assert.equal(state.tasks.at(-1).status, 'waiting');
  state = as(state, 'ayse');
  state = reduceState(state, { type: 'setTaskStatus', taskId: id, status: 'design', at: '2026-10-27T13:00:00.000Z' });
  state = reduceState(state, { type: 'setTaskStatus', taskId: id, status: 'completed', at: '2026-10-27T15:00:00.000Z' });
  assert.deepEqual(taskDurations(state.tasks.at(-1), '2026-10-27T16:00:00.000Z'), { deliveryMs: 3 * 3600000, waitingMs: 3600000, designMs: 2 * 3600000, approximate: false });
  assert.throws(() => act(as(state, 'can'), 'setTaskStatus', { taskId: id, status: 'canceled' }), /yetkiniz/);
});

test('monthly schedule adds selected weekdays and records overtime and leave reasons', () => {
  let state = createInitialState();
  const before = state.shifts.length;
  state = act(state, 'createMonthlyShifts', { userId: 'ayse', month: '2026-11', weekdays: [1, 3], start: '09:00', end: '18:00' });
  const added = state.shifts.slice(before);
  assert.ok(added.length >= 8);
  assert.ok(added.every(item => [1, 3].includes(new Date(item.date + 'T12:00:00Z').getUTCDay())));
  const repeated = act(state, 'createMonthlyShifts', { userId: 'ayse', month: '2026-11', weekdays: [1, 5], start: '09:00', end: '18:00' });
  assert.ok(repeated.shifts.length > state.shifts.length);
  assert.throws(() => act(state, 'createShiftEvent', { userId: 'ayse', kind: 'leave', date: '2026-11-05', reason: '' }), /nedeni/);
  state = act(state, 'createShiftEvent', { userId: 'ayse', kind: 'leave', date: '2026-11-05', reason: 'Yıllık izin' });
  state = act(state, 'createShiftEvent', { userId: 'ayse', kind: 'overtime', date: '2026-11-06', start: '18:00', end: '20:00', reason: 'Acil teslim' });
  assert.deepEqual(state.shifts.slice(-2).map(item => item.reason), ['Yıllık izin', 'Acil teslim']);
});

test('office ledger is limited to system and operations managers', () => {
  const initial = createInitialState();
  const props = { kind: 'expense', date: '2026-10-27', amount: 250.50, category: 'Yazılım', description: 'Lisans' };
  for (const id of ['ayse', 'lead']) {
    const state = as(initial, id);
    assert.equal(canAccessOffice(state), false);
    assert.throws(() => act(state, 'createOfficeEntry', props), /yetkiniz/);
  }
  const result = act(initial, 'createOfficeEntry', props);
  assert.equal(result.officeEntries.at(-1).amount, 250.5);
  assert.throws(() => act(initial, 'createOfficeEntry', { ...props, amount: -1 }), /Tutar/);
});

test('version one browser records migrate without dropping user records', () => {
  const old = createInitialState();
  old.version = 1;
  old.tasks[0].status = 'doing';
  delete old.tasks[0].statusHistory;
  delete old.tasks[0].company;
  delete old.officeEntries;
  const result = migrateState(old);
  assert.equal(result.version, 3);
  assert.equal(result.tasks[0].status, 'design');
  assert.equal(result.tasks[0].timingApproximate, true);
  assert.equal(result.reports.length, old.reports.length);
  assert.equal(result.officeEntries.length, 2);
});
