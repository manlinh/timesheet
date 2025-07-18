let currentUser = "";
let messages = [];
let scheduleData = { all: [], personal: [] };

function setUsername() {
  const input = document.getElementById("usernameInput");
  currentUser = input.value || "匿名";
  loadSchedule();
  loadMessages();
}

function showSchedule(type) {
  const container = document.getElementById("scheduleContainer");
  const items = type === "all" ? scheduleData.all : scheduleData.personal;
  container.innerHTML = "<pre>" + JSON.stringify(items, null, 2) + "</pre>";
}

function loadSchedule() {
  fetch("https://raw.githubusercontent.com/manlinh/timesheet/main/schedule.json")
    .then(res => res.json())
    .then(data => {
      scheduleData.all = data;
      scheduleData.personal = data.filter(e => e.user === currentUser);
      showSchedule("all");
    });
}

function loadMessages() {
  fetch("https://raw.githubusercontent.com/manlinh/timesheet/main/messages.json")
    .then(res => res.json())
    .then(data => {
      messages = data;
      renderMessages();
    });
}

function renderMessages() {
  const ul = document.getElementById("messageList");
  ul.innerHTML = "";
  messages.forEach(m => {
    const li = document.createElement("li");
    li.textContent = `[${m.user}] ${m.message}`;
    ul.appendChild(li);
  });
}

function submitMessage() {
  const input = document.getElementById("messageInput");
  const msg = input.value;
  if (!msg) return;
  const newMsg = { user: currentUser, message: msg, time: Date.now() };
  messages.push(newMsg);
  renderMessages();
  input.value = "";
  updateMessages(messages);
}
