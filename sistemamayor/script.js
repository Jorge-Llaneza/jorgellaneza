(() => {
  const entries = Object.entries(SISTEMA_MAYOR); // [ [num, word], ... ]
  const TOTAL = entries.length;
  const QUICK_COUNT = 20;

  const screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    result: document.getElementById("screen-result"),
  };

  const introCount = document.getElementById("intro-count");
  const btnStart = document.getElementById("btn-start");
  const btnStartQuick = document.getElementById("btn-start-quick");
  const btnRetry = document.getElementById("btn-retry");

  const progressLabel = document.getElementById("progress-label");
  const progressFill = document.getElementById("progress-fill");
  const timerLabel = document.getElementById("timer-label");
  const btnPause = document.getElementById("btn-pause");
  const pauseOverlay = document.getElementById("pause-overlay");
  const timeoutSlider = document.getElementById("timeout-slider");
  const timeoutValueLabel = document.getElementById("timeout-value");
  const quizCard = document.getElementById("quiz-card");
  const quizNumber = document.getElementById("quiz-number");
  const answerForm = document.getElementById("answer-form");
  const answerInput = document.getElementById("answer-input");
  const btnHideToggle = document.getElementById("btn-hide-toggle");
  const feedback = document.getElementById("feedback");

  const resTime = document.getElementById("res-time");
  const resAccuracy = document.getElementById("res-accuracy");
  const resCorrect = document.getElementById("res-correct");
  const resAvg = document.getElementById("res-avg");
  const reviewSection = document.getElementById("review-section");
  const reviewList = document.getElementById("review-list");
  const slowestSection = document.getElementById("slowest-section");
  const slowestList = document.getElementById("slowest-list");

  introCount.textContent = `Ronda completa: los ${TOTAL} números. Ronda rápida: ${QUICK_COUNT} al azar. En orden aleatorio, y si fallas una palabra vuelve a aparecer más adelante hasta que la aciertes.`;

  let queue = [];
  let current = null;
  let roundTotal = TOTAL;
  let lastMode = "full";
  let totalAttempts = 0;
  let firstTryCorrect = 0;
  let mistakes = new Map(); // num -> { word, given, fails }
  let wordTimes = new Map(); // num -> { word, ms }
  let questionStartTime = 0;
  let questionElapsedAccum = 0;
  let startTime = 0;
  let tickHandle = null;
  let locked = false;
  let isPaused = false;
  let pausedElapsed = 0;
  let timeoutSeconds = parseFloat(timeoutSlider.value);
  let questionTimeoutHandle = null;
  let questionDeadline = 0;
  let questionRemainingMs = 0;

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

  function startRound(mode) {
    lastMode = mode;
    queue = mode === "quick" ? shuffle(entries).slice(0, Math.min(QUICK_COUNT, TOTAL)) : shuffle(entries);
    roundTotal = queue.length;
    current = null;
    totalAttempts = 0;
    firstTryCorrect = 0;
    mistakes = new Map();
    wordTimes = new Map();
    startTime = Date.now();
    locked = false;
    isPaused = false;
    pausedElapsed = 0;
    clearTimeout(questionTimeoutHandle);
    btnPause.textContent = "Pausa";
    pauseOverlay.hidden = true;
    answerInput.disabled = false;

    showScreen("quiz");
    tickHandle = setInterval(() => {
      timerLabel.textContent = formatTime(Date.now() - startTime);
    }, 250);

    renderQuestion();
  }

  function renderQuestion() {
    current = queue.shift();
    const [num] = current;
    const mastered = roundTotal - queue.length - 1;
    quizCard.classList.remove("is-correct", "is-wrong");
    quizNumber.textContent = num;
    progressLabel.textContent = `${mastered} / ${roundTotal}`;
    progressFill.style.width = `${(mastered / roundTotal) * 100}%`;
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.value = "";
    answerInput.focus();
    locked = false;
    questionStartTime = Date.now();
    questionElapsedAccum = 0;

    scheduleQuestionTimeout(timeoutSeconds * 1000);
  }

  function getQuestionElapsedMs() {
    return questionElapsedAccum + (isPaused ? 0 : Date.now() - questionStartTime);
  }

  function recordWordTime(num, word, ms) {
    const entry = wordTimes.get(num) || { word, ms: 0 };
    entry.ms += ms;
    wordTimes.set(num, entry);
  }

  function scheduleQuestionTimeout(ms) {
    clearTimeout(questionTimeoutHandle);
    questionDeadline = Date.now() + ms;
    questionTimeoutHandle = setTimeout(handleTimeout, ms);
  }

  function markWrong(num, word, given) {
    const entry = mistakes.get(num) || { word, given: "", fails: 0 };
    entry.given = given;
    entry.fails++;
    mistakes.set(num, entry);

    quizCard.classList.add("is-wrong");

    // Re-insert a few cards ahead so it doesn't repeat immediately.
    const insertPos = Math.min(queue.length, 2 + Math.floor(Math.random() * 3));
    queue.splice(insertPos, 0, current);
  }

  function togglePause() {
    if (isPaused) {
      isPaused = false;
      startTime = Date.now() - pausedElapsed;
      questionStartTime = Date.now();
      tickHandle = setInterval(() => {
        timerLabel.textContent = formatTime(Date.now() - startTime);
      }, 250);
      scheduleQuestionTimeout(questionRemainingMs);
      pauseOverlay.hidden = true;
      answerInput.disabled = false;
      answerInput.focus();
      btnPause.textContent = "Pausa";
    } else {
      isPaused = true;
      pausedElapsed = Date.now() - startTime;
      questionElapsedAccum += Date.now() - questionStartTime;
      clearInterval(tickHandle);
      questionRemainingMs = Math.max(0, questionDeadline - Date.now());
      clearTimeout(questionTimeoutHandle);
      pauseOverlay.hidden = false;
      answerInput.disabled = true;
      btnPause.textContent = "Continuar";
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (locked || isPaused) return;
    clearTimeout(questionTimeoutHandle);

    const [num, word] = current;
    const userAnswer = answerInput.value;
    const isCorrect = normalize(userAnswer) === normalize(word);

    locked = true;
    totalAttempts++;
    recordWordTime(num, word, getQuestionElapsedMs());

    if (isCorrect) {
      if (!mistakes.has(num)) firstTryCorrect++;
      quizCard.classList.add("is-correct");
      feedback.textContent = "Correcto";
      feedback.className = "feedback good";
    } else {
      markWrong(num, word, userAnswer.trim());
      feedback.textContent = `Era "${word}"`;
      feedback.className = "feedback bad";
    }

    setTimeout(() => {
      if (queue.length === 0) {
        finishRound();
      } else {
        renderQuestion();
      }
    }, isCorrect ? 450 : 1100);
  }

  function handleTimeout() {
    if (locked) return;

    const [num, word] = current;
    locked = true;
    totalAttempts++;
    recordWordTime(num, word, getQuestionElapsedMs());

    markWrong(num, word, "");
    feedback.textContent = `Tiempo agotado (${timeoutSeconds.toFixed(1)}s) · era "${word}"`;
    feedback.className = "feedback bad";

    setTimeout(() => {
      if (queue.length === 0) {
        finishRound();
      } else {
        renderQuestion();
      }
    }, 1100);
  }

  function finishRound() {
    clearInterval(tickHandle);
    clearTimeout(questionTimeoutHandle);
    const elapsed = Date.now() - startTime;
    const accuracy = Math.round((firstTryCorrect / roundTotal) * 100);

    progressFill.style.width = "100%";
    resTime.textContent = formatTime(elapsed);
    resAccuracy.textContent = `${accuracy}%`;
    resCorrect.textContent = `${firstTryCorrect} / ${roundTotal}`;
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

    const slowest = Array.from(wordTimes.entries())
      .sort((a, b) => b[1].ms - a[1].ms)
      .slice(0, 10);

    slowestSection.hidden = slowest.length === 0;
    slowestList.innerHTML = slowest
      .map(
        ([num, m]) => `
        <li>
          <span class="rl-num">${num}</span>
          <span class="rl-answers"><b>${m.word}</b> (${(m.ms / 1000).toFixed(1)}s)</span>
        </li>`
      )
      .join("");

    showScreen("result");
  }

  btnStart.addEventListener("click", () => startRound("full"));
  btnStartQuick.addEventListener("click", () => startRound("quick"));
  btnRetry.addEventListener("click", () => startRound(lastMode));
  btnPause.addEventListener("click", togglePause);
  timeoutSlider.addEventListener("input", () => {
    timeoutSeconds = parseFloat(timeoutSlider.value);
    timeoutValueLabel.textContent = `${timeoutSeconds.toFixed(1)}s`;
  });
  btnHideToggle.addEventListener("click", () => {
    const hidden = answerInput.type === "text";
    answerInput.type = hidden ? "password" : "text";
    btnHideToggle.textContent = hidden ? "Mostrar" : "Ocultar";
    btnHideToggle.setAttribute("aria-pressed", String(hidden));
    answerInput.focus();
  });
  answerForm.addEventListener("submit", handleSubmit);
  answerInput.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      answerForm.requestSubmit();
    }
  });

  showScreen("intro");
})();
