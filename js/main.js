// San Jorge · Fábrica de Pastas — demo
import { initKit } from '../kit/kit.js?v=18';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const MOVIL = matchMedia('(max-width: 767px)').matches;
const TZ = 'America/Argentina/Buenos_Aires';
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
const DIAS_NOM = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ---------- fecha (con ?dia=miercoles / ?dia=29 para mostrar la demo cualquier día)
const hoyStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const aDate = (f) => new Date(f + 'T12:00:00Z');
const aStr = (d) => d.toISOString().slice(0, 10);
const sumar = (f, n) => aStr(new Date(aDate(f).getTime() + n * 864e5));
function fechaForzada() {
  const q = new URLSearchParams(location.search).get('dia'); if (!q) return null;
  const h = hoyStr();
  for (let i = 0; i < 400; i++) {
    const f = sumar(h, i), d = aDate(f);
    if (q === 'miercoles' && d.getUTCDay() === 3) return f;
    if (q === '29' && d.getUTCDate() === 29) return f;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : null;
}
const FORZADA = fechaForzada();
const HOY = FORZADA || hoyStr();

// ---------- intro: la laminadora
function imgLista(img) { return !img || img.complete ? Promise.resolve() : new Promise(r => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }); }
function intro() {
  return new Promise((listo) => {
    const el = $('#intro');
    if (!html.classList.contains('con-intro') || !el) { html.classList.add('c-in'); listo(); return; }
    const T = MOVIL ? { cortar: 950, abrir: 1250 } : { cortar: 1500, abrir: 1800 };
    const cargado = Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, imgLista($('.plato img'))]), new Promise(r => setTimeout(r, 2600))]);
    setTimeout(() => el.classList.add('cortar'), T.cortar);
    setTimeout(async () => {
      await cargado;
      el.classList.add('abrir');
      html.classList.add('c-in');
      setTimeout(() => { html.classList.remove('con-intro'); el.remove(); listo(); }, 650);
    }, T.abrir);
  });
}
intro();

// ---------- aparición al hacer scroll
function revelar() {
  $$('.rv').forEach((el) => {
    const hermanos = [...el.parentElement.children].filter(x => x.classList.contains('rv'));
    const i = hermanos.indexOf(el);
    if (hermanos.length > 2 && i > 0) el.style.setProperty('--rd', `${Math.min(i, 6) * 80}ms`);
  });
  if (!('IntersectionObserver' in window)) { $$('.rv').forEach(e => e.classList.add('visto')); return; }
  const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(e => io.observe(e));
}
revelar();

// ---------- menú del celu (bloqueo de scroll que funciona en iPhone)
let scrollGuardado = 0;
function bloquear(on) {
  if (on) { scrollGuardado = scrollY; Object.assign(document.body.style, { position: 'fixed', top: `-${scrollGuardado}px`, left: '0', right: '0' }); }
  else { Object.assign(document.body.style, { position: '', top: '', left: '', right: '' }); scrollTo({ top: scrollGuardado, behavior: 'instant' }); }
}
const burger = $('.top__burger'), menu = $('#menu');
function menuAbrir(on) {
  menu.hidden = !on; html.classList.toggle('menu-on', on);
  burger.setAttribute('aria-expanded', String(on)); burger.setAttribute('aria-label', on ? 'Cerrar menú' : 'Abrir menú');
  burger.innerHTML = on ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  bloquear(on);
}
burger.addEventListener('click', () => menuAbrir(menu.hidden));
menu.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  e.preventDefault(); menuAbrir(false);
  requestAnimationFrame(() => $(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }));
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) menuAbrir(false); });

