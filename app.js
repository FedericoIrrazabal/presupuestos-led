const BUDGETS_KEY = 'presupuestos.budgets';
const ISSUER_KEY = 'presupuestos.issuer';
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MAX_AMOUNT = 999_999_999_999_999;

// Personal data is never shipped in the code: each phone loads it once from «Mis datos».
const DEFAULT_ISSUER = { name: '', cuit: '', providerNumber: '', address: '', email: '', phone: '', phone2: '', city: '', signature: '', dni: '' };

const $ = (id) => document.getElementById(id);
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

let toastTimer;
function toast(message, ms = 2600) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    el.textContent = '';
  }, ms);
}

// ---------- Storage ----------

// A corrupt value is moved aside instead of being overwritten by the next save.
function loadBudgets() {
  const raw = localStorage.getItem(BUDGETS_KEY);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  localStorage.setItem(`${BUDGETS_KEY}.dañado-${Date.now()}`, raw);
  localStorage.removeItem(BUDGETS_KEY);
  setTimeout(() => toast('Los presupuestos guardados estaban dañados. Se guardó una copia aparte.', 6000));
  return [];
}

function readIssuer() {
  try {
    const { tagline, ...stored } = JSON.parse(localStorage.getItem(ISSUER_KEY)) ?? {};
    return { ...DEFAULT_ISSUER, ...stored };
  } catch {
    return { ...DEFAULT_ISSUER };
  }
}

let budgets = [];
try {
  budgets = loadBudgets();
} catch {
  budgets = [];
}
let issuer = readIssuer();
let current = null;

function setSaveStatus(ok) {
  const el = $('save-status');
  el.textContent = ok ? 'Guardado' : 'No se pudo guardar';
  el.classList.toggle('error', !ok);
}

// Re-reads storage before writing so a second tab or window never erases the other's budgets.
function persist(mutate) {
  try {
    const latest = loadBudgets();
    mutate(latest);
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(latest));
    budgets = latest;
    setSaveStatus(true);
  } catch {
    setSaveStatus(false);
  }
}

function upsert(budget) {
  persist((list) => {
    const index = list.findIndex((b) => b.id === budget.id);
    if (index >= 0) list[index] = budget;
    else list.push(budget);
  });
}

function touch() {
  current.updatedAt = Date.now();
  upsert(current);
  updateWordsWarning();
}

window.addEventListener('storage', (event) => {
  if (event.key !== BUDGETS_KEY) return;
  budgets = loadBudgets();
  if (!current) return renderList();
  const index = budgets.findIndex((b) => b.id === current.id);
  if (index < 0) {
    toast('Este presupuesto se eliminó en otra ventana.');
    goToList();
  } else {
    budgets[index] = current;
  }
});

// ---------- Text input ----------

function cleanInput(el) {
  const clean = stripEmoji(el.value);
  if (clean === el.value) return el.value;
  const caret = stripEmoji(el.value.slice(0, el.selectionStart ?? el.value.length)).length;
  el.value = clean;
  el.setSelectionRange?.(caret, caret);
  toast('Los emojis no se pueden usar en el PDF y se quitaron.');
  return clean;
}

// Accepts "24.000.000", "24.000.000,50", "24000000.5" and "$ 24.000.000"; decimals are rounded.
function parseMoney(text) {
  let digits = String(text).replace(/[^\d.,]/g, '');
  const comma = digits.lastIndexOf(',');
  if (comma >= 0) {
    digits = digits.slice(0, comma).replace(/\./g, '') + '.' + digits.slice(comma + 1).replace(/\D/g, '');
  } else {
    const groups = digits.split('.');
    const last = groups.pop();
    const lastIsDecimal = groups.length > 0 && last.length !== 3;
    digits = groups.join('') + (lastIsDecimal ? '.' : '') + last;
  }
  return Math.min(Math.round(Number(digits) || 0), MAX_AMOUNT);
}

