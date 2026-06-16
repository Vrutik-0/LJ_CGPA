/* ══ CONSTANTS ══ */
const DEFAULT_CREDITS = [24,27,24,24,24,24,24,24];
let nSems = 3, chartInst = null;

/* classification + band data */
const BANDS = [
  { label:'First Class with Distinction', lo:7.00, hi:10,   css:'--c-dist',   hex:'#5448C8' },
  { label:'First Class',                  lo:6.00, hi:6.99, css:'--c-first',  hex:'#1971C2' },
  { label:'Higher Second Class',          lo:5.50, hi:5.99, css:'--c-higher', hex:'#0C8599' },
  { label:'Second Class',                 lo:5.00, hi:5.49, css:'--c-second', hex:'#2B8A3E' },
  { label:'Pass Class',                   lo:3.50, hi:4.99, css:'--c-pass',   hex:'#E67700' },
  { label:'Fail',                         lo:0,    hi:3.49, css:'--c-fail',   hex:'#C92A2A' },
];
const GRADES = [
  {g:'O++++',r:'95–100',p:10},{g:'O++',r:'90–94',p:9.5},{g:'O+',r:'85–89',p:9},
  {g:'O',r:'80–84',p:8.5},{g:'A++',r:'75–79',p:8},{g:'A+',r:'70–74',p:7.5},
  {g:'A',r:'65–69',p:7},{g:'B++',r:'60–64',p:6.5},{g:'B+',r:'55–59',p:6},
  {g:'B',r:'50–54',p:5.5},{g:'C',r:'45–49',p:5},{g:'D',r:'40–44',p:4.5},
  {g:'E',r:'35–39',p:4},{g:'F',r:'0–34',p:0},
];

/* helper: resolve a CSS var */
const cssVar = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const isDark  = () => window.matchMedia('(prefers-color-scheme:dark)').matches;

/* ══ CLASSIFY ══ */
function classify(cgpa) {
  if (cgpa < 3.50) return { label:'Fail',                         col:'#C92A2A' };
  if (cgpa < 5.00) return { label:'Pass Class',                   col:'#E67700' };
  if (cgpa < 5.50) return { label:'Second Class',                 col:'#2B8A3E' };
  if (cgpa < 6.00) return { label:'Higher Second Class',          col:'#0C8599' };
  if (cgpa < 7.00) return { label:'First Class',                  col:'#1971C2' };
  return                   { label:'First Class with Distinction', col:null      };
}

/* ══ INIT FORMULA PANEL ══ */
function initPanel() {
  /* --- bands --- */
  const bandList = document.getElementById('bandList');
  bandList.innerHTML = BANDS.map((b,i) => {
    const r = b.lo===0 ? '< 3.50' : b.hi>=10 ? '≥ 7.00' : `${b.lo.toFixed(2)}–${b.hi.toFixed(2)}`;
    return `<div class="band-item" id="band${i}">
      <div class="band-left">
        <div class="band-dot" style="background:${b.hex}" id="bdot${i}"></div>
        <span class="band-name" id="bname${i}">${b.label}</span>
      </div>
      <span class="band-range">${r}</span>
    </div>`;
  }).join('');

  /* stagger bands in */
  anime({ targets:'.band-item', opacity:[0,1], translateX:[-10,0],
    delay:anime.stagger(50,{start:400}), duration:340, easing:'easeOutQuart' });

  /* --- grade rows --- */
  document.getElementById('gradeRows').innerHTML =
    `<div class="gr-head"><span>Grade</span><span>Marks %</span><span style="text-align:right">Pts</span></div>` +
    GRADES.map(g=>`<div class="gr-row">
      <span class="gr-grade">${g.g}</span>
      <span class="gr-range">${g.r}</span>
      <span class="gr-pts">${g.p}</span>
    </div>`).join('');

  /* --- toggle collapsible --- */
  document.getElementById('gtoggle').addEventListener('click', () => {
    const body = document.getElementById('gbody');
    const arr  = document.getElementById('gtArr');
    const open = body.style.display === 'block';
    arr.classList.toggle('open', !open);
    if (open) {
      anime({ targets:body, opacity:0, duration:160, easing:'easeInQuad',
        complete:()=>{ body.style.display='none'; } });
    } else {
      body.style.display = 'block';
      anime({ targets:body, opacity:[0,1], translateY:[-6,0], duration:260, easing:'easeOutQuad' });
      anime({ targets:'#gbody .gr-row', opacity:[0,1], translateX:[-6,0],
        delay:anime.stagger(24,{start:40}), duration:260, easing:'easeOutQuart' });
    }
  });

  /* --- formula block entrances (stagger) --- */
  anime({ targets:'#fb1,#fb2,#fb3,#fb4', opacity:[0,1], translateY:[8,0],
    delay:anime.stagger(80,{start:300}), duration:380, easing:'easeOutQuart' });
}

