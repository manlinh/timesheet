
function login() {
  const user = document.getElementById("usernameSelect").value;
  localStorage.setItem("username", user);
  window.location.href = "schedule.html";
}

fetch("users.json")
  .then(res => res.json())
  .then(users => {
    const sel = document.getElementById("usernameSelect");
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = u;
      sel.appendChild(opt);
    });
  });