function normalizeWords(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(de )?pesos\b/g, '')
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

function wordsMismatch(budget) {
  if (!budget.wordsEdited) return false;
  const expected = budget.total ? numberToTitleWords(budget.total) : '';
  return normalizeWords(budget.totalWords) !== normalizeWords(expected);
}

function updateWordsWarning() {
  const warning = $('words-warning');
  const mismatch = current && wordsMismatch(current);
  warning.hidden = !mismatch;
  // Hidden text still reaches screen readers through aria-describedby, so it is cleared too.
  warning.textContent = mismatch ? `Las letras no coinciden con el monto (${formatMoney(current.total)}). Tocá ↻ para recalcularlas.` : '';
}

// ---------- Screens and history ----------

function closingFor(date) {
  const year = date.getFullYear().toLocaleString('es-AR');
  const place = issuer.city ? `${issuer.city}, ` : '';
  return `${place}${date.getDate()} de ${MONTHS[date.getMonth()]} de ${year}.-`;
}

function newBudget() {
  return {
    id: newId(),
    event: '',
    days: '',
    description: '',
    section: '',
    items: [DEFAULT_ITEM_TEXT],
    total: 0,
    totalWords: '',
    wordsEdited: false,
    closing: closingFor(new Date()),
    updatedAt: Date.now(),
  };
}

function renderList() {
  const list = $('budget-list');
  list.innerHTML = '';
  const sorted = [...budgets].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const b of sorted) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'budget-card';
    const line = (className, text) => {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text;
      card.append(span);
    };
    line('name', b.event || 'Sin nombre de evento');
    if (b.section || b.days) line('sub', [b.section, b.days].filter(Boolean).join(' · '));
    line('total', formatMoney(b.total));
    card.onclick = () => openEditor(b.id, 'push');
    const li = document.createElement('li');
    li.append(card);
    list.append(li);
  }
  $('empty').hidden = budgets.length > 0;
  $('issuer-missing').hidden = Boolean(issuer.name);
}

function showScreen(editing) {
  for (const id of ['edit-screen', 'edit-bar', 'back', 'screen-title', 'save-status']) $(id).hidden = !editing;
  for (const id of ['list-screen', 'list-bar', 'brand', 'brand-spacer']) $(id).hidden = editing;
  window.scrollTo(0, 0);
}

function showList() {
  current = null;
  showScreen(false);
  renderList();
}

// The editor gets its own history entry so the Android back button returns to the list.
function goToList() {
  if (history.state?.budgetId) history.back();
  else showList();
}

window.addEventListener('popstate', (event) => {
  const id = event.state?.budgetId;
  if (id && budgets.some((b) => b.id === id)) openEditor(id, 'none');
  else showList();
});

const fields = { event: 'f-event', days: 'f-days', description: 'f-description', section: 'f-section', closing: 'f-closing' };

function openEditor(id, historyMode) {
  current = budgets.find((b) => b.id === id);
  if (historyMode === 'push') history.pushState({ budgetId: id }, '');
  if (historyMode === 'replace') history.replaceState({ budgetId: id }, '');
  for (const [key, inputId] of Object.entries(fields)) $(inputId).value = current[key] ?? '';
  requestAnimationFrame(() => fitTextarea($('f-description')));
  $('f-total').value = current.total ? formatMoney(current.total) : '';
  $('f-words').value = current.totalWords;
  renderItems();
  updateWordsWarning();
  $('screen-title').textContent = current.event || 'Presupuesto';
  setSaveStatus(true);
  showScreen(true);
}

// ---------- Editor ----------

