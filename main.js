
let currentUser = "";
let scheduleData = [];
let messages = [];
let isPersonal = false;

async function login() {
  currentUser = document.getElementById("username").value.trim();
  if (!currentUser) return alert("請輸入使用者名稱");
  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "block";
  await loadSchedule();
  await loadMessages();
}

async function loadSchedule() {
  const res = await fetch("schedule.json");
  scheduleData = await res.json();
  renderSchedule();
  const userSet = new Set(scheduleData.map(e => e.user));
  const datalist = document.getElementById("userlist");
  datalist.innerHTML = [...userSet].map(name => `<option value="${name}">`).join("");
}

function renderSchedule() {
  const container = document.getElementById("schedule-container");
  const data = isPersonal ? scheduleData.filter(d => d.user === currentUser) : scheduleData;
  const rows = data.map(d =>
    `<tr><td>${d.date}</td><td>${d.time}</td><td>${d.user}</td><td>${d.course}</td><td>${d.note}</td></tr>`
  ).join("");
  container.innerHTML = `
    <table>
      <thead><tr><th>日期</th><th>時間</th><th>使用者</th><th>課程</th><th>備註</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function switchView() {
  isPersonal = !isPersonal;
  renderSchedule();
}

async function loadMessages() {
  const res = await fetch("messages.json");
  messages = await res.json();
  renderChat();
}

function renderChat() {
  const chat = document.getElementById("chat-container");
  chat.innerHTML = messages.map(m =>
    `<p><strong>${m.user}:</strong> ${m.message}</p>`
  ).join("");
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (!msg) return;
  const newMsg = { user: currentUser, message: msg, time: Date.now() };
  messages.push(newMsg);
  input.value = "";
  renderChat();
  fetch("https://api.github.com/repos/manlinh/timesheet/contents/messages.json", {
    method: "PUT",
    headers: {
      "Authorization": "token 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "update messages.json",
      content: btoa(JSON.stringify(messages, null, 2)),
      sha: ""  // 若已知 sha 可填寫，否則需預先 GET
    })
  });
}

function downloadExcel() {
  const ws = XLSX.utils.json_to_sheet(scheduleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "時數表");
  XLSX.writeFile(wb, "timesheet.xlsx");
}
