const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const today = new Date();
today.setHours(0,0,0,0);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate()+n); return d; };

let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let currentView = 'calendar';
let selectedTaskId = null;
let activeWorkspace = 'شخصي';
let calendarMode = 'month';

let tasks = [
  {id:1,title:'مراجعة خطة الأسبوع',date:iso(today),workspace:'شخصي',priority:'normal',status:'active',description:'مراجعة الأولويات وترتيب المهام المهمة لهذا الأسبوع.'},
  {id:2,title:'مذاكرة للاختبار النهائي',date:iso(addDays(today,1)),workspace:'شخصي',priority:'high',status:'todo',description:'تقسيم الفصول إلى جلسات مذاكرة قصيرة.'},
  {id:3,title:'تجهيز عرض المشروع',date:iso(addDays(today,2)),workspace:'Project 0',priority:'urgent',status:'active',description:'تجهيز النقاط الرئيسية ومراجعة تجربة المستخدم.'},
  {id:4,title:'مراجعة واجهة التقويم',date:iso(addDays(today,3)),workspace:'Project 0',priority:'high',status:'todo',description:'التأكد من عرض المساحات والألوان والتفاصيل الجانبية.'},
  {id:5,title:'اجتماع متابعة الفريق',date:iso(addDays(today,4)),workspace:'العمل',priority:'normal',status:'todo',description:'مراجعة التقدم وتحديد الخطوات التالية.'},
  {id:6,title:'إنهاء التقرير',date:iso(addDays(today,-1)),workspace:'العمل',priority:'normal',status:'done',description:'تمت مراجعة التقرير وإرساله.'},
  {id:7,title:'قراءة فصل جديد',date:iso(addDays(today,6)),workspace:'شخصي',priority:'low',status:'todo',description:''},
  {id:8,title:'تحديث قائمة الأفكار',date:iso(addDays(today,8)),workspace:'Project 0',priority:'low',status:'todo',description:''},
  {id:9,title:'ترتيب الملفات',date:iso(addDays(today,10)),workspace:'العمل',priority:'normal',status:'active',description:''}
];
let inbox = ['فكرة لتطوير صفحة المشاريع','متابعة موعد الأسبوع القادم','تجربة طريقة جديدة لتنظيم الملاحظات'];

const workspaceClass = (name) => name === 'Project 0' ? 'purple' : name === 'العمل' ? 'blue' : 'personal';
const priorityLabel = {low:'منخفضة',normal:'عادية',high:'عالية',urgent:'عاجلة'};
const statusLabel = {todo:'لم تبدأ',active:'قيد التنفيذ',done:'مكتملة'};
const arabicDate = (date) => new Intl.DateTimeFormat('ar-SA',{day:'numeric',month:'long'}).format(new Date(date+'T12:00:00'));
const monthFormat = (date) => new Intl.DateTimeFormat('ar-SA',{month:'long',year:'numeric'}).format(date);

