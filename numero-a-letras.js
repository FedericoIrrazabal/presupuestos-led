const UP_TO_29 = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
  'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
  'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function below100(n) {
  if (n < 30) return UP_TO_29[n];
  const unit = n % 10;
  return TENS[Math.floor(n / 10)] + (unit ? ' y ' + UP_TO_29[unit] : '');
}

function below1000(n) {
  if (n === 100) return 'cien';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [HUNDREDS[hundreds], rest ? below100(rest) : ''].filter(Boolean).join(' ');
}

// Before "mil" / "millones" the trailing "uno" shortens: "veintiún mil", "un millón".
function apocope(words) {
  return words.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
}

function below1e6(n) {
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts = [];
  if (thousands === 1) parts.push('mil');
  else if (thousands > 1) parts.push(apocope(below1000(thousands)) + ' mil');
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

function below1e12(n) {
  const millions = Math.floor(n / 1e6);
  const rest = n % 1e6;
  const parts = [];
  if (millions === 1) parts.push('un millón');
  else if (millions > 1) parts.push(apocope(below1e6(millions)) + ' millones');
  if (rest) parts.push(below1e6(rest));
  return parts.join(' ');
}

// Covers up to 999.999 billones; parseMoney caps input below that.
function numberToWords(n) {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'cero';
  const billions = Math.floor(n / 1e12);
  const rest = n % 1e12;
  const parts = [];
  if (billions === 1) parts.push('un billón');
  else if (billions > 1) parts.push(apocope(below1e6(billions)) + ' billones');
  if (rest) parts.push(below1e12(rest));
  return parts.join(' ');
}

function numberToTitleWords(n) {
  return numberToWords(n)
    .split(' ')
    .map((w) => (w === 'y' ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}
