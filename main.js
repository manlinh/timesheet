timesheet";
const SCHEDULE_PATH = "data/schedule.json";
const MESSAGES_PATH = "data/messages.json";

// Load users from schedule.json
async function loadUsers() {
  const schedule = await fetchJSON(SCHEDULE_PATH);
  const select = document.getElementById("userSelect");
  for (let user in schedule) {
    let opt = document.createElement("option");
    opt.value = user;
    opt.textContent = user;
    select.appendChild(opt);
  }
}

// Login logic
function login() {
  const select = document.getElementById("userSelect");
  const input = document.getElementById("newUserInput");
  const user = input.value || select.value;
  localStorage.setItem("currentUser", user);
  window.location.href = "schedule.html";
}

// Load personal schedule
async function loadSchedule() {
  const user = localStorage.getItem("currentUser");
  document.getElementById("userTitle").textContent = user + " 的日程與留言板";
  const schedule = await fetchJSON(SCHEDULE_PATH);
  const container = document.getElementById("scheduleContainer");
  const data = schedule[user] || [];
  data.forEach((entry, idx) => {
    const cell = document.createElement("input");
    cell.value = entry;
    cell.dataset.index = idx;
    container.appendChild(cell);
  });
}

// Post message
async function postMessage() {
  const user = localStorage.getItem("currentUser");
  const text = document.getElementById("messageInput").value;
  const msgData = await fetchJSON(MESSAGES_PATH);
  msgData.push({ user, message: text, time: Date.now() });
  await updateJSON(MESSAGES_PATH, msgData);
  alert("留言已送出");
}

// Load JSON
async function fetchJSON(path) {
  const res = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${path}`);
  return await res.json();
}

// Update JSON
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
if (window.location.pathname.includes("index")) loadUsers();
if (window.location.pathname.includes("schedule")) loadSchedule();

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("zh-TW");
}

// Load messages
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

// Initialize empty schedule for new user
async function loadSchedule() {
  const user = localStorage.getItem("currentUser");
  document.getElementById("userTitle").textContent = user + " 的日程與留言板";
  const schedule = await fetchJSON(SCHEDULE_PATH);
  if (!schedule[user]) {
    schedule[user] = Array(7 * 6).fill("");  // 6 weeks * 7 days
    await updateJSON(SCHEDULE_PATH, schedule);
  }
  const container = document.getElementById("scheduleContainer");
  const data = schedule[user];
  data.forEach((entry, idx) => {
    const cell = document.createElement("input");
    cell.value = entry;
    cell.dataset.index = idx;
    container.appendChild(cell);
  });
  loadMessages();
}
