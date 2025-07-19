const GITHUB_TOKEN = "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";
const OWNER = "manlinh";
const REPO = "timesheet";

let calendarData = {}, logData = [];
let currentUser = "", editDate = "";

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

async function fetchJSON(path) {
  const r = await fetch(`data/${path}`);
  return r.json();
}

async function updateJSON(path, obj) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const r = await fetch(url, { headers:{Authorization:`token ${GITHUB_TOKEN}`} });
  const { sha } = await r.json();
  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type":"application/json", Authorization:`token ${GITHUB_TOKEN}` },
    body: JSON.stringify({
      message: `Update ${path}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2)))),
      sha
    })
  });
}

function renderCalendar() {
  const year = FIXED_YEAR;
  const month = FIXED_MONTH;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const startDay = firstDay.getDay();

  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let dc = 0;
  for (let i = 0; i < startDay; i++) { html += "<td></td>"; dc++; }

  for (let date=1; date<=daysInMonth; date++) {
    const dt = new Date(year, month, date);
    const iso = formatDate(dt);
    const entries = (calendarData[iso]||[]).map(e=>
      `<div class="entry">${e.user}（${e.time}）<br>${e.subject}</div>`).join("");
    html += `<td onclick="openPopup('${iso}')"><div class="date-label">${date}</div>${entries}</td>`;
    dc++;
    if (dc%7===0 && date<daysInMonth) html += "</tr><tr>";
  }
  while(dc%7!==0) { html += "<td></td>"; dc++; }
  html += "</tr></table>";
  document.getElementById("calendar-container").innerHTML = html;
}

function openPopup(date) {
  if (!localStorage.getItem("calendar_user")) return alert("請登入教師");
  currentUser = localStorage.getItem("calendar_user");
  editDate = date;
  document.getElementById("popup-date").innerText = date;
  const e = (calendarData[date]||[])[0]||{};
  document.getElementById("popup-time").value = e.time||"";
  document.getElementById("popup-subject").value = e.subject||"";
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

async function saveEntry() {
  const subject = document.getElementById("popup-subject").value.trim();
  const time = document.getElementById("popup-time").value.trim();
  if (!calendarData[editDate]) calendarData[editDate] = [];
  calendarData[editDate] = [{ user: currentUser, subject, time }];
  logData.push({ date: editDate, user: currentUser, subject, time, action:"新增/修改", timestamp: Date.now()/1000 });

  await updateJSON("data/calendar.json", calendarData);
  await updateJSON("data/calendar-log.json", logData);
  refresh();
}

async function deleteEntry() {
  calendarData[editDate] = [];
  logData.push({ date: editDate, user: currentUser, subject:"", time:"", action:"刪除", timestamp: Date.now()/1000 });

  await updateJSON("data/calendar.json", calendarData);
  await updateJSON("data/calendar-log.json", logData);
  refresh();
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML =
    logData.slice().reverse().map(l=>
      `<div><b>${l.date}</b> - ${l.action} ${l.time?`(${l.time})`:""} ${l.subject||"（刪除）"} by ${l.user}
      <small>${new Date(l.timestamp*1000).toLocaleString()}</small></div>`
    ).join("");
}

function refresh() {
  closePopup();
  renderCalendar();
  renderLogs();
}

(async()=>{
  calendarData = await fetchJSON("calendar.json");
  logData = await fetchJSON("calendar-log.json");
  if (localStorage.getItem("calendar_user")) {
    currentUser = localStorage.getItem("calendar_user");
    document.getElementById("user-login").innerHTML = `👋 歡迎 ${currentUser}`;
  }
  refresh();
})();
