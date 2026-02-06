function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTimeLabel() {
  const h = new Date().getHours();
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function getTimePrompt() {
  const label = getTimeLabel();
  if (label === "早上好") return "（还没贴贴…来和小宝说早上好吧 ✨）";
  if (label === "下午好") return "（还没贴贴…来和小宝说下午好吧 ☀️）";
  return "（还没贴贴…来和小宝说晚上好吧 🌙）";
}

// ===== 点击音效 =====
function playClick() {
  const sound = document.getElementById("clickSound");
  if (!sound) return;
  sound.currentTime = 0;
  sound.play().catch(()=>{});
}

// ===== 3秒小气泡 =====
function showBubble(text) {
  const bubble = document.getElementById("bubble");
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.add("show");
  clearTimeout(window.__bubbleTimer);
  window.__bubbleTimer = setTimeout(() => {
    bubble.classList.remove("show");
  }, 3000);
}

// ===== 时间模块（每秒刷新）=====
function updateClock(){
  const now = new Date();
  const greetingEl = document.getElementById("greeting");
  const dateEl = document.getElementById("date");
  const timeEl = document.getElementById("time");
  const btn = document.getElementById("btn");

  if (greetingEl) greetingEl.innerText = getTimeLabel() + " " + (now.getHours() < 12 ? "🌤" : now.getHours() < 18 ? "☀️" : "🌙");
  if (dateEl) dateEl.innerText = now.toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric', weekday:'long' });
  if (timeEl) timeEl.innerText = "现在是 " + now.toLocaleTimeString('zh-CN');
  if (btn) btn.innerText = getTimeLabel();
}

// ===== 天数渲染 =====
function renderDayCount() {
  const dayCount = localStorage.getItem("dayCount") || "0";
  const el = document.getElementById("dayCount");
  if (el) el.textContent = dayCount;
}

// ===== 显示/隐藏颜文字 =====
function setFaceVisible(visible) {
  const faceEl = document.getElementById("face");
  if (!faceEl) return;
  faceEl.style.display = visible ? "block" : "none";
}

// ===== 今日固定随机（用于“迁移”：之前点过但没存 lastMessage 的情况）=====
function seededMessage(dateStr) {
  if (!Array.isArray(messages) || messages.length === 0) return null;
  // 简单稳定 hash：把 dateStr 转成一个可重复的整数
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const idx = hash % messages.length;
  return messages[idx];
}

function setMessageToUI(msg) {
  const faceEl = document.getElementById("face");
  const quoteEl = document.getElementById("quote");

  if (typeof msg === "string") {
    if (faceEl) faceEl.textContent = "";
    if (quoteEl) quoteEl.textContent = msg;
    setFaceVisible(false);
    return { saved: msg };
  }

  if (msg && typeof msg === "object") {
    const face = msg.face || "";
    const text = msg.text || "";
    if (faceEl) faceEl.textContent = face;
    if (quoteEl) quoteEl.textContent = text;
    setFaceVisible(!!(face && face.trim()));
    return { saved: { face, text } };
  }

  // 兜底：如果 messages.js 没加载/为空
  if (faceEl) faceEl.textContent = "";
  if (quoteEl) quoteEl.textContent = "（猫猫把留言抱走了…但小宝还在这里贴贴 🐾）";
  setFaceVisible(false);
  return { saved: "（猫猫把留言抱走了…但小宝还在这里贴贴 🐾）" };
}

// ===== 抽一句（不重复一轮再洗牌）=====
function pickMessage() {
  let pool;
  try { pool = JSON.parse(localStorage.getItem("msgPool") || "null"); } catch(e) { pool = null; }
  if (!Array.isArray(pool) || pool.length === 0) {
    pool = (Array.isArray(messages) ? [...messages] : []).sort(() => Math.random() - 0.5);
  }
  const msg = pool.pop();
  localStorage.setItem("msgPool", JSON.stringify(pool));
  return msg;
}

// ===== 显示今日留言（用于刷新/重新进入）=====
function renderSavedMessageIfAny() {
  const today = todayKey();
  const last = localStorage.getItem("lastGreetingDate");
  const btn = document.getElementById("btn");

  if (last === today) {
    // 今日已打卡：优先读取 lastMessage；如果没有（旧版本遗留），用 seededMessage 补一个并写回
    let savedRaw = localStorage.getItem("lastMessage");
    let saved = null;

    if (savedRaw) {
      try { saved = JSON.parse(savedRaw); } catch(e) { saved = null; }
    }

    if (!saved) {
      const msg = seededMessage(today);
      const { saved: toSave } = setMessageToUI(msg);
      localStorage.setItem("lastMessage", JSON.stringify(toSave));
    } else {
      setMessageToUI(saved);
    }

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.style.cursor = "not-allowed";
    }
    return true;
  }

  // 今日未打卡：显示邀请文案，不显示颜文字
  const faceEl = document.getElementById("face");
  const quoteEl = document.getElementById("quote");
  if (faceEl) faceEl.textContent = "";
  setFaceVisible(false);
  if (quoteEl) quoteEl.textContent = getTimePrompt();

  if (btn) {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  }
  return false;
}

// ===== 打卡按钮 =====
function sayHi() {
  const today = todayKey();
  const last = localStorage.getItem("lastGreetingDate");
  if (last === today) return;

  playClick();
  showBubble("今天也好喜欢猫猫）");

  localStorage.setItem("lastGreetingDate", today);

  let dayCount = parseInt(localStorage.getItem("dayCount") || "0", 10);
  dayCount += 1;
  localStorage.setItem("dayCount", String(dayCount));
  renderDayCount();

  const msg = pickMessage();
  const { saved } = setMessageToUI(msg);
  localStorage.setItem("lastMessage", JSON.stringify(saved));

  const btn = document.getElementById("btn");
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";
  }
}

// ===== 启动 =====
document.addEventListener("DOMContentLoaded", () => {
  renderDayCount();
  renderSavedMessageIfAny();
  updateClock();

  setInterval(() => {
    const today = todayKey();
    const last = localStorage.getItem("lastGreetingDate");
    if (last !== today) {
      const quoteEl = document.getElementById("quote");
      if (quoteEl) quoteEl.textContent = getTimePrompt();
    }
    updateClock();
  }, 1000);
});
