/* ====================================================
   resume-builder.js — Resume Builder + ATS Analyzer
   ==================================================== */

let currentResumeId = null;
let rbSkills = [];

// Dynamic list data
const rbData = {
  education:    [],
  experience:   [],
  projects:     [],
  certs:        [],
  achievements: [],
  languages:    [],
};

/* ---------- LOAD SAVED RESUMES ---------- */
async function loadResumes() {
  try {
    const res  = await authFetch(`${API}/api/resume/builder`);
    const data = await res.json();
    const el   = document.getElementById('resumeList');

    if (!data.resumes?.length) {
      el.innerHTML = '<div class="empty-state">No resumes yet. Click "New Resume" to start.</div>';
      return;
    }

    el.innerHTML = data.resumes.map(r => `
      <div class="resume-card">
        <div class="rc-icon">📄</div>
        <div class="rc-body">
          <div class="rc-title">${escHtml(r.title)}</div>
          <div class="rc-meta">Template: ${r.template} • Updated: ${fmtDate(r.updatedAt)}</div>
          ${r.atsScore ? `<div class="rc-ats">ATS Score: <strong>${r.atsScore}/100</strong></div>` : ''}
        </div>
        <div class="rc-actions">
          <button class="btn-ghost btn-sm" onclick="editResume('${r._id}')">Edit</button>
          <button class="btn-ghost btn-sm danger" onclick="deleteResume('${r._id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch (err) {
    showToast('Failed to load resumes.', 'error');
  }
}

/* ---------- EDIT RESUME ---------- */
async function editResume(id) {
  try {
    const res  = await authFetch(`${API}/api/resume/builder`);
    const data = await res.json();
    const r    = data.resumes.find(x => x._id === id);
    if (!r) return;

    currentResumeId = id;
    prefillForm(r);
    showBuilder();
  } catch { showToast('Failed to load resume.', 'error'); }
}

function prefillForm(r) {
  const p = r.personal || {};
  document.getElementById('rb-name').value     = p.fullName  || '';
  document.getElementById('rb-email').value    = p.email     || '';
  document.getElementById('rb-phone').value    = p.phone     || '';
  document.getElementById('rb-location').value = p.location  || '';
  document.getElementById('rb-linkedin').value = p.linkedin  || '';
  document.getElementById('rb-github').value   = p.github    || '';
  document.getElementById('rb-summary').value  = r.summary   || '';

  rbData.education    = r.education    || [];
  rbData.experience   = r.experience   || [];
  rbData.projects     = r.projects     || [];
  rbData.certs        = r.certifications || [];
  rbData.achievements = r.achievements || [];
  rbData.languages    = r.languages    || [];
  rbSkills            = r.skills       || [];

  renderAllLists();
  initSkillsInput('rbSkillInput', 'rbSkillsChips', rbSkills);
}

function renderAllLists() {
  renderDynamicList('educationList', rbData.education, educationItemHtml);
  renderDynamicList('experienceList', rbData.experience, experienceItemHtml);
  renderDynamicList('projectList', rbData.projects, projectItemHtml);
  renderDynamicList('certList', rbData.certs, certItemHtml);
  renderDynamicList('achieveList', rbData.achievements, achieveItemHtml);
  renderDynamicList('langList', rbData.languages, langItemHtml);
  updatePreview();
}

/* ---------- DYNAMIC LIST HELPERS ---------- */
function renderDynamicList(containerId, items, htmlFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map((item, i) => `
    <div class="dyn-item">
      ${htmlFn(item, i)}
      <button class="dyn-remove" type="button" onclick="removeItem('${containerId}', ${i})">× Remove</button>
    </div>`).join('');
}

function removeItem(containerId, index) {
  const map = { educationList:'education', experienceList:'experience', projectList:'projects', certList:'certs', achieveList:'achievements', langList:'languages' };
  const key = map[containerId];
  if (key) { rbData[key].splice(index, 1); renderAllLists(); }
}

const educationItemHtml = (e, i) => `
  <div class="form-row-2">
    <div class="form-group"><label>Institution</label><input type="text" value="${escHtml(e.institution||'')}" oninput="rbData.education[${i}].institution=this.value;updatePreview()"/></div>
    <div class="form-group"><label>Degree</label><input type="text" value="${escHtml(e.degree||'')}" oninput="rbData.education[${i}].degree=this.value;updatePreview()"/></div>
  </div>
  <div class="form-row-2">
    <div class="form-group"><label>Field</label><input type="text" value="${escHtml(e.field||'')}" oninput="rbData.education[${i}].field=this.value;updatePreview()"/></div>
    <div class="form-group"><label>Year</label><input type="text" value="${escHtml(e.year||'')}" oninput="rbData.education[${i}].year=this.value;updatePreview()"/></div>
  </div>`;

const experienceItemHtml = (e, i) => `
  <div class="form-row-2">
    <div class="form-group"><label>Company</label><input type="text" value="${escHtml(e.company||'')}" oninput="rbData.experience[${i}].company=this.value;updatePreview()"/></div>
    <div class="form-group"><label>Role</label><input type="text" value="${escHtml(e.role||'')}" oninput="rbData.experience[${i}].role=this.value;updatePreview()"/></div>
  </div>
  <div class="form-group"><label>Duration</label><input type="text" value="${escHtml(e.duration||'')}" oninput="rbData.experience[${i}].duration=this.value;updatePreview()"/></div>
  <div class="form-group"><label>Description</label><textarea oninput="rbData.experience[${i}].description=this.value;updatePreview()">${escHtml(e.description||'')}</textarea></div>`;

const projectItemHtml = (p, i) => `
  <div class="form-row-2">
    <div class="form-group"><label>Project Name</label><input type="text" value="${escHtml(p.name||'')}" oninput="rbData.projects[${i}].name=this.value;updatePreview()"/></div>
    <div class="form-group"><label>Tech Stack</label><input type="text" value="${escHtml(p.tech||'')}" oninput="rbData.projects[${i}].tech=this.value;updatePreview()"/></div>
  </div>
  <div class="form-group"><label>Description</label><textarea oninput="rbData.projects[${i}].description=this.value;updatePreview()">${escHtml(p.description||'')}</textarea></div>`;

const certItemHtml   = (c, i) => `<div class="form-row-2"><div class="form-group"><label>Certification</label><input type="text" value="${escHtml(c.name||'')}" oninput="rbData.certs[${i}].name=this.value;updatePreview()"/></div><div class="form-group"><label>Issuer / Year</label><input type="text" value="${escHtml((c.issuer||'')+(c.year?' '+c.year:''))}" oninput="rbData.certs[${i}].issuer=this.value;updatePreview()"/></div></div>`;
const achieveItemHtml = (a, i) => `<div class="form-group"><input type="text" value="${escHtml(a||'')}" oninput="rbData.achievements[${i}]=this.value;updatePreview()"/></div>`;
const langItemHtml   = (l, i) => `<div class="form-row-2"><div class="form-group"><label>Language</label><input type="text" value="${escHtml(l.language||'')}" oninput="rbData.languages[${i}].language=this.value;updatePreview()"/></div><div class="form-group"><label>Proficiency</label><input type="text" value="${escHtml(l.proficiency||'')}" oninput="rbData.languages[${i}].proficiency=this.value;updatePreview()"/></div></div>`;

/* ---------- COLLECT FORM DATA ---------- */
function collectFormData() {
  return {
    title:    document.getElementById('rb-name').value || 'My Resume',
    template: document.getElementById('templateSelect')?.value || 'modern',
    personal: {
      fullName: document.getElementById('rb-name').value,
      email:    document.getElementById('rb-email').value,
      phone:    document.getElementById('rb-phone').value,
      location: document.getElementById('rb-location').value,
      linkedin: document.getElementById('rb-linkedin').value,
      github:   document.getElementById('rb-github').value,
    },
    summary:        document.getElementById('rb-summary').value,
    education:      rbData.education,
    experience:     rbData.experience,
    skills:         rbSkills,
    projects:       rbData.projects,
    certifications: rbData.certs,
    achievements:   rbData.achievements,
    languages:      rbData.languages,
  };
}

/* ---------- LIVE PREVIEW ---------- */
function updatePreview() {
  const d       = collectFormData();
  const preview = document.getElementById('resumePreview');
  if (!preview) return;

  preview.innerHTML = `
    <div class="rv-resume ${d.template}">
      <div class="rv-header">
        <h1>${escHtml(d.personal.fullName || 'Your Name')}</h1>
        <div class="rv-contact">
          ${d.personal.email    ? `<span>✉️ ${escHtml(d.personal.email)}</span>` : ''}
          ${d.personal.phone    ? `<span>📞 ${escHtml(d.personal.phone)}</span>` : ''}
          ${d.personal.location ? `<span>📍 ${escHtml(d.personal.location)}</span>` : ''}
          ${d.personal.linkedin ? `<span>🔗 ${escHtml(d.personal.linkedin)}</span>` : ''}
          ${d.personal.github   ? `<span>💻 ${escHtml(d.personal.github)}</span>` : ''}
        </div>
      </div>
      ${d.summary ? `<div class="rv-section"><h2>Summary</h2><p>${escHtml(d.summary)}</p></div>` : ''}
      ${d.education.length ? `<div class="rv-section"><h2>Education</h2>${d.education.map(e => `<div class="rv-item"><strong>${escHtml(e.institution||'')}</strong><span>${escHtml(e.degree||'')} ${e.field?'in '+escHtml(e.field):''}</span><span class="rv-date">${escHtml(e.year||'')}</span></div>`).join('')}</div>` : ''}
      ${d.experience.length ? `<div class="rv-section"><h2>Experience</h2>${d.experience.map(e => `<div class="rv-item"><strong>${escHtml(e.role||'')}</strong> at <em>${escHtml(e.company||'')}</em><span class="rv-date">${escHtml(e.duration||'')}</span>${e.description?`<p>${escHtml(e.description)}</p>`:''}</div>`).join('')}</div>` : ''}
      ${d.skills.length    ? `<div class="rv-section"><h2>Skills</h2><div class="rv-skills">${d.skills.map(s => `<span>${escHtml(s)}</span>`).join('')}</div></div>` : ''}
      ${d.projects.length  ? `<div class="rv-section"><h2>Projects</h2>${d.projects.map(p => `<div class="rv-item"><strong>${escHtml(p.name||'')}</strong><span class="rv-tech">${escHtml(p.tech||'')}</span>${p.description?`<p>${escHtml(p.description)}</p>`:''}</div>`).join('')}</div>` : ''}
      ${d.certifications.length ? `<div class="rv-section"><h2>Certifications</h2>${d.certifications.map(c => `<div class="rv-item"><span>${escHtml(c.name||'')} — ${escHtml(c.issuer||'')}</span></div>`).join('')}</div>` : ''}
      ${d.achievements.filter(Boolean).length ? `<div class="rv-section"><h2>Achievements</h2><ul>${d.achievements.filter(Boolean).map(a => `<li>${escHtml(a)}</li>`).join('')}</ul></div>` : ''}
      ${d.languages.length ? `<div class="rv-section"><h2>Languages</h2><div class="rv-skills">${d.languages.map(l => `<span>${escHtml(l.language||'')} (${escHtml(l.proficiency||'')})</span>`).join('')}</div></div>` : ''}
    </div>`;
}

/* ---------- SAVE RESUME ---------- */
async function saveResume(isDraft = true) {
  const body = { ...collectFormData(), isDraft };
  if (currentResumeId) body.id = currentResumeId;

  try {
    const res  = await authFetch(`${API}/api/resume/builder`, {
      method:  currentResumeId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    currentResumeId = data.resume._id;
    showToast(isDraft ? 'Draft saved!' : 'Resume saved!');
    return data.resume;
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
    return null;
  }
}

/* ---------- DELETE RESUME ---------- */
async function deleteResume(id) {
  if (!confirm('Delete this resume?')) return;
  try {
    await authFetch(`${API}/api/resume/builder?id=${id}`, { method: 'DELETE' });
    showToast('Resume deleted.');
    loadResumes();
  } catch { showToast('Delete failed.', 'error'); }
}


/* ---------- ANALYZE BUILT RESUME ---------- */
function resumeToText(d) {
  const parts = [];
  parts.push(d.personal?.fullName || '');
  parts.push(d.summary || '');
  d.education?.forEach(e => parts.push(`${e.institution||''} ${e.degree||''} ${e.field||''} ${e.year||''}`));
  d.experience?.forEach(e => parts.push(`${e.role||''} ${e.company||''} ${e.duration||''} ${e.description||''}`));
  parts.push((d.skills||[]).join(' '));
  d.projects?.forEach(p => parts.push(`${p.name||''} ${p.tech||''} ${p.description||''}`));
  d.certifications?.forEach(c => parts.push(`${c.name||''} ${c.issuer||''}`));
  parts.push((d.achievements||[]).filter(Boolean).join(' '));
  d.languages?.forEach(l => parts.push(`${l.language||''} ${l.proficiency||''}`));
  return parts.filter(Boolean).join('\n');
}

async function runBuiltAtsAnalysis() {
  const resultEl = document.getElementById('builtAtsResult');
  const btn = document.getElementById('analyzeBuiltBtn');
  const d = collectFormData();
  const text = resumeToText(d);

  if (text.trim().length < 50) {
    showToast('Add more details to your resume before analyzing.', 'error');
    return;
  }

  btn.disabled = true; btn.textContent = 'Analyzing…';
  resultEl.classList.add('resume-result-empty');
  resultEl.textContent = 'Calculating ATS score…';

  try {
    const res = await authFetch(`${API}/api/resume/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetRole: d.personal?.targetRole || 'Software Engineer' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    resultEl.classList.remove('resume-result-empty');
    resultEl.innerHTML = `
      <div class="resume-analysis">
        <div class="analysis-hero">
          <div class="analysis-score-block">
            <div class="analysis-score">${escHtml(String(data.atsScore))}</div>
            <div class="analysis-score-label">${escHtml(data.rating)}</div>
          </div>
          <div class="analysis-summary">
            <span class="analysis-role">ATS Match for ${escHtml(data.targetRole)}</span>
            <h4>${escHtml(data.summary)}</h4>
            ${data.matchedKeywords?.length ? `<div class="analysis-chips">${data.matchedKeywords.slice(0,8).map(k=>`<span class="analysis-chip">${escHtml(k)}</span>`).join('')}</div>` : ''}
          </div>
        </div>
        <div class="analysis-columns">
          <div class="analysis-column"><h5>Strengths</h5><ul>${(data.strengths||[]).map(s=>`<li>${escHtml(s)}</li>`).join('')}</ul></div>
          <div class="analysis-column"><h5>Improvements</h5><ul>${(data.improvements||[]).map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul></div>
        </div>
        ${data.missingKeywords?.length ? `<div class="analysis-keywords"><strong>Missing Keywords</strong><p class="analysis-muted">${escHtml(data.missingKeywords.join(', '))}</p></div>` : ''}
      </div>`;
    showToast('ATS analysis complete!');
  } catch (err) {
    resultEl.textContent = err.message || 'Analysis failed.';
    showToast(err.message || 'Analysis failed.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = '📊 Analyze ATS';
  }
}
/* ---------- EXPORT PDF ---------- */
function exportPdf() {
  const preview = document.getElementById('resumePreview');
  const name    = document.getElementById('rb-name').value || 'resume';

  // Simple print-to-PDF approach
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>${escHtml(name)} — Resume</title>
    <style>
      :root{--accent:#2563eb}
      *{box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#1a1a1a;font-size:13px;line-height:1.5}
      h1{font-size:26px;margin:0 0 6px;font-weight:800;letter-spacing:.02em}
      h2{font-size:13px;border-bottom:2px solid var(--accent);margin:16px 0 8px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:700;padding-bottom:3px}
      .rv-header{border-bottom:3px solid var(--accent);padding-bottom:10px;margin-bottom:6px}
      .rv-contact{display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:#555;margin-top:6px}
      .rv-section{margin-bottom:10px}
      .rv-item{margin-bottom:10px;page-break-inside:avoid}
      .rv-item strong{display:block;font-size:13px}
      .rv-item em{color:#555;font-style:normal}
      .rv-skills{display:flex;flex-wrap:wrap;gap:8px}
      .rv-skills span{background:#eef2ff;color:var(--accent);padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
      .rv-date{float:right;color:#777;font-size:11px;font-weight:600}
      .rv-tech{color:#666;font-size:11px;display:block;font-style:italic;margin-top:2px}
      p{margin:4px 0}
      ul{margin:4px 0;padding-left:18px}

      /* Modern */
      .rv-resume.modern h1{color:var(--accent)}
      .rv-resume.modern .rv-header{border-left:5px solid var(--accent);padding-left:14px;border-bottom:none}

      /* Classic */
      .rv-resume.classic{font-family:Georgia,'Times New Roman',serif;--accent:#1a1a1a}
      .rv-resume.classic h1{text-align:center;text-transform:uppercase;letter-spacing:.15em;font-size:24px}
      .rv-resume.classic h2{font-variant:small-caps;border-bottom:1px solid #999;color:#1a1a1a;letter-spacing:.08em}
      .rv-resume.classic .rv-header{text-align:center;border-bottom:1px solid #ccc}
      .rv-resume.classic .rv-contact{justify-content:center}
      .rv-resume.classic .rv-skills span{background:none;border:1px solid #999;color:#1a1a1a;border-radius:0}

      /* Minimal */
      .rv-resume.minimal{--accent:#888}
      .rv-resume.minimal h1{font-weight:300;letter-spacing:.04em}
      .rv-resume.minimal h2{border-bottom:none;color:#999;font-weight:400;letter-spacing:.2em;font-size:11px}
      .rv-resume.minimal .rv-header{border-bottom:1px solid #eee}
      .rv-resume.minimal .rv-skills span{background:none;border:1px solid #ddd;color:#555;border-radius:0}
      .rv-resume.minimal .rv-section{border-left:2px solid #eee;padding-left:12px}

      @page{size:A4;margin:15mm}
      @media print{body{padding:0;max-width:100%}}
    </style></head><body>${preview.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

/* ---------- ATS ANALYSIS ---------- */
async function runAtsAnalysis() {
  const file     = document.getElementById('atsFile')?.files?.[0];
  const role     = document.getElementById('atsRole')?.value.trim() || 'Software Engineer';
  const resultEl = document.getElementById('atsResult');

  if (!file) { showToast('Please select a PDF file.', 'error'); return; }
  if (!file.name.endsWith('.pdf')) { showToast('Only PDF files are supported.', 'error'); return; }

  const btn = document.getElementById('runAtsBtn');
  btn.disabled = true; btn.textContent = 'Analyzing…';
  resultEl.textContent = 'Reading resume and calculating ATS score…';
  resultEl.classList.add('resume-result-empty');

  try {
    const buffer = await file.arrayBuffer();
    const bytes  = new Uint8Array(buffer);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 0x8000) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 0x8000)));
    const base64 = btoa(chunks.join(''));

    const res  = await authFetch(`${API}/api/resume/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileName: file.name, fileType: file.type, fileDataBase64: base64, targetRole: role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    resultEl.classList.remove('resume-result-empty');
    resultEl.innerHTML = `
      <div class="resume-analysis">
        <div class="analysis-hero">
          <div class="analysis-score-block">
            <div class="analysis-score">${escHtml(String(data.atsScore))}</div>
            <div class="analysis-score-label">${escHtml(data.rating)}</div>
          </div>
          <div class="analysis-summary">
            <span class="analysis-role">ATS Match for ${escHtml(data.targetRole)}</span>
            <h4>${escHtml(data.summary)}</h4>
            ${data.matchedKeywords?.length ? `<div class="analysis-chips">${data.matchedKeywords.slice(0,8).map(k=>`<span class="analysis-chip">${escHtml(k)}</span>`).join('')}</div>` : ''}
          </div>
        </div>
        <div class="analysis-columns">
          <div class="analysis-column"><h5>Strengths</h5><ul>${(data.strengths||[]).map(s=>`<li>${escHtml(s)}</li>`).join('')}</ul></div>
          <div class="analysis-column"><h5>Improvements</h5><ul>${(data.improvements||[]).map(i=>`<li>${escHtml(i)}</li>`).join('')}</ul></div>
        </div>
        ${data.missingKeywords?.length ? `<div class="analysis-keywords"><strong>Missing Keywords</strong><p class="analysis-muted">${escHtml(data.missingKeywords.join(', '))}</p></div>` : ''}
      </div>`;
    showToast('ATS analysis complete!');
  } catch (err) {
    resultEl.textContent = err.message || 'Analysis failed.';
    showToast('Analysis failed.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Analyze Resume';
  }
}

/* ---------- UI SHOW/HIDE ---------- */
function showBuilder() {
  document.getElementById('resumeListSection').style.display    = 'none';
  document.getElementById('resumeBuilderSection').style.display = 'block';
  document.getElementById('atsAnalyzerSection').style.display   = 'none';
  initSkillsInput('rbSkillInput', 'rbSkillsChips', rbSkills);
  updatePreview();
}
function showList() {
  document.getElementById('resumeListSection').style.display    = 'block';
  document.getElementById('resumeBuilderSection').style.display = 'none';
  document.getElementById('atsAnalyzerSection').style.display   = 'none';
  currentResumeId = null;
  loadResumes();
}
function showAts() {
  document.getElementById('resumeListSection').style.display    = 'none';
  document.getElementById('resumeBuilderSection').style.display = 'none';
  document.getElementById('atsAnalyzerSection').style.display   = 'block';
}

/* ---------- EVENT BINDINGS ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadResumes();

  document.getElementById('newResumeBtn')?.addEventListener('click', () => { currentResumeId = null; rbData.education=[]; rbData.experience=[]; rbData.projects=[]; rbData.certs=[]; rbData.achievements=[]; rbData.languages=[]; rbSkills=[]; showBuilder(); });
  document.getElementById('cancelBuilderBtn')?.addEventListener('click', showList);
  document.getElementById('backFromAtsBtn')?.addEventListener('click', showList);
  document.getElementById('analyzeResumeBtn')?.addEventListener('click', showAts);
  document.getElementById('saveDraftBtn')?.addEventListener('click', () => saveResume(true));
  document.getElementById('saveAndPreviewBtn')?.addEventListener('click', () => saveResume(false));
  document.getElementById('exportPdfBtn')?.addEventListener('click', exportPdf);
  document.getElementById('analyzeBuiltBtn')?.addEventListener('click', runBuiltAtsAnalysis);
  document.getElementById('runAtsBtn')?.addEventListener('click', runAtsAnalysis);

  // ATS file label
  document.getElementById('atsFile')?.addEventListener('change', e => {
    document.getElementById('atsFileName').textContent = e.target.files[0]?.name || 'No file selected';
  });

  // Template change → re-render preview
  document.getElementById('templateSelect')?.addEventListener('change', updatePreview);

  // Builder section tabs
  document.querySelectorAll('.b-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.b-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.b-section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`bs-${tab.dataset.section}`)?.classList.add('active');
    });
  });

  // Add item buttons
  document.getElementById('addEducationBtn')?.addEventListener('click', () => { rbData.education.push({ institution:'', degree:'', field:'', year:'' }); renderAllLists(); });
  document.getElementById('addExpBtn')?.addEventListener('click',       () => { rbData.experience.push({ company:'', role:'', duration:'', description:'' }); renderAllLists(); });
  document.getElementById('addProjectBtn')?.addEventListener('click',   () => { rbData.projects.push({ name:'', tech:'', description:'' }); renderAllLists(); });
  document.getElementById('addCertBtn')?.addEventListener('click',      () => { rbData.certs.push({ name:'', issuer:'', year:'' }); renderAllLists(); });
  document.getElementById('addAchieveBtn')?.addEventListener('click',   () => { rbData.achievements.push(''); renderAllLists(); });
  document.getElementById('addLangBtn')?.addEventListener('click',      () => { rbData.languages.push({ language:'', proficiency:'' }); renderAllLists(); });

  // Live preview update on personal fields
  ['rb-name','rb-email','rb-phone','rb-location','rb-linkedin','rb-github','rb-summary'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePreview);
  });
});





/* ---------- ADMIN: ALL RESUMES ---------- */
let arPage = 1;

function fmtDate3(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escHtml3(str) {
  return String(str || "").replace(/[&<>"']/g, function(c) {
    var map = { "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#39;" };
    return map[c];
  });
}

async function loadAdminResumes() {
  var body = document.getElementById("arBody");
  var errEl = document.getElementById("arError");
  if (!body) return;
  errEl.textContent = "";
  body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">Loading...</td></tr>";

  try {
    var params = new URLSearchParams({ page: arPage, limit: 20 });
    var res = await authFetch(API + "/api/admin/resumes?" + params.toString());
    var data = await res.json();
    if (!res.ok) throw new Error(data.error);

    if (!data.resumes || !data.resumes.length) {
      body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">No resumes found.</td></tr>";
      document.getElementById("arPagination").innerHTML = "";
      return;
    }

    body.innerHTML = data.resumes.map(function(r) {
      var u = r.user || {};
      return "<tr>"
        + "<td>" + escHtml3((u.firstName || "") + " " + (u.lastName || "")) + "</td>"
        + "<td>" + escHtml3(u.email) + "</td>"
        + "<td>" + escHtml3(r.title) + "</td>"
        + "<td>" + escHtml3(r.template) + "</td>"
        + "<td>" + (r.atsScore || 0) + "</td>"
        + "<td>" + fmtDate3(r.updatedAt) + "</td>"
        + "</tr>";
    }).join("");

    var pag = document.getElementById("arPagination");
    if (data.pages > 1) {
      var html = "";
      for (var i = 1; i <= data.pages; i++) {
        html += "<button class=\"admin-page-btn " + (i === arPage ? "active" : "") + "\" data-page=\"" + i + "\">" + i + "</button>";
      }
      pag.innerHTML = html;
      pag.querySelectorAll(".admin-page-btn").forEach(function(btn) {
        btn.addEventListener("click", function() { arPage = Number(btn.dataset.page); loadAdminResumes(); });
      });
    } else {
      pag.innerHTML = "";
    }
  } catch (err) {
    errEl.textContent = err.message || "Failed to load resumes.";
    body.innerHTML = "<tr><td colspan=\"6\" class=\"empty-state\">Could not load resumes.</td></tr>";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  var user = getSession();
  if (user && user.isAdmin) {
    document.getElementById("resumeListSection").style.display = "none";
    document.getElementById("adminResumesView").style.display = "block";
    var newBtn = document.getElementById("newResumeBtn");
    var analyzeBtn = document.getElementById("analyzeResumeBtn");
    if (newBtn) newBtn.style.display = "none";
    if (analyzeBtn) analyzeBtn.style.display = "none";
    loadAdminResumes();
  }
});
