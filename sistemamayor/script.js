(() => {
  const entries = Object.entries(SISTEMA_MAYOR); // [ [num, word], ... ]
  const TOTAL = entries.length;
  const QUICK_COUNT = 20;
  const CHAIN_ENTRIES = entries.filter(([num]) => num.length === 2);
  const CHAIN_GROUP_SIZE = 4;

  const screens = {
    intro: document.getElementById("screen-intro"),
    quiz: document.getElementById("screen-quiz"),
    chain: document.getElementById("screen-chain"),
    result: document.getElementById("screen-result"),
  };

  const introCount = document.getElementById("intro-count");
  const btnStart = document.getElementById("btn-start");
  const btnStartQuick = document.getElementById("btn-start-quick");
  const btnStartChain = document.getElementById("btn-start-chain");
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

  const chainProgressLabel = document.getElementById("chain-progress-label");
  const chainProgressFill = document.getElementById("chain-progress-fill");
  const chainTimerLabel = document.getElementById("chain-timer-label");
  const chainCard = document.getElementById("chain-card");
  const chainNumber = document.getElementById("chain-number");
  const chainDots = Array.from(document.querySelectorAll("#chain-dots .chain-dot"));
  const chainForm = document.getElementById("chain-form");
  const chainRows = Array.from(document.querySelectorAll(".chain-row"));
  const chainInputs = Array.from(document.querySelectorAll(".chain-input"));
  const chainFeedback = document.getElementById("chain-feedback");
  const chainStepSlider = document.getElementById("chain-step-slider");
  const chainStepValueLabel = document.getElementById("chain-step-value");

  introCount.textContent = `Ronda completa: los ${TOTAL} números. Ronda rápida: ${QUICK_COUNT} al azar. Modo cadena: se muestran 4 números de dos cifras, uno por segundo, y luego escribes las 4 palabras en orden. En orden aleatorio, y si fallas una palabra vuelve a aparecer más adelante hasta que la aciertes.`;

  let queue = [];
  let current = null;
  let roundTotal = TOTAL;
  let lastMode = "full";
  let activeMode = "standard"; // "standard" | "chain"
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

  let chainGroups = [];
  let chainGroupIndex = 0;
  let chainCurrentGroup = null;
  let chainWordTotal = 0;
  let chainCorrectCount = 0;
  let chainMistakes = new Map();
  let chainStartTime = 0;
  let chainTickHandle = null;
  let chainStepTimeout = null;
  let chainLocked = false;
  let chainStepSeconds = parseFloat(chainStepSlider.value);

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
    activeMode = "standard";
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

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i + size <= arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  }

  function startChainRound() {
    activeMode = "chain";
    chainGroups = chunk(shuffle(CHAIN_ENTRIES), CHAIN_GROUP_SIZE);
    chainGroupIndex = 0;
    chainWordTotal = chainGroups.length * CHAIN_GROUP_SIZE;
    chainCorrectCount = 0;
    chainMistakes = new Map();
    chainStartTime = Date.now();

    showScreen("chain");
    clearInterval(chainTickHandle);
    chainTickHandle = setInterval(() => {
      chainTimerLabel.textContent = formatTime(Date.now() - chainStartTime);
    }, 250);

    playChainGroup();
  }

  function playChainGroup() {
    chainCurrentGroup = chainGroups[chainGroupIndex];
    chainLocked = false;
    chainCard.hidden = false;
    chainForm.hidden = true;
    chainCard.classList.remove("is-correct", "is-wrong");
    chainFeedback.textContent = "";
    chainFeedback.className = "feedback";
    chainInputs.forEach((input) => { input.value = ""; });
    chainRows.forEach((row) => {
      row.classList.remove("is-correct", "is-wrong");
      row.querySelector(".chain-row-answer").textContent = "";
    });

    chainProgressLabel.textContent = `${chainGroupIndex} / ${chainGroups.length}`;
    chainProgressFill.style.width = `${(chainGroupIndex / chainGroups.length) * 100}%`;

    showChainStep(0);
  }

  function showChainStep(i) {
    chainDots.forEach((dot, idx) => {
      dot.classList.toggle("is-active", idx === i);
      dot.classList.toggle("is-done", idx < i);
    });
    chainNumber.textContent = chainCurrentGroup[i][0];

    clearTimeout(chainStepTimeout);
    chainStepTimeout = setTimeout(() => {
      if (i + 1 < chainCurrentGroup.length) {
        showChainStep(i + 1);
      } else {
        revealChainForm();
      }
    }, chainStepSeconds * 1000);
  }

  function revealChainForm() {
    chainDots.forEach((dot) => dot.classList.remove("is-active", "is-done"));
    chainCard.hidden = true;
    chainForm.hidden = false;
    chainInputs[0].focus();
  }

  function handleChainSubmit(e) {
    e.preventDefault();
    if (chainLocked) return;
    chainLocked = true;

    let allCorrect = true;
    chainCurrentGroup.forEach(([num, word], idx) => {
      const input = chainInputs[idx];
      const row = chainRows[idx];
      const answerSpan = row.querySelector(".chain-row-answer");
      const given = input.value.trim();
      const isCorrect = normalize(given) === normalize(word);

      row.classList.add(isCorrect ? "is-correct" : "is-wrong");
      if (isCorrect) {
        chainCorrectCount++;
      } else {
        allCorrect = false;
        chainMistakes.set(num, { word, given });
        answerSpan.textContent = `${num}: ${word}`;
      }
    });

    chainFeedback.textContent = allCorrect ? "Las 4 correctas" : "Revisa los fallos";
    chainFeedback.className = `feedback ${allCorrect ? "good" : "bad"}`;

    setTimeout(() => {
      chainGroupIndex++;
      if (chainGroupIndex >= chainGroups.length) {
        finishChainRound();
      } else {
        playChainGroup();
      }
    }, allCorrect ? 700 : 1700);
  }

  function finishChainRound() {
    clearInterval(chainTickHandle);
    clearTimeout(chainStepTimeout);
    const elapsed = Date.now() - chainStartTime;
    const accuracy = Math.round((chainCorrectCount / chainWordTotal) * 100);

    chainProgressFill.style.width = "100%";
    resTime.textContent = formatTime(elapsed);
    resAccuracy.textContent = `${accuracy}%`;
    resCorrect.textContent = `${chainCorrectCount} / ${chainWordTotal}`;
    resAvg.textContent = `${(elapsed / chainWordTotal / 1000).toFixed(1)}s`;

    if (chainMistakes.size) {
      reviewSection.hidden = false;
      reviewList.innerHTML = Array.from(chainMistakes.entries())
        .map(
          ([num, m]) => `
          <li>
            <span class="rl-num">${num}</span>
            <span class="rl-answers"><b>${m.word}</b>${m.given ? ` (escribiste: ${m.given})` : " (sin respuesta)"}</span>
          </li>`
        )
        .join("");
    } else {
      reviewSection.hidden = true;
      reviewList.innerHTML = "";
    }

    slowestSection.hidden = true;
    slowestList.innerHTML = "";

    showScreen("result");
  }

  btnStart.addEventListener("click", () => startRound("full"));
  btnStartQuick.addEventListener("click", () => startRound("quick"));
  btnStartChain.addEventListener("click", startChainRound);
  btnRetry.addEventListener("click", () => {
    if (activeMode === "chain") {
      startChainRound();
    } else {
      startRound(lastMode);
    }
  });
  chainForm.addEventListener("submit", handleChainSubmit);
  chainInputs.forEach((input, idx) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && idx < chainInputs.length - 1) {
        e.preventDefault();
        chainInputs[idx + 1].focus();
      }
    });
  });
  btnPause.addEventListener("click", togglePause);
  timeoutSlider.addEventListener("input", () => {
    timeoutSeconds = parseFloat(timeoutSlider.value);
    timeoutValueLabel.textContent = `${timeoutSeconds.toFixed(1)}s`;
  });
  chainStepSlider.addEventListener("input", () => {
    chainStepSeconds = parseFloat(chainStepSlider.value);
    chainStepValueLabel.textContent = `${chainStepSeconds.toFixed(1)}s`;
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
