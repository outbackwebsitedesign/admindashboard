/* ============================================================
   LEDGER — Icons + shared UI primitives  →  window.*
   ============================================================ */
const { useState, useEffect, useRef, useMemo, createElement: h } = React;

/* ---- Icon set (1.6px stroke, currentColor) ---- */
const PATHS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  building: 'M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11M8 7h2M8 11h2M8 15h2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  invoice: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h4',
  card: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  check: 'M20 6L9 17l-5-5',
  checkSquare: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  trendUp: 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
  trendDown: 'M22 17l-8.5-8.5-5 5L2 7M16 17h6v-6',
  receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1zM8 7h8M8 11h8M8 15h5',
  pie: 'M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  plus: 'M12 5v14M5 12h14',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  chevDown: 'M6 9l6 6 6-6',
  chevRight: 'M9 6l6 6-6 6',
  chevLeft: 'M15 6l-6 6 6 6',
  x: 'M18 6L6 18M6 6l12 12',
  copy: 'M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  bank: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  briefcase: 'M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM10 5h4v2h-4z',
  paperclip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  sparkles: 'M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2zM19 3v4M21 5h-4M5 17v3M6.5 18.5h-3',
};
function Icon({ name, size = 16, fill = 'none', style, strokeWidth = 1.7, className }) {
  const d = PATHS[name] || '';
  const segs = d.split(/(?=M)/).filter(Boolean);
  return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: fill, stroke: 'currentColor',
    strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style, className, 'aria-hidden': true },
    segs.map((p, i) => h('path', { key: i, d: p })));
}

/* ---- Business chip ---- */
function BizChip({ biz, size = 'md' }) {
  const b = typeof biz === 'string' ? window.DB.biz(biz) : biz;
  if (!b) return h('div', { className: 'biz-chip all ' + (size === 'md' ? '' : size) }, '∑');
  return h('div', { className: 'biz-chip ' + (size === 'md' ? '' : size), style: { background: b.color } }, b.abbr);
}

/* ---- Avatar token from a name ---- */
const AV_COLORS = ['#6d5bd0','#2f6fb0','#bd7b34','#2f9c8e','#c0432c','#0f8a5f','#b07908','#6a4fc0'];
function Avatar({ name, size = 26, square = false }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  let hh = 0; for (let i = 0; i < (name || '').length; i++) hh = (hh * 31 + name.charCodeAt(i)) | 0;
  const bg = AV_COLORS[Math.abs(hh) % AV_COLORS.length];
  return h('div', { className: 'av-token' + (square ? ' sq' : ''), style: { width: size, height: size, background: bg, fontSize: size * 0.4 } }, initials);
}

/* ---- Button ---- */
function Button({ children, icon, variant, size, onClick, disabled, style, title }) {
  return h('button', { className: 'btn' + (variant ? ' ' + variant : '') + (size ? ' ' + size : ''), onClick, disabled, style, title },
    icon && h(Icon, { name: icon, size: size === 'sm' ? 13 : 15 }), children);
}

/* ---- Badge / status ---- */
const STATUS_LABEL = { paid:'Paid', sent:'Sent', overdue:'Overdue', draft:'Draft', partial:'Part-paid', void:'Void', open:'Open', done:'Done', pending:'Pending' };
function Badge({ status, children, dot, className }) {
  const cls = 'badge ' + (status || '') + (className ? ' ' + className : '');
  return h('span', { className: cls }, dot && h('span', { className: 'pip', style: { background: 'currentColor' } }), children || STATUS_LABEL[status] || status);
}

/* ---- Card ---- */
function Card({ title, sub, right, children, className, bodyClass, noBody }) {
  return h('div', { className: 'card' + (className ? ' ' + className : '') },
    (title || right) && h('div', { className: 'card-h' },
      title && h('h3', null, title),
      sub && h('span', { className: 'sub' }, sub),
      right && h('div', { className: 'right' }, right)),
    noBody ? children : h('div', { className: 'card-b' + (bodyClass ? ' ' + bodyClass : '') }, children));
}

/* ---- Stat / KPI card ---- */
function Stat({ label, icon, iconColor, value, cur = '$', delta, deltaDir, foot, spark }) {
  return h('div', { className: 'stat' },
    h('div', { className: 'row between' },
      h('span', { className: 'stat-label' }, label),
      icon && h('div', { className: 'stat-ico', style: { background: (iconColor || 'var(--brand)') + '1f', color: iconColor || 'var(--brand)' } }, h(Icon, { name: icon, size: 15 }))),
    h('div', { className: 'stat-val' }, cur && h('span', { className: 'cur' }, cur), value),
    (delta != null || foot) && h('div', { className: 'stat-foot' },
      delta != null && h('span', { className: 'delta ' + (deltaDir || 'up') },
        h(Icon, { name: deltaDir === 'down' ? 'arrowDown' : 'arrowUp', size: 11 }), delta),
      foot && h('span', { className: 'muted', style: { fontSize: 11.5 } }, foot)),
    spark && h('div', { className: 'stat-spark' }, spark));
}

/* ---- Segmented control ---- */
function Seg({ options, value, onChange }) {
  return h('div', { className: 'seg' }, options.map(o => {
    const val = o.value ?? o;
    const lbl = o.label ?? o;
    return h('button', { key: val, className: value === val ? 'on' : '', onClick: () => onChange(val) },
      lbl, o.count != null && h('span', { className: 'cnt' }, o.count));
  }));
}

/* ---- Modal ---- */
function Modal({ title, sub, onClose, children, footer, width }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  return h('div', { className: 'scrim', onMouseDown: onClose },
    h('div', { className: 'modal', style: width ? { width } : null, onMouseDown: e => e.stopPropagation() },
      h('div', { className: 'modal-h' },
        h('div', null, h('h3', null, title), sub && h('div', { className: 'muted', style: { marginTop: 3, fontSize: 12 } }, sub)),
        h('button', { className: 'icon-btn x', onClick: onClose, style: { width: 30, height: 30 } }, h(Icon, { name: 'x', size: 16 }))),
      h('div', { className: 'modal-b' }, children),
      footer && h('div', { className: 'modal-f' }, footer)));
}

/* ---- Drawer (right slide) ---- */
function Drawer({ onClose, children, width }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  return h('div', { className: 'scrim', onMouseDown: onClose },
    h('div', { className: 'drawer', style: width ? { width } : null, onMouseDown: e => e.stopPropagation() }, children));
}

/* ---- Empty state ---- */
function Empty({ icon = 'file', title, children }) {
  return h('div', { className: 'empty' }, h(Icon, { name: icon, size: 34 }), h('h4', null, title), children && h('div', { style: { fontSize: 12.5 } }, children));
}

/* ---- Toast host ---- */
let _toastFn = null;
function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { _toastFn = (msg, icon) => {
    const id = Math.random();
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }; }, []);
  return h('div', { className: 'toast-wrap' }, toasts.map(t =>
    h('div', { className: 'toast', key: t.id }, h(Icon, { name: t.icon || 'check', size: 16 }), t.msg)));
}
function toast(msg, icon) { _toastFn && _toastFn(msg, icon); }

/* ---- copy helper ---- */
function copyText(t) {
  try { navigator.clipboard.writeText(t); } catch (e) {}
  toast('Copied to clipboard', 'copy');
}

Object.assign(window, {
  Icon, BizChip, Avatar, Button, Badge, Card, Stat, Seg, Modal, Drawer, Empty,
  ToastHost, toast, copyText, useState, useEffect, useRef, useMemo, h,
});