/* ══ HIGHLIGHT MATCHING BAND ══ */
function highlightBand(cgpa) {
  BANDS.forEach((b,i) => {
    const el   = document.getElementById('band'+i);
    const name = document.getElementById('bname'+i);
    const dot  = document.getElementById('bdot'+i);
    const match = cgpa >= b.lo && (b.hi >= 10 ? true : cgpa < b.hi + 0.005);

    el.classList.remove('band-on');
    el.style.background  = 'transparent';
    el.style.borderColor = 'transparent';
    name.style.color     = '';
    dot.style.background = b.hex;
    dot.style.boxShadow  = 'none';

    if (match) {
      el.classList.add('band-on');
      el.style.background  = b.hex + '1C';
      el.style.borderColor = b.hex + '60';
      name.style.color     = b.hex;
      dot.style.background = b.hex;
      dot.style.boxShadow  = `0 0 0 3px ${b.hex}33`;
      anime({ targets:el,  scale:[1,1.03,1], duration:580, easing:'easeOutElastic(1,.5)' });
      anime({ targets:dot, scale:[1,2,1],    duration:640, easing:'easeOutElastic(1,.4)' });
    }
  });
}

/* ══ CHART ══ */
function renderChart(rows, cgpa) {
  const ctx    = document.getElementById('spiChart').getContext('2d');
  const dark   = isDark();
  const accent = cssVar('--accent');
  const grid   = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
  const tick   = dark ? '#3A3A44' : '#C8C8D0';

  /* legend dots */
  document.getElementById('lgBar').style.background  = accent + '55';
  document.getElementById('lgLine').style.borderColor = accent;
  document.getElementById('lgDash').style.borderColor = dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.25)';

  if (chartInst) { chartInst.destroy(); chartInst = null; }

  chartInst = new Chart(ctx, {
    data: {
      labels: rows.map(r => `Sem ${r.i}`),
      datasets: [
        { /* bars */
          type:'bar', label:'SPI',
          data: rows.map(r => r.spi),
          backgroundColor: accent + '2E',
          borderColor:     accent + '90',
          borderWidth: 1.5,
          borderRadius: 7,
          borderSkipped: false,
          order: 2,
        },
        { /* smooth line */
          type:'line', label:'Trend',
          data: rows.map(r => r.spi),
          borderColor: accent,
          borderWidth: 2.5,
          pointBackgroundColor: accent,
          pointBorderColor: dark ? '#18181B' : '#fff',
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: rows.length > 2 ? 0.4 : 0,
          fill: false,
          order: 1,
        },
        { /* cgpa avg dashed */
          type:'line', label:'CGPA avg',
          data: rows.map(() => +cgpa.toFixed(2)),
          borderColor: dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.22)',
          borderWidth: 1.5,
          borderDash: [6,4],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          order: 3,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration:900, easing:'easeOutQuart' },
      scales: {
        y: {
          min:0, max:10,
          grid:   { color:grid },
          border: { display:false },
          ticks:  { color:tick, stepSize:2,
                    font:{ family:"'Space Grotesk',sans-serif", size:11 },
                    callback: v => v===0 ? '0' : v }
        },
        x: {
          grid:   { display:false },
          border: { display:false },
          ticks:  { color:tick, font:{ family:"'Space Grotesk',sans-serif", size:11 } }
        }
      },
      plugins: {
        legend: { display:false },
        tooltip: {
          /* hide duplicate SPI from trend line */
          filter: item => !(item.dataset.label==='Trend'),
          backgroundColor: dark ? '#1A1A1E' : '#fff',
          borderColor:     dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.08)',
          borderWidth: 1,
          titleColor:  dark ? '#EBEBEB' : '#0D0D0D',
          bodyColor:   dark ? '#888' : '#666',
          padding: { x:12, y:9 },
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: items => items[0].label,
            label: item => item.dataset.label==='CGPA avg'
              ? `CGPA avg: ${cgpa.toFixed(2)}`
              : `SPI: ${Number(item.raw).toFixed(2)}`
          }
        }
      }
    }
  });
}

