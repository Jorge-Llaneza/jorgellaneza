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

  introCount.textContent = `${TOTAL} números en esta ronda, en orden aleatorio. Si fallas una palabra, vuelve a aparecer más adelante hasta que la aciertes.`;

  let queue = [];
  let current = null;
  let totalAttempts = 0;
  let firstTryCorrect = 0;
  let mistakes = new Map(); // num -> { word, given, fails }
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
    queue = shuffle(entries);
    current = null;
    totalAttempts = 0;
    firstTryCorrect = 0;
    mistakes = new Map();
    startTime = Date.now();
    locked = false;

    showScreen("quiz");
    tickHandle = setInterval(() => {
      timerLabel.textContent = formatTime(Date.now() - startTime);
    }, 250);

    renderQuestion();
  }

  function renderQuestion() {
    current = queue.shift();
    const [num] = current;
    const mastered = TOTAL - queue.length - 1;
    quizCard.classList.remove("is-correct", "is-wrong");
    quizNumber.textContent = num;
    progressLabel.textContent = `${mastered} / ${TOTAL}`;
    progressFill.style.width = `${(mastered / TOTAL) * 100}%`;
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.value = "";
    answerInput.focus();
    locked = false;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;

    const [num, word] = current;
    const userAnswer = answerInput.value;
    const isCorrect = normalize(userAnswer) === normalize(word);

    locked = true;
    totalAttempts++;

    if (isCorrect) {
      if (!mistakes.has(num)) firstTryCorrect++;
      quizCard.classList.add("is-correct");
      feedback.textContent = "Correcto";
      feedback.className = "feedback good";
    } else {
      const entry = mistakes.get(num) || { word, given: "", fails: 0 };
      entry.given = userAnswer.trim();
      entry.fails++;
      mistakes.set(num, entry);

      quizCard.classList.add("is-wrong");
      feedback.textContent = `Era "${word}"`;
      feedback.className = "feedback bad";

      // Re-insert a few cards ahead so it doesn't repeat immediately.
      const insertPos = Math.min(queue.length, 2 + Math.floor(Math.random() * 3));
      queue.splice(insertPos, 0, current);
    }

    setTimeout(() => {
      if (queue.length === 0) {
        finishRound();
      } else {
        renderQuestion();
      }
    }, isCorrect ? 450 : 1100);
  }

  function finishRound() {
    clearInterval(tickHandle);
    const elapsed = Date.now() - startTime;
    const accuracy = Math.round((firstTryCorrect / TOTAL) * 100);

    progressFill.style.width = "100%";
    resTime.textContent = formatTime(elapsed);
    resAccuracy.textContent = `${accuracy}%`;
    resCorrect.textContent = `${firstTryCorrect} / ${TOTAL}`;
    resAvg.textContent = `${(elapsed / totalAttempts / 1000).toFixed(1)}s`;

    if (mistakes.size) {
      reviewSection.hidden = false;
      reviewList.innerHTML = Array.from(mistakes.entries())
        .map(
          ([num, m]) => `
          <li>
            <span class="rl-num">${num}</span>
            <span class="rl-answers"><b>${m.word}</b>${m.given ? ` (escribiste: ${m.given})` : " (sin respuesta)"}${m.fails > 1 ? ` · fallada ${m.fails} veces` : ""}</span>
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