// ---------- arrastrar carruseles con el mouse (desde cualquier punto, fluido, con inercia)
function arrastrable(el) {
  let x0 = 0, s0 = 0, activo = false, movio = false, vel = 0, ultX = 0, ultT = 0, raf = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth + 2) return;
    cancelAnimationFrame(raf);
    activo = true; movio = false; x0 = ultX = e.clientX; s0 = el.scrollLeft; vel = 0; ultT = performance.now();
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!activo) return;
    const dx = e.clientX - x0;
    if (!movio && Math.abs(dx) > 4) { movio = true; el.classList.add('arrastrando'); }
    if (!movio) return;
    el.scrollLeft = s0 - dx;
    const t = performance.now(); vel = (e.clientX - ultX) / Math.max(1, t - ultT); ultX = e.clientX; ultT = t;
    e.preventDefault();
  });
  const soltar = () => {
    if (!activo) return; activo = false;
    if (!movio) { el.classList.remove('arrastrando'); return; }
    let v = vel * 16;
    const paso = () => {
      if (Math.abs(v) < .4) { el.classList.remove('arrastrando'); return; }
      el.scrollLeft -= v; v *= .93; raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
  };
  el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar); el.addEventListener('lostpointercapture', soltar);
  el.addEventListener('click', (e) => { if (movio) { e.preventDefault(); e.stopPropagation(); movio = false; } }, true);
  el.addEventListener('dragstart', (e) => e.preventDefault());
}
$$('[data-drag]').forEach(arrastrable);
$$('[data-flechas]').forEach((f) => {
  const el = document.getElementById(f.dataset.flechas); if (!el) return;
  const [a, b] = $$('button', f);
  const estado = () => { a.disabled = el.scrollLeft < 4; b.disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4; };
  f.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn) return; const card = el.firstElementChild; const paso = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * .8; el.scrollBy({ left: paso * Number(btn.dataset.dir), behavior: 'smooth' }); });
  el.addEventListener('scroll', estado, { passive: true }); addEventListener('resize', estado); estado();
});
// la píldora del panel aparece recién pasado el hero (nunca tapa el CTA)
const heroEl = $('.hero');
const pasoHero = () => html.classList.toggle('paso-hero', scrollY > heroEl.offsetHeight * .6);
addEventListener('scroll', pasoHero, { passive: true }); pasoHero();

