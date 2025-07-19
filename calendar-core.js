const OWNER = "manlinh";
const REPO = "timesheet";

let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex = undefined;

function setUser() {
  const u = document.getElementById("username").value.trim();
  if (!u) return alert("請輸入教師名稱");
  localStorage.setItem("calendar_user", u);
  currentUser = u;
  document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function showStatus(msg, ok = true) {
  const el = document.getElementById("status-message");
  el.textContent = msg;
  el.style.background = ok ? "#d4edda" : "#f8d7da";
  el.style.color = ok ? "#155724" : "#721c24";
  el.style.border = ok ? "1px solid #c3e6cb" : "1px solid #f5c6cb";
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 3000);
}

function hashColor(name) {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + (hash << 5) - hash;
  return `hsl(${hash % 360},70%,85%)`;
}

async function fetchJSON(path) {
  const r = await fetch(`data/${path}`);
  return r.json();
}

async function dispatchUpdate() {
  const payload = {
    calendar: JSON.stringify(calendarData),
    log: JSON.stringify(logData)
  };

  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/dispatches`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event_type: "update-calendar",
      client_payload: payload
    })
  });

  if (res.ok) {
    showStatus("✅ 已送出寫入請求，請稍後刷新", true);
  } else {
    const txt = await res.text();
    console.error(txt);
    showStatus("❌ 寫入失敗：" + txt, false);
  }
}

function renderCalendar() {
  const year = FIXED_YEAR, month = FIXED_MONTH;
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let dc = 0;
  for (let i = 0; i < firstDay; i++) { html += "<td></td>"; dc++; }

  for (let d = 1; d <= days; d++) {
    const iso = formatDate(new Date(year, month, d));
    const entries = (calendarData[iso] || []).map((e, i) =>
      `<div class="entry" style="background:${hashColor(e.user)}">
        <div onclick="editEntry('${iso}', ${i})">
          ${e.user}（${e.time}）<br>${e.subject}
        </div>
        <button class="delete-btn" onclick="deleteSpecificEntry(event, '${iso}', ${i})">🗑</button>
      </div>`
    ).join("");
    html += `<td><div class="date-label">${d}</div>${entries}<button class="add-btn" onclick="openPopup('${iso}')">➕</button></td>`;
    dc++;
    if (dc % 7 === 0 && d < days) html += "</tr><tr>";
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

function editEntry(date, idx) {
  openPopup(date);
  editIndex = idx;
  const e = calendarData[date][idx];
  const [start, end] = e.time.split(" - ");
  document.getElementById("start-time").value = start;
  document.getElementById("end-time").value = end;
  document.getElementById("popup-subject").value = e.subject;
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

  closePopup();
  renderCalendar();
  renderLogs();
  await dispatchUpdate();
}

async function deleteSpecificEntry(ev, date, i) {
  ev.stopPropagation();
  const e = calendarData[date][i];
  calendarData[date].splice(i, 1);

  logData.push({
    date,
    user: e.user,
    subject: e.subject,
    time: e.time,
    action: "刪除",
    timestamp: Date.now() / 1000
  });

  renderCalendar();
  renderLogs();
  await dispatchUpdate();
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML =
    logData.slice().reverse().map(l =>
      `<div><b>${l.date}</b> - ${l.action} (${l.time}) ${l.subject} by ${l.user}
       <small>${new Date(l.timestamp * 1000).toLocaleString()}</small></div>`
    ).join("");
}

function refresh() {
  closePopup();
  renderCalendar();
  renderLogs();
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
