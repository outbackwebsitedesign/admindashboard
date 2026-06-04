/* ============================================================
   LEDGER — Seed / demo data (plain JS global: window.DB)
   Locale: en-AU · Currency: AUD · GST 10%
   "Today" is anchored to 2026-06-04
   ============================================================ */
(function () {
  const TODAY = new Date('2026-06-04T09:00:00');

  /* ---- formatters ---- */
  const fmtAUD = (n, opts = {}) => {
    const sign = n < 0 ? '-' : '';
    const v = Math.abs(n);
    const s = v.toLocaleString('en-AU', { minimumFractionDigits: opts.dp ?? 2, maximumFractionDigits: opts.dp ?? 2 });
    return (opts.noSign ? '' : sign) + '$' + s;
  };
  const fmtK = (n) => {
    const sign = n < 0 ? '-' : '';
    const v = Math.abs(n);
    if (v >= 1000000) return sign + '$' + (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1000) return sign + '$' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return sign + '$' + v.toFixed(0);
  };
  const fmtNum = (n) => n.toLocaleString('en-AU');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const fmtDate = (d) => { const x = new Date(d); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };
  const fmtDateShort = (d) => { const x = new Date(d); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };
  const fmtTime = (d) => { const x = new Date(d); let h = x.getHours(); const m = x.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2,'0')}${ap}`; };
  const daysFromToday = (d) => Math.round((new Date(d) - TODAY) / 86400000);
  const relDays = (d) => {
    const diff = daysFromToday(d);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff < 0) return `${-diff}d ago`;
    return `in ${diff}d`;
  };
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const addDays = (base, n) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };

  /* deterministic pseudo-random */
  const rng = (seed) => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; };

  /* ============================================================
     BUSINESSES
     ============================================================ */
  const businesses = [
    {
      id: 'mar', name: 'Marlowe & Sons Coffee', type: 'Café & Roastery', abbr: 'MS',
      color: 'var(--biz-cafe)', owner: 'Dani Marlowe', abn: '52 114 668 902',
      email: 'accounts@marlowecoffee.com.au', phone: '(03) 9412 6680',
      address: '14 Gertrude St, Fitzroy VIC 3065', since: '2019', stripe: true, gst: true,
      ytdIncome: 412800, ytdExpense: 286400, cash: 38240,
    },
    {
      id: 'rfp', name: 'Reliable Flow Plumbing', type: 'Trade · Plumbing', abbr: 'RF',
      color: 'var(--biz-plumb)', owner: 'Mark Petrakis', abn: '88 203 551 740',
      email: 'office@reliableflow.com.au', phone: '0438 220 117',
      address: '7/22 Logistics Way, Dandenong VIC 3175', since: '2016', stripe: true, gst: true,
      ytdIncome: 689500, ytdExpense: 421200, cash: 91450,
    },
    {
      id: 'nbs', name: 'Northbound Studio', type: 'Design Studio', abbr: 'NB',
      color: 'var(--biz-studio)', owner: 'Priya Raman', abn: '41 990 218 663',
      email: 'hello@northbound.studio', phone: '0401 776 220',
      address: 'L2, 60 Smith St, Collingwood VIC 3066', since: '2021', stripe: true, gst: true,
      ytdIncome: 318600, ytdExpense: 162900, cash: 64720,
    },
    {
      id: 'bws', name: 'Brightwater Cleaning Co.', type: 'Commercial Cleaning', abbr: 'BW',
      color: 'var(--biz-clean)', owner: 'Sione Tuilagi', abn: '19 447 882 305',
      email: 'admin@brightwaterclean.com.au', phone: '0455 901 663',
      address: '3 Enterprise Dr, Sunshine VIC 3020', since: '2018', stripe: false, gst: true,
      ytdIncome: 254300, ytdExpense: 178600, cash: 21980,
    },
  ];

  /* ============================================================
     CUSTOMERS
     ============================================================ */
  const customers = [
    // Marlowe & Sons (wholesale + corporate)
    { id:'c-m1', biz:'mar', name:'Aperture Films', contact:'Joel Tan', email:'joel@aperturefilms.com.au', phone:'0412 556 901', type:'Wholesale', city:'Richmond', since:'2021-03' },
    { id:'c-m2', biz:'mar', name:'Folio Bookstore', contact:'Renee Atkins', email:'renee@foliobooks.com.au', phone:'0433 102 778', type:'Wholesale', city:'Fitzroy', since:'2020-08' },
    { id:'c-m3', biz:'mar', name:'Hatch Coworking', contact:'Daniel Pho', email:'ops@hatchspace.co', phone:'0401 889 220', type:'Corporate', city:'Cremorne', since:'2022-01' },
    { id:'c-m4', biz:'mar', name:'Greenline Yoga', contact:'Mia Costa', email:'hello@greenlineyoga.com', phone:'0455 661 003', type:'Wholesale', city:'Carlton', since:'2023-05' },
    { id:'c-m5', biz:'mar', name:'Northcote Primary', contact:'P&C Committee', email:'pandc@northcoteps.vic.edu.au', phone:'(03) 9481 2200', type:'Event', city:'Northcote', since:'2024-02' },
    { id:'c-m6', biz:'mar', name:'Saltwater Dental', contact:'Dr. Anita Roy', email:'reception@saltwaterdental.au', phone:'0421 330 815', type:'Corporate', city:'Fitzroy', since:'2023-09' },
    { id:'c-m7', biz:'mar', name:'The Print Room', contact:'Sam Okafor', email:'sam@theprintroom.com.au', phone:'0438 771 290', type:'Wholesale', city:'Brunswick', since:'2022-07' },

    // Reliable Flow Plumbing
    { id:'c-r1', biz:'rfp', name:'Brookside Property Group', contact:'Leah Kwan', email:'leah@brooksidepg.com.au', phone:'0411 230 559', type:'Strata', city:'Glen Waverley', since:'2018-04' },
    { id:'c-r2', biz:'rfp', name:'Apex Builders', contact:'Tony Russo', email:'tony@apexbuilders.com.au', phone:'0419 880 442', type:'Builder', city:'Clayton', since:'2017-11' },
    { id:'c-r3', biz:'rfp', name:'The Harrow Residence', contact:'Margaret Hale', email:'m.hale@gmail.com', phone:'0402 117 663', type:'Residential', city:'Malvern', since:'2024-03' },
    { id:'c-r4', biz:'rfp', name:'Dandenong RSL', contact:'Facilities', email:'facilities@dandyrsl.com.au', phone:'(03) 9792 4400', type:'Commercial', city:'Dandenong', since:'2019-06' },
    { id:'c-r5', biz:'rfp', name:'Westfield Kitchen Fitouts', contact:'Cara Nguyen', email:'cara@wkf.com.au', phone:'0433 905 118', type:'Builder', city:'Mulgrave', since:'2021-02' },
    { id:'c-r6', biz:'rfp', name:'Lloyd & Co Real Estate', contact:'Brett Lloyd', email:'brett@lloydco.com.au', phone:'0400 661 720', type:'Strata', city:'Oakleigh', since:'2020-09' },
    { id:'c-r7', biz:'rfp', name:'St. Brigid\u2019s College', contact:'Maintenance Office', email:'maint@stbrigids.vic.edu.au', phone:'(03) 9701 3300', type:'Commercial', city:'Berwick', since:'2022-05' },
    { id:'c-r8', biz:'rfp', name:'Halcyon Apartments OC', contact:'Owners Corp', email:'oc@halcyonapts.com.au', phone:'0421 778 330', type:'Strata', city:'Box Hill', since:'2023-08' },

    // Northbound Studio
    { id:'c-n1', biz:'nbs', name:'Tidewell Health', contact:'Dr. Helena Booth', email:'helena@tidewell.health', phone:'0412 008 551', type:'Retainer', city:'South Yarra', since:'2022-04' },
    { id:'c-n2', biz:'nbs', name:'Otto & Pearl', contact:'Jamie Lawson', email:'jamie@ottopearl.com', phone:'0433 220 991', type:'Project', city:'Fitzroy', since:'2023-01' },
    { id:'c-n3', biz:'nbs', name:'Meridian Capital', contact:'Andrew Choi', email:'a.choi@meridiancap.com.au', phone:'0401 556 230', type:'Retainer', city:'Docklands', since:'2021-10' },
    { id:'c-n4', biz:'nbs', name:'Lumen Energy', contact:'Sasha Petrov', email:'sasha@lumenenergy.au', phone:'0455 119 880', type:'Project', city:'Cremorne', since:'2024-01' },
    { id:'c-n5', biz:'nbs', name:'Field Notes Co.', contact:'Erin Whitlock', email:'erin@fieldnotes.co', phone:'0438 661 902', type:'Project', city:'Collingwood', since:'2023-07' },
    { id:'c-n6', biz:'nbs', name:'Coastline Property', contact:'Marco Diaz', email:'marco@coastlineproperty.au', phone:'0421 990 117', type:'Retainer', city:'Brighton', since:'2022-11' },

    // Brightwater Cleaning
    { id:'c-b1', biz:'bws', name:'Sunshine Plaza Mgmt', contact:'Vince Caruso', email:'vince@sunshineplaza.com.au', phone:'0411 880 220', type:'Contract', city:'Sunshine', since:'2019-02' },
    { id:'c-b2', biz:'bws', name:'Latrobe Medical Centre', contact:'Practice Mgr', email:'admin@latrobemc.com.au', phone:'(03) 9311 7700', type:'Contract', city:'Footscray', since:'2020-06' },
    { id:'c-b3', biz:'bws', name:'Kingsway Offices', contact:'Helen Tran', email:'helen@kingswayoffices.au', phone:'0433 119 005', type:'Contract', city:'Williamstown', since:'2021-09' },
    { id:'c-b4', biz:'bws', name:'Bayview Childcare', contact:'Director', email:'director@bayviewcc.com.au', phone:'0400 226 781', type:'Contract', city:'Altona', since:'2022-03' },
    { id:'c-b5', biz:'bws', name:'Forge Gym', contact:'Reece Daniels', email:'reece@forgegym.com.au', phone:'0455 330 118', type:'One-off', city:'Maribyrnong', since:'2024-04' },
    { id:'c-b6', biz:'bws', name:'Northpoint Logistics', contact:'Site Office', email:'site@northpointlog.com.au', phone:'0421 008 663', type:'Contract', city:'Truganina', since:'2023-05' },
  ];

  /* ============================================================
     INVOICES  (status: paid | sent | overdue | draft | partial)
     each: items[], subtotal/gst/total computed
     ============================================================ */
  const invItems = (rows) => rows.map(r => ({ desc: r[0], qty: r[1], unit: r[2], amount: +(r[1] * r[2]).toFixed(2) }));
  function makeInvoice(o) {
    const items = invItems(o.items);
    const subtotal = +items.reduce((s, i) => s + i.amount, 0).toFixed(2);
    const gst = +(subtotal * 0.1).toFixed(2);
    const total = +(subtotal + gst).toFixed(2);
    return { ...o, items, subtotal, gst, total };
  }

  const invoices = [
    // ---- Marlowe & Sons ----
    makeInvoice({ id:'INV-1042', biz:'mar', cust:'c-m3', issued:'2026-05-28', due:'2026-06-11', status:'sent', stripe:'plink_1Q8xHatch', items:[['House Blend beans 5kg', 6, 84],['Filter — Single Origin 1kg', 4, 39],['Equipment service call', 1, 120]] }),
    makeInvoice({ id:'INV-1041', biz:'mar', cust:'c-m1', issued:'2026-05-20', due:'2026-06-03', status:'overdue', stripe:'plink_1Q7vAper', items:[['Office subscription — May', 1, 340],['Oat milk cases (x8)', 8, 26]] }),
    makeInvoice({ id:'INV-1040', biz:'mar', cust:'c-m6', issued:'2026-05-18', due:'2026-06-01', status:'paid', paid:'2026-05-29', stripe:'plink_1Q7pDent', items:[['Waiting-room pod plan — May', 1, 280],['Descaling service', 1, 90]] }),
    makeInvoice({ id:'INV-1039', biz:'mar', cust:'c-m2', issued:'2026-05-12', due:'2026-05-26', status:'paid', paid:'2026-05-22', items:[['House Blend beans 5kg', 8, 84],['Decaf 1kg', 3, 42]] }),
    makeInvoice({ id:'INV-1038', biz:'mar', cust:'c-m5', issued:'2026-05-09', due:'2026-05-23', status:'paid', paid:'2026-05-20', items:[['School fair cart hire', 1, 450],['Catering — 200 cups', 200, 3.2]] }),
    makeInvoice({ id:'INV-1037', biz:'mar', cust:'c-m7', issued:'2026-05-04', due:'2026-05-18', status:'partial', items:[['House Blend beans 5kg', 10, 84],['Cold brew kegs (x4)', 4, 110]] }),
    makeInvoice({ id:'INV-1036', biz:'mar', cust:'c-m4', issued:'2026-04-28', due:'2026-05-12', status:'paid', paid:'2026-05-08', items:[['Filter — Single Origin 1kg', 6, 39],['Chai concentrate 2L', 4, 28]] }),
    makeInvoice({ id:'INV-1035', biz:'mar', cust:'c-m3', issued:'2026-04-26', due:'2026-05-10', status:'paid', paid:'2026-05-02', items:[['House Blend beans 5kg', 6, 84],['Equipment service call', 1, 120]] }),
    makeInvoice({ id:'INV-1043', biz:'mar', cust:'c-m1', issued:'2026-06-03', due:'2026-06-17', status:'draft', items:[['Office subscription — June', 1, 340]] }),

    // ---- Reliable Flow Plumbing ----
    makeInvoice({ id:'INV-2188', biz:'rfp', cust:'c-r2', issued:'2026-05-30', due:'2026-06-13', status:'sent', stripe:'plink_2A1Apex', items:[['Rough-in — Lot 14 townhouses', 1, 6800],['Materials — copper & PEX', 1, 2140],['Tempering valves (x6)', 6, 145]] }),
    makeInvoice({ id:'INV-2187', biz:'rfp', cust:'c-r4', issued:'2026-05-27', due:'2026-06-10', status:'sent', stripe:'plink_2A0Rsl', items:[['Backflow testing — annual', 4, 180],['Grease trap service', 1, 420]] }),
    makeInvoice({ id:'INV-2186', biz:'rfp', cust:'c-r3', issued:'2026-05-22', due:'2026-06-05', status:'overdue', stripe:'plink_2ZxHarr', items:[['Hot water unit replacement', 1, 1980],['Labour — 4.5 hrs', 4.5, 120],['Disposal & fittings', 1, 160]] }),
    makeInvoice({ id:'INV-2185', biz:'rfp', cust:'c-r1', issued:'2026-05-19', due:'2026-06-02', status:'paid', paid:'2026-05-30', items:[['Strata maintenance — May', 1, 1450],['Blocked riser — Unit 8', 1, 380]] }),
    makeInvoice({ id:'INV-2184', biz:'rfp', cust:'c-r5', issued:'2026-05-15', due:'2026-05-29', status:'paid', paid:'2026-05-26', items:[['Commercial kitchen fitout — stage 2', 1, 5200],['Stainless waste runs', 1, 880]] }),
    makeInvoice({ id:'INV-2183', biz:'rfp', cust:'c-r6', issued:'2026-05-11', due:'2026-05-25', status:'paid', paid:'2026-05-21', items:[['Leak detection — 3 sites', 3, 240],['Tap & cartridge replacements', 9, 65]] }),
    makeInvoice({ id:'INV-2182', biz:'rfp', cust:'c-r7', issued:'2026-05-06', due:'2026-05-20', status:'partial', items:[['Gas line compliance works', 1, 2400],['Certification & paperwork', 1, 320]] }),
    makeInvoice({ id:'INV-2181', biz:'rfp', cust:'c-r8', issued:'2026-04-29', due:'2026-05-13', status:'paid', paid:'2026-05-09', items:[['Common-area pipe relining', 1, 3850]] }),
    makeInvoice({ id:'INV-2189', biz:'rfp', cust:'c-r2', issued:'2026-06-02', due:'2026-06-16', status:'draft', items:[['Fix-off — Lot 14 townhouses', 1, 4200]] }),

    // ---- Northbound Studio ----
    makeInvoice({ id:'NB-0461', biz:'nbs', cust:'c-n1', issued:'2026-05-29', due:'2026-06-12', status:'sent', stripe:'plink_3TideW', items:[['Brand retainer — June', 1, 4500]] }),
    makeInvoice({ id:'NB-0460', biz:'nbs', cust:'c-n4', issued:'2026-05-24', due:'2026-06-07', status:'sent', stripe:'plink_3Lumen', items:[['Website design — milestone 2', 1, 7200],['Illustration set (x12)', 12, 180]] }),
    makeInvoice({ id:'NB-0459', biz:'nbs', cust:'c-n3', issued:'2026-05-20', due:'2026-06-03', status:'overdue', stripe:'plink_3Merid', items:[['Marketing retainer — May', 1, 3800]] }),
    makeInvoice({ id:'NB-0458', biz:'nbs', cust:'c-n2', issued:'2026-05-14', due:'2026-05-28', status:'paid', paid:'2026-05-23', items:[['Packaging redesign — final', 1, 5400]] }),
    makeInvoice({ id:'NB-0457', biz:'nbs', cust:'c-n5', issued:'2026-05-08', due:'2026-05-22', status:'paid', paid:'2026-05-18', items:[['Editorial layout — 48pp', 1, 3200],['Stock & licensing', 1, 240]] }),
    makeInvoice({ id:'NB-0456', biz:'nbs', cust:'c-n6', issued:'2026-05-02', due:'2026-05-16', status:'paid', paid:'2026-05-12', items:[['Property campaign retainer', 1, 2600]] }),
    makeInvoice({ id:'NB-0462', biz:'nbs', cust:'c-n2', issued:'2026-06-03', due:'2026-06-17', status:'draft', items:[['Social templates pack', 1, 1400]] }),

    // ---- Brightwater Cleaning ----
    makeInvoice({ id:'BW-3310', biz:'bws', cust:'c-b1', issued:'2026-05-31', due:'2026-06-14', status:'sent', items:[['Plaza common areas — May', 1, 4200],['Window cleaning — quarterly', 1, 680]] }),
    makeInvoice({ id:'BW-3309', biz:'bws', cust:'c-b2', issued:'2026-05-28', due:'2026-06-11', status:'sent', items:[['Medical centre clean — May', 22, 110],['Clinical waste handling', 1, 240]] }),
    makeInvoice({ id:'BW-3308', biz:'bws', cust:'c-b3', issued:'2026-05-21', due:'2026-06-04', status:'overdue', items:[['Office cleaning — May', 1, 2380]] }),
    makeInvoice({ id:'BW-3307', biz:'bws', cust:'c-b4', issued:'2026-05-16', due:'2026-05-30', status:'paid', paid:'2026-05-27', items:[['Childcare deep clean', 1, 1560],['Sanitisation — toys & mats', 1, 320]] }),
    makeInvoice({ id:'BW-3306', biz:'bws', cust:'c-b6', issued:'2026-05-10', due:'2026-05-24', status:'paid', paid:'2026-05-22', items:[['Warehouse clean — May', 1, 1980]] }),
    makeInvoice({ id:'BW-3305', biz:'bws', cust:'c-b5', issued:'2026-05-04', due:'2026-05-18', status:'partial', items:[['Post-renovation clean', 1, 1240]] }),
    makeInvoice({ id:'BW-3311', biz:'bws', cust:'c-b1', issued:'2026-06-02', due:'2026-06-16', status:'draft', items:[['Plaza common areas — June', 1, 4200]] }),
  ];

  // partial payments tracker
  const partialPaid = { 'INV-1037':600, 'INV-2182':1500, 'NB-0461':0, 'BW-3305':500 };
  invoices.forEach(i => { i.amountPaid = i.status === 'paid' ? i.total : (i.status === 'partial' ? (partialPaid[i.id] || 0) : 0); });

  /* ============================================================
     PAYMENTS  (derived from paid + partial invoices)
     method: stripe | bank | cash
     ============================================================ */
  const payments = [];
  let payNo = 5100;
  invoices.filter(i => i.amountPaid > 0).forEach(i => {
    const method = i.stripe ? 'stripe' : (Math.abs(hash(i.id)) % 3 === 0 ? 'cash' : 'bank');
    payments.push({
      id: 'PAY-' + (payNo++), biz: i.biz, invoice: i.id, cust: i.cust,
      date: i.paid || i.due, amount: i.amountPaid, method,
      fee: method === 'stripe' ? +(i.amountPaid * 0.0175 + 0.30).toFixed(2) : 0,
      status: i.status === 'partial' ? 'partial' : 'settled',
    });
  });
  function hash(s){ let h=0; for(let k=0;k<s.length;k++){ h=(h*31+s.charCodeAt(k))|0; } return h; }

  /* ============================================================
     EXPENSES
     ============================================================ */
  const E = (biz, date, vendor, cat, amount, gst = true, method = 'card') =>
    ({ id:'EXP-'+Math.abs(hash(biz+date+vendor+amount)).toString().slice(0,6), biz, date, vendor, cat, amount, gst: gst ? +(amount/11).toFixed(2) : 0, method, status: daysFromToday(date) < -2 ? 'reconciled' : 'unreconciled' });
  const expenses = [
    // Marlowe
    E('mar','2026-05-30','Cartel Coffee Roasters','Cost of Goods',3840), E('mar','2026-05-28','Bunnings Warehouse','Equipment',218.40),
    E('mar','2026-05-25','Origin Energy','Utilities',642.10), E('mar','2026-05-22','Casual Staff — payroll','Wages',5840),
    E('mar','2026-05-18','Square Au','Bank & Fees',186.20), E('mar','2026-05-14','Bega Dairy','Cost of Goods',880),
    E('mar','2026-05-11','City of Yarra','Rent & Outgoings',4200,false,'bank'), E('mar','2026-05-06','Insurance Australia','Insurance',312),
    E('mar','2026-05-02','Visy Recycling','Waste',144), E('mar','2026-04-29','MYOB Subscription','Software',74.80),
    // Reliable Flow
    E('rfp','2026-05-31','Reece Plumbing Supplies','Materials',7240), E('rfp','2026-05-29','Caltex Fuel','Vehicle',880.40),
    E('rfp','2026-05-26','Apprentice wages','Wages',9600), E('rfp','2026-05-21','Tradelink','Materials',3120),
    E('rfp','2026-05-17','Toll Insurance','Insurance',1140), E('rfp','2026-05-12','Telstra','Phone & Internet',218),
    E('rfp','2026-05-08','VBA Licensing','Compliance',430,false,'bank'), E('rfp','2026-05-03','Kennards Hire','Equipment Hire',560),
    E('rfp','2026-04-30','simPRO Software','Software',289), E('rfp','2026-04-27','Repco','Vehicle',342.80),
    // Northbound
    E('nbs','2026-05-30','Adobe Creative Cloud','Software',132), E('nbs','2026-05-27','Freelance — illustration','Contractors',1800),
    E('nbs','2026-05-23','WeWork Collingwood','Rent & Outgoings',1650), E('nbs','2026-05-19','Figma','Software',96),
    E('nbs','2026-05-14','Moo Print','Production',420), E('nbs','2026-05-09','Splice / Stock','Software',58),
    E('nbs','2026-05-04','Xero Subscription','Software',75), E('nbs','2026-04-28','Adobe Stock','Production',128),
    // Brightwater
    E('bws','2026-05-31','Bunzl Cleaning Supplies','Materials',2180), E('bws','2026-05-28','Casual cleaners — payroll','Wages',8400),
    E('bws','2026-05-24','BP Fuel','Vehicle',640.20), E('bws','2026-05-20','Agar Chemicals','Materials',880),
    E('bws','2026-05-15','WorkCover','Insurance',720,false,'bank'), E('bws','2026-05-10','Officeworks','Office',144.60),
    E('bws','2026-05-05','Optus','Phone & Internet',96), E('bws','2026-04-30','Deputy Software','Software',88),
  ];

  /* ============================================================
     APPOINTMENTS  (around 2026-06)
     ============================================================ */
  const A = (biz, dayOffset, hour, min, mins, title, cust, kind) =>
    ({ id:'apt-'+Math.abs(hash(biz+dayOffset+title)).toString().slice(0,5), biz, start: addDays(TODAY, dayOffset).setHours(hour,min,0,0) && new Date(new Date(addDays(TODAY,dayOffset)).setHours(hour,min,0,0)).toISOString(), durMin: mins, title, cust, kind });
  const appointments = [
    A('rfp',0,8,30,90,'Hot water install — Harrow Res','c-r3','job'),
    A('rfp',0,13,0,60,'Site inspection — Apex Lot 14','c-r2','job'),
    A('mar',0,10,0,45,'Wholesale tasting — Folio','c-m2','meeting'),
    A('nbs',1,11,0,60,'Tidewell brand review','c-n1','meeting'),
    A('rfp',1,9,0,120,'Backflow testing — RSL','c-r4','job'),
    A('bws',1,6,0,90,'Quarterly windows — Plaza','c-b1','job'),
    A('mar',2,14,30,30,'Equipment service — Saltwater','c-m6','job'),
    A('nbs',2,15,0,45,'Lumen website handover','c-n4','meeting'),
    A('rfp',3,8,0,180,'Kitchen fitout stage 3 — WKF','c-r5','job'),
    A('bws',4,18,0,120,'Post-reno clean — Forge Gym','c-b5','job'),
    A('nbs',4,10,0,60,'Otto & Pearl kickoff','c-n2','meeting'),
    A('mar',-1,9,0,30,'Roastery stock count','','internal'),
    A('rfp',7,9,30,90,'Strata maintenance — Brookside','c-r1','job'),
  ];

  /* ============================================================
     TASKS  (reminders / to-dos)
     ============================================================ */
  const T = (biz, dueOffset, title, prio, done, tag) =>
    ({ id:'tsk-'+Math.abs(hash(biz+title)).toString().slice(0,5), biz, due: iso(addDays(TODAY, dueOffset)), title, prio, done, tag });
  const tasks = [
    T('mar',-2,'Chase INV-1041 — Aperture (overdue)','high',false,'Invoicing'),
    T('mar',1,'Reconcile Square payouts for May','med',false,'Bookkeeping'),
    T('mar',3,'Prepare May BAS figures','high',false,'Compliance'),
    T('mar',-1,'Email June subscription invoice to Hatch','med',true,'Invoicing'),
    T('rfp',0,'Send Stripe link to Harrow Residence','high',false,'Payments'),
    T('rfp',2,'Match Reece supplier statement','med',false,'Bookkeeping'),
    T('rfp',5,'Renew VBA registration','high',false,'Compliance'),
    T('rfp',-3,'Payroll — apprentice super','high',true,'Payroll'),
    T('nbs',1,'Follow up Meridian overdue retainer','high',false,'Invoicing'),
    T('nbs',4,'Invoice Lumen milestone 3','med',false,'Invoicing'),
    T('nbs',-1,'Categorise Adobe + Figma expenses','low',true,'Bookkeeping'),
    T('bws',-1,'Brightwater — chase Kingsway overdue','high',false,'Invoicing'),
    T('bws',2,'Connect Stripe account','med',false,'Setup'),
    T('bws',6,'Quarterly contract review — Bayview','low',false,'Admin'),
  ];

  /* ============================================================
     TIME LOGS
     ============================================================ */
  const TL = (biz, dayOffset, who, cust, hrs, rate, note, billable=true) =>
    ({ id:'tl-'+Math.abs(hash(biz+dayOffset+who+note)).toString().slice(0,5), biz, date: iso(addDays(TODAY, dayOffset)), who, cust, hrs, rate, note, billable, billed:false });
  const timeLogs = [
    TL('nbs',-1,'Priya Raman','c-n1',3.5,165,'Brand guideline revisions'),
    TL('nbs',-1,'Alex Kerr','c-n4',5,140,'Website build — components'),
    TL('nbs',-2,'Priya Raman','c-n3',2,165,'Meridian campaign concepts'),
    TL('nbs',-2,'Alex Kerr','c-n2',4,140,'Packaging dielines'),
    TL('nbs',-3,'Priya Raman','',1.5,165,'Studio admin — invoicing',false),
    TL('rfp',-1,'Mark Petrakis','c-r3',4.5,120,'Hot water unit replacement'),
    TL('rfp',-1,'Dylan Cho','c-r2',8,95,'Rough-in — Lot 14'),
    TL('rfp',-2,'Dylan Cho','c-r5',7.5,95,'Kitchen fitout stage 2'),
    TL('mar',-1,'Dani Marlowe','',2,0,'Wholesale order packing',false),
    TL('bws',-1,'Sione Tuilagi','c-b5',3,75,'Post-reno clean'),
  ];

  /* ============================================================
     EMAILS / THREADS
     ============================================================ */
  const emails = [
    { id:'em1', biz:'rfp', thread:'th1', from:'Margaret Hale', cust:'c-r3', subject:'Re: Hot water unit quote', preview:'Thanks Mark — happy to go ahead. When can you fit us in?', ago:'2h', unread:true, dir:'in', tag:'Quote' },
    { id:'em2', biz:'nbs', thread:'th2', from:'Andrew Choi', cust:'c-n3', subject:'May retainer invoice', preview:'Sorry for the delay — finance will process this week.', ago:'5h', unread:true, dir:'in', tag:'Overdue' },
    { id:'em3', biz:'mar', thread:'th3', from:'Daniel Pho', cust:'c-m3', subject:'June coffee subscription', preview:'Can we bump the weekly order to 8kg from July?', ago:'1d', unread:true, dir:'in', tag:'Order' },
    { id:'em4', biz:'mar', thread:'th4', from:'You', cust:'c-m1', subject:'Invoice INV-1041 — payment reminder', preview:'Hi Joel, a friendly reminder that INV-1041 is now overdue…', ago:'1d', unread:false, dir:'out', tag:'Reminder' },
    { id:'em5', biz:'bws', thread:'th5', from:'Helen Tran', cust:'c-b3', subject:'Re: May invoice', preview:'We\u2019ve had a change of building manager — resending PO.', ago:'2d', unread:false, dir:'in', tag:'Admin' },
    { id:'em6', biz:'rfp', thread:'th6', from:'Tony Russo', cust:'c-r2', subject:'Lot 14 — fix-off schedule', preview:'Frames up next week, can you start fix-off on the 16th?', ago:'2d', unread:false, dir:'in', tag:'Job' },
    { id:'em7', biz:'nbs', thread:'th7', from:'Sasha Petrov', cust:'c-n4', subject:'Website milestone 2 — approved', preview:'Looks fantastic. Approved to invoice. Onwards!', ago:'3d', unread:false, dir:'in', tag:'Approval' },
    { id:'em8', biz:'mar', thread:'th8', from:'Renee Atkins', cust:'c-m2', subject:'Payment sent', preview:'Just paid INV-1039 via the Stripe link. Thanks!', ago:'4d', unread:false, dir:'in', tag:'Payment' },
  ];

  /* ============================================================
     DOCUMENTS
     ============================================================ */
  const documents = [
    { id:'d1', biz:'mar', name:'May BAS worksheet.xlsx', kind:'Spreadsheet', size:'82 KB', date:'2026-06-01', by:'You' },
    { id:'d2', biz:'mar', name:'Lease — 14 Gertrude St.pdf', kind:'PDF', size:'1.2 MB', date:'2026-01-12', by:'Dani Marlowe' },
    { id:'d3', biz:'rfp', name:'VBA registration 2026.pdf', kind:'PDF', size:'340 KB', date:'2026-05-08', by:'You' },
    { id:'d4', biz:'rfp', name:'Apex Lot14 — contract.pdf', kind:'PDF', size:'880 KB', date:'2026-04-02', by:'Mark Petrakis' },
    { id:'d5', biz:'nbs', name:'Tidewell retainer agreement.pdf', kind:'PDF', size:'210 KB', date:'2026-04-01', by:'Priya Raman' },
    { id:'d6', biz:'bws', name:'Brightwater insurance COC.pdf', kind:'PDF', size:'156 KB', date:'2026-05-15', by:'You' },
  ];

  /* ============================================================
     12-MONTH SERIES per business (income / expense / cashflow)
     ============================================================ */
  function monthly(biz, baseInc, baseExp, seed) {
    const r = rng(seed);
    const out = [];
    // months: Jul 2025 .. Jun 2026 (FY)
    const labels = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
    let trend = 0.86;
    for (let i = 0; i < 12; i++) {
      const seasonal = 1 + 0.12 * Math.sin((i / 12) * Math.PI * 2 + 1);
      trend += 0.012;
      const inc = Math.round((baseInc * seasonal * (0.9 + r() * 0.2) * trend) / 100) * 100;
      const exp = Math.round((baseExp * (0.92 + r() * 0.16) * trend) / 100) * 100;
      out.push({ m: labels[i], income: inc, expense: exp, net: inc - exp, future: i === 11 });
    }
    return out;
  }
  const series = {
    mar: monthly('mar', 34000, 23800, 11),
    rfp: monthly('rfp', 57000, 35000, 23),
    nbs: monthly('nbs', 26500, 13500, 37),
    bws: monthly('bws', 21000, 14800, 51),
  };
  // aggregate series for "all businesses"
  series.all = series.mar.map((row, i) => ({
    m: row.m,
    income: row.income + series.rfp[i].income + series.nbs[i].income + series.bws[i].income,
    expense: row.expense + series.rfp[i].expense + series.nbs[i].expense + series.bws[i].expense,
    net: 0, future: row.future,
  }));
  series.all.forEach(r => r.net = r.income - r.expense);

  /* expense category breakdown per biz (for donut) */
  function catBreakdown(biz) {
    const map = {};
    expenses.filter(e => e.biz === biz).forEach(e => { map[e.cat] = (map[e.cat] || 0) + e.amount; });
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount);
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  window.DB = {
    TODAY, businesses, customers, invoices, payments, expenses,
    appointments, tasks, timeLogs, emails, documents, series,
    catBreakdown,
    fmt: { fmtAUD, fmtK, fmtNum, fmtDate, fmtDateShort, fmtTime, relDays, daysFromToday, iso, addDays, MONTHS, DOW },
    // helpers
    biz: (id) => businesses.find(b => b.id === id),
    cust: (id) => customers.find(c => c.id === id),
    byBiz: (arr, bizId) => bizId === 'all' ? arr : arr.filter(x => x.biz === bizId),
  };
})();
