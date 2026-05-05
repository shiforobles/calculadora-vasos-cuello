// ─── App State ────────────────────────────────────────────
let state = {
  templateIdx: -1,
  values: {},
  bodyEdited: false,
  conclusionEdited: false,
  patient: { hc: '', edad: '', sexo: '' }
};

// ─── Init ─────────────────────────────────────────────────
(function init() {
  const sel = document.getElementById('template-select');

  // Build grouped <optgroup> menu
  const groups = {};
  TEMPLATES.forEach((t, i) => {
    const g = t.group || 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push({ t, i });
  });
  Object.entries(groups).forEach(([name, items]) => {
    const og = document.createElement('optgroup');
    og.label = name;
    items.forEach(({ t, i }) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = t.title;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });

  // Restore last used template by title (robust against reordering)
  const savedTitle = localStorage.getItem('dopplerLastTemplate');
  if (savedTitle) {
    const idx = TEMPLATES.findIndex(t => t.title === savedTitle);
    if (idx >= 0) { sel.value = idx; onTemplateChange(); }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      copyReport();
    }
  });

  updateStats();
})();

// ─── Template selection ───────────────────────────────────
function onTemplateChange() {
  const sel = document.getElementById('template-select');
  const idx = parseInt(sel.value, 10);

  if (isNaN(idx)) {
    state.templateIdx = -1;
    clearAll(false);
    return;
  }

  state.templateIdx = idx;
  state.values = {};
  state.bodyEdited = false;
  state.conclusionEdited = false;

  const tpl = TEMPLATES[idx];

  localStorage.setItem('dopplerLastTemplate', tpl.title);

  // Init default values for each variable
  tpl.variables.forEach(v => {
    const cfg = VAR_CONFIG[v];
    if (cfg && cfg.type === 'select') {
      state.values[v] = cfg.options[0].value;
    } else {
      state.values[v] = '';
    }
  });

  renderVarsPanel(tpl);
  renderReport();
  updateIndicator(tpl);
  checkSuggestion();

  document.getElementById('body-edit-notice').classList.remove('visible');
  document.getElementById('conclusion-edit-notice').classList.remove('visible');
}

// ─── Render variable inputs ───────────────────────────────
function renderVarsPanel(tpl) {
  const panel = document.getElementById('vars-panel');
  const empty = document.getElementById('vars-empty');
  const countBadge = document.getElementById('vars-count');

  panel.innerHTML = '';

  if (!tpl.variables || tpl.variables.length === 0) {
    panel.appendChild(Object.assign(document.createElement('div'), {
      id: 'vars-empty',
      textContent: 'Esta plantilla no requiere variables.',
      style: 'font-size:.83rem;color:var(--muted);font-style:italic;text-align:center;padding:.5rem 0;'
    }));
    countBadge.style.display = 'none';
    return;
  }

  countBadge.style.display = '';
  countBadge.textContent = tpl.variables.length;

  tpl.variables.forEach(varName => {
    const cfg = VAR_CONFIG[varName] || { type: 'text', label: varName, placeholder: varName };
    const wrap = document.createElement('div');
    wrap.className = 'field';

    const lbl = document.createElement('label');
    lbl.className = 'field-label';
    lbl.textContent = cfg.label || varName;

    let input;
    if (cfg.type === 'select') {
      input = document.createElement('select');
      cfg.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        input.appendChild(o);
      });
      // Set default
      if (state.values[varName]) input.value = state.values[varName];
    } else {
      input = document.createElement('input');
      input.type = cfg.type || 'text';
      input.placeholder = cfg.placeholder || '';
      if (cfg.step) input.step = cfg.step;
      if (cfg.min !== undefined) input.min = cfg.min;
      if (state.values[varName]) input.value = state.values[varName];
      if (cfg.readonly) {
        input.readOnly = true;
        input.style.cssText = 'background:#f1f5f9;color:#475569;font-weight:600;cursor:default;';
      }
    }

    input.dataset.var = varName;
    if (!cfg.readonly) {
      input.addEventListener('input', onVarInput);
      input.addEventListener('change', onVarInput);
    }

    wrap.appendChild(lbl);
    wrap.appendChild(input);
    panel.appendChild(wrap);
  });
}

