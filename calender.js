const GITHUB_TOKEN = "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";
const OWNER = "manlinh";
const REPO = "timesheet";
let calendarData = {}, logData = [];
let currentMonth = new Date();
let currentUser = "";
let editDate = "";

function setUser() {
  const user = document.getElementById("username").value.trim();
  if (!user) return alert("請輸入使用者名稱");
  localStorage.setItem("calendar_user", user);
  currentUser = user;
  document.getElementById("user-login").innerHTML = `👋 歡迎 ${user}`;
}

function goToday() {
  currentMonth = new Date();
  renderCalendar();
}

function prevMonth() {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

async function fetchJSON(path) {
  const res = await fetch(`data/${path}`);
  return res.json();
}

async function updateJSON(path, obj) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
  const { sha } = await res.json();
  await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${GITHUB_TOKEN}`
    },
    body: JSON.stringify({
      message: `Update ${path}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2)))),
      sha
    })
  });
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(1 - firstDay.getDay());

  const container = document.getElementById("calendar-container");
  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr>";

  let d = new Date(startDate);
  for (let w = 0; w < 6; w++) {
    html += "<tr>";
    for (let i = 0; i < 7; i++) {
      const iso = formatDate(d);
      const isCurrentMonth = d.getMonth() === month;
      const entries = (calendarData[iso] || []).map(e =>
        `<div class="entry">${e.user}: ${e.subject}</div>`).join("");

      html += `<td style="background:${isCurrentMonth ? "#fff" : "#f0f0f0"}" onclick="openPopup('${iso}')">
        <div class="date-label">${d.getDate()}</div>${entries}</td>`;
      d.setDate(d.getDate() + 1);
    }
    html += "</tr>";
  }
  html += "</table>";

  document.getElementById("calendar-container").innerHTML = html;
  document.getElementById("current-month").textContent = `${year} 年 ${month + 1} 月`;
}

function openPopup(date) {
  if (!currentUser) return alert("請先登入");
  editDate = date;
  document.getElementById("popup-date").textContent = date;
  const entry = (calendarData[date] || [])[0] || {};
  document.getElementById("popup-subject").value = entry.subject || "";
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

async function saveEntry() {
  const subject = document.getElementById("popup-subject").value.trim();
  if (!calendarData[editDate]) calendarData[editDate] = [];
  calendarData[editDate] = [{ user: currentUser, subject }];
  logData.push({ date: editDate, user: currentUser, subject, action: "新增/修改", time: Date.now() / 1000 });

  await updateJSON("data/calendar.json", calendarData);
  await updateJSON("data/calendar-log.json", logData);

  closePopup();
  renderCalendar();
  renderLogs();
}

async function deleteEntry() {
  calendarData[editDate] = [];
  logData.push({ date: editDate, user: currentUser, subject: "", action: "刪除", time: Date.now() / 1000 });

  await updateJSON("data/calendar.json", calendarData);
  await updateJSON("data/calendar-log.json", logData);

  closePopup();
  renderCalendar();
  renderLogs();
}

function renderLogs() {
  const container = document.getElementById("calendar-log");
  container.innerHTML = logData.slice().reverse().map(log =>
    `<div><b>${log.date}</b> - ${log.action} ${log.subject || "（刪除）"} by ${log.user} 
    <small>${new Date(log.time * 1000).toLocaleString()}</small></div>`
  ).join("");
}

(async () => {
  currentUser = localStorage.getItem("calendar_user") || "";
  if (currentUser) document.getElementById("user-login").innerHTML = `👋 歡迎 ${currentUser}`;
  calendarData = await fetchJSON("calendar.json");
  logData = await fetchJSON("calendar-log.json");
  renderCalendar();
  renderLogs();
})();
