
/* ===== Tabs ===== */
const tabsMap = [
  {btn:'btn-calculadora', tab:'tab-calculadora'},
  {btn:'btn-registro',    tab:'tab-registro'},
  {btn:'btn-tablas',      tab:'tab-tablas'},
  {btn:'btn-dashboard',   tab:'tab-dashboard'},
  {btn:'btn-ensayos',     tab:'tab-ensayos'}
];
tabsMap.forEach(({btn, tab})=>{
  const b = document.getElementById(btn);
  if (!b) return;
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.tabbar button').forEach(el=>{
      el.classList.toggle('active', el.id === btn);
      el.setAttribute('aria-selected', el.id === btn ? 'true' : 'false');
    });
    document.querySelectorAll('section.tab').forEach(el=>{
      el.classList.toggle('active', el.id === tab);
    });
    if (tab === 'tab-calculadora'){
      const first = document.getElementById('inpA');
      if (first) first.focus({preventScroll:true});
    }
  });
});

/* ===== Calculadora ===== */
const inpA = document.getElementById('inpA');
const inpH = document.getElementById('inpH');
const inpL = document.getElementById('inpL');
const inpSac = document.getElementById('inpSac');
const inpConst = document.getElementById('inpConst');
const outEl = document.querySelector('#calcOut h2');

function parseDec(txt){
  if (typeof txt !== 'string') return NaN;
  const s = txt.trim().replace(',', '.');
  if (s === '') return NaN;
  return Number(s);
}
const fmt = (n, d=3) => Number(n).toFixed(d);

function calcular(){
  const A = parseDec(inpA.value);
  const H = parseDec(inpH.value);
  const L = parseDec(inpL.value);
  const Sac = parseDec(inpSac.value || '0');
  const C = parseDec(inpConst.value || '11.5');

  if (!isFinite(A) || !isFinite(H) || !isFinite(L) || !isFinite(Sac) || !isFinite(C) || C<=0){
    outEl.textContent = '—';
    return;
  }
  // ((((H*2)+A)*0.9)*L)/C + Sac
  const perimetroParcial = (H * 2) + A;
  const perimetroAjustado = perimetroParcial * 0.9;
  const areaLineal = perimetroAjustado * L;   // m²
  const m3_base = areaLineal / C;             // m³
  const m3_total = m3_base + Sac;             // m³
  outEl.textContent = `${fmt(m3_total)} m³`;
}

// Botones
document.getElementById('btnCalcular')?.addEventListener('click', calcular);
document.getElementById('btnLimpiar')?.addEventListener('click', ()=>{
  [inpA, inpH, inpL, inpSac].forEach(i=>{ if (i) i.value=''; });
  if (inpConst) inpConst.value = '11.5';
  outEl.textContent = '—';
  inpA?.focus();
});

// Cálculo en tiempo real
[inpA, inpH, inpL, inpSac, inpConst].forEach(el=>{
  el?.addEventListener('input', ()=>{
    const hasCore = inpA?.value.trim() && inpH?.value.trim() && inpL?.value.trim();
    if (hasCore) calcular(); else outEl.textContent = '—';
  });
  el?.addEventListener('keydown', (ev)=>{ if (ev.key === 'Enter') calcular(); });
});

// Service Worker (registro)
(function(){
  if ('serviceWorker' in navigator){
    const swUrl = '/shotcrete-calc/sw.js';
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register(swUrl).catch(()=>{});
    });
  }
})();