// ─── Variable input handler ───────────────────────────────
function onVarInput(e) {
  const varName = e.target.dataset.var;
  state.values[varName] = e.target.value;

  // Auto-calculate ratio when VPS ACC or VPS ACI changes
  if (varName === 'vps' || varName === 'vps_acc') {
    const vpsAci = parseFloat(state.values.vps);
    const vpsAcc = parseFloat(state.values.vps_acc);
    if (!isNaN(vpsAci) && !isNaN(vpsAcc) && vpsAcc > 0) {
      const ratio = (vpsAci / vpsAcc).toFixed(1);
      state.values.ratio = ratio;
      const ratioInput = document.querySelector('[data-var="ratio"]');
      if (ratioInput) ratioInput.value = ratio;
    } else {
      state.values.ratio = '';
      const ratioInput = document.querySelector('[data-var="ratio"]');
      if (ratioInput) ratioInput.value = '';
    }
  }

  // Only re-render if user hasn't manually edited the body
  if (!state.bodyEdited) {
    renderBody();
  }
  if (!state.conclusionEdited) {
    renderConclusion();
  }

  checkSuggestion();
  updateStats();
  // Refresh guide if open
  if (document.getElementById('guide-panel').classList.contains('open')) renderGuide();
}

// ─── Render body & conclusion from template ───────────────
function renderReport() {
  renderBody();
  renderConclusion();
  updateStats();
}

function applyVars(template) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    return state.values[name] !== undefined && state.values[name] !== ''
      ? state.values[name]
      : match;
  });
}

function renderBody() {
  if (state.templateIdx < 0) return;
  const tpl = TEMPLATES[state.templateIdx];
  // Use body_ambas variant when lado_bilateral === 'ambas'
  const bodyTemplate = (tpl.body_ambas && state.values['lado_bilateral'] === 'ambas')
    ? tpl.body_ambas
    : tpl.body;
  document.getElementById('report-body').value = applyVars(bodyTemplate);
  updateStats();
}

function renderConclusion() {
  if (state.templateIdx < 0) return;
  const tpl = TEMPLATES[state.templateIdx];
  document.getElementById('report-conclusion').value = applyVars(tpl.conclusion);
}

// ─── Manual edit trackers ─────────────────────────────────
function onBodyInput() {
  state.bodyEdited = true;
  document.getElementById('body-edit-notice').classList.add('visible');
  updateStats();
}

function onConclusionInput() {
  state.conclusionEdited = true;
  document.getElementById('conclusion-edit-notice').classList.add('visible');
}

// ─── Reset buttons ────────────────────────────────────────
function resetBody() {
  if (state.templateIdx < 0) return;
  state.bodyEdited = false;
  renderBody();
  document.getElementById('body-edit-notice').classList.remove('visible');
}

function resetConclusion() {
  if (state.templateIdx < 0) return;
  state.conclusionEdited = false;
  renderConclusion();
  document.getElementById('conclusion-edit-notice').classList.remove('visible');
}

// ─── Smart suggestion ─────────────────────────────────────
function checkSuggestion() {
  const banner = document.getElementById('suggestion-banner');
  const match = SUGGESTIONS.find(s => s.test(state.values));

  if (!match) {
    banner.style.display = 'none';
    return;
  }

  const tplName = match.suggestTemplate;
  const tplIdx = TEMPLATES.findIndex(t => t.title === tplName);

  banner.style.display = 'block';
  banner.innerHTML = `
    👉 Sugerencia: ${match.message(state.values)}
    ${tplIdx >= 0 ? `<br><button class="suggest-btn" onclick="applySuggestedTemplate(${tplIdx})">Usar plantilla "${tplName}"</button>` : ''}
  `;
}

function applySuggestedTemplate(idx) {
  const sel = document.getElementById('template-select');
  sel.value = idx;
  onTemplateChange();
}

// ─── Template indicator ───────────────────────────────────
function updateIndicator(tpl) {
  document.getElementById('template-indicator').innerHTML =
    `Plantilla activa: <span class="tpl-name">${tpl.title}</span>`;
}

