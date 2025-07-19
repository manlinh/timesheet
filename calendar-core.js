const OWNER = "manlinh";
const REPO = "timesheet";

let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex;

function setUser() {
  const u = document.getElementById("username").value.trim();
  const token = document.getElementById("token").value.trim();
  if (!u || !token) return alert("請輸入教師名稱與 Token");

  localStorage.setItem("calendar_user", u);
  localStorage.setItem("calendar_token", token);
  currentUser = u;
  document.getElementById("user-login").textContent = `👋 歡迎 ${u}`;
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

async function fetchJSON(file) {
  const res = await fetch(`data/${file}`);
  return res.json();
}

async function doDispatch() {
  const token = localStorage.getItem("calendar_token");
  if (!token) return alert("請先登入並輸入 token");

  const payload = {
    event_type: "update-calendar",
    client_payload: {
      calendar: JSON.stringify(calendarData),
      log: JSON.stringify(logData)
    }
  };
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (res.status === 204) alert("✅ 已提交修改，請稍後重新整理");
  else {
    const txt = await res.text();
    alert("❌ 寫入失敗：" + txt);
  }
}

function renderCalendar() {
  const year = FIXED_YEAR;
  const month = FIXED_MONTH;
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
         <button onclick="event.stopPropagation(); deleteEntryConfirm('${iso}', ${idx})">🗑</button>
       </div>`).join("");
    html += `<td><div class="date-label">${date}</div>${entries}<button onclick="openPopup('${iso}')">➕</button></td>`;
    dc++;
    if (dc % 7 === 0 && date < daysInMonth) html += "</tr><tr>";
  }
  while (dc % 7 !== 0) { html += "<td></td>"; dc++; }
  html += "</tr></table>";
  document.getElementById("calendar-container").innerHTML = html;
}

function openPopup(date) {
  if (!localStorage.getItem("calendar_user")) return alert("請先登入教師");
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
  generateTimeOptions();
  document.getElementById("start-time").value = start || "09:00";
  document.getElementById("end-time").value = end || "10:00";
  document.getElementById("popup-subject").value = e.subject || "";

  const [yy, mm, dd] = date.split("-");
  document.getElementById("popup-date").textContent = `${yy} 年 ${parseInt(mm)} 月 ${parseInt(dd)} 日`;

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

  logData.push({ date: editDate, user: currentUser, subject, time, action: "新增/修改", timestamp: Date.now() / 1000 });

  await doDispatch();
  refresh();
}

function deleteEntryConfirm(date, index) {
  if (!confirm("確定要刪除這筆行程？")) return;
  editDate = date;
  editIndex = index;
  deleteEntry();
}

async function deleteEntry() {
  const entry = calendarData[editDate][editIndex];
  calendarData[editDate].splice(editIndex, 1);

  logData.push({ date: editDate, user: currentUser, subject: entry.subject, time: entry.time, action: "刪除", timestamp: Date.now() / 1000 });

  await doDispatch();
  refresh();
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML = logData.slice().reverse().map(l =>
    `<div><b>${l.date}</b> - ${l.action} ${l.time ? `(${l.time})` : ""} ${l.subject || "（刪除）"} by ${l.user}
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
    document.getElementById("user-login").textContent = `👋 歡迎 ${currentUser}`;
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
