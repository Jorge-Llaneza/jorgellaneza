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

const newsletterForm = document.querySelector("#newsletter-form");
const newsletterNote = document.querySelector(".newsletter-note");

newsletterForm.addEventListener("submit", (e) => {
  if (newsletterForm.action.includes("YOUR_BUTTONDOWN_USERNAME")) {
    e.preventDefault();
    newsletterNote.textContent = "Newsletter signup isn't set up yet. Please use the contact form below.";
    newsletterNote.classList.add("error");
    newsletterNote.hidden = false;
    return;
  }

  // The form posts to Buttondown in a new tab; swap the form out once it has gone.
  setTimeout(() => {
    newsletterForm.hidden = true;
    document.querySelector(".newsletter-fine").hidden = true;
    newsletterNote.textContent = "Almost done: check your inbox and click the confirmation link to join the list.";
    newsletterNote.classList.remove("error");
    newsletterNote.hidden = false;
  }, 0);
});