// ---------- tiempos de cocción (los de sus placas 209 a 231)
const COCCION = [
  { n: 'Ñoquis', a: 60, b: 60, tip: 'Cocinalos 1 minuto aunque no suban a la superficie.' },
  { n: 'Cintas', a: 120, b: 180, tip: 'Cinta ancha y mediana: de 2 a 3 minutos.' },
  { n: 'Ravioles', a: 150, b: 180, tip: '2′30″ para al dente, 3′ a punto.' },
  { n: 'Ravioles integrales', a: 240, b: 300, tip: 'Revolvé en forma de remolino para que no se peguen.' },
  { n: 'Fuccilles', a: 300, b: 360, tip: 'Los tirabuzones: de 5 a 6 minutos.' },
  { n: 'Fideos de albahaca', a: 360, b: 360, tip: 'Revolvé seguido para que no se peguen al fondo.' },
  { n: 'Caseritos', a: 360, b: 480, tip: 'De 6 a 8 minutos.' },
  { n: 'Tortelettis', a: 360, b: 480, tip: 'Del freezer directo al agua hirviendo, revolviendo en remolino.' },
  { n: 'Sorrentinos', a: 480, b: 480, tip: 'Del freezer al agua hirviendo, 8 minutos a fuego bajo.' },
  { n: 'Raviolones', a: 480, b: 480, tip: 'Del freezer, a fuego bajo. Si se descongelan, se rompen.' },
  { n: 'Tallarines', a: 480, b: 600, tip: 'De 8 a 10 minutos.' },
  { n: 'Fideos integrales', a: 600, b: 600, tip: 'Cocinalos 10 minutos.' },
];
const fmtT = (s) => { const m = Math.floor(s / 60), r = s % 60; return r ? `${m}′${String(r).padStart(2, '0')}″` : `${m}′`; };
const fmtReloj = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const RELOJ_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>';
function cocina() {
  const cont = $('[data-sj-banderines]'), olla = $('.olla');
  const nom = $('[data-sj-olla-nom]'), reloj = $('[data-sj-reloj]'), tip = $('[data-sj-olla-tip]');
  const bStart = $('[data-sj-olla="start"]'), bReset = $('[data-sj-olla="reset"]');
  cont.innerHTML = COCCION.map((c, i) => `<button type="button" class="band" role="listitem" aria-pressed="false" data-i="${i}">${RELOJ_SVG}<span class="band__n">${c.n}</span><span class="band__t">${c.a === c.b ? fmtT(c.a) : `${fmtT(c.a)} a ${fmtT(c.b)}`}</span></button>`).join('');
  let sel = null, fin = 0, resto = 0, tic = 0, corriendo = false, avisoDente = false, audio = null;
  const pintar = (s) => { reloj.textContent = fmtReloj(Math.max(0, Math.ceil(s))); };
  function elegir(i) {
    sel = COCCION[i]; parar(); olla.classList.remove('lista');
    $$('.band', cont).forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i)));
    nom.textContent = sel.n; resto = sel.b; pintar(resto);
    tip.textContent = sel.tip + (sel.a !== sel.b ? ` Te avisamos a los ${fmtT(sel.a)} para probar uno.` : '');
    bStart.disabled = false; bReset.disabled = false; bStart.textContent = 'Poner la olla';
    if (MOVIL) olla.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function parar() { corriendo = false; clearInterval(tic); olla.classList.remove('hierve'); }
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, .32, .64].forEach(t => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
        g.gain.setValueAtTime(.0001, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(.25, audio.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + t + .25);
        o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .27); });
    } catch (_) { /* sin audio */ }
    try { navigator.vibrate?.([220, 120, 220]); } catch (_) { /* sin vibración */ }
  }
  bStart.addEventListener('click', () => {
    if (!sel) return;
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch (_) { /* nada */ }
    if (corriendo) { resto = (fin - Date.now()) / 1000; parar(); bStart.textContent = 'Seguir'; return; }
    if (resto <= 0) resto = sel.b;
    olla.classList.remove('lista'); olla.classList.add('hierve'); corriendo = true; avisoDente = false;
    fin = Date.now() + resto * 1000; bStart.textContent = 'Pausar';
    tic = setInterval(() => {
      const s = (fin - Date.now()) / 1000; pintar(s);
      if (sel.a !== sel.b && !avisoDente && s <= sel.b - sel.a) { avisoDente = true; tip.textContent = 'Ya están al dente: probá uno. Si los querés más tiernos, esperá al final.'; try { navigator.vibrate?.(120); } catch (_) { /* nada */ } }
      if (s <= 0) { parar(); resto = 0; olla.classList.add('lista'); tip.textContent = '¡Listas! Colalas y a la mesa.'; bStart.textContent = 'Otra vez'; beep(); }
    }, 250);
  });
  bReset.addEventListener('click', () => { if (!sel) return; parar(); olla.classList.remove('lista'); resto = sel.b; pintar(resto); bStart.textContent = 'Poner la olla'; tip.textContent = sel.tip; });
  cont.addEventListener('click', (e) => { const b = e.target.closest('.band'); if (b) elegir(Number(b.dataset.i)); });
}
cocina();

