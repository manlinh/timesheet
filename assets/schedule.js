async function loadSchedule() {
  const user = localStorage.getItem("currentUser");
  const res = await fetch("schedule.json");
  const data = await res.json();
  const table = document.createElement("table");
  const header = table.insertRow();
  header.innerHTML = "<th>週</th><th>星期</th><th>時間</th><th>課程</th>";

  data.filter(x => x.username === user).forEach(item => {
    const row = table.insertRow();
    row.innerHTML = `<td>${item.week}</td><td>${item.day}</td><td>${item.hour}</td><td>${item.content}</td>`;
  });

  document.getElementById("scheduleContainer").appendChild(table);
}

document.addEventListener("DOMContentLoaded", loadSchedule);
