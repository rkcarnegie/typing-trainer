(() => {
  const STORAGE_THEME = "typingTrainer.theme";
  const STORAGE_BEST = "typingTrainer.bestScores";

  const passageDisplay = document.getElementById("passageDisplay");
  const typingInput = document.getElementById("typingInput");
  const themeToggle = document.getElementById("themeToggle");
  const restartBtn = document.getElementById("restartBtn");
  const tryAgainBtn = document.getElementById("tryAgainBtn");
  const diffButtons = document.querySelectorAll(".diff-btn");
  const resultsPanel = document.getElementById("resultsPanel");
  const newBestBadge = document.getElementById("newBestBadge");
  const bestDifficultyLabel = document.getElementById("bestDifficultyLabel");

  const statWpm = document.getElementById("statWpm");
  const statAccuracy = document.getElementById("statAccuracy");
  const statTime = document.getElementById("statTime");
  const statErrors = document.getElementById("statErrors");
  const statBest = document.getElementById("statBest");

  const resultWpm = document.getElementById("resultWpm");
  const resultAccuracy = document.getElementById("resultAccuracy");
  const resultTime = document.getElementById("resultTime");
  const resultErrors = document.getElementById("resultErrors");

  let difficulty = "short";
  let passage = "";
  let startTime = null;
  let tickHandle = null;
  let finished = false;

  function loadBestScores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_BEST)) || {};
    } catch {
      return {};
    }
  }

  function saveBestScores(scores) {
    localStorage.setItem(STORAGE_BEST, JSON.stringify(scores));
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
    localStorage.setItem(STORAGE_THEME, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved) {
      applyTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  function pickPassage(level) {
    const pool = PASSAGES[level];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderPassage() {
    passageDisplay.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const ch of passage) {
      const span = document.createElement("span");
      span.textContent = ch;
      frag.appendChild(span);
    }
    passageDisplay.appendChild(frag);
    passageDisplay.children[0]?.classList.add("current");
  }

  function updateBestDisplay() {
    const scores = loadBestScores();
    bestDifficultyLabel.textContent = difficulty[0].toUpperCase() + difficulty.slice(1);
    statBest.textContent = scores[difficulty] ? scores[difficulty] : "–";
  }

  function resetRound(newPassage = true) {
    clearInterval(tickHandle);
    tickHandle = null;
    startTime = null;
    finished = false;
    if (newPassage) passage = pickPassage(difficulty);
    renderPassage();
    typingInput.value = "";
    typingInput.disabled = false;
    typingInput.focus();
    resultsPanel.classList.add("hidden");
    newBestBadge.classList.add("hidden");
    statWpm.textContent = "0";
    statAccuracy.textContent = "100%";
    statTime.textContent = "0.0s";
    statErrors.textContent = "0";
    updateBestDisplay();
  }

  function computeStats(elapsedMs) {
    const typed = typingInput.value;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === passage[i]) correct++;
    }
    const errors = typed.length - correct;
    const minutes = Math.max(elapsedMs / 60000, 1 / 600); // avoid divide-by-near-zero
    const wpm = Math.round((correct / 5) / minutes);
    const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
    return { correct, errors, wpm, accuracy };
  }

  function tick() {
    const elapsed = Date.now() - startTime;
    const { wpm, accuracy, errors } = computeStats(elapsed);
    statWpm.textContent = wpm;
    statAccuracy.textContent = `${accuracy}%`;
    statTime.textContent = `${(elapsed / 1000).toFixed(1)}s`;
    statErrors.textContent = errors;
  }

  function highlightPassage() {
    const typed = typingInput.value;
    const spans = passageDisplay.children;
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];
      span.classList.remove("correct", "incorrect", "current");
      if (i < typed.length) {
        span.classList.add(typed[i] === passage[i] ? "correct" : "incorrect");
      } else if (i === typed.length) {
        span.classList.add("current");
      }
    }
  }

  function finishRound() {
    finished = true;
    clearInterval(tickHandle);
    typingInput.disabled = true;
    const elapsed = Date.now() - startTime;
    const { wpm, accuracy, errors } = computeStats(elapsed);

    resultWpm.textContent = wpm;
    resultAccuracy.textContent = `${accuracy}%`;
    resultTime.textContent = `${(elapsed / 1000).toFixed(1)}s`;
    resultErrors.textContent = errors;

    const scores = loadBestScores();
    const previousBest = scores[difficulty] || 0;
    if (wpm > previousBest) {
      scores[difficulty] = wpm;
      saveBestScores(scores);
      newBestBadge.classList.remove("hidden");
    }
    updateBestDisplay();

    resultsPanel.classList.remove("hidden");
  }

  typingInput.addEventListener("input", () => {
    if (finished) return;

    if (typingInput.value.length > passage.length) {
      typingInput.value = typingInput.value.slice(0, passage.length);
    }

    if (startTime === null && typingInput.value.length > 0) {
      startTime = Date.now();
      tickHandle = setInterval(tick, 200);
    }

    highlightPassage();
    tick();

    if (typingInput.value.length === passage.length) {
      finishRound();
    }
  });

  diffButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      difficulty = btn.dataset.difficulty;
      diffButtons.forEach((b) => b.classList.toggle("active", b === btn));
      resetRound();
    });
  });

  restartBtn.addEventListener("click", () => resetRound());
  tryAgainBtn.addEventListener("click", () => resetRound());

  function init() {
    initTheme();
    diffButtons.forEach((b) => b.classList.toggle("active", b.dataset.difficulty === difficulty));
    resetRound();
  }

  init();
})();
