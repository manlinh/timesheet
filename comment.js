
document.addEventListener("DOMContentLoaded", () => {
  const commentDiv = document.getElementById("comments");
  const form = document.getElementById("commentForm");
  const textarea = document.getElementById("commentInput");
  const user = localStorage.getItem("username") || "匿名";

  fetch("comment.json")
    .then(res => res.json())
    .then(data => {
      render(data);
      form.addEventListener("submit", e => {
        e.preventDefault();
        const newComment = { user, text: textarea.value, time: new Date().toISOString() };
        data.push(newComment);
        render(data);
        textarea.value = "";
      });
    });

  function render(list) {
    commentDiv.innerHTML = list.map(c => `<p><b>${c.user}:</b> ${c.text}</p>`).join("");
  }
});
