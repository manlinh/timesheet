const token = 'YOUR_GITHUB_TOKEN_HERE'; // Replace this manually
const repo = 'manlinh/timesheet';

function login() {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) return alert("請輸入名稱");

  localStorage.setItem('username', username);
  window.location.href = "schedule.html";
}