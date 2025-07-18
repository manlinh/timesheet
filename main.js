// main.js
async function login() {
  const name = document.getElementById("username").value;
  if (!name) return alert("請輸入使用者名稱！");
  window.location.href = `user.html?name=${encodeURIComponent(name)}`;
}

function downloadSchedule() {
  fetch('schedule.json')
    .then(response => response.json())
    .then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "schedule.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
}