// ---------- KIT
const UNIDAD = { ravioles: 'Por caja', fideos: 'Por ½ kg o por kilo', especialidades: 'Por caja o por kilo', noquis: 'Por ½ kg o por kilo', vegana: 'Bajo pedido, con 24 hs de anticipación', salsas: 'Pote chico o grande', listas: 'Listas para hornear o calentar', postres: 'Por unidad' };
const FOTO_CAT = { ravioles: 'img/carta/ravioles.webp', fideos: 'img/carta/fideos.webp', especialidades: 'img/carta/especialidades.webp', noquis: 'img/carta/noquis.webp', vegana: 'img/carta/fideos2.webp', salsas: 'img/carta/salsas.webp', listas: 'img/carta/empanadas.webp', postres: 'img/carta/postres.webp' };
const SEL = new Map();
const variantesDe = (p) => (p.variantes || []).filter(v => v && v.precio != null);
function selDe(p) {
  if (!SEL.has(p.id)) {
    const v = variantesDe(p)[0];
    const opc = {}; (p.opciones || []).forEach(g => { if (g.valores?.length) opc[g.id] = String(g.valores[0].id); });
    SEL.set(p.id, { variante: v ? String(v.id) : null, opc });
  }
  return SEL.get(p.id);
}
const precioBase = (p, s) => { const v = variantesDe(p).find(x => String(x.id) === s.variante); return v ? Number(v.precio) : (p.precio == null ? null : Number(p.precio)); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const thumb = (f) => f ? f.replace(/\.webp$/, '-s.webp') : '';
let kit = null, CTX = null;
const PRODUCTOS = new Map();

function precioHTML(p, ctx) {
  const s = selDe(p); const base = precioBase(p, s);
  if (base == null) return '<b>Consultar</b>';
  const vs = variantesDe(p); const u = vs.length === 1 ? `<small>por ${esc(vs[0].nombre.toLowerCase())}</small>` : '';
  const pr = ctx.promoDe(p.categoria);
  if (!pr) return `<b>${ctx.money(base)}</b>${u}`;
  return `<s>${ctx.money(base)}</s><b>${ctx.money(Math.round(base * (1 - pr.pct / 100)))}</b><span class="off">−${pr.pct}% hoy</span>`;
}
function template(p, ctx) {
  PRODUCTOS.set(p.id, p); CTX = ctx;
  const s = selDe(p); const vs = variantesDe(p);
  const foto = p.foto ? ctx.asset(p.foto) : '';
  const seg = vs.length > 1
    ? `<div class="seg" role="group" aria-label="Cantidad de ${esc(p.nombre)}">${vs.map(v => `<button type="button" data-sj-v="${esc(v.id)}" aria-pressed="${String(v.id) === s.variante}">${esc(v.nombre)}</button>`).join('')}</div>`
    : '';
  const opc = (p.opciones || []).map(g => `<div class="it__opc"><label for="o-${esc(p.id)}-${esc(g.id)}">${esc(g.nombre)}</label>
    <select id="o-${esc(p.id)}-${esc(g.id)}" data-sj-opc="${esc(g.id)}">${g.valores.map(v => `<option value="${esc(v.id)}" ${String(v.id) === s.opc[g.id] ? 'selected' : ''}>${esc(v.nombre)}</option>`).join('')}</select></div>`).join('');
  return `
    <div class="it__main${foto ? '' : ' sin-foto'}">
      ${foto ? `<button type="button" class="it__thumb" data-sj-ver aria-label="Ver foto de ${esc(p.nombre)}"><img src="${esc(thumb(foto))}" alt="" width="64" height="64" loading="lazy" decoding="async"></button>` : ''}
      <div class="it__txt">
        <h3 class="it__n${foto ? ' con-foto' : ''}">${esc(p.nombre)}${(p.etiquetas || []).map(t => ctx.etiquetaHTML(t)).join('')}</h3>
        ${p.descripcion ? `<p class="it__d">${esc(p.descripcion)}</p>` : ''}
        ${opc}
      </div>
    </div>
    <div class="it__buy${seg ? '' : ' sin-seg'}">
      ${seg}
      <p class="precio" data-sj-precio>${precioHTML(p, ctx)}</p>
      <div class="qty" data-sj-qty="${esc(p.id)}">${qtyHTML(p)}</div>
    </div>`;
}
const mismaOpc = (a = {}, b = {}) => { const ka = Object.keys(a || {}), kb = Object.keys(b || {}); return ka.length === kb.length && ka.every(k => String(a[k]) === String(b[k])); };
function cantSel(p) {
  if (!kit?.carrito) return 0; const s = selDe(p);
  return kit.carrito.lineas.filter(l => l.id === p.id && (l.variante || null) === (s.variante || null) && mismaOpc(l.opc, s.opc)).reduce((a, l) => a + l.cant, 0);
}
function qtyHTML(p) {
  const n = cantSel(p);
  if (!n) return `<button type="button" class="add" data-sj-add><span aria-hidden="true">+</span> Agregar</button>`;
  return `<div class="step" role="group" aria-label="Cantidad en tu pedido"><button type="button" data-sj-menos aria-label="Quitar uno">−</button><output aria-live="polite">${n}</output><button type="button" data-sj-add aria-label="Agregar uno">+</button></div>`;
}
function pintarItem(item) {
  const p = PRODUCTOS.get(item.dataset.id); if (!p || !kit) return;
  const q = $('[data-sj-qty]', item); if (q) q.innerHTML = qtyHTML(p);
  const pr = $('[data-sj-precio]', item); if (pr) pr.innerHTML = precioHTML(p, kit);
}
const pintarTodo = () => $$('.sj-item').forEach(pintarItem);

function verFoto(p, src) {
  const box = document.createElement('div'); box.className = 'verfoto'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', p.nombre);
  box.innerHTML = `<figure><img src="${esc(src)}" alt="${esc(p.nombre)}" width="640" height="640"><figcaption>${esc(p.nombre)}<button type="button" aria-label="Cerrar">×</button></figcaption></figure>`;
  const cerrar = () => { box.remove(); bloquear(false); removeEventListener('keydown', key); };
  const key = (e) => { if (e.key === 'Escape') cerrar(); };
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('button')) cerrar(); });
  addEventListener('keydown', key);
  document.body.appendChild(box); bloquear(true); $('button', box).focus();
}

