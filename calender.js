const GITHUB_TOKEN = "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";
const OWNER = "manlinh";
const REPO = "timesheet";

let calendarData = {};
let logData = [];
let currentDate = "";

function getDateRange(start, end) {
  const range = [];
  const d = new Date(start);
  while (d <= new Date(end)) {
    range.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return range;
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

function renderCalendar(data) {
  const container = document.getElementById("calendar-container");
  const start = new Date("2025-07-01");
  const end = new Date("2025-09-07");
  const allDays = getDateRange(start, end);

  let html = "<table><thead><tr><th>週次</th><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead><tbody>";

  for (let i = 0; i < allDays.length; i += 7) {
    html += "<tr><td>第" + (i / 7 + 1) + "週</td>";
    for (let j = 0; j < 7; j++) {
      const day = allDays[i + j];
      if (!day) { html += "<td></td>"; continue; }
      const iso = day.toISOString().split("T")[0];
      const lessons = (data[iso] || []).map(d => `<div>${d.user}: ${d.subject}</div>`).join("");
      html += `<td onclick="editDate('${iso}')"><div class="date">${iso.slice(5)}</div>${lessons}</td>`;
    }
    html += "</tr>";
  }

  html += "</tbody></table>";
  container.innerHTML = html;
}

function editDate(iso) {
  currentDate = iso;
  document.getElementById("popup-date").textContent = iso;
  const entry = (calendarData[iso] || [])[0] || {};
  document.getElementById("subject").value = entry.subject || "";
  document.getElementById("user").value = entry.user || "";
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
}

async function saveEntry() {
  const subject = document.getElementById("subject").value;
  const user = document.getElementById("user").value;
  if (!calendarData[currentDate]) calendarData[currentDate] = [];
  calendarData[currentDate] = [{ subject, user }];

  logData.push({ date: currentDate, user, subject, action: "新增/修改", time: Date.now() / 1000 });

  await updateJSON("data/calendar.json", calendarData);
  await updateJSON("data/calendar-log.json", logData);
  closePopup();
  renderCalendar(calendarData);
  renderLogs();
}

async function deleteEntry() {
  calendarData[currentDate] = [];

  logData.push({ date: currentDate, user: "", subject: "", action: "刪除", time: Date.now() / 1000 });

  await updateJSON("data/calendar.json", calendarData);
  await updateJSON("data/calendar-log.json", logData);
  closePopup();
  renderCalendar(calendarData);
  renderLogs();
}

function renderLogs() {
  const container = document.getElementById("calendar-log");
  container.innerHTML = logData.map(log =>
    `<div><b>${log.date}</b> - ${log.action} ${log.subject || ""} by ${log.user || "N/A"} <small>${new Date(log.time * 1000).toLocaleString()}</small></div>`
  ).join("");
}

(async () => {
  calendarData = await fetchJSON("calendar.json");
  logData = await fetchJSON("calendar-log.json");
  renderCalendar(calendarData);
  renderLogs();
})();
