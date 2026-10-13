(() => {
  const entries = Object.entries(SISTEMA_MAYOR); // [ [num, word], ... ]
  const TOTAL = entries.length;

  const screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };

  const introCount = document.getElementById("intro-count");
  const btnStart = document.getElementById("btn-start");
  const btnRetry = document.getElementById("btn-retry");

  const progressLabel = document.getElementById("progress-label");
  const progressFill = document.getElementById("progress-fill");
  const timerLabel = document.getElementById("timer-label");
  const quizCard = document.getElementById("quiz-card");
  const quizNumber = document.getElementById("quiz-number");
  const answerForm = document.getElementById("answer-form");
  const answerInput = document.getElementById("answer-input");
  const feedback = document.getElementById("feedback");

  const resTime = document.getElementById("res-time");
  const resAccuracy = document.getElementById("res-accuracy");
  const resCorrect = document.getElementById("res-correct");
  const resAvg = document.getElementById("res-avg");
  const reviewSection = document.getElementById("review-section");
  const reviewList = document.getElementById("review-list");

  introCount.textContent = `${TOTAL} números en esta ronda, en orden aleatorio.`;

  let order = [];
  let index = 0;
  let correctCount = 0;
  let mistakes = [];
  let startTime = 0;
  let tickHandle = null;
  let locked = false;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.dataset.active = key === name ? "true" : "false";
    });
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function startRound() {
    order = shuffle(entries);
    index = 0;
    correctCount = 0;
    mistakes = [];
    startTime = Date.now();
    locked = false;

    showScreen("quiz");
    tickHandle = setInterval(() => {
      timerLabel.textContent = formatTime(Date.now() - startTime);
    }, 250);

    renderQuestion();
  }

  function renderQuestion() {
    const [num] = order[index];
    quizCard.classList.remove("is-correct", "is-wrong");
    quizNumber.textContent = num;
    progressLabel.textContent = `${index + 1} / ${TOTAL}`;
    progressFill.style.width = `${(index / TOTAL) * 100}%`;
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.value = "";
    answerInput.focus();
    locked = false;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;

    const [num, word] = order[index];
    const userAnswer = answerInput.value;
    const isCorrect = normalize(userAnswer) === normalize(word);

    locked = true;

    if (isCorrect) {
      correctCount++;
      quizCard.classList.add("is-correct");
      feedback.textContent = "Correcto";
      feedback.className = "feedback good";
    } else {
      mistakes.push({ num, word, given: userAnswer.trim() });
      quizCard.classList.add("is-wrong");
      feedback.textContent = `Era "${word}"`;
      feedback.className = "feedback bad";
    }

    setTimeout(() => {
      index++;
      if (index >= TOTAL) {
        finishRound();
      } else {
        renderQuestion();
      }
    }, isCorrect ? 450 : 1100);
  }

  function finishRound() {
    clearInterval(tickHandle);
    const elapsed = Date.now() - startTime;
    const accuracy = Math.round((correctCount / TOTAL) * 100);

    progressFill.style.width = "100%";
    resTime.textContent = formatTime(elapsed);
    resAccuracy.textContent = `${accuracy}%`;
    resCorrect.textContent = `${correctCount} / ${TOTAL}`;
    resAvg.textContent = `${(elapsed / TOTAL / 1000).toFixed(1)}s`;

    if (mistakes.length) {
      reviewSection.hidden = false;
      reviewList.innerHTML = mistakes
        .map(
          (m) => `
          <li>
            <span class="rl-num">${m.num}</span>
            <span class="rl-answers"><b>${m.word}</b>${m.given ? ` (escribiste: ${m.given})` : " (sin respuesta)"}</span>
          </li>`
        )
        .join("");
    } else {
      reviewSection.hidden = true;
      reviewList.innerHTML = "";
    }

    showScreen("result");
  }

  btnStart.addEventListener("click", startRound);
  btnRetry.addEventListener("click", startRound);
  answerForm.addEventListener("submit", handleSubmit);

  showScreen("intro");
})();