// ─── Stats ────────────────────────────────────────────────
function updateStats() {
  const body = document.getElementById('report-body').value;
  const conclusion = document.getElementById('report-conclusion').value;
  const full = body + ' ' + conclusion;

  document.getElementById('body-count').textContent =
    `${body.length} caracteres`;

  document.getElementById('word-count').textContent =
    full.trim() ? full.trim().split(/\s+/).length : 0;

  document.getElementById('total-count').textContent =
    full.trim().length;
}

// ─── Actions ──────────────────────────────────────────────
function copyReport() {
  const body = document.getElementById('report-body').value.trim();
  const conclusion = document.getElementById('report-conclusion').value.trim();

  if (!body && !conclusion) {
    showToast('No hay informe para copiar.');
    return;
  }

  let full = body;
  if (conclusion) full += '\n\nCONCLUSIÓN:\n' + conclusion;

  navigator.clipboard.writeText(full)
    .then(() => showToast('✓ Informe copiado al portapapeles'))
    .catch(() => fallbackCopy(full));
}

function copyConclusion() {
  const text = document.getElementById('report-conclusion').value.trim();
  if (!text) { showToast('No hay conclusión para copiar.'); return; }
  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Conclusión copiada'))
    .catch(() => fallbackCopy(text));
}

function fallbackCopy(text) {
  const ta = document.getElementById('report-body');
  const prev = ta.value;
  ta.value = text;
  ta.select();
  document.execCommand('copy');
  ta.value = prev;
  showToast('✓ Copiado');
}

function exportTxt() {
  const body = document.getElementById('report-body').value.trim();
  const conclusion = document.getElementById('report-conclusion').value.trim();

  if (!body && !conclusion) {
    showToast('No hay informe para exportar.');
    return;
  }

  let full = body;
  if (conclusion) full += '\n\nCONCLUSIÓN:\n' + conclusion;

  const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const tplName = state.templateIdx >= 0
    ? TEMPLATES[state.templateIdx].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : 'informe';

  const date = new Date().toISOString().slice(0, 10);
  a.download = `doppler_${tplName}_${date}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Archivo exportado');
}

function clearAll(resetSelect = true) {
  if (resetSelect) {
    document.getElementById('template-select').value = '';
    state.templateIdx = -1;
    localStorage.removeItem('dopplerLastTemplate');
    document.getElementById('template-indicator').textContent = '';
    document.getElementById('suggestion-banner').style.display = 'none';
  }

  state.values = {};
  state.bodyEdited = false;
  state.conclusionEdited = false;

  document.getElementById('report-body').value = '';
  document.getElementById('report-conclusion').value = '';
  document.getElementById('vars-panel').innerHTML =
    '<div style="font-size:.83rem;color:var(--muted);font-style:italic;text-align:center;padding:.5rem 0;">Seleccione una plantilla</div>';
  document.getElementById('vars-count').style.display = 'none';
  document.getElementById('body-edit-notice').classList.remove('visible');
  document.getElementById('conclusion-edit-notice').classList.remove('visible');

  updateStats();
}

// ─── Google Sheets Integration ───────────────────────────
function openSettings() {
  const url = localStorage.getItem('sheetsScriptUrl') || '';
  document.getElementById('sheets-url-input').value = url;
  document.getElementById('sheets-status').className = 'sheets-status';
  document.getElementById('settings-overlay').classList.add('open');
}

function closeSettings(e) {
  if (e && e.target !== document.getElementById('settings-overlay')) return;
  document.getElementById('settings-overlay').classList.remove('open');
}

function saveSettings() {
  const url = document.getElementById('sheets-url-input').value.trim();
  const status = document.getElementById('sheets-status');
  if (!url.startsWith('https://script.google.com/macros/s/')) {
    status.className = 'sheets-status err';
    status.textContent = 'La URL debe empezar con https://script.google.com/macros/s/...';
    return;
  }
  localStorage.setItem('sheetsScriptUrl', url);
  status.className = 'sheets-status ok';
  status.textContent = '✓ URL guardada correctamente en este navegador.';
  setTimeout(() => document.getElementById('settings-overlay').classList.remove('open'), 1200);
}

async function saveToSheets() {
  const url = localStorage.getItem('sheetsScriptUrl');
  if (!url) { openSettings(); showToast('Configurá la URL de tu Apps Script primero.'); return; }
  if (state.templateIdx < 0) { showToast('Seleccioná una plantilla antes de guardar.'); return; }

  const tpl = TEMPLATES[state.templateIdx];
  const v = state.values;
  const conclusion = document.getElementById('report-conclusion').value.trim();

  const payload = JSON.stringify({
    fecha:       new Date().toLocaleString('es-AR'),
    hc:          state.patient.hc   || '',
    edad:        state.patient.edad  || '',
    sexo:        state.patient.sexo  || '',
    grupo:       tpl.group           || '',
    diagnostico: tpl.title,
    lado:        v.lado || v.lado_bilateral || '',
    tipo_placa:  v.tipo_placa  || '',
    gim_d:       v.gim_d       || '',
    gim_i:       v.gim_i       || '',
    vps_acc:     v.vps_acc     || '',
    vps_aci:     v.vps        || '',
    vfd_aci:     v.vfd        || '',
    ratio:       v.ratio       || '',
    conclusion
  });

  const btn = document.getElementById('btn-sheets');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', body: payload });
    showToast('✓ Guardado en Sheets');
  } catch (err) {
    showToast('Error de red. Verificá tu conexión.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> Guardar en Sheets`;
  }
}

