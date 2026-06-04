/* ============================================================
   LEDGER — Hand-built SVG charts → window.*
   ============================================================ */
const { useState: _uS, useRef: _uR, useEffect: _uE, createElement: _h } = React;

/* ---- Sparkline ---- */
function Sparkline({ data, w = 90, hgt = 30, color = 'var(--brand)', fill = true, strokeW = 1.6 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * w, hgt - 3 - ((v - min) / rng) * (hgt - 6) ]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${w} ${hgt} L0 ${hgt} Z`;
  const id = 'sp' + Math.random().toString(36).slice(2, 7);
  return _h('svg', { width: w, height: hgt, style: { display: 'block', overflow: 'visible' } },
    fill && _h('defs', null, _h('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 },
      _h('stop', { offset: '0%', stopColor: color, stopOpacity: 0.22 }),
      _h('stop', { offset: '100%', stopColor: color, stopOpacity: 0 }))),
    fill && _h('path', { d: area, fill: `url(#${id})`, stroke: 'none' }),
    _h('path', { d: line, fill: 'none', stroke: color, strokeWidth: strokeW, strokeLinecap: 'round', strokeLinejoin: 'round' }));
}

/* ---- Income vs Expense area/line chart with grid + hover ---- */
function CashflowChart({ series, height = 240, fmt }) {
  const [hover, setHover] = _uS(null);
  const w = 760, pad = { l: 46, r: 14, t: 14, b: 26 };
  const innerW = w - pad.l - pad.r, innerH = height - pad.t - pad.b;
  const maxV = Math.max(...series.map(s => Math.max(s.income, s.expense))) * 1.12;
  const x = i => pad.l + (i / (series.length - 1)) * innerW;
  const y = v => pad.t + innerH - (v / maxV) * innerH;
  const path = (key) => series.map((s, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(s[key]).toFixed(1)).join(' ');
  const areaInc = path('income') + ` L${x(series.length - 1)} ${pad.t + innerH} L${x(0)} ${pad.t + innerH} Z`;
  const ticks = 4;
  return _h('div', { style: { position: 'relative' } },
    _h('svg', { viewBox: `0 0 ${w} ${height}`, width: '100%', style: { display: 'block' },
      onMouseLeave: () => setHover(null),
      onMouseMove: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width * w;
        let idx = Math.round((px - pad.l) / innerW * (series.length - 1));
        idx = Math.max(0, Math.min(series.length - 1, idx));
        setHover(idx);
      } },
      _h('defs', null, _h('linearGradient', { id: 'cfInc', x1: 0, y1: 0, x2: 0, y2: 1 },
        _h('stop', { offset: '0%', stopColor: 'var(--brand)', stopOpacity: 0.16 }),
        _h('stop', { offset: '100%', stopColor: 'var(--brand)', stopOpacity: 0 }))),
      // grid + y labels
      Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = (maxV / ticks) * i; const yy = y(v);
        return _h('g', { key: i },
          _h('line', { x1: pad.l, x2: w - pad.r, y1: yy, y2: yy, stroke: 'var(--line-2)', strokeWidth: 1 }),
          _h('text', { x: pad.l - 8, y: yy + 3.5, textAnchor: 'end', fontSize: 10, fill: 'var(--faint)', fontFamily: 'var(--mono)' }, fmt.fmtK(v)));
      }),
      // x labels
      series.map((s, i) => _h('text', { key: i, x: x(i), y: height - 8, textAnchor: 'middle', fontSize: 10, fill: hover === i ? 'var(--ink)' : 'var(--faint)', fontWeight: hover === i ? 600 : 400 }, s.m)),
      _h('path', { d: areaInc, fill: 'url(#cfInc)' }),
      _h('path', { d: path('income'), fill: 'none', stroke: 'var(--brand)', strokeWidth: 2.2, strokeLinejoin: 'round' }),
      _h('path', { d: path('expense'), fill: 'none', stroke: 'var(--neg)', strokeWidth: 2, strokeDasharray: '4 3', strokeLinejoin: 'round', opacity: 0.85 }),
      // hover
      hover != null && _h('g', null,
        _h('line', { x1: x(hover), x2: x(hover), y1: pad.t, y2: pad.t + innerH, stroke: 'var(--line-strong)', strokeWidth: 1 }),
        _h('circle', { cx: x(hover), cy: y(series[hover].income), r: 4, fill: 'var(--brand)', stroke: '#fff', strokeWidth: 2 }),
        _h('circle', { cx: x(hover), cy: y(series[hover].expense), r: 4, fill: 'var(--neg)', stroke: '#fff', strokeWidth: 2 }))),
    hover != null && _h('div', { style: {
      position: 'absolute', left: `${(x(hover) / w) * 100}%`, top: 6, transform: 'translateX(-50%)',
      background: 'var(--side)', color: '#fff', padding: '7px 10px', borderRadius: 7, fontSize: 11,
      pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: 'var(--sh-3)', zIndex: 5 } },
      _h('div', { style: { fontWeight: 600, marginBottom: 3 } }, series[hover].m + (series[hover].future ? ' · current' : '')),
      _h('div', { className: 'mono', style: { color: 'var(--brand-300)' } }, 'Income  ' + fmt.fmtAUD(series[hover].income, { dp: 0 })),
      _h('div', { className: 'mono', style: { color: '#f0a594' } }, 'Expense ' + fmt.fmtAUD(series[hover].expense, { dp: 0 })),
      _h('div', { className: 'mono', style: { color: '#cdd5df', marginTop: 2 } }, 'Net      ' + fmt.fmtAUD(series[hover].net, { dp: 0 }))));
}

