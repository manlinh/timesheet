const GITHUB_TOKEN = "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";
const OWNER = "manlinh";
const REPO = "timesheet";
const SCHEDULE_PATH = "data/schedule.json";
const MESSAGES_PATH = "data/messages.json";

async function fetchJSON(path) {
  const res = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${path}`);
  return await res.json();
}

async function updateJSON(path, content) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const shaRes = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const { sha } = await shaRes.json();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update " + path,
      content: encoded,
      sha
    })
  });
}

function login() {
  const user = document.getElementById("newUserInput").value || document.getElementById("userSelect").value;
  if (!user) return alert("請選擇或輸入使用者名稱");
  localStorage.setItem("currentUser", user);
  window.location.href = "schedule.html";
}

async function loadUsers() {
  const schedule = await fetchJSON(SCHEDULE_PATH);
  const select = document.getElementById("userSelect");
  for (let user in schedule) {
    const opt = document.createElement("option");
    opt.value = user;
    opt.textContent = user;
    select.appendChild(opt);
  }
}

async function loadSchedule() {
  const user = localStorage.getItem("currentUser");
  document.getElementById("userTitle").textContent = user + " 的日程與留言板";
  const schedule = await fetchJSON(SCHEDULE_PATH);
  if (!schedule[user]) {
    schedule[user] = Array(6 * 7).fill("");
    await updateJSON(SCHEDULE_PATH, schedule);
  }
  const container = document.getElementById("scheduleContainer");
  container.innerHTML = "";
  const data = schedule[user];
  data.forEach((entry, idx) => {
    const cell = document.createElement("input");
    cell.value = entry;
    cell.dataset.index = idx;
    container.appendChild(cell);
  });
  loadMessages();
}

async function postMessage() {
  const user = localStorage.getItem("currentUser");
  const text = document.getElementById("messageInput").value;
  const msgData = await fetchJSON(MESSAGES_PATH);
  msgData.push({ user, message: text, time: Date.now() });
  await updateJSON(MESSAGES_PATH, msgData);
  alert("留言已送出");
  loadMessages();
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("zh-TW");
}

async function loadMessages() {
  const data = await fetchJSON(MESSAGES_PATH);
  const container = document.getElementById("messagesContainer");
  container.innerHTML = "";
  data.forEach(m => {
    const div = document.createElement("div");
    div.textContent = `[${formatTime(m.time)}] ${m.user}: ${m.message}`;
    container.appendChild(div);
  });
}

if (location.pathname.includes("index")) loadUsers();
if (location.pathname.includes("schedule")) loadSchedule();
