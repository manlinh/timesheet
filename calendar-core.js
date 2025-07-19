let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex;
let currentMonth = 6;
const FIXED_YEAR = 2025;

function setUser() {
  const u = document.getElementById("username").value.trim();
  if (!u) return alert("請輸入教師名稱");
  localStorage.setItem("calendar_user", u);
  currentUser = u;
  document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
  renderCalendar();
}

function formatDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

async function fetchRemoteData() {
  try {
    const res = await fetch("https://calendar-api-jet.vercel.app/api/read-calendar");
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    calendarData = data.calendar || {};
    logData = data.log || [];
    console.log("✅ 資料載入完成", calendarData, logData);
  } catch (e) {
    alert("⚠️ 載入資料失敗，請稍後再試");
    console.error(e);
  }
}

async function updateToAPI() {
  try {
    const res = await fetch("https://calendar-api-jet.vercel.app/api/update-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: calendarData, log: logData })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    console.log("✅ 更新成功");
  } catch (e) {
    console.error("❌ 更新失敗", e);
    alert("❌ 寫入失敗，請查看 Console");
  }
}

function renderCalendar() {
  updateTitle();
  const year = FIXED_YEAR, month = currentMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let dc = 0;

  for (; dc < firstDay; dc++) html += "<td></td>";

  for (let d = 1; d <= daysInMonth; d++, dc++) {
    const iso = formatDate(new Date(year, month, d));
    const entries = (calendarData[iso] || []).map((e, i) => `
      <div class="entry" onclick="editEntry('${iso}', ${i})">
        ${e.user} (${e.time}) ${e.subject}
        <button onclick="event.stopPropagation(); deleteEntry('${iso}', ${i})">🗑</button>
      </div>`).join("");
    html += `<td><div class="date-label">${d}</div>${entries}<button onclick="openPopup('${iso}')">➕</button></td>`;
    if (dc % 7 === 6 && d < daysInMonth) html += "</tr><tr>";
  }
  while (dc % 7 !== 0) { html += "<td></td>"; dc++; }
  html += "</tr></table>";
  document.getElementById("calendar-container").innerHTML = html;
}

function updateTitle() {
  document.getElementById("calendar-title").innerText = `📅 ${FIXED_YEAR} 年 ${currentMonth+1} 月行事曆`;
}

function switchMonth(m) {
  currentMonth = m;
  renderCalendar();
}

function openPopup(date) {
  if (!localStorage.getItem("calendar_user")) return alert("請先登入教師");
  currentUser = localStorage.getItem("calendar_user");
  editDate = date; editIndex = undefined;
  document.getElementById("popup-date").textContent = date;
  generateTimeOptions();
  document.getElementById("start-time").value = "09:00";
  document.getElementById("end-time").value = "10:00";
  document.getElementById("popup-subject").value = "";
  document.getElementById("popup").classList.remove("hidden");
}

function editEntry(date, index) {
  event.stopPropagation();
  currentUser = localStorage.getItem("calendar_user");
  editDate = date; editIndex = index;
  const e = calendarData[date][index];
  generateTimeOptions();
  const [s, ee] = e.time.split(" - ");
  document.getElementById("start-time").value = s;
  document.getElementById("end-time").value = ee;
  document.getElementById("popup-subject").value = e.subject;
  document.getElementById("popup-date").textContent = date;
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
  editIndex = undefined;
}

async function saveEntry() {
  const subj = document.getElementById("popup-subject").value.trim();
  const start = document.getElementById("start-time").value;
  const end = document.getElementById("end-time").value;
  const entry = { user: currentUser, subject: subj, time: `${start} - ${end}` };
  if (!calendarData[editDate]) calendarData[editDate] = [];
  if (typeof editIndex === "number") calendarData[editDate][editIndex] = entry;
  else calendarData[editDate].push(entry);
  logData.push({ date: editDate, user: currentUser, subject: subj, time: entry.time, action: "新增/修改", timestamp: Date.now() / 1000 });
  await updateToAPI();
  refresh();
}

async function deleteEntry(date, index) {
  const e = calendarData[date].splice(index, 1)[0];
  logData.push({ date, user: e.user, subject: e.subject, time: e.time, action: "刪除", timestamp: Date.now() / 1000 });
  await updateToAPI();
  refresh();
}

function renderLogs() {
  document.getElementById("calendar-log").innerHTML = logData.slice().reverse().map(l =>
    `<div><b>${l.date}</b> - ${l.action} (${l.time}) ${l.subject} by ${l.user}<br><small>${new Date(l.timestamp*1000).toLocaleString()}</small></div>`
  ).join("");
}

function generateTimeOptions() {
  const t=30; let opts=[];
  for (let h=0; h<24; h++) for (let m=0; m<60; m+=t) {
    const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    opts.push(`<option value="${time}">${time}</option>`);
  }
  document.getElementById("start-time").innerHTML = opts.join("");
  document.getElementById("end-time").innerHTML = opts.join("");
}

function exportMonthToExcel() {
  const wb = XLSX.utils.book_new(), rows=[["日期","時段","課程","教師"]];
  for (let d=1; d<=31; d++) {
    const dt = new Date(FIXED_YEAR, currentMonth, d);
    if (dt.getMonth() !== currentMonth) break;
    const key = formatDate(dt);
    (calendarData[key]||[]).forEach(e => rows.push([key, e.time, e.subject, e.user]));
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, `${FIXED_YEAR}-${currentMonth+1}`);
  XLSX.writeFile(wb, `calendar-${FIXED_YEAR}-${currentMonth+1}.xlsx`);
}

function refresh() {
  closePopup();
  renderCalendar();
  renderLogs();
}

(async () => {
  await fetchRemoteData();
  const u = localStorage.getItem("calendar_user");
  if (u) {
    currentUser = u;
    document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
  }
  refresh();
})();