/* ══ BUILD CARDS ══ */
function buildCards(n, fromSemChange) {
  const grid = document.getElementById('grid');
  const doCreate = () => {
    grid.innerHTML = '';
    for (let i=1;i<=n;i++) {
      const d = document.createElement('div');
      d.className = 'sem-card';
      d.innerHTML =
        `<div class="card-label">Semester ${i}</div>
         <div class="igroup">
           <div class="igroup-label">SPI</div>
           <input type="number" id="spi${i}" min="0" max="10" step="0.01"
                  placeholder="e.g. 8.79" autocomplete="off" inputmode="decimal">
         </div>
         <div class="igroup">
           <div class="igroup-label">Credits earned</div>
           <input type="number" id="cr${i}" min="1" max="60" step="1"
                  value="${DEFAULT_CREDITS[i-1]}" placeholder="${DEFAULT_CREDITS[i-1]}"
                  autocomplete="off" inputmode="numeric">
         </div>`;
      grid.appendChild(d);
    }
    anime({ targets:'.sem-card', opacity:[0,1], translateY:[14,0],
      duration:420, delay:anime.stagger(52), easing:'easeOutQuart' });
  };
  const existing = grid.querySelectorAll('.sem-card');
  if (fromSemChange && existing.length) {
    anime({ targets:existing, opacity:0, translateY:-10, duration:180, easing:'easeInQuad', complete:doCreate });
  } else { doCreate(); }
}

/* ══ CALCULATE ══ */
function calculate() {
  const errEl = document.getElementById('err');
  let totalGP=0, totalCr=0, hasErr=false;
  const rows=[];

  for (let i=1;i<=nSems;i++) {
    const spiEl=document.getElementById('spi'+i), crEl=document.getElementById('cr'+i);
    const spi=parseFloat(spiEl.value), cr=parseFloat(crEl.value);
    const spiOk=!isNaN(spi)&&spi>=0&&spi<=10, crOk=!isNaN(cr)&&cr>0;
    spiEl.classList.toggle('invalid',!spiOk);
    crEl .classList.toggle('invalid',!crOk);
    if (!spiOk||!crOk) { hasErr=true; continue; }
    rows.push({i, spi, cr, gp:spi*cr});
  }

  if (hasErr) {
    errEl.style.display='block';
    errEl.textContent='Please enter a valid SPI (0 – 10) and credits (> 0) for every semester.';
    anime({ targets:'#err', translateX:[0,-8,8,-5,5,0], duration:440, easing:'linear' });
    return;
  }
  errEl.style.display='none';
  rows.forEach(r=>{ totalGP+=r.gp; totalCr+=r.cr; });

  const cgpa=totalGP/totalCr, pct=(cgpa-0.5)*10, cls=classify(cgpa);

  /* meta */
  document.getElementById('pctDisp').textContent  = pct.toFixed(2)+'%';
  document.getElementById('resNote').textContent   = totalGP.toFixed(2)+' grade pts ÷ '+totalCr+' credits';
  const pill=document.getElementById('classPill');
  pill.textContent=cls.label;
  pill.style.background=cls.col ? cls.col+'1A' : 'var(--accent-dim)';
  pill.style.color=cls.col ?? 'var(--accent)';

  /* breakdown */
  const bdown=document.getElementById('bdown');
  bdown.innerHTML=
    `<div class="brow brow-head">
       <span>Sem</span><span>SPI</span>
       <span style="text-align:right">Credits</span>
       <span style="text-align:right">Grade pts</span>
     </div>`+
    rows.map(r=>`
      <div class="brow brow-row">
        <span>${r.i}</span>
        <div class="bar-cell">
          <div class="bar-track"><div class="bar-fill" data-w="${(r.spi/10*100).toFixed(2)}"></div></div>
          <span class="bar-val">${r.spi.toFixed(2)}</span>
        </div>
        <span class="num">${r.cr}</span>
        <span class="num">${r.gp.toFixed(2)}</span>
      </div>`).join('')+
    `<div class="brow brow-row brow-total">
       <span>CGPA</span>
       <div class="bar-cell">
         <div class="bar-track"><div class="bar-fill" data-w="${(cgpa/10*100).toFixed(2)}"></div></div>
         <span class="bar-val">${cgpa.toFixed(2)}</span>
       </div>
       <span class="num">${totalCr}</span>
       <span class="num">${totalGP.toFixed(2)}</span>
     </div>`;

  /* show result */
  const res=document.getElementById('result');
  res.style.display='block';
  anime({ targets:'#result', opacity:[0,1], translateY:[30,0], duration:540, easing:'easeOutQuart' });

  /* ring */
  const circ=2*Math.PI*45, offset=circ-(Math.min(cgpa,10)/10)*circ;
  const ring=document.getElementById('ring');
  ring.style.strokeDasharray=circ; ring.style.strokeDashoffset=circ;
  setTimeout(()=>{
    anime({ targets:ring, strokeDashoffset:offset, duration:1100, easing:'easeOutExpo' });
  },80);

  /* counter */
  const dispEl=document.getElementById('cgpaDisp');
  anime({ targets:{v:0}, v:cgpa, duration:1050, easing:'easeOutExpo',
    update(a){ dispEl.textContent=parseFloat(a.animations[0].currentValue).toFixed(2); } });

  /* bar fills */
  setTimeout(()=>{
    anime({ targets:bdown.querySelectorAll('.bar-fill'),
      width:el=>el.dataset.w+'%', duration:720, delay:anime.stagger(50), easing:'easeOutQuart' });
  },260);

  /* chart */
  const cs=document.getElementById('chartSection');
  cs.style.display='none';
  setTimeout(()=>{
    cs.style.display='block'; cs.style.opacity='0';
    renderChart(rows, cgpa);
    anime({ targets:cs, opacity:[0,1], translateY:[14,0], duration:500, easing:'easeOutQuart' });
  },430);

  /* band highlight (right panel) */
  setTimeout(()=>highlightBand(cgpa), 350);

  /* mobile scroll */
  if (window.innerWidth<600) setTimeout(()=>res.scrollIntoView({behavior:'smooth',block:'start'}),320);
}

