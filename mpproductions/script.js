const toggle = document.querySelector(".nav-toggle");
const navList = document.querySelector(".nav ul");

toggle.addEventListener("click", () => {
  navList.classList.toggle("open");
});

const form = document.querySelector("#contact-form");
const formNote = document.querySelector(".form-note");
const submitBtn = form.querySelector("button[type=submit]");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await res.json();

    if (result.success) {
      form.hidden = true;
      formNote.textContent = "Thanks — your message is in. We'll get back to you soon.";
      formNote.classList.remove("error");
      formNote.hidden = false;
    } else {
      throw new Error(result.message || "Submission failed");
    }
  } catch (err) {
    formNote.textContent = "Something went wrong sending your message. Please email us directly.";
    formNote.classList.add("error");
    formNote.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Send message";
  }
});