// ─── Clinical Guide ──────────────────────────────────────
function toggleGuide() {
  const panel = document.getElementById('guide-panel');
  const isOpen = panel.classList.contains('open');
  if (isOpen) { closeGuide(); } else { openGuide(); }
}

function openGuide() {
  renderGuide();
  document.getElementById('guide-panel').classList.add('open');
  document.getElementById('guide-overlay').classList.add('open');
}

function closeGuide() {
  document.getElementById('guide-panel').classList.remove('open');
  document.getElementById('guide-overlay').classList.remove('open');
}

function getGuideData() {
  if (state.templateIdx < 0) return null;
  const tpl = TEMPLATES[state.templateIdx];
  const vals = state.values;
  const tipo = vals.tipo_placa || '';
  const esVulnerable = tipo === 'fibrolipídica' || tipo === 'heterogénea';
  const vps = parseFloat(vals.vps);
  const t = tpl.title;

  // ── Sin enfermedad ──────────────────────────────────────
  if (t === 'Normal') return {
    dx: 'Sin enfermedad aterosclerótica carotídea',
    riesgo: 'Bajo', riesgoClass: 'riesgo-bajo',
    conducta: [
      'No requiere tratamiento específico por este estudio',
      'Estratificar RCV global (SCORE2 / Framingham)',
      'Controlar factores de riesgo (HTA, DBT, dislipemia, tabaco)',
    ],
    seguimiento: '2–3 años según perfil de riesgo',
    ref: [
      ['GIM normal', '< 0.09 cm  (< 0.9 mm)'],
      ['GIM borderline', '0.09 – 0.10 cm  (0.9 – 1.0 mm)'],
      ['GIM aumentado', '> 0.10 cm  (> 1.0 mm)'],
      ['Criterio de placa', '≥ 0.15 cm  (≥ 1.5 mm) focal'],
    ]
  };

  if (t === 'Normal añoso (fibroesclerosis)') return {
    dx: 'Cambios involutivos. Sin enfermedad aterosclerótica activa',
    riesgo: 'Bajo–Moderado', riesgoClass: 'riesgo-mod',
    conducta: [
      'Estratificar RCV global',
      'Controlar FRCV si corresponde',
      'No indicación de estatina solo por este hallazgo',
    ],
    seguimiento: '2–3 años',
    ref: []
  };

  if (t === 'Engrosamiento IMT borderline (0.9–1.0 mm)') return {
    dx: 'Engrosamiento parietal leve — marcador precoz de riesgo cardiovascular',
    riesgo: 'Bajo–Moderado', riesgoClass: 'riesgo-mod',
    conducta: [
      'Modificar factores de riesgo (dieta mediterránea, ejercicio, cese tabaco)',
      'Estratificar RCV global con SCORE2 o Framingham',
      'No indicación automática de estatina solo por IMT borderline',
      'Repetir estudio en 2–3 años para evaluar progresión',
    ],
    seguimiento: '2–3 años',
    ref: [
      ['GIM normal', '< 0.9 mm'],
      ['GIM borderline', '0.9–1.0 mm  (este estudio)'],
      ['GIM aumentado', '> 1.0 mm'],
      ['Criterio de placa', '≥ 1.5 mm focal ó protrusión > 0.5 mm'],
    ]
  };

  if (t === 'Engrosamiento IMT significativo (>1.0 mm)') return {
    dx: 'Aterosclerosis subclínica establecida — GIM aumentado',
    riesgo: 'Moderado', riesgoClass: 'riesgo-mod',
    conducta: [
      'Modificación intensiva de factores de riesgo',
      'Estatina si RCV global moderado–alto (SCORE2 ≥ 5%)',
      'Meta LDL < 70 mg/dL si RCV moderado',
      'Control de HTA (meta < 130/80), DBT, dislipemia',
    ],
    seguimiento: '12–18 meses',
    ref: [
      ['GIM normal', '< 0.9 mm'],
      ['GIM borderline', '0.9–1.0 mm'],
      ['GIM aumentado', '> 1.0 mm  (este estudio)'],
      ['Criterio de placa', '≥ 1.5 mm focal'],
    ]
  };

  if (t === 'Ateromatosis mínima') return {
    dx: 'Aterosclerosis carotídea precoz — sin placa definida aún',
    riesgo: 'Moderado', riesgoClass: 'riesgo-mod',
    conducta: [
      'Estatina según score de riesgo global (no automática)',
      'Modificación intensiva de FRCV',
      'Suspender tabaco (reduce progresión un 50%)',
      'Control lipídico: LDL < 70 mg/dL si RCV moderado',
    ],
    seguimiento: '12 meses',
    ref: [
      ['Criterio de ateromatosis mínima', 'IMT focal 1.0–1.4 mm en bulbo'],
      ['Sin placa definida', '< 1.5 mm de espesor focal'],
    ]
  };

  // ── Placa no obstructiva ────────────────────────────────
  const esPlaqueTemplate = [
    'Placa focal no obstructiva',
    'Placas ipsilaterales no obstructivas',
    'Placas bilaterales no significativas',
    'Ateromatosis difusa sin repercusión',
    'Estenosis leve ACI (<50%)',
  ].includes(t);

  if (esPlaqueTemplate) return {
    dx: 'Enfermedad Aterosclerótica Carotídea establecida — RCV Alto',
    riesgo: esVulnerable ? 'Muy alto (placa vulnerable)' : 'Alto',
    riesgoClass: esVulnerable ? 'riesgo-muyalto' : 'riesgo-alto',
    conducta: [
      'Estatina alta intensidad: Rosuvastatina 20–40 mg/d  ó  Atorvastatina 40–80 mg/d',
      'Meta LDL < 55 mg/dL (ESC 2019 muy alto RCV)',
      'AAS 100 mg/día',
      'Control de HTA (meta < 130/80), DBT, obesidad, cese tabaco',
      ...(esVulnerable ? ['⚠️ Placa vulnerable: riesgo embólico elevado → evaluar doble antiagregación (AAS + Clopidogrel 75 mg/d)'] : []),
      ...(tipo === 'heterogénea' ? ['⚠️ Placa ulcerada/irregular: posible fuente embolígena — derivar si AIT/ACV previo'] : []),
      t === 'Ateromatosis difusa sin repercusión' ? 'Carga aterosclerótica extensa: seguimiento más frecuente' : '',
    ].filter(Boolean),
    seguimiento: t === 'Ateromatosis difusa sin repercusión' ? '6 meses' : '12 meses',
    ref: [
      ['Criterio de placa', '≥ 1.5 mm ó protrusión > 0.5 mm sobre pared adyacente'],
      ['Placa blanda/vulnerable', 'Hipoecogénica — alto riesgo de rotura'],
      ['Placa fibrocálcica', 'Hiperecogénica con sombra — estable'],
      ['Meta LDL (muy alto RCV)', '< 55 mg/dL'],
      ['Meta LDL (alto RCV)', '< 70 mg/dL'],
    ]
  };

  // ── Estenosis moderada ──────────────────────────────────
  if (t === 'Estenosis moderada ACI (50–69%)') return {
    dx: 'Estenosis moderada de ACI — tratamiento médico con seguimiento estricto',
    riesgo: 'Alto', riesgoClass: 'riesgo-alto',
    conducta: [
      'Estatina alta intensidad (Rosuva 20–40 mg ó Atorva 40–80 mg) — meta LDL < 55',
      'AAS 100 mg/día',
      'Control estricto de todos los FRCV',
      'Derivar a cirugía vascular para evaluación (no indicación quirúrgica automática)',
      '⚠️ Si AIT o ACV previo: evaluación urgente (ventana quirúrgica 2 semanas)',
    ],
    seguimiento: '6 meses con eco Doppler',
    ref: [
      ['VPS ACI moderada', '125–229 cm/s'],
      ['Ratio ACI/ACC', '2.0–3.9'],
      ['VFD ACI', '40–99 cm/s'],
      ['Umbral quirúrgico (sintomático)', '≥ 50% con AIT/ACV'],
    ]
  };

  // ── Estenosis severa ────────────────────────────────────
  if (t === 'Estenosis severa ACI (>70%)') return {
    dx: 'Estenosis severa de ACI — evaluar revascularización',
    riesgo: 'Muy alto / Crítico', riesgoClass: 'riesgo-critico',
    conducta: [
      '⚠️ Derivación urgente a cirugía vascular',
      'Sintomático (AIT/ACV): CEA ideal en las primeras 2 semanas',
      'Asintomático ≥ 70%: evaluar CEA si expectativa de vida > 5 años y riesgo quirúrgico bajo',
      'Antiagregante previo al procedimiento (AAS 100 mg/día)',
      'Estatina alta intensidad (estabilización preoperatoria)',
      'No suspender antiagregante ni estatina en el perioperatorio',
    ],
    seguimiento: 'Post-CEA: 1 mes, 6 meses, luego anual',
    ref: [
      ['VPS ACI severa', '≥ 230 cm/s'],
      ['Ratio ACI/ACC severa', '≥ 4.0'],
      ['VFD ACI severa', '≥ 100 cm/s'],
      ['Umbral quirúrgico sintomático', '≥ 50%'],
      ['Umbral quirúrgico asintomático', '≥ 70%'],
      ['Técnica de elección', 'CEA (endarterectomía)'],
      ['Alternativa', 'CAS (stenting) si alto riesgo quirúrgico'],
    ]
  };

  // ── Suboclusión ─────────────────────────────────────────
  if (t === 'Suboclusión ACI (near-occlusion)') return {
    dx: 'Near-occlusion — estenosis >99% con luz residual mínima (string sign)',
    riesgo: 'Crítico', riesgoClass: 'riesgo-critico',
    conducta: [
      '⚠️ Derivación URGENTE a cirugía vascular / neurointervencionismo',
      '⚠️ TRAMPA: las velocidades pueden ser BAJAS o normales (colapso distal del lumen)',
      'Buscar "string sign" en color Doppler: señal filiforme en ACI',
      'Doble antiagregación inmediata: AAS 100 mg + Clopidogrel 75 mg',
      'Estatina alta intensidad',
      'Si sintomático: hospitalización — riesgo muy elevado de ACV inminente',
    ],
    seguimiento: 'Urgente — no diferir consulta vascular',
    ref: [
      ['String sign', 'Luz filiforme visible en color Doppler'],
      ['VPS', 'Puede ser BAJA paradójicamente (colapso distal)'],
      ['Diferencial oclusión', 'Suboclusión: señal filiforme presente'],
      ['Diferencial oclusión', 'Oclusión total: ausencia completa de flujo'],
      ['Riesgo de ACV', 'Mayor que en estenosis severa clásica'],
    ]
  };

  // ── Oclusión ────────────────────────────────────────────
  if (t === 'Oclusión ACI') return {
    dx: 'Oclusión total de ACI — no operable en la mayoría de los casos',
    riesgo: 'Muy alto', riesgoClass: 'riesgo-muyalto',
    conducta: [
      'Tratamiento médico (oclusión crónica no es quirúrgica)',
      'Anticoagulación si trombo fresco reciente (discutir con neurología)',
      'AAS 100 mg/día o anticoagulación según etiología',
      'Estatina alta intensidad',
      'Derivar a neurología / unidad de ACV',
      '⚠️ Si ACV agudo: activar código ACV — evaluación para trombectomía',
    ],
    seguimiento: '3–6 meses (evaluar circulación colateral)',
    ref: [
      ['Signo directo', 'Ausencia total de flujo Doppler en ACI'],
      ['ACC ipsilateral', 'Patrón de alta resistencia (sin salida distal)'],
      ['ACE ipsilateral', 'Flujo conservado (distingue de suboclusión)'],
      ['Diferencial', 'Suboclusión: señal filiforme presente en color'],
    ]
  };

  // ── Estenosis externa ───────────────────────────────────
  if (t === 'Estenosis carótida externa significativa') return {
    dx: 'Estenosis de carótida externa — habitualmente no quirúrgica',
    riesgo: 'Moderado–Alto', riesgoClass: 'riesgo-alto',
    conducta: [
      'Tratamiento médico en la mayoría de los casos',
      'Estatina alta intensidad + AAS 100 mg/día',
      'La ACE estenótica raramente requiere cirugía (salvo casos selectos)',
      'Si AIT en territorio ipsilateral: derivar para evaluación',
    ],
    seguimiento: '12 meses',
    ref: [
      ['Identificación ACE', 'Patrón alta resistencia (diástole baja)'],
      ['Temporal tap sign', 'Golpear art. temporal → ondas en espectral ACE'],
      ['ACI vs ACE', 'ACI: baja resistencia, sin ramas visibles proximales'],
    ]
  };

  return null;
}