/* ══ NEW TARGET CGPA CALCULATOR ══ */
document.getElementById('planBtn').addEventListener('click', () => {
  anime({ targets:'#planBtn', scale:[.96,1], duration:320, easing:'easeOutBack' });
  
  let totalGP = 0, totalCr = 0, hasErr = false;
  
  /* Validate and compute current state first */
  for (let i = 1; i <= nSems; i++) {
    const spi = parseFloat(document.getElementById('spi'+i).value);
    const cr = parseFloat(document.getElementById('cr'+i).value);
    if(isNaN(spi) || isNaN(cr) || spi < 0 || spi > 10 || cr <= 0) {
      hasErr = true;
    } else {
      totalGP += (spi * cr);
      totalCr += cr;
    }
  }

  const resDiv = document.getElementById('planResult');
  resDiv.style.display = 'block';

  if (hasErr || totalCr === 0) {
    resDiv.innerHTML = '<span class="plan-error">Please fill out your current semesters\' SPI and credits above first!</span>';
    anime({ targets:resDiv, translateX:[0,-6,6,-4,4,0], duration:400, easing:'linear' });
    return;
  }

  const targetCgpa = parseFloat(document.getElementById('targetCgpa').value);
  const nextCr = parseFloat(document.getElementById('nextSemCr').value);

  if(isNaN(targetCgpa) || targetCgpa < 0 || targetCgpa > 10 || isNaN(nextCr) || nextCr <= 0) {
    resDiv.innerHTML = '<span class="plan-error">Please enter a valid target CGPA and next semester credits.</span>';
    anime({ targets:resDiv, translateX:[0,-6,6,-4,4,0], duration:400, easing:'linear' });
    return;
  }

  /* Core logic */
  const targetTotalCr = totalCr + nextCr;
  const targetTotalGP = targetCgpa * targetTotalCr;
  const requiredGP = targetTotalGP - totalGP;
  const requiredSPI = requiredGP / nextCr;

  if (requiredSPI > 10) {
    resDiv.innerHTML = `<span class="plan-error">To achieve a CGPA of ${targetCgpa}, you need an SPI of ${requiredSPI.toFixed(2)}, which is impossible (max 10).</span>`;
  } else if (requiredSPI <= 0) {
    resDiv.innerHTML = `<span class="plan-res-text">You've already secured enough grade points! Even with an SPI of <strong>0.00</strong>, your CGPA will remain above ${targetCgpa}.</span>`;
  } else {
    resDiv.innerHTML = `<span class="plan-res-text">You need an SPI of <strong>${requiredSPI.toFixed(2)}</strong> in your next semester to hit a CGPA of ${targetCgpa}.</span>`;
  }
  
  anime({ targets:resDiv, opacity:[0,1], translateY:[10,0], duration:350, easing:'easeOutQuart' });
});