function renderItems() {
  const ol = $('items');
  ol.innerHTML = '';
  current.items.forEach((text, index) => {
    const li = document.createElement('li');
    const area = document.createElement('textarea');
    area.value = text;
    area.rows = 2;
    area.setAttribute('aria-label', `Ítem ${index + 1}`);
    const fit = () => {
      area.style.height = 'auto';
      area.style.height = area.scrollHeight + 'px';
    };
    area.oninput = () => {
      current.items[index] = cleanInput(area);
      fit();
      touch();
    };
    requestAnimationFrame(fit);
    const tools = document.createElement('div');
    tools.className = 'item-tools';
    const tool = (icon, title, action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-btn';
      btn.innerHTML = `<svg aria-hidden="true"><use href="#i-${icon}"/></svg>`;
      btn.setAttribute('aria-label', `${title} ítem ${index + 1}`);
      btn.onclick = () => {
        action();
        touch();
        renderItems();
      };
      tools.append(btn);
    };
    if (index > 0) tool('up', 'Subir', () => swapItems(index, index - 1));
    if (index < current.items.length - 1) tool('down', 'Bajar', () => swapItems(index, index + 1));
    tool('x', 'Quitar', () => current.items.splice(index, 1));
    li.append(area, tools);
    ol.append(li);
  });
}

// scrollHeight excludes borders, so they are added back or the last line gets clipped.
function fitTextarea(area) {
  area.style.height = 'auto';
  area.style.height = area.scrollHeight + area.offsetHeight - area.clientHeight + 'px';
}

function swapItems(a, b) {
  [current.items[a], current.items[b]] = [current.items[b], current.items[a]];
}

for (const [key, inputId] of Object.entries(fields)) {
  $(inputId).addEventListener('input', (e) => {
    current[key] = cleanInput(e.target);
    if (e.target.tagName === 'TEXTAREA') fitTextarea(e.target);
    if (key === 'event') $('screen-title').textContent = current.event || 'Presupuesto';
    touch();
  });
}

$('f-total').addEventListener('input', (e) => {
  current.total = parseMoney(e.target.value);
  if (!current.wordsEdited) {
    current.totalWords = current.total ? numberToTitleWords(current.total) : '';
    $('f-words').value = current.totalWords;
  }
  touch();
});
$('f-total').addEventListener('blur', (e) => {
  e.target.value = current.total ? formatMoney(current.total) : '';
});

$('f-words').addEventListener('input', (e) => {
  current.totalWords = cleanInput(e.target);
  current.wordsEdited = true;
  touch();
});
$('regen-words').onclick = () => {
  current.wordsEdited = false;
  current.totalWords = current.total ? numberToTitleWords(current.total) : '';
  $('f-words').value = current.totalWords;
  touch();
};

$('add-item').onclick = () => {
  current.items.push(DEFAULT_ITEM_TEXT);
  touch();
  renderItems();
  const areas = $('items').querySelectorAll('textarea');
  areas[areas.length - 1].focus();
};

$('new-budget').onclick = () => {
  const b = newBudget();
  upsert(b);
  openEditor(b.id, 'push');
};

$('duplicate').onclick = () => {
  const copy = {
    ...structuredClone(current),
    id: newId(),
    closing: closingFor(new Date()),
    updatedAt: Date.now(),
  };
  upsert(copy);
  openEditor(copy.id, 'replace');
  toast('Copia creada. Ya estás editando la copia.');
};

$('delete').onclick = () => {
  if (!confirm('¿Eliminar este presupuesto?')) return;
  const id = current.id;
  persist((list) => {
    const index = list.findIndex((b) => b.id === id);
    if (index >= 0) list.splice(index, 1);
  });
  goToList();
};

$('back').onclick = goToList;

// ---------- PDF ----------

