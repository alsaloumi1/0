"use strict";

/* ---------------------------------------------------------
   SAMPLE DATA (local only).
   Nothing here is connected to Supabase yet. When the backend
   exists, replace TASKS with a query and make saveTask() write
   to the database before showing "saved".
   --------------------------------------------------------- */
const STATUSES = {
  inprogress: "قيد التنفيذ",
  waiting: "بانتظار المورد",
  review: "مراجعة",
  notstarted: "لم تبدأ",
  completed: "مكتملة"
};
const PRIORITIES = { urgent: "عاجلة", high: "عالية", normal: "عادية", low: "منخفضة" };

const TASKS = [
  { id: 1, title: "إطلاق حملة تسويقية", path: "Business › Marketing › Campaigns", status: "inprogress", priority: "high",
    due: "الأحد", start: "غدًا", est: "6 ساعات", act: "2.5 ساعة", tags: ["Marketing", "Important"],
    subtasks: [{ t: "إعداد المحتوى", done: true }, { t: "تجهيز التصاميم", done: true }, { t: "مراجعة المحتوى", done: false }, { t: "جدولة المنشورات", done: false }],
    dependsOn: "تجهيز التصميم", blocks: "جدولة المنشورات" },
  { id: 2, title: "تجهيز التصميم", path: "Business › Marketing › Content", status: "waiting", priority: "normal",
    due: "غدًا", start: "", est: "", act: "", tags: [], subtasks: [], dependsOn: "", blocks: "" },
  { id: 3, title: "مراجعة المحتوى", path: "Business › Marketing › Content", status: "review", priority: "high",
    due: "الثلاثاء", start: "", est: "", act: "", tags: ["Marketing"], subtasks: [], dependsOn: "", blocks: "" },
  { id: 4, title: "مراجعة خطة التسويق", path: "Personal › Planning", status: "notstarted", priority: "urgent",
    due: "الأسبوع القادم", start: "", est: "", act: "", tags: [], subtasks: [], dependsOn: "", blocks: "" },
  { id: 5, title: "صيانة المعدات", path: "Business › Operations › Maintenance", status: "notstarted", priority: "normal",
    due: "", overdue: true, start: "", est: "", act: "", tags: [], subtasks: [], dependsOn: "", blocks: "" },
  { id: 6, title: "اجتماع الفريق الأسبوعي", path: "Business › Operations › Daily Operations", status: "completed", priority: "low",
    due: "أمس", start: "", est: "", act: "", tags: [], subtasks: [], dependsOn: "", blocks: "" }
];

let view = "table";
let selectedId = null;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const pill = (t) => `<span class="pill s-${t.status}">${STATUSES[t.status]}</span>`;
const pri = (t) => `<span class="dot p-${t.priority}"></span>${PRIORITIES[t.priority]}`;
const due = (t) => (t.overdue ? '<span class="overdue">متأخرة</span>' : esc(t.due || "—"));

function row(t) {
  return `<div class="row${t.id === selectedId ? " sel" : ""}${t.status === "completed" ? " done" : ""}" role="button" tabindex="0" data-id="${t.id}">
    <div>${esc(t.title)}<div class="meta">${esc(t.path)}</div></div>
    <span>${pill(t)}</span><span class="c-pri">${pri(t)}</span><span class="c-due">${due(t)}</span></div>`;
}

function card(t) {
  return `<div class="card${t.id === selectedId ? " sel" : ""}" role="button" tabindex="0" data-id="${t.id}">
    <div>${esc(t.title)}</div><div class="meta">${pri(t)} · ${due(t)}</div></div>`;
}

