let calendarData = {}, logData = [];
let currentUser = "", editDate = "", editIndex;
let currentMonth = 6; // 7月
const FIXED_YEAR = 2025;

// 登入教師
function setUser() {
  const u = document.getElementById("username").value.trim();
  if (!u) return alert("請輸入教師名稱");
  currentUser = u;
  localStorage.setItem("calendar_user", u);
  document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
  renderCalendar();
}

// 格式化日期為 ISO
function formatDate(d) {
  const y = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'), da = String(d.getDate()).padStart(2,'0');
  return `${y}-${mo}-${da}`;
}

// 從 Vercel 讀資料
async function fetchData() {
  try {
    const res = await fetch("https://calendar-api-jet.vercel.app/api/read-calendar");
    if (!res.ok) throw new Error(res.status);
    return res.json();
  } catch (e) {
    console.error(e);
    alert("⚠️ 載入資料失敗，請稍後再試");
    return { calendar: {}, log: [] };
  }
}

// 寫回資料到 Vercel
async function updateData() {
  try {
    const res = await fetch("https://calendar-api-jet.vercel.app/api/update-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendar: calendarData, log: logData })
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (e) {
    console.error(e);
    alert("❌ 寫入失敗，請查看 Console");
  }
}

// 呈現月曆
function renderCalendar() {
  document.getElementById("calendar-title").innerText = `📅 ${FIXED_YEAR} 年 ${currentMonth+1} 月行事曆`;
  const year = FIXED_YEAR, month = currentMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  let html = "<table><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr><tr>";
  let cellCount = 0;
  for (; cellCount < firstDay; cellCount++) html += "<td></td>";

  for (let d=1; d<=daysInMonth; d++, cellCount++) {
    const iso = formatDate(new Date(year, month, d));
    const items = (calendarData[iso]||[])
      .map((e,i)=>`
        <div class="entry" onclick="editEntry('${iso}',${i})">
          ${e.user} (${e.time}) ${e.subject}
          <button onclick="event.stopPropagation(); deleteEntry('${iso}',${i})">🗑</button>
        </div>`)
      .join("");
    html += `<td>
      <div class="date-label">${d}</div>
      ${items}
      <button onclick="openEntry('${iso}')">➕</button>
    </td>`;
    if (cellCount % 7 === 6 && d < daysInMonth) html += "</tr><tr>";
  }
  while (cellCount%7!==0) { html+="<td></td>"; cellCount++; }
  html += "</tr></table>";
  document.getElementById("calendar-container").innerHTML = html;
}

// 切月份
function switchMonth(m) {
  currentMonth = m;
  renderCalendar();
}

// 開啟編輯
function openEntry(date) {
  if (!localStorage.getItem("calendar_user")) return alert("請先登入");
  currentUser = localStorage.getItem("calendar_user");
  editDate = date; editIndex = undefined;
  document.getElementById("popup-date").innerText = date;
  generateTimeOptions();
  document.getElementById("start-time").value = "09:00";
  document.getElementById("end-time").value = "10:00";
  document.getElementById("subjects").value = "";
  document.getElementById("popup").classList.remove("hidden");
}

// 編輯已有項目
function editEntry(date, idx) {
  event.stopPropagation();
  currentUser = localStorage.getItem("calendar_user");
  editDate = date; editIndex = idx;
  const e = calendarData[date][idx];
  document.getElementById("popup-date").innerText = date;
  generateTimeOptions();
  const [s, eT] = e.time.split(" - ");
  document.getElementById("start-time").value = s;
  document.getElementById("end-time").value = eT;
  document.getElementById("subjects").value = e.subject;
  document.getElementById("popup").classList.remove("hidden");
}

// 關閉對話框
function closePopup() {
  document.getElementById("popup").classList.add("hidden");
  editIndex = undefined;
}

// 儲存資料
async function saveEntry() {
  const subject = document.getElementById("subjects").value.trim();
  const start = document.getElementById("start-time").value;
  const end = document.getElementById("end-time").value;
  const entry = { user:currentUser, subject, time:`${start} - ${end}` };
  if (!calendarData[editDate]) calendarData[editDate] = [];
  if (editIndex>=0) calendarData[editDate][editIndex] = entry;
  else calendarData[editDate].push(entry);
  logData.push({ date:editDate,user:currentUser,subject,time:entry.time,action:"新增/修改",timestamp:Date.now()/1000 });
  await updateData();
  refresh();
}

// 刪除項目
async function deleteEntry(date, idx) {
  const e = calendarData[date].splice(idx,1)[0];
  logData.push({ date,user:e.user,subject:e.subject,time:e.time,action:"刪除",timestamp:Date.now()/1000 });
  await updateData();
  refresh();
}

// 畫出日誌
function renderLog() {
  document.getElementById("calendar-log").innerHTML =
    logData.slice().reverse()
      .map(l=>`<div>${l.date} ${l.action} ${l.time} ${l.subject} by ${l.user}</div>`)
      .join("");
}

// 時間選項
function generateTimeOptions() {
  const start = document.getElementById("start-time"), end = document.getElementById("end-time");
  let opts=[]; for(let h=0;h<24;h++)for(let m=0;m<60;m+=30){
    const t=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    opts.push(`<option value="${t}">${t}</option>`);
  }
  start.innerHTML = end.innerHTML = opts.join("");
}

// 匯出 Excel
function exportExcel() {
  const wb = XLSX.utils.book_new();
  const data=[["日期","時間","課程","教師"]];
  for (let d=1; d<=31; d++) {
    const dt=new Date(FIXED_YEAR,currentMonth,d);
    if (dt.getMonth()!==currentMonth) break;
    const key=formatDate(dt);
    (calendarData[key]||[]).forEach(e=>data.push([key,e.time,e.subject,e.user]));
  }
  const ws=XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb,ws,`${FIXED_YEAR}-${currentMonth+1}`);
  XLSX.writeFile(wb,`calendar-${FIXED_YEAR}-${currentMonth+1}.xlsx`);
}

// 重整視圖
function refresh() {
  closePopup();
  renderCalendar();
  renderLog();
}

// 啟動初始化
(async()=>{
  const d = await fetchData();
  calendarData = d.calendar||{};
  logData = d.log||[];
  const u = localStorage.getItem("calendar_user");
  if (u) {
    currentUser = u;
    document.getElementById("user-login").innerHTML = `👋 歡迎 ${u}`;
  }
  refresh();
})();