/* ---- Net bar chart (per month profit) ---- */
function NetBars({ series, height = 150, fmt }) {
  const w = 760, pad = { l: 40, r: 8, t: 10, b: 22 };
  const innerW = w - pad.l - pad.r, innerH = height - pad.t - pad.b;
  const maxV = Math.max(...series.map(s => Math.abs(s.net))) * 1.1;
  const bw = innerW / series.length * 0.56;
  const x = i => pad.l + (i + 0.5) / series.length * innerW;
  const zeroY = pad.t + innerH;
  return _h('svg', { viewBox: `0 0 ${w} ${height}`, width: '100%', style: { display: 'block' } },
    series.map((s, i) => {
      const hgt = (Math.abs(s.net) / maxV) * innerH;
      return _h('g', { key: i },
        _h('rect', { x: x(i) - bw / 2, y: zeroY - hgt, width: bw, height: Math.max(hgt, 1), rx: 2,
          fill: 'var(--brand)', opacity: s.future ? 0.5 : 0.85 }),
        _h('text', { x: x(i), y: height - 7, textAnchor: 'middle', fontSize: 9.5, fill: 'var(--faint)' }, s.m));
    }),
    _h('line', { x1: pad.l, x2: w - pad.r, y1: zeroY, y2: zeroY, stroke: 'var(--line)', strokeWidth: 1 }));
}

/* ---- Donut chart ---- */
const DONUT_COLORS = ['#0f8a5f','#2f6fb0','#bd7b34','#6d5bd0','#c0432c','#2f9c8e','#b07908','#6a4fc0','#7a8694','#c8cdd4'];
function Donut({ data, size = 150, thickness = 22, fmt, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.amount, 0) || 1;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let acc = 0;
  return _h('div', { style: { display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' } },
    _h('svg', { width: size, height: size, style: { flex: 'none' } },
      _h('circle', { cx, cy, r, fill: 'none', stroke: 'var(--surface-3)', strokeWidth: thickness }),
      data.map((d, i) => {
        const frac = d.amount / total;
        const seg = _h('circle', { key: i, cx, cy, r, fill: 'none',
          stroke: DONUT_COLORS[i % DONUT_COLORS.length], strokeWidth: thickness,
          strokeDasharray: `${(frac * C).toFixed(2)} ${(C - frac * C).toFixed(2)}`,
          strokeDashoffset: (-acc * C).toFixed(2),
          transform: `rotate(-90 ${cx} ${cy})`, style: { transition: 'stroke-dasharray .4s' } });
        acc += frac; return seg;
      }),
      _h('text', { x: cx, y: cy - 2, textAnchor: 'middle', fontSize: 17, fontWeight: 600, fill: 'var(--ink)', fontFamily: 'var(--mono)' }, centerValue),
      _h('text', { x: cx, y: cy + 14, textAnchor: 'middle', fontSize: 9.5, fill: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }, centerLabel)),
    _h('div', { style: { flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 7 } },
      data.map((d, i) => _h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 } },
        _h('span', { style: { width: 9, height: 9, borderRadius: 3, background: DONUT_COLORS[i % DONUT_COLORS.length], flex: 'none' } }),
        _h('span', { style: { flex: 1, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, d.cat),
        _h('span', { className: 'mono', style: { color: 'var(--muted)', fontSize: 11 } }, ((d.amount / total) * 100).toFixed(0) + '%'),
        _h('span', { className: 'mono', style: { color: 'var(--ink)', fontWeight: 500, minWidth: 64, textAlign: 'right' } }, fmt.fmtAUD(d.amount, { dp: 0 }))))));
}

/* ---- Horizontal compare bars (per business) ---- */
function HBars({ rows, fmt, max }) {
  const mx = max || Math.max(...rows.map(r => r.value)) || 1;
  return _h('div', { style: { display: 'flex', flexDirection: 'column', gap: 11 } },
    rows.map((r, i) => _h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 11 } },
      _h('div', { style: { width: 150, display: 'flex', alignItems: 'center', gap: 8, flex: 'none' } },
        r.chip, _h('span', { style: { fontSize: 12, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 } }, r.label)),
      _h('div', { style: { flex: 1, height: 9, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden' } },
        _h('div', { style: { width: (r.value / mx * 100) + '%', height: '100%', background: r.color || 'var(--brand)', borderRadius: 5, transition: 'width .5s' } })),
      _h('span', { className: 'mono', style: { fontSize: 12, fontWeight: 600, color: 'var(--ink)', minWidth: 70, textAlign: 'right' } }, fmt.fmtAUD(r.value, { dp: 0 })))));
}

Object.assign(window, { Sparkline, CashflowChart, NetBars, Donut, HBars, DONUT_COLORS });
