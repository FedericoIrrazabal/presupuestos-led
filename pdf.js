const PAGE = { width: 210, height: 297, left: 28, right: 22, bottom: 280 };
const CONTENT_WIDTH = PAGE.width - PAGE.left - PAGE.right;
const BRAND_BLUE = [0, 174, 239];
const INK = [11, 11, 11];
const MUTED = [90, 90, 90];
const FONTS = [
  { file: 'fonts/montserrat-extrabold.ttf', name: 'Montserrat', style: 'extrabold' },
  { file: 'fonts/montserrat-semibold.ttf', name: 'Montserrat', style: 'semibold' },
  { file: 'fonts/allura.ttf', name: 'Allura', style: 'normal' },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('no se pudo cargar ' + src));
    img.src = src;
  });
}

const DEFAULT_ITEM_TEXT = 'Alquiler de ';
const WIN_ANSI_EXTRAS = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

// Emoji and joiners are removed as the user types; the PDF fonts cannot draw them.
function stripEmoji(text) {
  return text.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0E\uFE0F\u200D\u20E3]/gu, '');
}

// jsPDF's built-in fonts only map WinAnsi; one character outside it garbles the whole line.
function toPdfText(text) {
  return [...stripEmoji(String(text ?? ''))]
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return code === 10 || (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRAS.includes(ch);
    })
    .join('')
    .replace(/ {2,}/g, ' ');
}

function isPrintableItem(item) {
  const text = item.trim();
  return text !== '' && text.toLowerCase() !== DEFAULT_ITEM_TEXT.trim().toLowerCase();
}

function stripWrappingQuotes(text) {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^["“«](.*)["”»]$/s);
  return wrapped ? wrapped[1].trim() : trimmed;
}