function showToast(message){
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(()=>toast.classList.remove('show'),2400);
}
function updateStats(){
  $('#totalStat').textContent = tasks.length;
  $('#doneStat').textContent = tasks.filter(t=>t.status==='done').length;
  $('#activeStat').textContent = tasks.filter(t=>t.status==='active').length;
  $('#urgentStat').textContent = tasks.filter(t=>t.priority==='urgent' && t.status!=='done').length;
  $('#inboxCount').textContent = inbox.length;
}
function taskChip(task){
  return `<button class="event-chip ${workspaceClass(task.workspace)} ${task.status==='done'?'is-done':''}" data-task="${task.id}" title="${escapeHtml(task.title)}"><span class="event-dot"></span><span>${escapeHtml(task.title)}</span></button>`;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderCalendar(){
  $('#monthLabel').textContent = monthFormat(currentMonth);
  const year=currentMonth.getFullYear(), month=currentMonth.getMonth();
  const first=new Date(year,month,1), last=new Date(year,month+1,0);
  const startOffset=first.getDay();
  const count=Math.ceil((startOffset+last.getDate())/7)*7;
  const cells=[];
  for(let i=0;i<count;i++){
    const dayNum=i-startOffset+1;
    const date=new Date(year,month,dayNum);
    const inMonth=date.getMonth()===month;
    const dateKey=iso(date);
    const dayTasks=tasks.filter(t=>t.date===dateKey && (activeWorkspace==='الكل'||t.workspace===activeWorkspace));
    cells.push(`<div class="day-cell ${inMonth?'':'outside'} ${dateKey===iso(today)?'is-today':''}" data-date="${dateKey}">
      <div class="day-number">${date.getDate()}${dateKey===iso(today)?'<span>اليوم</span>':''}</div>
      <div class="day-events">${dayTasks.slice(0,3).map(taskChip).join('')}${dayTasks.length>3?`<span class="more-events">+${dayTasks.length-3} مهام أخرى</span>`:''}</div>
      <button class="cell-add" data-add-date="${dateKey}" aria-label="إضافة مهمة في هذا اليوم">＋</button>
    </div>`);
  }
  $('#calendarDays').innerHTML=cells.join('');
  if(calendarMode==='week') $('#calendarDays').classList.add('week-mode'); else $('#calendarDays').classList.remove('week-mode');
  $$('.event-chip').forEach(btn=>btn.addEventListener('click',()=>openTask(Number(btn.dataset.task))));
  $$('[data-add-date]').forEach(btn=>btn.addEventListener('click',()=>openModal(btn.dataset.addDate)));
}
function renderUpcoming(){
  const upcoming=tasks.filter(t=>t.status!=='done').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  $('#upcomingList').innerHTML=upcoming.length?upcoming.map(t=>`<button class="upcoming-row" data-task="${t.id}"><span class="upcoming-date">${new Date(t.date+'T12:00:00').getDate()}</span><span class="upcoming-copy"><b>${escapeHtml(t.title)}</b><small>${arabicDate(t.date)} · ${escapeHtml(t.workspace)}</small></span><i class="priority-dot ${t.priority}"></i></button>`).join(''):'<div class="empty-inline">لا توجد مهام قادمة حالياً.</div>';
  $$('.upcoming-row').forEach(b=>b.addEventListener('click',()=>openTask(Number(b.dataset.task))));
}
function renderTaskList(){
  const filter=$('#statusFilter')?.value||'all';
  const query=$('#searchInput').value.trim().toLowerCase();
  const list=tasks.filter(t=>(activeWorkspace==='الكل'||t.workspace===activeWorkspace)&&(filter==='all'||t.status===filter)&&(!query||t.title.toLowerCase().includes(query)));
  $('#allTasksList').innerHTML=list.map(t=>`<button class="task-list-row" data-task="${t.id}"><span class="check-circle ${t.status==='done'?'checked':''}">${t.status==='done'?'✓':''}</span><span class="task-list-copy"><b>${escapeHtml(t.title)}</b><small>${arabicDate(t.date)} · ${escapeHtml(t.workspace)}</small></span><span class="priority-pill ${t.priority}">${priorityLabel[t.priority]}</span><span class="status-pill">${statusLabel[t.status]}</span></button>`).join('')||'<div class="empty-inline">لا توجد مهام مطابقة.</div>';
  $$('.task-list-row').forEach(b=>b.addEventListener('click',()=>openTask(Number(b.dataset.task))));
}
function renderInbox(){
  $('#inboxItems').innerHTML=inbox.map((item,i)=>`<div class="inbox-row"><span class="inbox-spark">✧</span><span>${escapeHtml(item)}</span><button data-convert="${i}">تحويل إلى مهمة</button><button class="remove-inbox" data-remove="${i}" aria-label="حذف">×</button></div>`).join('')||'<div class="empty-inline">صندوق الوارد فارغ. التقط فكرة جديدة عندما تخطر لك.</div>';
  $$('[data-convert]').forEach(b=>b.addEventListener('click',()=>{const text=inbox.splice(Number(b.dataset.convert),1)[0];tasks.push({id:Date.now(),title:text,date:iso(today),workspace:activeWorkspace==='الكل'?'شخصي':activeWorkspace,priority:'normal',status:'todo',description:'تم تحويل هذه الفكرة من صندوق الوارد.'});renderAll();showToast('تم تحويل الفكرة إلى مهمة');}));
  $$('[data-remove]').forEach(b=>b.addEventListener('click',()=>{inbox.splice(Number(b.dataset.remove),1);renderInbox();updateStats();}));
}
function renderAll(){renderCalendar();renderUpcoming();renderTaskList();renderInbox();updateStats();}
function openTask(id){
  const t=tasks.find(x=>x.id===id); if(!t)return;
  selectedTaskId=id; $('.detail-empty').classList.add('hidden'); $('#detailContent').classList.remove('hidden'); $('#detailPanel').classList.add('open');
  $('#detailTitle').value=t.title; $('#detailStatus').value=t.status; $('#detailPriority').value=t.priority; $('#detailDate').value=t.date; $('#detailWorkspace').value=t.workspace; $('#detailDescription').value=t.description||'';
}
function closeDetail(){selectedTaskId=null;$('#detailPanel').classList.remove('open');$('#detailContent').classList.add('hidden');$('.detail-empty').classList.remove('hidden');}
function saveTask(){
  const t=tasks.find(x=>x.id===selectedTaskId);if(!t)return;
  t.title=$('#detailTitle').value.trim()||t.title;t.status=$('#detailStatus').value;t.priority=$('#detailPriority').value;t.date=$('#detailDate').value||t.date;t.workspace=$('#detailWorkspace').value;t.description=$('#detailDescription').value;
  renderAll();showToast('تم حفظ التغييرات');
}
function openModal(date=iso(today)){
  $('#taskModal').classList.remove('hidden');$('#newTaskDate').value=date;$('#newTaskWorkspace').value=activeWorkspace==='الكل'?'شخصي':activeWorkspace;$('#newTaskTitle').focus();
}
function closeModal(){$('#taskModal').classList.add('hidden');$('#taskForm').reset();}
function switchView(view){
  currentView=view;
  ['calendar','tasks','inbox','recurring'].forEach(v=>$('#'+v+'View')?.classList.toggle('hidden',v!==view));
  $$('.nav-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const titles={calendar:'التقويم',tasks:'كل المهام',inbox:'صندوق الوارد',recurring:'المهام المتكررة'};
  $('#pageTitle').textContent=titles[view];
  $('.stats-grid').classList.toggle('hidden',view!=='calendar');
  $('.lower-grid').classList.toggle('hidden',view!=='calendar');
  if(view==='tasks')renderTaskList();if(view==='inbox')renderInbox();
}
function setWorkspace(name){
  activeWorkspace=name;$('#activeWorkspaceName').textContent=name;$('#breadcrumbWorkspace').textContent=name;
  $$('.workspace-row').forEach(b=>b.classList.toggle('selected',b.dataset.workspace===name));
  renderAll();
}
$$('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$$('.workspace-row').forEach(b=>b.addEventListener('click',()=>setWorkspace(b.dataset.workspace)));
$('#prevMonth').addEventListener('click',()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar();});
$('#nextMonth').addEventListener('click',()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar();});
$('#todayBtn').addEventListener('click',()=>{currentMonth=new Date(today.getFullYear(),today.getMonth(),1);renderCalendar();});
$('#newTaskBtn').addEventListener('click',()=>openModal());
$('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);
$('#taskModal').addEventListener('click',e=>{if(e.target.id==='taskModal')closeModal();});
$('#taskForm').addEventListener('submit',e=>{
  e.preventDefault();const title=$('#newTaskTitle').value.trim();if(!title)return;
  tasks.push({id:Date.now(),title,date:$('#newTaskDate').value||iso(today),workspace:$('#newTaskWorkspace').value,priority:$('#newTaskPriority').value,status:$('#newTaskStatus').value,description:$('#newTaskDescription').value});
  closeModal();renderAll();showToast('تمت إضافة المهمة');
});
$('#closeDetail').addEventListener('click',closeDetail);$('#saveTask').addEventListener('click',saveTask);
$('#deleteTask').addEventListener('click',()=>{if(!selectedTaskId)return;tasks=tasks.filter(t=>t.id!==selectedTaskId);closeDetail();renderAll();showToast('تم حذف المهمة');});
$('#statusFilter').addEventListener('change',renderTaskList);
$('#searchInput').addEventListener('input',()=>{if(currentView==='tasks')renderTaskList();});
$('#newInboxBtn').addEventListener('click',()=>{const idea=prompt('اكتب الفكرة التي تريد حفظها:');if(idea?.trim()){inbox.unshift(idea.trim());renderInbox();updateStats();}});
$('#addWorkspace').addEventListener('click',()=>{const name=prompt('اسم مساحة العمل الجديدة:');if(name?.trim()){const btn=document.createElement('button');btn.className='workspace-row';btn.dataset.workspace=name.trim();btn.innerHTML='<i class="workspace-dot purple"></i> '+escapeHtml(name.trim());btn.addEventListener('click',()=>setWorkspace(name.trim()));$('#workspaceList').append(btn);$('#detailWorkspace').add(new Option(name.trim(),name.trim()));$('#newTaskWorkspace').add(new Option(name.trim(),name.trim()));setWorkspace(name.trim());}});
$('#addFolder').addEventListener('click',()=>showToast('إضافة المجلدات ستُفعّل مع ربط قاعدة البيانات.'));
$('#workspaceSwitcher').addEventListener('click',()=>showToast('اختر مساحة العمل من القائمة الجانبية.'));
$('#filterButton').addEventListener('click',()=>showToast('تصفية التقويم حسب مساحة العمل المحددة.'));
$$('[data-calendar-mode]').forEach(b=>b.addEventListener('click',()=>{$$('[data-calendar-mode]').forEach(x=>x.classList.toggle('selected',x===b));calendarMode=b.dataset.calendarMode;renderCalendar();}));
$$('[data-view]').filter(b=>!b.classList.contains('nav-item')).forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('mobile-open'));

renderAll();
