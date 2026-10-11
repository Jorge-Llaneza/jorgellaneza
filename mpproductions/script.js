const toggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav ul");

toggle.addEventListener("click", () => {
  navList.classList.toggle("open");
});

const form = document.querySelector(".contact form");
const formNote = document.querySelector(".form-note");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  form.hidden = true;
  formNote.hidden = false;
});
