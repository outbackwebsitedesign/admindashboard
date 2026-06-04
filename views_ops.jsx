/* ============================================================
   LEDGER — Ops views: Appointments, Tasks, Time tracking, Email
   ============================================================ */
const { Icon: OIcon, BizChip: OBizChip, Avatar: OAvatar, Button: OButton, Badge: OBadge,
        Card: OCard, Seg: OSeg, Stat: OStat, Empty: OEmpty, PageHead: OPageHead, h: oh } = window;
const OF = window.DB.fmt;
const oMoney = (n, dp) => OF.fmtAUD(n, { dp });

/* ============================================================
   APPOINTMENTS / CALENDAR  (June 2026)
   ============================================================ */
function AppointmentsView({ bizId, store }) {
  const DB = window.DB;
  const appts = DB.byBiz(DB.appointments, bizId);
  // build June 2026 grid; today = 4 Jun 2026
  const year = 2026, month = 5; // June
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const bizColor = (b) => DB.biz(b).color;
  const apptsOn = (d) => appts.filter(a => { const x = new Date(a.start); return x.getMonth() === month && x.getDate() === d; });
  const [sel, setSel] = window.useState(null);

  const upcoming = appts.filter(a => OF.daysFromToday(a.start) >= 0).sort((a, b) => new Date(a.start) - new Date(b.start));

  return oh('div', { className: 'content-inner fade-up' },
    oh(OPageHead, { bizId, title: 'Appointments', sub: 'June 2026',
      actions: [oh(OButton, { key: 'n', variant: 'primary', icon: 'plus' }, 'New appointment')] }),
    oh('div', { className: 'grid', style: { gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' } },
      oh(OCard, { bodyClass: 'tight' },
        oh('div', { className: 'row between', style: { padding: '12px 16px' } },
          oh('div', { className: 'row', style: { gap: 8 } },
            oh('button', { className: 'icon-btn', style: { width: 30, height: 30 } }, oh(OIcon, { name: 'chevLeft', size: 16 })),
            oh('span', { style: { fontSize: 14, fontWeight: 600 } }, 'June 2026'),
            oh('button', { className: 'icon-btn', style: { width: 30, height: 30 } }, oh(OIcon, { name: 'chevRight', size: 16 }))),
          oh('span', { className: 'muted', style: { fontSize: 11.5 } }, appts.length + ' bookings')),
        oh('div', { className: 'cal', style: { margin: '0 14px 14px' } },
          OF.DOW.map(d => oh('div', { className: 'cal-dow', key: d }, d)),
          cells.map((d, i) => {
            if (!d) return oh('div', { className: 'cal-cell off', key: i });
            const evs = apptsOn(d);
            const isToday = d === 4;
            return oh('div', { className: 'cal-cell' + (isToday ? ' today' : ''), key: i },
              oh('div', { className: 'cal-date' }, d),
              evs.slice(0, 3).map(a => { const c = DB.cust(a.cust);
                return oh('div', { key: a.id, className: 'cal-ev', onClick: () => setSel(a),
                  style: { background: bizColor(a.biz) + '22', color: bizColor(a.biz) } },
                  OF.fmtTime(a.start) + ' ' + a.title); }),
              evs.length > 3 && oh('div', { style: { fontSize: 9, color: 'var(--muted)', marginTop: 2 } }, '+' + (evs.length - 3) + ' more'));
          }))),
      oh(OCard, { title: 'Upcoming', bodyClass: 'tight' },
        upcoming.length ? upcoming.map(a => { const c = DB.cust(a.cust);
          return oh('div', { key: a.id, className: 'row', style: { gap: 11, padding: '11px 14px', borderBottom: '1px solid var(--line-2)', cursor: 'pointer' }, onClick: () => setSel(a) },
            oh('div', { style: { width: 3, alignSelf: 'stretch', borderRadius: 2, background: bizColor(a.biz), flex: 'none' } }),
            oh('div', { style: { flex: 1, minWidth: 0 } },
              oh('div', { style: { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' } }, a.title),
              oh('div', { className: 'muted', style: { fontSize: 11 } }, OF.relDays(a.start) + ' · ' + OF.fmtTime(a.start) + (c ? ' · ' + c.name : ''))),
            bizId === 'all' && oh(OBizChip, { biz: a.biz, size: 'sm' }));
        }) : oh(OEmpty, { icon: 'calendar', title: 'No upcoming bookings' }))),
    sel && window.h(ApptModal, { a: sel, onClose: () => setSel(null) }));
}
function ApptModal({ a, onClose }) {
  const DB = window.DB; const c = DB.cust(a.cust); const b = DB.biz(a.biz);
  return window.h(window.Modal, { title: a.title, sub: OF.fmtDate(a.start) + ' · ' + OF.fmtTime(a.start), onClose, width: 460,
    footer: [window.h('div', { className: 'spacer', key: 's' }), window.h(OButton, { key: 'e', variant: 'ghost', icon: 'edit' }, 'Edit'), window.h(OButton, { key: 'm', variant: 'primary', icon: 'mail' }, 'Email reminder')] },
    window.h('div', { className: 'col', style: { gap: 11 } },
      detailLine('briefcase', 'Business', b.name),
      c && detailLine('user', 'Customer', c.name + ' · ' + c.phone),
      detailLine('clock', 'Duration', a.durMin + ' minutes'),
      detailLine('zap', 'Type', a.kind)));
}
function detailLine(icon, label, val) {
  return window.h('div', { className: 'row', style: { gap: 11 } },
    window.h('div', { style: { width: 30, height: 30, borderRadius: 7, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flex: 'none' } }, window.h(OIcon, { name: icon, size: 15, style: { color: 'var(--muted)' } })),
    window.h('div', null, window.h('div', { className: 'muted', style: { fontSize: 10.5 } }, label), window.h('div', { style: { fontSize: 13, color: 'var(--ink)', textTransform: label === 'Type' ? 'capitalize' : 'none' } }, val)));
}

/* ============================================================
   TASKS / REMINDERS
   ============================================================ */
function TasksView({ bizId, store }) {
  const DB = window.DB;
  const [tasks, setTasks] = window.useState(() => DB.byBiz(DB.tasks, bizId).map(t => ({ ...t })));
  window.useEffect(() => { setTasks(DB.byBiz(DB.tasks, bizId).map(t => ({ ...t }))); }, [bizId]);
  const [filter, setFilter] = window.useState('open');
  const toggle = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const visible = filter === 'all' ? tasks : filter === 'open' ? tasks.filter(t => !t.done) : tasks.filter(t => t.done);
  const grouped = {};
  visible.forEach(t => { (grouped[t.tag] = grouped[t.tag] || []).push(t); });
  const openCount = tasks.filter(t => !t.done).length;
  const overdue = tasks.filter(t => !t.done && OF.daysFromToday(t.due) < 0).length;

  const prioColor = (p) => p === 'high' ? 'var(--neg)' : p === 'med' ? 'var(--warn)' : 'var(--line-strong)';

  return oh('div', { className: 'content-inner fade-up' },
    oh(OPageHead, { bizId, title: 'Tasks & reminders', sub: openCount + ' open · ' + overdue + ' overdue',
      actions: [oh(OButton, { key: 'n', variant: 'primary', icon: 'plus' }, 'New task')] }),
    oh('div', { className: 'row', style: { marginBottom: 14 } },
      oh(OSeg, { value: filter, onChange: setFilter, options: [
        { value: 'open', label: 'Open', count: tasks.filter(t => !t.done).length },
        { value: 'done', label: 'Done', count: tasks.filter(t => t.done).length },
        { value: 'all', label: 'All', count: tasks.length }] })),
    Object.keys(grouped).length ? oh('div', { className: 'col', style: { gap: 16 } },
      Object.entries(grouped).map(([tag, ts]) => oh('div', { key: tag },
        oh('div', { className: 'section-title' }, tag, oh('span', { className: 'badge soft', style: { fontSize: 10 } }, ts.length), oh('span', { className: 'line' })),
        oh(OCard, { bodyClass: 'tight' }, ts.map(t => { const c = OF.daysFromToday(t.due);
          return oh('div', { key: t.id, className: 'row', style: { gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--line-2)' } },
            oh('button', { onClick: () => toggle(t.id), style: {
              width: 19, height: 19, borderRadius: 5, flex: 'none', cursor: 'pointer',
              border: '1.5px solid ' + (t.done ? 'var(--brand)' : 'var(--line-strong)'),
              background: t.done ? 'var(--brand)' : 'transparent', display: 'grid', placeItems: 'center', padding: 0 } },
              t.done && oh(OIcon, { name: 'check', size: 12, style: { color: '#fff' } })),
            oh('span', { style: { width: 7, height: 7, borderRadius: '50%', background: prioColor(t.prio), flex: 'none' } }),
            oh('span', { style: { flex: 1, fontSize: 13, color: t.done ? 'var(--faint)' : 'var(--ink-2)', textDecoration: t.done ? 'line-through' : 'none' } }, t.title),
            bizId === 'all' && oh(OBizChip, { biz: t.biz, size: 'sm' }),
            oh('span', { className: 'mono', style: { fontSize: 11, fontWeight: 500, color: !t.done && c < 0 ? 'var(--neg)' : 'var(--muted)', whiteSpace: 'nowrap' } }, OF.relDays(t.due))); }))))
    ) : oh(OCard, null, oh(OEmpty, { icon: 'checkSquare', title: 'Nothing here', children: 'No tasks match this filter.' })));
}

/* ============================================================
   TIME TRACKING
   ============================================================ */
function TimeView({ bizId, store }) {
  const DB = window.DB;
  const logs = DB.byBiz(DB.timeLogs, bizId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalHrs = logs.reduce((s, l) => s + l.hrs, 0);
  const billableHrs = logs.filter(l => l.billable).reduce((s, l) => s + l.hrs, 0);
  const value = logs.filter(l => l.billable).reduce((s, l) => s + l.hrs * l.rate, 0);
  const unbilled = logs.filter(l => l.billable && !l.billed).reduce((s, l) => s + l.hrs * l.rate, 0);

  return oh('div', { className: 'content-inner fade-up' },
    oh(OPageHead, { bizId, title: 'Time tracking', sub: 'Billable hours and work in progress',
      actions: [oh(OButton, { key: 's', variant: 'primary', icon: 'clock' }, 'Start timer')] }),
    oh('div', { className: 'grid g-4', style: { marginBottom: 16 } },
      oh(OStat, { label: 'Hours logged', icon: 'clock', iconColor: 'var(--info)', value: totalHrs.toFixed(1), cur: '' }),
      oh(OStat, { label: 'Billable', icon: 'check', iconColor: 'var(--brand)', value: billableHrs.toFixed(1), cur: '', foot: Math.round(billableHrs / totalHrs * 100) + '% of total' }),
      oh(OStat, { label: 'Billable value', icon: 'dollar', iconColor: 'var(--brand)', value: OF.fmtNum(Math.round(value)) }),
      oh(OStat, { label: 'Unbilled WIP', icon: 'briefcase', iconColor: 'var(--warn)', value: OF.fmtNum(Math.round(unbilled)) })),
    oh(OCard, { bodyClass: 'tight', title: 'Time entries',
      right: oh(OButton, { size: 'sm', variant: 'primary', icon: 'invoice' }, 'Invoice unbilled') },
      oh('div', { className: 'tbl-wrap' }, oh('table', { className: 'tbl' },
        oh('thead', null, oh('tr', null,
          oh('th', null, 'Date'), bizId === 'all' && oh('th', null, 'Biz'), oh('th', null, 'Person'),
          oh('th', null, 'Work'), oh('th', null, 'Customer'), oh('th', { className: 'r' }, 'Hours'),
          oh('th', { className: 'r' }, 'Rate'), oh('th', { className: 'r' }, 'Value'), oh('th', null, ''))),
        oh('tbody', null, logs.map(l => { const c = DB.cust(l.cust);
          return oh('tr', { key: l.id },
            oh('td', { className: 'muted', style: { whiteSpace: 'nowrap' } }, OF.fmtDateShort(l.date)),
            bizId === 'all' && oh('td', null, oh(OBizChip, { biz: l.biz, size: 'sm' })),
            oh('td', null, oh('div', { className: 'cellrow' }, oh(OAvatar, { name: l.who, size: 24 }), oh('span', { className: 'strong' }, l.who))),
            oh('td', { style: { color: 'var(--ink-2)' } }, l.note),
            oh('td', { className: 'muted' }, c ? c.name : '—'),
            oh('td', { className: 'amt' }, l.hrs.toFixed(1)),
            oh('td', { className: 'amt muted' }, l.rate ? oMoney(l.rate, 0) : '—'),
            oh('td', { className: 'amt' }, l.billable ? oMoney(l.hrs * l.rate, 0) : '—'),
            oh('td', null, l.billable ? oh('span', { className: 'badge open', style: { fontSize: 10 } }, 'billable') : oh('span', { className: 'badge draft', style: { fontSize: 10 } }, 'internal'))); }))))));
}

/* ============================================================
   EMAIL MANAGEMENT
   ============================================================ */
function EmailView({ bizId, store }) {
  const DB = window.DB;
  const emails = DB.byBiz(DB.emails, bizId);
  const [sel, setSel] = window.useState(emails[0] && emails[0].id);
  const [filter, setFilter] = window.useState('all');
  const list = filter === 'unread' ? emails.filter(e => e.unread) : emails;
  const cur = emails.find(e => e.id === sel) || list[0];
  const unread = emails.filter(e => e.unread).length;

  return oh('div', { className: 'content-inner fade-up' },
    oh(OPageHead, { bizId, title: 'Email', sub: unread + ' unread · linked to customers',
      actions: [oh(OButton, { key: 'c', variant: 'primary', icon: 'edit' }, 'Compose')] }),
    oh('div', { className: 'card', style: { overflow: 'hidden', display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 200px)', minHeight: 460 } },
      // list
      oh('div', { style: { borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', minHeight: 0 } },
        oh('div', { className: 'row', style: { padding: '10px 12px', borderBottom: '1px solid var(--line-2)', gap: 8 } },
          oh(OSeg, { value: filter, onChange: setFilter, options: [{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread', count: unread }] })),
        oh('div', { style: { overflowY: 'auto', flex: 1 } },
          list.map(e => { const c = DB.cust(e.cust);
            return oh('div', { key: e.id, onClick: () => setSel(e.id), style: {
              padding: '11px 13px', borderBottom: '1px solid var(--line-2)', cursor: 'pointer',
              background: cur && cur.id === e.id ? 'var(--brand-tint)' : (e.unread ? 'var(--surface)' : 'var(--surface-2)'),
              borderLeft: '2px solid ' + (cur && cur.id === e.id ? 'var(--brand)' : 'transparent') } },
              oh('div', { className: 'row between', style: { marginBottom: 3 } },
                oh('div', { className: 'row', style: { gap: 7, minWidth: 0 } },
                  e.unread && oh('span', { style: { width: 7, height: 7, borderRadius: '50%', background: 'var(--brand)', flex: 'none' } }),
                  oh('span', { style: { fontSize: 12.5, fontWeight: e.unread ? 700 : 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, e.from)),
                oh('span', { className: 'muted', style: { fontSize: 10.5, flex: 'none' } }, e.ago)),
              oh('div', { style: { fontSize: 12, fontWeight: e.unread ? 600 : 500, color: 'var(--ink-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 } }, e.subject),
              oh('div', { className: 'row between', style: { gap: 6 } },
                oh('span', { className: 'muted', style: { fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 } }, e.preview),
                bizId === 'all' && oh(OBizChip, { biz: e.biz, size: 'sm' }))); }))),
      // reading pane
      cur ? oh('div', { style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },
        oh('div', { style: { padding: '16px 20px', borderBottom: '1px solid var(--line-2)' } },
          oh('div', { className: 'row between', style: { marginBottom: 10 } },
            oh('span', { style: { fontSize: 16, fontWeight: 600 } }, cur.subject),
            oh('span', { className: 'badge soft' }, cur.tag)),
          oh('div', { className: 'row', style: { gap: 11 } },
            oh(OAvatar, { name: cur.from, size: 38 }),
            oh('div', { style: { flex: 1 } },
              oh('div', { className: 'row between' },
                oh('span', { style: { fontSize: 13, fontWeight: 600, color: 'var(--ink)' } }, cur.from),
                oh('span', { className: 'muted', style: { fontSize: 11.5 } }, cur.ago + ' ago')),
              oh('div', { className: 'muted', style: { fontSize: 11.5 } }, cur.dir === 'in' ? 'to ' + DB.biz(cur.biz).email : 'sent from ' + DB.biz(cur.biz).email)))),
        oh('div', { style: { padding: 20, flex: 1, overflowY: 'auto', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.7 } },
          oh('p', { style: { marginTop: 0 } }, cur.preview),
          oh('p', null, 'Let me know if you need anything else from our end. Happy to jump on a quick call if that\u2019s easier.'),
          oh('p', { style: { color: 'var(--muted)' } }, '— ' + cur.from),
          cur.cust && oh('div', { className: 'card flat', style: { marginTop: 16, padding: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 10 } },
            oh(OIcon, { name: 'link', size: 15, style: { color: 'var(--muted)' } }),
            oh('span', { style: { fontSize: 12, color: 'var(--ink-2)' } }, 'Linked to customer '),
            oh('span', { className: 'lk', style: { fontSize: 12 } }, DB.cust(cur.cust).name))),
        oh('div', { style: { padding: '13px 20px', borderTop: '1px solid var(--line-2)', display: 'flex', gap: 8 } },
          oh(OButton, { variant: 'primary', icon: 'send' }, 'Reply'),
          oh(OButton, { variant: 'ghost', icon: 'invoice' }, 'Create invoice'),
          oh(OButton, { variant: 'ghost', icon: 'checkSquare' }, 'Make task'))
      ) : oh(OEmpty, { icon: 'mail', title: 'Select an email' })));
}

Object.assign(window, { AppointmentsView, TasksView, TimeView, EmailView });
