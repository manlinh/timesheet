const FIXED_YEAR = 2025;
let currentMonth = 6;
let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex = undefined;

function switchMonth(m) {
  currentMonth = m;
  refresh();
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
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

async function fetchJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function renderCalendar() {
  const year = FIXED_YEAR, month = currentMonth;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = firstDay.getDay();

  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let dc = 0;
  for (let i = 0; i < startDay; i++){ html += "<td></td>"; dc++; }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const iso = formatDate(dt);
    const entries = (calendarData[iso] || []).map((e,i)=>`
      <div class="entry" onclick="editEntry('${iso}',${i})">
        ${e.user}（${e.time}）<br>${e.subject}
        <button onclick="event.stopPropagation(); deleteEntry('${iso}',${i})">🗑</button>
      </div>`).join("");
    html += `<td><div class="date-label">${d}</div>${entries}
             <button onclick="openPopup('${iso}')">➕</button></td>`;
    dc++;
    if (dc % 7 === 0 && d < daysInMonth) html += "</tr><tr>";
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
  document.getElementById("popup-date").textContent = date;
  generateTimeOptions();
  document.getElementById("start-time").value = "09:00";
  document.getElementById("end-time").value = "10:00";
  document.getElementById("popup-subject").value = "";
  document.getElementById("popup").classList.remove("hidden");
}

function editEntry(date, idx) {
  currentUser = localStorage.getItem("calendar_user");
  editDate = date;
  editIndex = idx;
  const e = calendarData[date][idx];
  document.getElementById("popup-date").textContent = date;
  generateTimeOptions();
  const [s,eT] = e.time.split(" - ");
  document.getElementById("start-time").value = s;
  document.getElementById("end-time").value = eT;
  document.getElementById("popup-subject").value = e.subject;
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
  editIndex = undefined;
}

async function saveEntry() {
  const subj = document.getElementById("popup-subject").value.trim();
  const s = document.getElementById("start-time").value;
  const e = document.getElementById("end-time").value;
  const time = `${s} - ${e}`;
  const entry = { user: currentUser, subject: subj, time };

  if (!calendarData[editDate]) calendarData[editDate] = [];
  if (typeof editIndex === "number") {
    calendarData[editDate][editIndex] = entry;
  } else {
    calendarData[editDate].push(entry);
  }

  logData.push({ date: editDate, user: currentUser, subject: subj, time, action: "新增/修改", timestamp: Date.now()/1000 });
  await syncToAPI();
  refresh();
}

async function deleteEntry(date, idx) {
  const entry = calendarData[date].splice(idx,1)[0];
  logData.push({ date, user: entry.user, subject: entry.subject, time: entry.time, action: "刪除", timestamp: Date.now()/1000 });
  await syncToAPI();
  refresh();
}

function generateTimeOptions() {
  const opts = [];
  for (let h=0;h<24;h++){
    for (let m=0;m<60;m+=30){
      const t = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
      opts.push(`<option value="${t}">${t}</option>`);
    }
  }
  document.getElementById("start-time").innerHTML = opts.join("");
  document.getElementById("end-time").innerHTML = opts.join("");
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML = logData.slice().reverse().map(l=>
    `<div><b>${l.date}</b> - ${l.action} (${l.time}) ${l.subject} by ${l.user}
    <small>${new Date(l.timestamp*1000).toLocaleString()}</small></div>`
  ).join("");
}

async function syncToAPI() {
  const res = await fetch("https://calendar-api-jet.vercel.app/api/update-calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ calendar: calendarData, log: logData })
  });
  if (!res.ok) alert("寫入失敗：" + await res.text());
}

function refresh() {
  closePopup();
  renderCalendar();
  renderLogs();
  updateTitle();
}

(async()=>{
  calendarData = await fetchJSON("data/calendar.json");
  logData = await fetchJSON("data/calendar-log.json");
  if (localStorage.getItem("calendar_user")) {
    currentUser = localStorage.getItem("calendar_user");
    document.getElementById("user-login").innerHTML = `👋 歡迎 ${currentUser}`;
  }
  refresh();
})();
