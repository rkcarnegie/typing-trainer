(() => {
  const STORAGE_THEME = "typingTrainer.theme";
  const STORAGE_BEST = "typingTrainer.bestScores";
  const ALL_PASSAGES = [...PASSAGES.short, ...PASSAGES.medium, ...PASSAGES.long];

  const passageDisplay = document.getElementById("passageDisplay");
  const typingInput = document.getElementById("typingInput");
  const themeToggle = document.getElementById("themeToggle");
  const restartBtn = document.getElementById("restartBtn");
  const tryAgainBtn = document.getElementById("tryAgainBtn");
  const modeButtons = document.querySelectorAll("#modeGroup .diff-btn");
  const diffButtons = document.querySelectorAll("#diffGroup .diff-btn");
  const durationButtons = document.querySelectorAll("#durationGroup .diff-btn");
  const diffGroup = document.getElementById("diffGroup");
  const durationGroup = document.getElementById("durationGroup");
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

  let mode = "passage"; // "passage" | "timed"
  let difficulty = "short";
  let duration = 30; // seconds, timed mode
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

  function scoreKey() {
    return mode === "timed" ? `timed-${duration}` : difficulty;
  }

  function scoreLabel() {
    return mode === "timed" ? `${duration}s` : difficulty[0].toUpperCase() + difficulty.slice(1);
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

  function randomPassage() {
    return ALL_PASSAGES[Math.floor(Math.random() * ALL_PASSAGES.length)];
  }

  function buildPassage() {
    if (mode === "passage") {
      const pool = PASSAGES[difficulty];
      return pool[Math.floor(Math.random() * pool.length)];
    }
    // Timed mode: build a long stream of text, generously sized for the
    // chosen duration so a fast typist won't reach the end before time is up.
    let text = "";
    const minLen = duration * 20 + 400;
    while (text.length < minLen) {
      text += (text ? " " : "") + randomPassage();
    }
    return text;
  }

  function appendSpans(text) {
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement("span");
      span.textContent = ch;
      frag.appendChild(span);
    }
    passageDisplay.appendChild(frag);
  }

  function renderPassage() {
    passageDisplay.innerHTML = "";
    appendSpans(passage);
    passageDisplay.children[0]?.classList.add("current");
  }

  function extendPassageIfNeeded() {
    if (mode !== "timed") return;
    while (passage.length - typingInput.value.length < 150) {
      const addition = " " + randomPassage();
      passage += addition;
      appendSpans(addition);
    }
  }

  function updateBestDisplay() {
    const scores = loadBestScores();
    bestDifficultyLabel.textContent = scoreLabel();
    statBest.textContent = scores[scoreKey()] ? scores[scoreKey()] : "–";
  }

  function resetRound(newPassage = true) {
    clearInterval(tickHandle);
    tickHandle = null;
    startTime = null;
    finished = false;
    if (newPassage) passage = buildPassage();
    renderPassage();
    typingInput.value = "";
    typingInput.disabled = false;
    typingInput.focus();
    resultsPanel.classList.add("hidden");
    newBestBadge.classList.add("hidden");
    statWpm.textContent = "0";
    statAccuracy.textContent = "100%";
    statTime.textContent = mode === "timed" ? `${duration}s` : "0.0s";
    statErrors.textContent = "0";
    updateBestDisplay();
  }

  function elapsedCappedMs() {
    const raw = Date.now() - startTime;
    return mode === "timed" ? Math.min(raw, duration * 1000) : raw;
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
    const elapsed = elapsedCappedMs();
    const { wpm, accuracy, errors } = computeStats(elapsed);
    statWpm.textContent = wpm;
    statAccuracy.textContent = `${accuracy}%`;
    statErrors.textContent = errors;

    if (mode === "timed") {
      const remainingMs = Math.max(duration * 1000 - (Date.now() - startTime), 0);
      statTime.textContent = `${Math.ceil(remainingMs / 1000)}s`;
      if (remainingMs <= 0) finishRound();
    } else {
      statTime.textContent = `${(elapsed / 1000).toFixed(1)}s`;
    }
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
    passageDisplay.querySelector(".current")?.scrollIntoView({ block: "nearest" });
  }

  function finishRound() {
    finished = true;
    clearInterval(tickHandle);
    typingInput.disabled = true;
    const elapsed = elapsedCappedMs();
    const { wpm, accuracy, errors } = computeStats(elapsed);

    resultWpm.textContent = wpm;
    resultAccuracy.textContent = `${accuracy}%`;
    resultTime.textContent = `${(elapsed / 1000).toFixed(1)}s`;
    resultErrors.textContent = errors;

    const scores = loadBestScores();
    const key = scoreKey();
    const previousBest = scores[key] || 0;
    if (wpm > previousBest) {
      scores[key] = wpm;
      saveBestScores(scores);
      newBestBadge.classList.remove("hidden");
    }
    updateBestDisplay();

    resultsPanel.classList.remove("hidden");
  }

  typingInput.addEventListener("input", () => {
    if (finished) return;

    if (mode === "timed") {
      extendPassageIfNeeded();
    } else if (typingInput.value.length > passage.length) {
      typingInput.value = typingInput.value.slice(0, passage.length);
    }

    if (startTime === null && typingInput.value.length > 0) {
      startTime = Date.now();
      tickHandle = setInterval(tick, 200);
    }

    highlightPassage();
    tick();

    if (mode === "passage" && typingInput.value.length === passage.length) {
      finishRound();
    }
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      modeButtons.forEach((b) => b.classList.toggle("active", b === btn));
      diffGroup.classList.toggle("hidden", mode !== "passage");
      durationGroup.classList.toggle("hidden", mode !== "timed");
      resetRound();
    });
  });

  diffButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      difficulty = btn.dataset.difficulty;
      diffButtons.forEach((b) => b.classList.toggle("active", b === btn));
      resetRound();
    });
  });

  durationButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      duration = Number(btn.dataset.duration);
      durationButtons.forEach((b) => b.classList.toggle("active", b === btn));
      resetRound();
    });
  });

  restartBtn.addEventListener("click", () => resetRound());
  tryAgainBtn.addEventListener("click", () => resetRound());

  function init() {
    initTheme();
    modeButtons.forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    diffButtons.forEach((b) => b.classList.toggle("active", b.dataset.difficulty === difficulty));
    durationButtons.forEach((b) => b.classList.toggle("active", Number(b.dataset.duration) === duration));
    resetRound();
  }

  init();
})();
