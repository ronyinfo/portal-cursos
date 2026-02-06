// ==============================
// Portal de Cursos - app.js
// ==============================

// Chaves do localStorage
const LS_USERS = "pc_users_v1";
const LS_SESSION = "pc_session_v1";
const LS_PROGRESS = "pc_progress_v1"; // { cpf: { courseId: { enrolledAt, completedAt, periodStart, periodEnd, completionId } } }

// Util
function nowIso() { return new Date().toISOString(); }

function normalizeCpf(cpf) {
  return (cpf || "").replace(/\D/g, "");
}

function isValidCpfFormat(cpf) {
  cpf = normalizeCpf(cpf);
  return cpf.length === 11;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro lendo localStorage:", key, e);
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Usuários
function getUsers() {
  return loadJson(LS_USERS, []);
}

function setUsers(users) {
  saveJson(LS_USERS, users);
}

// Sessão
function getSession() {
  return loadJson(LS_SESSION, null);
}

function setSession(sess) {
  saveJson(LS_SESSION, sess);
}

function clearSession() {
  localStorage.removeItem(LS_SESSION);
}

function currentUser() {
  const sess = getSession();
  if (!sess?.cpf) return null;
  return getUsers().find(u => u.cpf === sess.cpf) || null;
}

function requireAuth() {
  const sess = getSession();
  if (!sess?.cpf) location.href = "login.html";
  return sess;
}

function logout() {
  clearSession();
  location.href = "index.html";
}

// Data BR (para exportar)
function pad2(n){ return String(n).padStart(2,"0"); }
function formatDateBR(iso){
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
}

// ==============================
// Cursos (3 fixos por enquanto)
// ==============================
const COURSES = [
  { id:"c1", title:"Informática Básica", hours: 20, periodDays: 10, desc:"Windows, internet, e-mail, organização de arquivos." },
  { id:"c2", title:"Word e Documentos", hours: 12, periodDays: 7, desc:"Formatação, templates, PDFs, boas práticas." },
  { id:"c3", title:"Excel Essencial", hours: 18, periodDays: 9, desc:"Planilhas, fórmulas, gráficos, produtividade." },
];

function courseById(id){ return COURSES.find(c => c.id === id); }

// Progresso
function getProgress() {
  return loadJson(LS_PROGRESS, {});
}

function setProgress(p) {
  saveJson(LS_PROGRESS, p);
}

function enrollCourse(cpf, courseId) {
  cpf = normalizeCpf(cpf);
  const progress = getProgress();
  progress[cpf] = progress[cpf] || {};

  if (progress[cpf][courseId]?.enrolledAt) {
    return { ok:false, msg:"Você já está matriculado." };
  }

  const c = courseById(courseId);
  if (!c) return { ok:false, msg:"Curso inválido." };

  const start = new Date();
  const end = new Date(start.getTime() + (c.periodDays * 24*60*60*1000));

  progress[cpf][courseId] = {
    enrolledAt: nowIso(),
    completedAt: null,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    completionId: null
  };

  setProgress(progress);
  return { ok:true, msg:"Matrícula realizada." };
}

function completeCourse(cpf, courseId) {
  cpf = normalizeCpf(cpf);
  const progress = getProgress();
  progress[cpf] = progress[cpf] || {};
  const entry = progress[cpf][courseId];

  if (!entry?.enrolledAt) return { ok:false, msg:"Você ainda não se matriculou." };
  if (entry.completedAt) return { ok:false, msg:"Curso já concluído." };

  const completionId = `CC-${cpf}-${courseId}-${Date.now()}`;
  entry.completedAt = nowIso();
  entry.completionId = completionId;

  progress[cpf][courseId] = entry;
  setProgress(progress);

  return { ok:true, msg:"Curso concluído!", completionId };
}

function userCourseState(cpf, courseId) {
  cpf = normalizeCpf(cpf);
  const progress = getProgress();
  const entry = progress?.[cpf]?.[courseId] || null;

  if (!entry) return { status:"none" };
  if (entry.completedAt) return { status:"completed", ...entry };
  return { status:"enrolled", ...entry };
}

function exportCompletions(cpf) {
  cpf = normalizeCpf(cpf);
  const user = getUsers().find(u => u.cpf === cpf);
  const progress = getProgress();
  const entries = progress?.[cpf] || {};

  const out = [];
  for (const c of COURSES) {
    const e = entries[c.id];
    if (e?.completedAt) {
      out.push({
        nome: user?.name || "",
        cpf,
        curso: c.title,
        carga_horaria: c.hours,
        periodo_inicio: formatDateBR(e.periodStart),
        periodo_fim: formatDateBR(e.periodEnd),
        concluido_em: formatDateBR(e.completedAt),
        completion_id: e.completionId
      });
    }
  }
  return out;
}
