// Scientific calculator - vanilla JS. Uses its own parser (no eval).
const layout = [
 ['sin(','fn'],['cos(','fn'],['tan(','fn'],['log(','fn'],['ln(','fn'],
 ['√(','fn'],['^','op'],['π','fn'],['(','op'],[')','op'],
 ['7','num'],['8','num'],['9','num'],['÷','op'],['AC','clr'],
 ['4','num'],['5','num'],['6','num'],['×','op'],['⌫','clr'],
 ['1','num'],['2','num'],['3','num'],['−','op'],['!','op'],
 ['0','num'],['.','num'],['%','op'],['+','op'],['=','eq']];
const keys = document.getElementById('keys'), expr = document.getElementById('expr'), out = document.getElementById('out'), degBtn = document.getElementById('deg');
let text = '', deg = true, justEvaluated = false;

layout.forEach(([k, cls]) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = k; b.className = cls;
  b.addEventListener('click', () => press(k)); keys.appendChild(b);
});
degBtn.addEventListener('click', () => { deg = !deg; degBtn.textContent = deg ? 'DEG' : 'RAD'; degBtn.setAttribute('aria-pressed', deg); });

function press(k) {
  if (k === 'AC') text = '';
  else if (k === '⌫') text = text.replace(/(sin\(|cos\(|tan\(|log\(|ln\(|√\(|.)$/, '');
  else if (k === '=') return calculate();
  else { if (justEvaluated && /[\d.π(]|[a-z√]/.test(k)) text = ''; text += k; }
  justEvaluated = false; expr.textContent = text; if (!text) out.textContent = '0';
}

function calculate() {
  try {
    const v = parse(text); if (!isFinite(v)) throw new Error('Math error');
    out.textContent = +v.toPrecision(12); expr.textContent = text + ' ='; text = String(+v.toPrecision(12)); justEvaluated = true;
  } catch { out.textContent = 'Error'; text = ''; justEvaluated = false; }
}

// Recursive descent parser: expr -> term -> power -> postfix -> primary
function parse(src) {
  const s = src.replace(/\s/g, ''); let i = 0;
  const peek = () => s[i];
  const toRad = x => deg ? x * Math.PI / 180 : x;
  function expression() { let v = term(); while (peek() === '+' || peek() === '−') v = s[i++] === '+' ? v + term() : v - term(); return v; }
  function term() { let v = power(); while (peek() === '×' || peek() === '÷') v = s[i++] === '×' ? v * power() : v / power(); return v; }
  function power() { let v = postfix(); if (peek() === '^') { i++; return Math.pow(v, power()); } return v; }
  function postfix() {
    let v = unary();
    while (peek() === '!' || peek() === '%') {
      if (s[i++] === '!') { if (v < 0 || !Number.isInteger(v) || v > 170) throw 0; let f = 1; for (let n = 2; n <= v; n++) f *= n; v = f; } else v /= 100;
    } return v;
  }
  function unary() { if (peek() === '−') { i++; return -unary(); } return primary(); }
  function primary() {
    if (peek() === '(') { i++; const v = expression(); if (s[i++] !== ')') throw 0; return v; }
    if (s.startsWith('π', i)) { i++; return Math.PI; }
    const fns = { 'sin(': x => Math.sin(toRad(x)), 'cos(': x => Math.cos(toRad(x)), 'tan(': x => Math.tan(toRad(x)), 'log(': Math.log10, 'ln(': Math.log, '√(': Math.sqrt };
    for (const f in fns) if (s.startsWith(f, i)) { i += f.length; const v = expression(); if (s[i++] !== ')') throw 0; return fns[f](v); }
    const m = /^\d*\.?\d+/.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; return parseFloat(m[0]);
  }
  const r = expression(); if (i !== s.length) throw 0; return r;
}

// Keyboard support
document.addEventListener('keydown', e => {
  const map = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'AC' };
  const k = map[e.key] || e.key;
  if (/^[0-9.+()^!%]$/.test(k) || ['×', '÷', '−', '=', '⌫', 'AC'].includes(k)) { e.preventDefault(); press(k); }
});