function renderGuide() {
  const tpl = state.templateIdx >= 0 ? TEMPLATES[state.templateIdx] : null;
  const nameEl = document.getElementById('guide-tpl-name');
  const bodyEl = document.getElementById('guide-body');

  if (!tpl) {
    nameEl.textContent = '';
    bodyEl.innerHTML = '<p style="font-size:.85rem;color:#64748b;text-align:center;padding:1rem 0;">Seleccione una plantilla para ver la guía clínica.</p>';
    return;
  }

  nameEl.textContent = tpl.title;
  const g = getGuideData();
  if (!g) { bodyEl.innerHTML = '<p style="padding:1rem;font-size:.83rem;color:#64748b;">Sin guía disponible para esta plantilla.</p>'; return; }

  const conducta = g.conducta.map(c => {
    const isWarn = c.startsWith('⚠️');
    const text = isWarn ? c.replace('⚠️ ', '') : c;
    return `<li class="${isWarn ? 'warn' : ''}">${isWarn ? '⚠️ ' : ''}${text}</li>`;
  }).join('');

  const refRows = g.ref && g.ref.length
    ? g.ref.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
    : '';

  bodyEl.innerHTML = `
    <div class="guide-block">
      <div class="guide-block-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        Diagnóstico
      </div>
      <div class="guide-dx">${g.dx}</div>
      <div class="guide-riesgo ${g.riesgoClass}">Riesgo: ${g.riesgo}</div>
    </div>

    <div class="guide-block">
      <div class="guide-block-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        Conducta terapéutica
      </div>
      <ul class="guide-conducta-list">${conducta}</ul>
    </div>

    <div class="guide-block">
      <div class="guide-block-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Seguimiento sugerido
      </div>
      <div class="guide-seguimiento"><strong>${g.seguimiento}</strong></div>
    </div>

    ${refRows ? `
    <div class="guide-block">
      <div class="guide-block-title">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
        Valores de referencia
      </div>
      <table class="guide-ref-table">${refRows}</table>
    </div>` : ''}

    <p style="font-size:.7rem;color:#86efac;text-align:center;padding:.25rem 0;">
      Solo orientación clínica — no incluida en el informe
    </p>
  `;
}

// ─── Toast ────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