function montarCarta() {
  const carta = $('#carta-sj');
  carta.addEventListener('click', (e) => {
    const item = e.target.closest('.sj-item'); if (!item) return;
    const p = PRODUCTOS.get(item.dataset.id); if (!p) return;
    const s = selDe(p);
    const v = e.target.closest('[data-sj-v]');
    if (v) { s.variante = v.dataset.sjV; $$('[data-sj-v]', item).forEach(b => b.setAttribute('aria-pressed', String(b === v))); pintarItem(item); return; }
    const add = e.target.closest('[data-sj-add]');
    if (add) { kit.carrito.agregar(p.id, 1, { variante: s.variante || undefined, opc: Object.keys(s.opc).length ? { ...s.opc } : undefined, origen: add }); return; }
    if (e.target.closest('[data-sj-menos]')) { kit.carrito.agregar(p.id, -1, { variante: s.variante || undefined, opc: Object.keys(s.opc).length ? { ...s.opc } : undefined }); return; }
    if (e.target.closest('[data-sj-ver]')) { verFoto(p, kit.asset(p.foto)); }
  });
  carta.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-sj-opc]'); if (!sel) return;
    const item = sel.closest('.sj-item'); const p = PRODUCTOS.get(item.dataset.id);
    selDe(p).opc[sel.dataset.sjOpc] = sel.value; pintarItem(item);
  });
  // foto grande al costado (desktop)
  const fImg = $('[data-sj-foto]'), fNom = $('[data-sj-fotonom]');
  let fotoActual = '';
  const mostrarFoto = (src, nombre) => {
    if (!src || src === fotoActual) { if (nombre) fNom.textContent = nombre; return; }
    fotoActual = src; fImg.classList.add('cambia');
    const im = new Image(); im.onload = im.onerror = () => { fImg.src = src; fNom.textContent = nombre; requestAnimationFrame(() => fImg.classList.remove('cambia')); }; im.src = src;
  };
  const fotoDeCat = (cat) => {
    const panel = $$('.kit-carta__panel', carta).find(x => !x.hidden);
    const conFoto = panel && $$('.sj-item[data-photo]', panel)[0];
    if (conFoto) mostrarFoto(conFoto.dataset.photo, PRODUCTOS.get(conFoto.dataset.id)?.nombre || '');
    else if (FOTO_CAT[cat]) mostrarFoto(new URL(FOTO_CAT[cat], location.href).href, $(`.kit-tab[data-cat="${cat}"]`, carta)?.textContent || '');
  };
  let rafH = 0, ultimo = null;
  carta.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const it = e.target.closest('.sj-item'); if (!it || it === ultimo) return;
    ultimo = it; cancelAnimationFrame(rafH);
    rafH = requestAnimationFrame(() => {
      $$('.sj-item.is-hover', carta).forEach(x => x.classList.remove('is-hover')); it.classList.add('is-hover');
      if (it.dataset.photo) mostrarFoto(it.dataset.photo, PRODUCTOS.get(it.dataset.id)?.nombre || '');
    });
  });
  // pestañas: al cambiar, la foto de la familia y volver arriba de la carta si hace falta
  carta.addEventListener('click', (e) => {
    const t = e.target.closest('.kit-tab'); if (!t) return;
    fotoDeCat(t.dataset.cat);
    t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
  // cabecera de cada familia + Anterior / Siguiente (se rearma cada vez que el dueño edita la carta)
  document.addEventListener('kit:carta', (e) => {
    const el = e.detail.el; if (el !== carta) return;
    const tabs = $$('.kit-tab', el);
    $$('.kit-carta__panel', el).forEach((panel) => {
      const tab = document.getElementById(panel.getAttribute('aria-labelledby'));
      const cat = tab?.dataset.cat; const i = tabs.indexOf(tab);
      const n = $$('.kit-item', panel).length;
      const pr = (kit || CTX)?.promoDe ? (kit || CTX).promoDe(cat) : null;
      panel.insertAdjacentHTML('afterbegin', `<header class="fam"><h3 class="fam__t">${esc(tab?.textContent || '')}</h3>
        <p class="fam__s"><span>${n} ${n === 1 ? 'opción' : 'opciones'} · ${esc(UNIDAD[cat] || '')}</span>${pr ? `<span class="fam__promo">Hoy −${pr.pct}%</span>` : ''}</p></header>`);
      const prev = tabs[i - 1], next = tabs[i + 1];
      panel.insertAdjacentHTML('beforeend', `<nav class="fam__nav" aria-label="Otras secciones de la carta">
        ${prev ? `<button type="button" data-ir="${esc(prev.dataset.cat)}"><span aria-hidden="true">←</span><span>${esc(prev.textContent)}</span></button>` : ''}
        ${next ? `<button type="button" data-ir="${esc(next.dataset.cat)}"><span>${esc(next.textContent)}</span><span aria-hidden="true">→</span></button>` : ''}</nav>`);
    });
    fotoDeCat($('.kit-tab.is-on', el)?.dataset.cat);
  });
  carta.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ir]'); if (!b) return;
    $(`.kit-tab[data-cat="${b.dataset.ir}"]`, carta)?.click();
    const top = carta.getBoundingClientRect().top + scrollY - (MOVIL ? 60 : 104);
    if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
  });
}
montarCarta();

