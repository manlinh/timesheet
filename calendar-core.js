let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex = undefined;
let currentMonth = 6;
const FIXED_YEAR = 2025;

// 🔄 用 Vercel API 即時讀取 calendar.json
async function fetchCalendarJSON() {
  const r = await fetch("https://calendar-api-jet.vercel.app/api/read-calendar");
  if (!r.ok) throw new Error("❌ 無法讀取 calendar.json：" + r.status);
  return r.json();
}

// 🔄 用 Vercel API 即時讀取 calendar-log.json
async function fetchLogJSON() {
  const r = await fetch("https://calendar-api-jet.vercel.app/api/read-calendar-log");
  if (!r.ok) throw new Error("❌ 無法讀取 calendar-log.json：" + r.status);
  return r.json();
}

function setUser() {
  const u = document.getElementById("username").value.trim();
  if (!u) return alert("請輸入教師名稱");
  localStorage.setItem("calendar_user", u);
  currentUser = u;
  document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
  renderCalendar();
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

async function updateToAPI() {
  try {
    const res = await fetch("https://calendar-api-jet.vercel.app/api/update-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: calendarData, log: logData })
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("❌ API update fail:", res.status, txt);
      alert("❌ 寫入失敗：" + txt);
      return false;
    }
    return true;
  } catch (e) {
    console.error("❌ updateToAPI exception:", e);
    alert("❌ 寫入例外，請查看 Console");
    return false;
  }
}

function renderCalendar() {
  document.getElementById("calendar-title").innerText = `📅 ${FIXED_YEAR} 年 ${currentMonth+1} 月行事曆`;

  const year = FIXED_YEAR;
  const month = currentMonth;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let dc = 0;
  for (let i = 0; i < firstDay; i++) { html += "<td></td>"; dc++; }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = formatDate(new Date(year, month, d));
    const entries = (calendarData[iso] || []).map((e, idx) =>
      `<div class="entry" onclick="editEntry('${iso}',${idx})">
         ${e.user}（${e.time}）<br>${e.subject}
         <button onclick="event.stopPropagation(); deleteEntry('${iso}',${idx})">🗑</button>
       </div>`).join("");
    html += `<td><div class="date-label">${d}</div>${entries}<button onclick="openPopup('${iso}')">➕</button></td>`;
    dc++;
    if (dc % 7 === 0 && d < daysInMonth) html += "</tr><tr>";
  }

  while (dc % 7 !== 0) { html += "<td></td>"; dc++; }
  html += "</tr></table>";
  document.getElementById("calendar-container").innerHTML = html;
}

function switchMonth(m) {
  currentMonth = m;
  renderCalendar();
}

function openPopup(date) {
  if (!localStorage.getItem("calendar_user")) return alert("請登入教師");
  currentUser = localStorage.getItem("calendar_user");
  editDate = date;
  editIndex = undefined;
  document.getElementById("popup-date").textContent = `${date}`;
  generateTimeOptions();
  document.getElementById("start-time").value = "09:00";
  document.getElementById("end-time").value = "10:00";
  document.getElementById("popup-subject").value = "";
  document.getElementById("popup").classList.remove("hidden");
}

function editEntry(date, idx) {
  event.stopPropagation();
  currentUser = localStorage.getItem("calendar_user");
  editDate = date;
  editIndex = idx;
  const e = calendarData[date][idx];
  document.getElementById("popup-date").textContent = date;
  generateTimeOptions();
  const [s, ed] = e.time.split(" - ");
  document.getElementById("start-time").value = s;
  document.getElementById("end-time").value = ed;
  document.getElementById("popup-subject").value = e.subject;
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
  editIndex = undefined;
}

async function saveEntry() {
  const subject = document.getElementById("popup-subject").value.trim();
  const start = document.getElementById("start-time").value;
  const end = document.getElementById("end-time").value;
  const entry = { user: currentUser, subject, time: `${start} - ${end}` };

  if (!calendarData[editDate]) calendarData[editDate] = [];
  if (typeof editIndex === "number") calendarData[editDate][editIndex] = entry;
  else calendarData[editDate].push(entry);

  logData.push({ date: editDate, user: currentUser, subject, time: entry.time, action: "新增/修改", timestamp: Date.now() / 1000 });

  if (await updateToAPI()) refresh();
}

async function deleteEntry(date, index) {
  const entr = calendarData[date].splice(index, 1)[0];
  logData.push({ date, user: entr.user, subject: entr.subject, time: entr.time, action: "刪除", timestamp: Date.now() / 1000 });

  if (await updateToAPI()) refresh();
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML = logData.slice().reverse().map(l =>
    `<div><b>${l.date}</b> - ${l.action} (${l.time}) ${l.subject || ""} by ${l.user} <small>${new Date(l.timestamp*1000).toLocaleString()}</small></div>`
  ).join("");
}

function generateTimeOptions() {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      opts.push(`<option value="${t}">${t}</option>`);
    }
  }
  document.getElementById("start-time").innerHTML = opts.join("");
  document.getElementById("end-time").innerHTML = opts.join("");
}

function exportMonthToExcel() {
  const wb = XLSX.utils.book_new();
  const ws_data = [["日期","時段","課程","教師"]];
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(FIXED_YEAR, currentMonth, d);
    if (dt.getMonth() !== currentMonth) break;
    const key = formatDate(dt);
    (calendarData[key] || []).forEach(e => ws_data.push([key, e.time, e.subject, e.user]));
  }
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, `${FIXED_YEAR}-${currentMonth+1}`);
  XLSX.writeFile(wb, `calendar-${FIXED_YEAR}-${currentMonth+1}.xlsx`);
}

function refresh() {
  closePopup();
  renderCalendar();
  renderLogs();
}

(async () => {
  try {
    calendarData = await fetchCalendarJSON();
    logData = await fetchLogJSON();
    if (localStorage.getItem("calendar_user")) {
      currentUser = localStorage.getItem("calendar_user");
      document.getElementById("user-login").innerHTML = `👋 歡迎 ${currentUser}`;
    }
    refresh();
    console.log("✅ Calendar loaded from API with dynamic sync");
  } catch (e) {
    console.error("❌ 初始化載入失敗：", e);
    alert("⚠️ 載入行事曆失敗，請稍後再試");
  }
})();
