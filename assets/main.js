async function login() {
  const user = document.getElementById("userSelect").value;
  localStorage.setItem("currentUser", user);
  window.location.href = "schedule.html";
}

async function populateUsers() {
  const res = await fetch("users.json");
  const users = await res.json();
  const select = document.getElementById("userSelect");
  users.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.name;
    opt.textContent = u.name;
    select.appendChild(opt);
  });
}

document.addEventListener("DOMContentLoaded", populateUsers);