function pdfFileName() {
  const name = toPdfText(current.event || 'presupuesto')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `Presupuesto - ${name || 'presupuesto'}.pdf`;
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

let pdfBusy = false;

// One PDF action at a time: a second tap while sharing would otherwise also trigger a download.
async function runPdfAction(deliver) {
  if (pdfBusy) return;
  if (wordsMismatch(current) && !confirm('Las letras no coinciden con el monto. ¿Generar el PDF igual?')) return;
  pdfBusy = true;
  const buttons = [$('share-pdf'), $('download-pdf')];
  buttons.forEach((b) => b.setAttribute('aria-disabled', 'true'));
  try {
    const doc = await buildPdf(current, issuer);
    await deliver(new File([doc.output('blob')], pdfFileName(), { type: 'application/pdf' }));
  } catch (err) {
    toast('No se pudo generar el PDF: ' + err.message);
  } finally {
    pdfBusy = false;
    buttons.forEach((b) => b.removeAttribute('aria-disabled'));
  }
}

$('share-pdf').onclick = () =>
  runPdfAction(async (file) => {
    if (!navigator.canShare?.({ files: [file] })) return download(file);
    try {
      await navigator.share({ files: [file], title: file.name });
    } catch (err) {
      if (err.name !== 'AbortError') download(file);
    }
  });

$('download-pdf').onclick = () => runPdfAction(async (file) => download(file));

// ---------- Issuer ----------

const issuerDialog = $('issuer-dialog');
const cuitInput = issuerDialog.querySelector('[name=cuit]');
const dniInput = issuerDialog.querySelector('[name=dni]');
let derivedDni = '';

// The DNI follows the CUIT until the user types a different one by hand.
function syncDniFromCuit() {
  const next = dniFromCuit(cuitInput.value);
  if (!dniInput.value.trim() || dniInput.value.trim() === derivedDni) dniInput.value = next;
  derivedDni = next;
}

function showCuitError(message) {
  const error = $('cuit-error');
  error.textContent = message;
  error.hidden = !message;
  if (message) cuitInput.setAttribute('aria-invalid', 'true');
  else cuitInput.removeAttribute('aria-invalid');
}

// Typed digits get their dashes as they go, because the numeric keypad on phones has no "-".
cuitInput.addEventListener('input', () => {
  cuitInput.value = formatCuit(cuitInput.value);
  const error = cuitError(cuitInput.value);
  cuitInput.setCustomValidity(error);
  if (!error || cuitDigits(cuitInput.value).length === 11) showCuitError(error);
  else showCuitError('');
  syncDniFromCuit();
});
cuitInput.addEventListener('blur', () => showCuitError(cuitError(cuitInput.value)));
cuitInput.addEventListener('invalid', () => showCuitError(cuitError(cuitInput.value)));

function openIssuerDialog() {
  for (const input of issuerDialog.querySelectorAll('input')) input.value = issuer[input.name] ?? '';
  cuitInput.value = formatCuit(cuitInput.value);
  cuitInput.setCustomValidity(cuitError(cuitInput.value));
  showCuitError('');
  derivedDni = dniFromCuit(cuitInput.value);
  if (!dniInput.value.trim()) dniInput.value = derivedDni;
  updateSignaturePreview();
  issuerDialog.returnValue = '';
  issuerDialog.showModal();
}
function updateSignaturePreview() {
  const text = issuerDialog.querySelector('[name=signature]').value.trim();
  $('signature-preview').textContent = text || 'Así se verá tu firma';
  $('signature-preview').classList.toggle('empty', !text);
}
issuerDialog.querySelector('[name=signature]').addEventListener('input', (e) => {
  cleanInput(e.target);
  updateSignaturePreview();
});
$('open-issuer').onclick = openIssuerDialog;
$('issuer-missing-btn').onclick = openIssuerDialog;
$('cancel-issuer').onclick = () => issuerDialog.close();
issuerDialog.addEventListener('close', () => {
  if (issuerDialog.returnValue !== 'save') return;
  for (const input of issuerDialog.querySelectorAll('input')) issuer[input.name] = stripEmoji(input.value).trim();
  try {
    localStorage.setItem(ISSUER_KEY, JSON.stringify(issuer));
    toast('Datos guardados');
    if (!current) renderList();
  } catch {
    toast('No se pudieron guardar los datos.');
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

const startId = history.state?.budgetId;
if (startId && budgets.some((b) => b.id === startId)) openEditor(startId, 'none');
else showList();