function renderList() {
  const el = $("#list");
  if (!TASKS.length) {
    el.className = "";
    el.innerHTML = '<p class="empty">لا توجد مهام بعد. ابدأ بإنشاء مهمة جديدة.</p>';
    return;
  }
  if (view === "kanban") {
    el.className = "kanban";
    el.innerHTML = Object.keys(STATUSES).map((k) => {
      const items = TASKS.filter((t) => t.status === k);
      return `<div class="col"><div class="colh"><span>${STATUSES[k]}</span><span>${items.length}</span></div>${items.map(card).join("") || '<div class="meta">لا شيء هنا</div>'}</div>`;
    }).join("");
    return;
  }
  el.className = "table" + (view === "list" ? " compact" : "");
  const head = view === "table" ? '<div class="row hd"><span>المهمة</span><span>الحالة</span><span class="c-pri">الأولوية</span><span class="c-due">الموعد</span></div>' : "";
  el.innerHTML = head + TASKS.map(row).join("");
}

function progress(t) {
  const n = t.subtasks.length;
  if (!n) return null;
  return Math.round((t.subtasks.filter((s) => s.done).length / n) * 100);
}

function field(label, value) {
  return value ? `<div class="fld"><span class="lbl">${label}</span><span>${value}</span></div>` : "";
}

function renderPanel() {
  const t = TASKS.find((x) => x.id === selectedId);
  const p = $("#panel");
  if (!t) { p.hidden = true; p.innerHTML = ""; return; }
  const pct = progress(t);
  p.hidden = false;
  p.innerHTML = `
    <div class="ph"><span class="lbl">تعديل محلي – غير محفوظ في قاعدة البيانات</span><button class="close" data-close>إغلاق</button></div>
    <h2>${esc(t.title)}</h2>
    <div>
      ${field("المساحة", esc(t.path))}
      ${field("الحالة", pill(t))}
      ${field("الأولوية", pri(t))}
      ${field("البداية", esc(t.start))}
      ${field("الموعد النهائي", t.overdue ? '<span class="overdue">متأخرة</span>' : esc(t.due))}
      ${field("المدة المقدرة", esc(t.est))}
      ${field("المدة الفعلية", esc(t.act))}
      ${field("الوسوم", t.tags.length ? `<span class="tags">${t.tags.map((x) => `<span class="pill s-notstarted">${esc(x)}</span>`).join("")}</span>` : "")}
    </div>
    ${t.subtasks.length ? `<div class="sec"><h3><span>المهام الفرعية</span><span class="lbl" id="pct"></span></h3>
      <div class="bar"><i id="bar"></i></div>
      ${t.subtasks.map((s, i) => `<label class="st"><input type="checkbox" data-sub="${i}"${s.done ? " checked" : ""}>${esc(s.t)}</label>`).join("")}</div>` : ""}
    ${t.dependsOn || t.blocks ? `<div class="sec"><h3>الاعتماديات</h3>${field("تعتمد على", esc(t.dependsOn))}${field("تُمهّد لـ", esc(t.blocks))}</div>` : ""}`;
  updateProgress(t);
}

function updateProgress(t) {
  const pct = progress(t);
  const bar = $("#bar"), label = $("#pct");
  if (bar) bar.style.width = (pct || 0) + "%";
  if (label) label.textContent = pct === null ? "" : pct + "%";
}

function select(id) {
  selectedId = id;
  renderList();
  renderPanel();
}

function closePanel() {
  selectedId = null;
  renderList();
  renderPanel();
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closePanel();
  const tab = e.target.closest("[data-view]");
  if (tab) {
    view = tab.dataset.view;
    document.querySelectorAll(".tab").forEach((b) => {
      const on = b === tab;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", on);
    });
    return renderList();
  }
  const item = e.target.closest("[data-id]");
  if (item) select(Number(item.dataset.id));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && selectedId !== null) return closePanel();
  if (e.key !== "Enter" && e.key !== " ") return;
  const item = e.target.closest && e.target.closest("[data-id]");
  if (item && item === document.activeElement) {
    e.preventDefault();
    select(Number(item.dataset.id));
  }
});

document.addEventListener("change", (e) => {
  const box = e.target.closest("[data-sub]");
  if (!box) return;
  const t = TASKS.find((x) => x.id === selectedId);
  t.subtasks[Number(box.dataset.sub)].done = box.checked;
  updateProgress(t);
});

renderList();
select(1);
