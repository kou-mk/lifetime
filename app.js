// ===== helpers =====
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ===== keys =====
const STATE_KEY='lifetime_state', LOG_KEY='lifetime_log';
const PREF_KEY='lifetime_prefs', LIFE_KEY='lifetime_life';

// ===== defaults =====
const defaultPrefs={ showDate:true, showWeekday:true, showTime:false, lifeEnabled:false };
const defaultLife={ birthdate:'', expectancy:80 };

let prefs=load(PREF_KEY, defaultPrefs);
let life=load(LIFE_KEY, defaultLife);

// ===== state =====
const app=document.body;
let state=localStorage.getItem(STATE_KEY)||'off';
app.classList.add(state);

// ===== render date/time =====
let timeTimer=null;
function renderDateTime(){
  const header=document.getElementById('dateHeader');
  if(!prefs.showDate && !prefs.showTime){
    header.style.display='none'; return;
  }
  header.style.display='block';

  const now=new Date();
  document.getElementById('year').textContent=prefs.showDate? now.getFullYear() : '';
  const wd=['日','月','火','水','木','金','土'][now.getDay()];
  document.getElementById('date').textContent=prefs.showDate
    ? (prefs.showWeekday? `${now.getMonth()+1}月${now.getDate()}日（${wd}）` : `${now.getMonth()+1}月${now.getDate()}日`)
    : '';
  document.getElementById('time').textContent=prefs.showTime
    ? `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    : '';
}
function startClock(){
  if(timeTimer) clearInterval(timeTimer);
  if(prefs.showTime){
    renderDateTime();
    timeTimer=setInterval(renderDateTime,60000);
  } else {
    renderDateTime();
  }
}
startClock();

// ===== long press =====
const ring=document.querySelector('.ring-progress'), btn=document.getElementById('powerBtn');
const CIRC=339.3, DURATION=1000;
let raf=null,startTime=null;
const resetRing=()=>ring.style.strokeDashoffset=CIRC;
resetRing();

btn.addEventListener('pointerdown',()=>{
  startTime=performance.now();
  ring.style.stroke= state==='off'?'var(--color-action)':'var(--color-action-sub)';
  raf=requestAnimationFrame(updateRing);
});
btn.addEventListener('pointerup',cancel); btn.addEventListener('pointerleave',cancel);
function cancel(){ if(!raf)return; cancelAnimationFrame(raf); resetRing(); raf=null; }
function updateRing(ts){
  const p=Math.min((ts-startTime)/DURATION,1);
  ring.style.strokeDashoffset= state==='off'? CIRC*(1-p):CIRC*p;
  if(p>=1){ toggleState(); resetRing(); raf=null; return; }
  raf=requestAnimationFrame(updateRing);
}
function toggleState(){
  state= state==='on'?'off':'on';
  app.classList.remove('on','off'); app.classList.add(state);
  localStorage.setItem(STATE_KEY,state);
  const log=load(LOG_KEY,[]); log.push({state,date:new Date().toISOString().split('T')[0]}); save(LOG_KEY,log);
}

// ===== life render =====
function renderLife(){
  const root=document.getElementById('lifeContainer');
  root.innerHTML='';
  if(!prefs.lifeEnabled||!life.birthdate) return;
  const birth=new Date(life.birthdate+'T00:00:00');
  const end=new Date(birth); end.setFullYear(end.getFullYear()+life.expectancy);
  const total=end-birth, elapsed=Math.min(Math.max(Date.now()-birth,0),total);
  if(total<=0) return;
  const remainingPct=Math.max(0,Math.min(100,Math.round(((total-elapsed)/total)*100)));
  root.innerHTML=`
  <div class="life-gauge-wrap">
    <svg viewBox="0 0 100 100" class="life-svg">
      <circle cx="50" cy="50" r="45" stroke="var(--color-divider)" stroke-width="8" fill="none"/>
      <circle cx="50" cy="50" r="45" stroke="var(--color-primary)" stroke-width="8" fill="none"
        stroke-dasharray="282.6" stroke-dashoffset="${282.6*(1-remainingPct/100)}"/>
    </svg>
    <div class="life-percent">${remainingPct}%</div>
  </div>`;
}

// ===== settings bind =====
const $=id=>document.getElementById(id);
$('toggleDate').checked=prefs.showDate;
$('toggleWeekday').checked=prefs.showWeekday;
$('toggleTime').checked=prefs.showTime;
$('toggleLife').checked=prefs.lifeEnabled;
$('birthdate').value=life.birthdate;
$('expectancy').value=life.expectancy;
$('lifeFields').style.display=prefs.lifeEnabled?'grid':'none';

$('toggleDate').onchange=()=>{ prefs.showDate=$('toggleDate').checked; save(PREF_KEY,prefs); startClock(); };
$('toggleWeekday').onchange=()=>{ prefs.showWeekday=$('toggleWeekday').checked; save(PREF_KEY,prefs); renderDateTime(); };
$('toggleTime').onchange=()=>{ prefs.showTime=$('toggleTime').checked; save(PREF_KEY,prefs); startClock(); };
$('toggleLife').onchange=()=>{ prefs.lifeEnabled=$('toggleLife').checked; save(PREF_KEY,prefs); $('lifeFields').style.display=prefs.lifeEnabled?'grid':'none'; renderLife(); };
$('birthdate').onchange=()=>{ life.birthdate=$('birthdate').value; save(LIFE_KEY,life); renderLife(); };
$('expectancy').oninput=()=>{ life.expectancy=Number($('expectancy').value)||80; save(LIFE_KEY,life); renderLife(); };

// ===== tabs =====
document.querySelectorAll('.tab').forEach(tab=>{
  tab.onclick=()=>{
    const target='tab-'+tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p=>{
      p.classList.toggle('active', p.id===target);
    });
    if(tab.dataset.tab==='life') renderLife();
  };
});


// ===== Font size control =====
const sizeSelect = document.getElementById('fontSize');
if (sizeSelect) {
  sizeSelect.value = prefs.fontSize || 'm';
  const header = document.getElementById('dateHeader');
  header.classList.remove('size-s','size-m','size-l');
  header.classList.add('size-' + sizeSelect.value);

  sizeSelect.onchange = () => {
    prefs.fontSize = sizeSelect.value;
    save(PREF_KEY, prefs);
    header.classList.remove('size-s','size-m','size-l');
    header.classList.add('size-' + sizeSelect.value);
  };
}
