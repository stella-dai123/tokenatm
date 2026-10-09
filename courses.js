// Course records share the existing local persistence and private cloud sync.
let studyMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let studySelectedDay = day();
let studyEditingId = null;
const courseDialog = document.createElement('dialog');
courseDialog.id = 'course-editor';
courseDialog.innerHTML = `<form id="course-form"><h2 id="course-form-title">添加课程</h2><label for="course-name">课程名称</label><input id="course-name" required maxlength="100" placeholder="例如：生理学"><label for="course-exam">考试日期（可选）</label><input id="course-exam" type="date" min="0001-01-01" max="9999-12-31"><p class="course-dialog-note">设置日期后，日历和倒计时会自动更新。提醒显示在网页内。</p><div class="actions"><button type="button" class="outline" id="course-cancel">取消</button><button type="submit" class="primary">保存课程</button></div></form>`;
document.body.appendChild(courseDialog);
const courseRows = () => state.courses || [];
const dateOrdinal = value => Date.parse(value + 'T00:00:00Z') / 86400000;
const examDays = value => dateOrdinal(value) - dateOrdinal(day());
function countdownLabel(date) {
  const n = examDays(date);
  return n > 0 ? `还有 ${n} 天` : n === 0 ? '今天考试' : `已过 ${-n} 天`;
}
function dateFor(year, month, date) {
  return String(year).padStart(4, '0') + '-' + String(month + 1).padStart(2, '0') + '-' + String(date).padStart(2, '0');
}
function examItem(course) {
  const remaining = examDays(course.examDate);
  return `<div class="exam-item"><div>${esc(course.name)}<small>${esc(course.examDate)}</small></div><span class="countdown ${remaining < 0 ? 'past' : remaining <= 7 ? 'soon' : ''}">${countdownLabel(course.examDate)}</span></div>`;
}
function renderCourses() {
  const courses = courseRows();
  const upcoming = courses.filter(c => c.examDate && examDays(c.examDate) >= 0).sort((a, b) => a.examDate.localeCompare(b.examDate));
  const soon = upcoming.filter(c => examDays(c.examDate) <= 7);
  const completed = courses.reduce((n, c) => n + c.tasks.filter(t => t.done).length, 0);
  const taskCount = courses.reduce((n, c) => n + c.tasks.length, 0);
  const year = studyMonth.getFullYear(), month = studyMonth.getMonth();
  const dates = new Date(year, month + 1, 0).getDate();
  const offset = (studyMonth.getDay() + 6) % 7;
  let calendar = ['一', '二', '三', '四', '五', '六', '日'].map(w => `<div class="calendar-weekday">${w}</div>`).join('');
  calendar += '<div aria-hidden="true"></div>'.repeat(offset);
  for (let d = 1; d <= dates; d++) {
    const date = dateFor(year, month, d);
    const exams = courses.filter(c => c.examDate === date);
    calendar += `<button class="calendar-day ${date === day() ? 'today' : ''} ${date === studySelectedDay ? 'selected' : ''} ${exams.length ? 'has-exam' : ''}" data-study-date="${date}" aria-label="${date}${exams.length ? '，考试：' + esc(exams.map(c => c.name).join('、')) : ''}" aria-pressed="${date === studySelectedDay}">${d}${exams.length ? '<span class="calendar-dot"></span>' : '<span style="height:4px"></span>'}</button>`;
  }
  const selectedExams = courses.filter(c => c.examDate === studySelectedDay);
  $('#content').innerHTML = `<div id="study-content"><div class="study-page-heading"><div><h2>这学期，一点一点准备好。</h2><span class="muted">${courses.length} 门课程 · 复习任务已完成 ${completed} / ${taskCount}</span></div><button class="outline" id="course-add">＋ 添加课程</button></div>${soon.length ? `<div class="study-alert">近期考试提醒：${soon.map(c => `${esc(c.name)} · ${countdownLabel(c.examDate)}`).join('；')}</div>` : ''}<div class="study-layout"><section class="study-calendar"><div class="calendar-head"><button class="outline" data-study-month="-1" aria-label="上个月">‹</button><h3>${year} 年 ${month + 1} 月</h3><button class="outline" data-study-month="1" aria-label="下个月">›</button><button class="danger" id="study-today">今天</button></div><div class="calendar-grid">${calendar}</div><div class="calendar-legend">橙色标记：考试日 · 点击日期查看安排</div></section><section class="study-agenda"><h3>${esc(studySelectedDay)} 的考试</h3>${selectedExams.length ? selectedExams.map(examItem).join('') : '<p class="study-empty">这一天没有考试安排。</p>'}<h3 style="margin-top:24px">接下来的考试</h3><div class="agenda-list">${upcoming.length ? upcoming.map(examItem).join('') : '<p class="study-empty">暂无待考考试，给课程设置考试日期吧。</p>'}</div></section></div><div class="study-cards">${courses.map(renderCourseCard).join('')}</div>${courses.length ? '' : '<div class="study-empty">添加第一门课，再把复习目标拆成可以打勾的小任务。</div>'}<p class="muted" style="margin-top:24px">勾选会自动保存；登录后沿用云端同步。考试提醒和倒计时在网页内显示。</p></div>`;
  $('#course-add').onclick = () => openCourseEditor(null);
  $('#study-content').onclick = handleStudyClick;
  $('#study-content').onchange = handleStudyCheck;
  $('#study-content').onsubmit = handleReviewSubmit;
}
function renderCourseCard(course) {
  const done = course.tasks.filter(t => t.done).length;
  const percent = course.tasks.length ? Math.round(done / course.tasks.length * 100) : 0;
  return `<article class="study-card"><div class="study-title"><div><h3>${esc(course.name)}</h3><span class="study-meta">${course.examDate ? '考试日期 ' + esc(course.examDate) : '尚未设置考试日期'}</span></div>${course.examDate ? `<span class="countdown ${examDays(course.examDate) < 0 ? 'past' : examDays(course.examDate) <= 7 ? 'soon' : ''}">${countdownLabel(course.examDate)}</span>` : ''}</div><div class="study-toolbar"><button class="danger" data-course-edit="${esc(course.id)}">编辑课程 / 考试日期</button><button class="danger" data-course-remove="${esc(course.id)}">删除课程</button></div><div class="study-progress"><span>复习进度 ${done} / ${course.tasks.length}</span><b>${percent}%</b></div><div class="progress-track" role="progressbar" aria-label="${esc(course.name)}复习进度" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" style="width:${percent}%"></div></div><ul class="review-list">${course.tasks.map(t => `<li class="review-item ${t.done ? 'complete' : ''}"><label><input type="checkbox" data-review-course="${esc(course.id)}" data-review-task="${esc(t.id)}" ${t.done ? 'checked' : ''}><span class="review-name">${esc(t.name)}</span></label><button class="danger" data-review-remove="${esc(t.id)}" data-review-parent="${esc(course.id)}" aria-label="删除任务 ${esc(t.name)}">删除</button></li>`).join('') || '<li class="study-empty">还没有任务，把第一项复习计划加进来吧。</li>'}</ul><form class="review-add" data-review-form="${esc(course.id)}"><input name="task" maxlength="200" required placeholder="例如：复习第 1 章并做练习" aria-label="${esc(course.name)}的新复习任务"><button class="primary">添加任务</button></form></article>`;
}
function openCourseEditor(id) {
  studyEditingId = id;
  const course = courseRows().find(c => c.id === id);
  $('#course-form').reset();
  $('#course-form-title').textContent = course ? '编辑课程' : '添加课程';
  $('#course-name').value = course?.name || '';
  $('#course-exam').value = course?.examDate || '';
  courseDialog.showModal();
  $('#course-name').focus();
}
$('#course-cancel').onclick = () => courseDialog.close();
$('#course-form').onsubmit = event => {
  event.preventDefault();
  const name = $('#course-name').value.trim();
  const examDate = $('#course-exam').value || null;
  if (!name || examDate && !validCourseDate(examDate)) return;
  const rows = courseRows();
  if (studyEditingId && !rows.some(c => c.id === studyEditingId)) { toast('该课程已被另一设备删除，请重新添加。'); return; }
  const courses = studyEditingId ? rows.map(c => c.id === studyEditingId ? { ...c, name, examDate } : c) : [...rows, { id: crypto.randomUUID(), name, examDate, tasks: [] }];
  if (commit({ ...state, courses })) { courseDialog.close(); toast('课程已保存'); }
};
function handleStudyClick(event) {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.studyMonth) { const next = new Date(studyMonth); next.setMonth(next.getMonth() + Number(data.studyMonth)); if (next.getFullYear() >= 1 && next.getFullYear() <= 9999) { studyMonth = next; renderCourses(); } return; }
  if (button.id === 'study-today') { studyMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1); studySelectedDay = day(); renderCourses(); return; }
  if (data.studyDate) { studySelectedDay = data.studyDate; renderCourses(); return; }
  if (data.courseEdit) { openCourseEditor(data.courseEdit); return; }
  if (data.courseRemove) { const course = courseRows().find(c => c.id === data.courseRemove); if (course && confirm(`删除「${course.name}」及其复习任务？`)) commit({ ...state, courses: courseRows().filter(c => c.id !== course.id) }); return; }
  if (data.reviewRemove && confirm('删除这项复习任务？')) commit({ ...state, courses: courseRows().map(c => c.id === data.reviewParent ? { ...c, tasks: c.tasks.filter(t => t.id !== data.reviewRemove) } : c) });
}
function handleStudyCheck(event) {
  const input = event.target;
  if (!input.dataset.reviewTask) return;
  const courses = courseRows().map(c => c.id === input.dataset.reviewCourse ? { ...c, tasks: c.tasks.map(t => t.id === input.dataset.reviewTask ? { ...t, done: input.checked } : t) } : c);
  if (!commit({ ...state, courses })) input.checked = !input.checked;
}
function handleReviewSubmit(event) {
  if (!event.target.dataset.reviewForm) return;
  event.preventDefault();
  const form = event.target, name = form.elements.task.value.trim();
  if (!name) return;
  const courses = courseRows().map(c => c.id === form.dataset.reviewForm ? { ...c, tasks: [...c.tasks, { id: crypto.randomUUID(), name, done: false }] } : c);
  if (commit({ ...state, courses })) { const next = [...document.querySelectorAll('[data-review-form]')].find(f => f.dataset.reviewForm === form.dataset.reviewForm); next?.elements.task.focus(); }
}
// Refresh date-based counts when the tab becomes visible or midnight passes.
let studyLastDay = day();
setInterval(() => { const today = day(); if (studyLastDay !== today) { studyLastDay = today; if (tab === 'courses') renderCourses(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && tab === 'courses') renderCourses(); });