/* ══ RESET ══ */
function reset() {
  for (let i=1;i<=nSems;i++) {
    const se=document.getElementById('spi'+i), ce=document.getElementById('cr'+i);
    if(se){ se.value=''; se.classList.remove('invalid'); }
    if(ce){ ce.value=DEFAULT_CREDITS[i-1]; ce.classList.remove('invalid'); }
  }
  const res=document.getElementById('result');
  if (res.style.display!=='none') {
    anime({ targets:res, opacity:0, translateY:10, duration:200, easing:'easeInQuad',
      complete:()=>{
        res.style.display='none';
        document.getElementById('chartSection').style.display='none';
        if(chartInst){ chartInst.destroy(); chartInst=null; }
      }
    });
  }
  document.getElementById('err').style.display='none';
  document.getElementById('planResult').style.display = 'none';
  document.getElementById('targetCgpa').value = '';

  /* clear bands */
  BANDS.forEach((_,i)=>{
    const el=document.getElementById('band'+i);
    el.classList.remove('band-on');
    el.style.background=el.style.borderColor='transparent';
    document.getElementById('bname'+i).style.color='';
    document.getElementById('bdot'+i).style.boxShadow='none';
  });
}

/* ══ SEM PILLS ══ */
document.getElementById('semPills').addEventListener('click', e => {
  const pill=e.target.closest('.sem-pill'); if(!pill) return;
  document.querySelectorAll('.sem-pill').forEach(p=>p.classList.remove('active'));
  pill.classList.add('active');
  nSems=+pill.dataset.n;
  anime({ targets:pill, scale:[.80,1.12,1], duration:300, easing:'easeOutBack' });
  const res=document.getElementById('result');
  if(res.style.display!=='none') {
    anime({ targets:res, opacity:0, duration:180, easing:'easeInQuad',
      complete:()=>{ res.style.display='none';
        document.getElementById('chartSection').style.display='none';
        if(chartInst){ chartInst.destroy(); chartInst=null; }
      }
    });
  }
  document.getElementById('err').style.display='none';
  document.getElementById('planResult').style.display='none';
  buildCards(nSems,true);
});

/* ══ BUTTONS ══ */
document.getElementById('calcBtn').addEventListener('click', ()=>{
  anime({ targets:'#calcBtn', scale:[.96,1], duration:320, easing:'easeOutBack' });
  calculate();
});
document.getElementById('resetBtn').addEventListener('click', reset);

/* ══ ENTER KEY ══ */
document.addEventListener('keydown', e=>{
  if(e.key==='Enter'){
    const id=e.target?.id||'';
    if(id.startsWith('spi')||id.startsWith('cr')) calculate();
    if(id === 'targetCgpa' || id === 'nextSemCr') document.getElementById('planBtn').click();
  }
});

/* ══ SCALE TOGGLE ══ */
document.getElementById('scaleToggle').addEventListener('click', function(){
  const tbl=document.getElementById('scaleTable'), arr=document.getElementById('scaleArrow');
  const open=tbl.style.display==='table';
  arr.classList.toggle('open',!open);
  if(open) {
    anime({ targets:tbl, opacity:0, duration:180, complete:()=>tbl.style.display='none' });
  } else {
    tbl.style.display='table';
    anime({ targets:tbl, opacity:[0,1], translateY:[-4,0], duration:240, easing:'easeOutQuad' });
  }
});

/* ══ ENTRANCE ANIMATIONS ══ */
anime({ targets:'#hdr',         opacity:[0,1], translateY:[-14,0], duration:640, easing:'easeOutQuart' });
anime({ targets:'#semSel',      opacity:[0,1], translateY:[8,0],   duration:520, delay:130, easing:'easeOutQuart' });
anime({ targets:'#btnRow',      opacity:[0,1],                     duration:400, delay:500, easing:'easeOutQuart' });
anime({ targets:'#foot',        opacity:[0,1],                     duration:380, delay:680, easing:'easeOutQuart' });
anime({ targets:'#formulaCard', opacity:[0,1], translateX:[18,0],  duration:640, delay:200, easing:'easeOutQuart' });

buildCards(3);
initPanel();