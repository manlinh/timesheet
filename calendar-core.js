const FIXED_YEAR = 2025;
let currentMonth = 6; // 預設七月（JS中0為一月）
let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex = undefined;

function switchMonth(month) {
  currentMonth = month;
  renderCalendar();
  updateTitle();
}

function updateTitle() {
  document.getElementById("calendar-title").innerText =
    `📅 ${FIXED_YEAR} 年 ${currentMonth + 1} 月行事曆`;
}

function setUser() {
  const u = document.getElementById("username").value.trim();
  if (!u) return alert("請輸入教師名稱");
  localStorage.setItem("calendar_user", u);
  currentUser = u;
  document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function fetchJSON(path) {
  const r = await fetch(`data/${path}`);
  return r.json();
}

function renderCalendar() {
  const year = FIXED_YEAR;
  const month = currentMonth;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay.getDay();

  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let dc = 0;
  for (let i = 0; i < startDay; i++) { html += "<td></td>"; dc++; }

  for (let date = 1; date <= daysInMonth; date++) {
    const dt = new Date(year, month, date);
    const iso = formatDate(dt);
    const entries = (calendarData[iso] || []).map((e, idx) =>
      `<div class="entry" onclick="editEntry('${iso}', ${idx})">
         ${e.user}（${e.time}）<br>${e.subject}
         <button onclick="event.stopPropagation(); deleteEntry('${iso}', ${idx})">🗑</button>
       </div>`).join("");
    html += `<td><div class="date-label">${date}</div>${entries}
             <button onclick="openPopup('${iso}')">➕</button></td>`;
    dc++;
    if (dc % 7 === 0 && date < daysInMonth) html += "</tr><tr>";
  }
  while (dc % 7 !== 0) { html += "<td></td>"; dc++; }
  html += "</tr></table>";
  document.getElementById("calendar-container").innerHTML = html;
}

function openPopup(date) {
  if (!localStorage.getItem("calendar_user")) return alert("請登入教師");
  currentUser = localStorage.getItem("calendar_user");
  editDate = date;
  editIndex = undefined;

  const [yy, mm, dd] = date.split("-");
  document.getElementById("popup-date").textContent = `${yy} 年 ${parseInt(mm)} 月 ${parseInt(dd)} 日`;
  generateTimeOptions();
  document.getElementById("start-time").value = "09:00";
  document.getElementById("end-time").value = "10:00";
  document.getElementById("popup-subject").value = "";
  document.getElementById("popup").classList.remove("hidden");
}

function editEntry(date, index) {
  currentUser = localStorage.getItem("calendar_user");
  editDate = date;
  editIndex = index;

  const e = calendarData[date][index];
  const [start, end] = (e.time || "").split(" - ");
  document.getElementById("popup-date").textContent = date;
  generateTimeOptions();
  document.getElementById("start-time").value = start || "09:00";
  document.getElementById("end-time").value = end || "10:00";
  document.getElementById("popup-subject").value = e.subject || "";
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
  const time = `${start} - ${end}`;
  const newEntry = { user: currentUser, subject, time };

  if (!calendarData[editDate]) calendarData[editDate] = [];
  if (typeof editIndex === "number") {
    calendarData[editDate][editIndex] = newEntry;
  } else {
    calendarData[editDate].push(newEntry);
  }

  logData.push({
    date: editDate,
    user: currentUser,
    subject,
    time,
    action: "新增/修改",
    timestamp: Date.now() / 1000
  });

  await syncToAPI();
  refresh();
}

async function deleteEntry(date, index) {
  const entry = calendarData[date][index];
  calendarData[date].splice(index, 1);
  logData.push({
    date: date,
    user: entry.user,
    subject: entry.subject,
    time: entry.time,
    action: "刪除",
    timestamp: Date.now() / 1000
  });

  await syncToAPI();
  refresh();
}

function generateTimeOptions() {
  const start = document.getElementById("start-time");
  const end = document.getElementById("end-time");
  const times = [];

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      times.push(`${hh}:${mm}`);
    }
  }

  start.innerHTML = times.map(t => `<option value="${t}">${t}</option>`).join('');
  end.innerHTML = times.map(t => `<option value="${t}">${t}</option>`).join('');
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML =
    logData.slice().reverse().map(l =>
      `<div><b>${l.date}</b> - ${l.action} ${l.time ? `(${l.time})` : ""} ${l.subject || "（刪除）"} by ${l.user}
        <small>${new Date(l.timestamp * 1000).toLocaleString()}</small></div>`
    ).join("");
}

function refresh() {
  closePopup();
  renderCalendar();
  renderLogs();
  updateTitle();
}

async function syncToAPI() {
  const res = await fetch("https://calendar-api-jet.vercel.app/api/update-calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calendar: calendarData, log: logData })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) alert("❌ 寫入失敗：" + JSON.stringify(json));
}

function exportMonthToExcel() {
  const wb = XLSX.utils.book_new();
  const ws_data = [["日期", "時段", "課程", "教師"]];
  const y = FIXED_YEAR, m = currentMonth;

  for (let day = 1; day <= 31; day++) {
    const d = new Date(y, m, day);
    if (d.getMonth() !== m) break;
    const key = formatDate(d);
    const events = calendarData[key] || [];
    events.forEach(e => {
      ws_data.push([key, e.time || "", e.subject || "", e.user || ""]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, `${y}-${m + 1}`);
  XLSX.writeFile(wb, `calendar-${y}-${m + 1}.xlsx`);
}

(async () => {
  calendarData = await fetchJSON("calendar.json");
  logData = await fetchJSON("calendar-log.json");
  if (localStorage.getItem("calendar_user")) {
    currentUser = localStorage.getItem("calendar_user");
    document.getElementById("user-login").innerHTML = `👋 歡迎 ${currentUser}`;
  }
  refresh();
})();
