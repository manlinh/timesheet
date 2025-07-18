let currentUser = "";
let messages = [];
let totalSchedule = {
  "2025-07-17": { "09:00": ["小A", "小B"], "13:00": ["小C"] },
  "2025-07-18": { "10:00": ["小B"], "14:00": ["小A", "小D"] }
};

const defaultUsers = ["小A", "小B", "小C", "小D"];

function setUsername() {
  const input = document.getElementById("username").value;
  if (!input) return alert("請輸入使用者名稱");
  currentUser = input;
  renderUserButtons();
  renderSchedule();
  renderMessages();
}

function renderUserButtons() {
  const container = document.getElementById("user-buttons");
  container.innerHTML = "";
  defaultUsers.forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => {
      currentUser = name;
      document.getElementById("username").value = name;
      renderSchedule();
      renderMessages();
    };
    container.appendChild(btn);
  });
}

function showTotalSchedule() {
  renderSchedule();
}

function showPersonalSchedule() {
  renderSchedule(true);
}

function renderSchedule(personal = false) {
  const container = document.getElementById("schedule-display");
  container.innerHTML = "";
  Object.entries(totalSchedule).forEach(([date, times]) => {
    const dateBlock = document.createElement("div");
    dateBlock.innerHTML = `<strong>${date}</strong><br>`;
    Object.entries(times).forEach(([time, names]) => {
      if (!personal || names.includes(currentUser)) {
        dateBlock.innerHTML += `${time}：${names.join("、")}<br>`;
      }
    });
    container.appendChild(dateBlock);
  });
}

function submitMessage() {
  const text = document.getElementById("message-input").value;
  if (!text) return;
  const message = { user: currentUser, text, time: new Date().toLocaleString() };
  messages.push(message);
  renderMessages();
  document.getElementById("message-input").value = "";
}

function renderMessages() {
  const ul = document.getElementById("messages");
  ul.innerHTML = "";
  messages.forEach(msg => {
    const li = document.createElement("li");
    li.textContent = `[${msg.time}] ${msg.user}：${msg.text}`;
    ul.appendChild(li);
  });
}