let fontDataPromise;
function loadFontData() {
  fontDataPromise ??= Promise.all(
    FONTS.map(async (font) => {
      const response = await fetch(font.file);
      if (!response.ok) throw new Error(`no se pudo cargar ${font.file} (${response.status})`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { ...font, base64: btoa(binary) };
    })
  ).catch((err) => {
    fontDataPromise = undefined;
    throw err;
  });
  return fontDataPromise;
}

function formatMoney(n) {
  return '$ ' + Math.round(n || 0).toLocaleString('es-AR');
}

async function buildPdf(rawBudget, rawIssuer) {
  const clean = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? toPdfText(v) : v]));
  const budget = { ...clean(rawBudget), items: rawBudget.items.map(toPdfText).filter(isPrintableItem) };
  const issuer = clean(rawIssuer);
  const event = stripWrappingQuotes(budget.event || '');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const [logo, fonts] = await Promise.all([loadImage('logo-light.png'), loadFontData()]);
  for (const font of fonts) {
    const vfsName = font.file.split('/').pop();
    doc.addFileToVFS(vfsName, font.base64);
    doc.addFont(vfsName, font.name, font.style);
  }

  const accentRule = (x, y, width, thickness = 0.6) => {
    doc.setFillColor(...BRAND_BLUE);
    doc.rect(x, y, width, thickness, 'F');
  };
  const centered = (text, y) => {
    const x = PAGE.width / 2 - doc.getTextWidth(text) / 2;
    doc.text(text, x, y);
    return x;
  };

  const logoW = 52;
  const logoH = (logoW * logo.naturalHeight) / logo.naturalWidth;
  doc.addImage(logo, 'PNG', PAGE.left - 2, 12, logoW, logoH);

  let y = 12 + logoH + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const headerLines = [
    issuer.name,
    issuer.cuit && 'C.U.I.T.: ' + issuer.cuit,
    issuer.providerNumber && 'P. Estado Nº ' + issuer.providerNumber,
    issuer.address,
    issuer.email,
    issuer.phone && 'Teléfono: ' + issuer.phone,
  ].filter(Boolean);
  for (const line of headerLines) {
    doc.text(line, PAGE.left, y);
    y += 3.8;
  }

  y = Math.max(y + 18, 78);
  doc.setTextColor(...INK);
  doc.setFont('Montserrat', 'extrabold');
  doc.setFontSize(16);
  const title = 'PRESUPUESTO';
  const charSpace = 1.6;
  const titleWidth = doc.getTextWidth(title) + charSpace * (title.length - 1);
  doc.text(title, PAGE.width / 2 - titleWidth / 2, y, { charSpace });
  accentRule(PAGE.width / 2 - 12, y + 3, 24, 1);

  y += 18;
  const labeled = (label, value) => {
    if (!value) return;
    doc.setFont('Montserrat', 'extrabold');
    doc.setFontSize(11);
    doc.text(label, PAGE.left, y);
    const valueX = PAGE.left + doc.getTextWidth(label) + 2.5;
    doc.setFont('helvetica', 'bold');
    const valueLines = doc.splitTextToSize(value, PAGE.width - PAGE.right - valueX);
    doc.text(valueLines, valueX, y);
    y += valueLines.length * 5 + 5;
  };
  labeled('Evento:', event && `“${event}”`);
  labeled('Días:', budget.days);

  if (budget.description?.trim()) {
    doc.setFont('Montserrat', 'extrabold');
    doc.setFontSize(11);
    doc.text('Descripción:', PAGE.left, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    const descriptionX = PAGE.left + 5;
    const descriptionLines = doc.splitTextToSize(budget.description.trim(), PAGE.width - PAGE.right - descriptionX);
    for (const line of descriptionLines) {
      if (y > PAGE.bottom) {
        doc.addPage();
        y = 25;
      }
      doc.text(line, descriptionX, y);
      y += 5;
    }
    y += 6;
  }

  if (budget.section) {
    doc.setFont('Montserrat', 'extrabold');
    doc.setFontSize(12);
    const x = centered(budget.section, y + 3);
    accentRule(x, y + 5.2, doc.getTextWidth(budget.section));
    y += 18;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const bulletX = PAGE.left;
  const textX = PAGE.left + 5;
  for (const item of budget.items) {
    const lines = doc.splitTextToSize(item.trim(), PAGE.width - PAGE.right - textX);
    if (y + lines.length * 5 > PAGE.bottom) {
      doc.addPage();
      y = 25;
    }
    doc.setFillColor(...BRAND_BLUE);
    doc.rect(bulletX, y - 2.6, 2, 2, 'F');
    doc.text(lines, textX, y);
    y += lines.length * 5 + 6;
  }

  if (y + 30 > PAGE.bottom) {
    doc.addPage();
    y = 25;
  }
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(PAGE.left, y - 7, PAGE.width - PAGE.right, y - 7);
  doc.setFont('Montserrat', 'extrabold');
  doc.setFontSize(13);
  const totalLabel = 'Presupuesto Total:';
  doc.text(totalLabel, PAGE.left, y);
  accentRule(PAGE.left, y + 1.6, doc.getTextWidth(totalLabel));
  const amountX = PAGE.left + doc.getTextWidth(totalLabel) + 3;
  doc.setFontSize(12);
  const words = budget.totalWords ? ` (${budget.totalWords}).-` : '.-';
  const totalLines = doc.splitTextToSize(formatMoney(budget.total) + words, PAGE.width - PAGE.right - amountX);
  doc.text(totalLines, amountX, y);
  y += totalLines.length * 5.5 + 16;

  if (budget.closing) {
    doc.setFont('Montserrat', 'semibold');
    doc.setFontSize(12);
    const closingLines = doc.splitTextToSize(budget.closing, CONTENT_WIDTH);
    if (y + closingLines.length * 5.5 > PAGE.bottom) {
      doc.addPage();
      y = 25;
    }
    doc.text(closingLines, PAGE.width - PAGE.right, y, { align: 'right' });
    y += closingLines.length * 5.5;
  }

  const signatureLines = [
    issuer.name && issuer.name.toUpperCase(),
    issuer.dni && 'D.N.I Nº ' + issuer.dni,
    issuer.phone && 'Teléfono: ' + issuer.phone,
  ].filter(Boolean);
  if (issuer.signature || signatureLines.length) {
    const blockHeight = 32;
    y += 20;
    if (y + blockHeight > PAGE.bottom) {
      doc.addPage();
      y = 40;
    }
    const centerX = PAGE.width - PAGE.right - 32;
    if (issuer.signature) {
      doc.setFont('Allura', 'normal');
      doc.setFontSize(26);
      doc.text(issuer.signature, centerX, y, { align: 'center' });
      y += 6;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    for (const line of signatureLines) {
      doc.text(line, centerX, y, { align: 'center' });
      y += 4.2;
    }
  }

  return doc;
}
