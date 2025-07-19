const GITHUB_TOKEN = "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";
const OWNER = "manlinh";
const REPO = "timesheet";
const USER_STORAGE_KEY = "timesheet_user";

let currentSchedule = {}, currentMessages = [];

async function fetchJSON(path) {
  const res = await fetch(`data/${path}`);
  return res.json();
}

async function loadAll() {
  currentSchedule = await fetchJSON("schedule.json");
  currentMessages = await fetchJSON("messages.json");
  renderFullSchedule(currentSchedule);
  loadUserOptions(Object.keys(currentSchedule));
  document.getElementById("all-schedule").style.display = 'block';
}

function loadUserOptions(users) {
  const select = document.getElementById("user-select");
  select.innerHTML = users.map(u => `<option value="${u}">${u}</option>`).join("");
}

function login() {
  const select = document.getElementById("user-select");
  const newUser = document.getElementById("new-user").value.trim();
  const user = newUser || select.value;
  if (!user) return alert("請選擇或新增使用者");
  if (!(user in currentSchedule)) currentSchedule[user] = Array(14).fill("");
  localStorage.setItem(USER_STORAGE_KEY, user);
  window.location.href = "schedule.html";
}

function renderFullSchedule(data) {
  const days = ["一","二","三","四","五","六","日"];
  let html = `<table><tr><th>教師</th>`;
  for (let w=1; w<=2; w++) days.forEach(d => html+=`<th>第${w}週${d}</th>`);
  html+="</tr>";
  for (let u in data) {
    html+=`<tr><td>${u}</td>`;
    data[u].forEach(c => html+=`<td>${c||""}</td>`);
    html+="</tr>";
  }
  html+="</table>";
  document.getElementById("schedule").innerHTML = html;
}

function renderPersonalSchedule() {
  const user = localStorage.getItem(USER_STORAGE_KEY);
  document.getElementById("welcome").textContent = `你好，${user}`;
  const sch = currentSchedule[user] || Array(14).fill("");
  const days = ["一","二","三","四","五","六","日"];
  let html = "<table><tr>";
  days.forEach(d=> html+=`<th>第1週${d}</th>`);
  days.forEach(d=> html+=`<th>第2週${d}</th>`);
  html += "</tr><tr>";
  sch.forEach((v,i)=> html+=`<td><input data-idx="${i}" value="${v}" onchange="updateCell(this)"></td>`);
  html+="</tr></table>";
  document.getElementById("my-schedule").innerHTML = html;
}

function updateCell(input) {
  const idx = +input.dataset.idx;
  const user = localStorage.getItem(USER_STORAGE_KEY);
  currentSchedule[user][idx] = input.value;
}

async function syncSchedule() {
  await updateJSON("data/schedule.json", currentSchedule);
}

function renderMessages() {
  document.getElementById("message-board").innerHTML = currentMessages
    .map(m=>`<div><b>${m.user}</b>: ${m.message} <small>(${new Date(m.time*1000).toLocaleString()})</small></div>`)
    .join("");
}

async function addMessage() {
  const msg = document.getElementById("new-message").value.trim();
  if (!msg) return;
  const user = localStorage.getItem(USER_STORAGE_KEY);
  currentMessages.push({ user, message: msg, time: Math.floor(Date.now()/1000) });
  renderMessages();
  await updateJSON("data/messages.json", currentMessages);
}

async function updateJSON(path, obj) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const res = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}` }});
  const { sha } = await res.json();
  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type":"application/json", Authorization: `token ${GITHUB_TOKEN}` },
    body: JSON.stringify({
      message: `Update ${path}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(obj, null,2)))),
      sha
    })
  });
  alert(`${path} 已同步`);
}

if (location.pathname.includes("schedule.html")) {
  (async ()=>{
    currentSchedule = await fetchJSON("schedule.json");
    currentMessages = await fetchJSON("messages.json");
    renderPersonalSchedule();
    renderMessages();
  })();
} else {
  loadAll();
}