// ---------- pila de cajas (el carrito)
const COLOR = { salsas: 'r', listas: 'r', postres: 'a' };
let pilaAntes = 0;
function pintarPila() {
  const lineas = kit?.carrito ? kit.carrito.lineas : [];
  const cajas = [];
  lineas.forEach(l => { const c = PRODUCTOS.get(l.id)?.categoria; for (let i = 0; i < l.cant; i++) cajas.push(COLOR[c] || ''); });
  const n = cajas.length;
  const vis = cajas.slice(-6);
  const nueva = n > pilaAntes; pilaAntes = n;
  const htmlPila = vis.length ? vis.map((c, i) => `<i class="${c}"${nueva && i === vis.length - 1 ? '' : ' style="animation:none"'}></i>`).join('') : '<i class="vacia"></i><i class="vacia"></i><i class="vacia"></i>';
  $$('.pila').forEach(p => { p.innerHTML = htmlPila; });
  $$('[data-sj-n]').forEach(x => { x.textContent = n; });
}

// ---------- promos: chip del hero, semana, cuenta al 29
function pintarPromos() {
  const P = kit.config.pedidos?.promos || [];
  $$('[data-sj-pct]').forEach(el => { const pr = P.find(x => x.id === el.dataset.sjPct); if (pr) el.textContent = pr.pct; });
  const hoy = kit.promosHoy();
  const chip = $('[data-sj-promochip]');
  const texto = (lista) => lista.map(pr => `${pr.pct}% en ${pr.id === 'mie-fideos' ? 'fideos y ñoquis' : pr.id === 'mie-ravioles' ? 'ravioles' : 'ñoquis'}`).join(' · ');
  if (hoy.length) {
    chip.classList.add('es-promo');
    $('.promochip__d', chip).textContent = aDate(HOY).getUTCDate() === 29 && hoy.some(x => x.id === '29-noquis') ? 'Hoy 29' : 'Hoy';
    $('.promochip__t', chip).textContent = `${texto(hoy)}, ya aplicado en tu pedido`;
  } else {
    const mie = P.filter(x => (x.dias || []).includes('mie') && Number(x.pct) > 0);
    $('.promochip__d', chip).textContent = mie.length ? 'Miércoles' : 'Envío';
    $('.promochip__t', chip).textContent = mie.length ? texto(mie) : 'Gratis en Villa Devoto';
  }
  // semana: 7 días desde hoy
  const H = kit.config.horarios;
  $('[data-sj-semana]').innerHTML = Array.from({ length: 7 }, (_, i) => {
    const f = sumar(HOY, i); const d = aDate(f); const dow = d.getUTCDay();
    const fr = H[DIAS[dow]] || [];
    const prs = (P || []).filter(pr => Number(pr.pct) > 0 && (((pr.dias || []).includes(DIAS[dow])) || (pr.diasMes || []).map(Number).includes(d.getUTCDate())));
    const cls = ['dia', i === 0 ? 'dia--hoy' : '', !fr.length ? 'dia--off' : '', prs.length ? 'dia--promo' : ''].join(' ');
    const horas = fr.length ? fr.map(([a, b]) => `<span class="dia__h">${a.replace(/^0/, '')} a ${b.replace(/^0/, '')} hs</span>`).join('') : 'Cerrado';
    const promo = d.getUTCDate() === 29 && prs.some(x => x.id === '29-noquis') ? 'Día de ñoquis' : prs.length ? (dow === 3 ? 'Miércoles de promo' : 'Promo') : '';
    return `<li class="${cls}">${i === 0 ? '<span class="dia__hoy">Hoy</span>' : ''}<span>${DIAS_NOM[dow]}</span><b>${d.getUTCDate()}</b><span>${horas}</span>${promo ? `<span class="dia__p">${promo}</span>` : ''}</li>`;
  }).join('');
  // próximo 29
  let k = 0; while (k < 70 && aDate(sumar(HOY, k)).getUTCDate() !== 29) k++;
  $('[data-sj-29]').textContent = k === 0 ? '¡Hoy es 29! Los ñoquis ya tienen el descuento en el pedido.' : `Faltan ${k} ${k === 1 ? 'día' : 'días'} para el próximo 29 (${DIAS_NOM[aDate(sumar(HOY, k)).getUTCDay()].toLowerCase()}).`;
  $$('.promo').forEach(x => x.classList.remove('es-hoy'));
  if (hoy.some(x => x.id.startsWith('mie'))) $('.promo')?.classList.add('es-hoy');
  if (hoy.some(x => x.id === '29-noquis')) $('.promo--29')?.classList.add('es-hoy');
}

// ---------- abierto / cerrado
function pintarEstado() {
  const el = $('[data-sj-estado]'); if (!el || !kit) return;
  const e = kit.abierto();
  el.classList.toggle('abierto', e.abierto); el.classList.toggle('cerrado', !e.abierto);
  el.textContent = e.abierto ? `Abierto ahora · hasta las ${e.cierra.replace(/^0/, '')} hs` : e.abre ? `Cerrado ahora · abre a las ${e.abre.replace(/^0/, '')} hs` : 'Cerrado ahora';
}

(async () => {
  try {
    kit = await initKit({
      config: 'cliente.json',
      fechaPromo: FORZADA || undefined,
      carta: { template, itemClass: 'sj-item' },
      carrito: { label: 'Mi pedido', icono: '<span class="pila" aria-hidden="true"></span>' },
    });
    await kit.carrito?.listo;
    pintarPromos(); pintarEstado(); pintarPila(); pintarTodo();
    document.addEventListener('kit:carrito', () => { pintarPila(); pintarTodo(); });
    document.addEventListener('kit:destacados', () => { pintarPromos(); pintarTodo(); });
    setInterval(pintarEstado, 60000);
  } catch (err) { console.error('[demo] kit', err); }
})();
