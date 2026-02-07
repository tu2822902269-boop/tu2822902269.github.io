(function(){
  const $ = (id)=>document.getElementById(id);

  const greetingEl = $("greeting");
  const dateEl = $("date");
  const timeEl = $("time");
  const daysEl = $("daysCount");
  const messageEl = $("message");
  const btn = $("greetBtn");
  let inlineLabel = $("btnLabelInline");
  const toast = $("toast");
  const KEY_CHECKED = "cat_checkedin_date";
const KEY_DAILY_MSG = "cat_daily_msg";

  function getPeriod(h){
    if (h >= 5 && h <= 11) return {label:"早上好", emoji:"🌤️"};
    if (h >= 12 && h <= 17) return {label:"下午好", emoji:"🌞"};
    return {label:"晚上好", emoji:"🌙"};
  }
  function formatDate(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const dd=String(d.getDate()).padStart(2,"0");
    const w=["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][d.getDay()];
    return `${y}年${m}月${dd}日  ${w}`;
  }
  function formatTime(d){
    const hh=String(d.getHours()).padStart(2,"0");
    const mm=String(d.getMinutes()).padStart(2,"0");
    const ss=String(d.getSeconds()).padStart(2,"0");
    return `${hh}:${mm}:${ss}`;
  }

  const START_KEY="cat_start_date_v1";
  function getStartDate(){
    const raw = localStorage.getItem(START_KEY);
    if (raw){
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) return dt;
    }
    const now=new Date();
    const start=new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
    localStorage.setItem(START_KEY, start.toISOString());
    return start;
  }
  function calcDays(){
    const s=getStartDate();
    const now=new Date();
    const s0=new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0,0,0,0);
    const n0=new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0);
    const diff=n0.getTime()-s0.getTime();
    return Math.max(1, Math.floor(diff/86400000)+1);
  }

  function todayKey(){
    const d=new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  }
  function pick(list){ return list[Math.floor(Math.random()*list.length)]; }
  function tpl(s, greet){ return (s||"").split("{greet}").join(greet); }

  function getPreMessage(greet){
    const key="cat_pre_msg_"+todayKey();
    let msg=localStorage.getItem(key);
    if(!msg){
      msg=pick(window.MESSAGES||[]);
      localStorage.setItem(key,msg);
    }
    return tpl(msg,greet);
  }
  function getAfterMessage(greet){
    const key="cat_after_msg_"+todayKey();
    let msg=localStorage.getItem(key);
    if(!msg){
      msg=pick(window.AFTER_MESSAGES||["今天也好喜欢猫猫💕"]);
      localStorage.setItem(key,msg);
    }
    return tpl(msg,greet);
  }
  function hasCheckedIn(){ return localStorage.getItem("cat_checked_"+todayKey())==="1"; }
  function setCheckedIn(){ localStorage.setItem("cat_checked_"+todayKey(),"1"); }

  function beep(){
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      const ctx=new AudioCtx();
      const o=ctx.createOscillator();
      const g=ctx.createGain();
      o.type="sine"; o.frequency.value=880;
      g.gain.value=0.001;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime+0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.18);
      o.stop(ctx.currentTime+0.2);
      setTimeout(()=>ctx.close(),260);
    }catch(e){}
  }
  function showToast(text, ms=1400){
  toast.textContent=text;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>toast.classList.remove("show"), ms);
}

  function tick(){
    const now=new Date();
    const p=getPeriod(now.getHours());
    greetingEl.textContent=`${p.label} ${p.emoji}`;
    dateEl.textContent=formatDate(now);
    timeEl.textContent=`现在是 ${formatTime(now)}`;
    btn.textContent=p.label;
    inlineLabel.textContent=p.label;

    if (hasCheckedIn()) {
  // ✅ 已贴贴：显示“今天随机到的那条留言”
      if (hasCheckedIn()) {
      // ✅ 已贴贴：优先读今天存下来的随机留言对象
      let one = null;
      try {
        const raw = localStorage.getItem(KEY_DAILY_MSG);
        if (raw && raw.trim().startsWith("{")) one = JSON.parse(raw);
      } catch (e) {}

      if (one && one.face && one.text) {
        messageEl.textContent = `${one.face} ${one.text}`;
      } else {
        // 兜底：别让页面空着
        messageEl.textContent = "（今天已经贴贴过啦💕）";
      }

      btn.disabled = true;
      btn.style.opacity = "0.65";
      btn.style.cursor = "default";
    } else {
      // ✅ 未贴贴：显示引导语
      messageEl.textContent = `还没贴贴…来和小宝说${p.label}吧！`;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.cursor = "pointer";
    }

  btn.disabled = true;
  btn.style.opacity = "0.65";
  btn.style.cursor = "default";
} else {
  // ✅ 未贴贴：显示引导语（还没贴贴…）
  messageEl.textContent = getPreMessage(p.label);
  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.cursor = "pointer";
}
    daysEl.textContent=String(calcDays());
  }

  btn.addEventListener("click", ()=>{
  const now = new Date();
  const p = getPeriod(now.getHours());
  if (hasCheckedIn()) return;

  setCheckedIn();

  // 1) 三秒小气泡：从 AFTER_MESSAGES 随机一句（没有就用默认）
  const bubble = (window.AFTER_MESSAGES && window.AFTER_MESSAGES.length)
    ? pick(window.AFTER_MESSAGES)
    : "今天也好喜欢猫猫💕";
  showToast(bubble);

  // 2) 主体显示：随机颜文字 + 留言（用 messages.js 里的 messages）
  const pool = (window.messages && window.messages.length) ? window.messages : [];
  if (pool.length) {
    const one = pool[Math.floor(Math.random() * pool.length)];
    messageEl.textContent = `${one.face} ${one.text}`;
    localStorage.setItem(KEY_DAILY_MSG, JSON.stringify(one));
  } else {
    messageEl.textContent = "（猫猫的留言池还没加载到…）";
  }

  // 3) 按钮变灰不可点
  btn.disabled = true;
  btn.style.opacity = "0.65";
  btn.style.cursor = "default";
});  // ✅ 关键：click 在这里结束
    
  document.querySelectorAll(".nav-item").forEach(a=>{
    a.addEventListener("click",(e)=>{
      e.preventDefault();
      beep();
      showToast("还在施工中～先抱抱猫猫💕");
    });
  });

  tick();
  setInterval(tick, 1000);
})();
