const API_KEY = "5L4zgX5wTupy0j22joETfoZccJgdmAJUcoiZ6byy";
const DEFAULT_ROWS = 2;
const DEFAULT_COLS = 2;

// ============================================
// GAME STATE - Variables to track game progress
// ============================================
let flippedCards = []; // Array to store currently flipped cards (max 2 at a time)
let matchedPairs = 0; // Counter for successfully matched pairs
let totalPairs = 0; // Total number of pairs needed to win
let flipCount = 0; // Total number of card flips (for scoring)
let isChecking = false; // Flag to prevent clicks while checking for match
let gameTimer = null; // Reference to the timer interval
let elapsedSeconds = 0; // Time elapsed since game started
let gameStarted = false; // Flag to know if first card was clicked

// ============================================
// TASKS - Data management and business logic
// ============================================

// Function to reset all game state (called when starting new game)
const resetGameState = () => {
  flippedCards = [];
  matchedPairs = 0;
  flipCount = 0;
  isChecking = false;
  elapsedSeconds = 0;
  gameStarted = false;

  // Stop any existing timer
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
};

// Get the delay setting from the dropdown (in milliseconds)
const getDelayMs = () => {
  const delaySelect = document.getElementById("delay");
  const delaySeconds = parseFloat(delaySelect.value) || 1;
  return delaySeconds * 1000; // Convert to milliseconds
};

const getImageCount = () => {
  const rows = parseInt(numRows.value) || DEFAULT_ROWS;
  const cols = parseInt(numColumns.value) || DEFAULT_COLS;
  // Divide by 2 because each image will be duplicated to create pairs
  return (rows * cols) / 2;
};

const buildApiUrl = (count) => {
  return `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&count=${count}`;
};

const fetchNasaImages = async () => {
  const count = getImageCount();
  const response = await fetch(buildApiUrl(count));

  if (!response.ok) {
    // API error (e.g., invalid key, rate limit)
    throw new Error("API");
  }

  const data = await response.json();
  return data;
};

const filterImages = (images) => {
  return images.filter((image) => image.media_type === "image");
};

// Fisher-Yates shuffle algorithm for random card arrangement
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create pairs of cards and shuffle them
const createPairs = (images) => {
  const pairs = [...images, ...images];
  const shuffledPairs = shuffleArray(pairs);
  return shuffledPairs;
};

// ============================================
// DOM - All DOM manipulations and updates
// ============================================

  let imagesRow = document.getElementById("imagesRow");
  let playButton = document.getElementById("playButton");
  let formSection = document.getElementById("formSection");
  let playerName = document.getElementById("playerName");
  let numRows = document.getElementById("numRows");
  let numColumns = document.getElementById("numColumns");
  let validationError = document.getElementById("validationError");
  let loadingModal = new bootstrap.Modal(document.getElementById("loadingModal"));
  let errorModal = new bootstrap.Modal(document.getElementById("errorModal"));
  let errorMessage = document.getElementById("errorMessage");
  let retryButton = document.getElementById("retryButton");
  let highScoresButton = document.getElementById("highScoresButton");
  let leaderboardTableBody = document.getElementById("leaderboardTableBody");
  let leaderboardModal = new bootstrap.Modal(document.getElementById("leaderboardModal"));
  let nasaImagesContainer = document.getElementById("nasaImagesContainer");
  let settingsModal = new bootstrap.Modal(document.getElementById("settingsModal"));
  let flipCountDisplay = document.getElementById("flipCountDisplay");
  let matchedPairsDisplay = document.getElementById("matchedPairsDisplay");
  let timerDisplay = document.getElementById("timerDisplay");
  let gameOverStats = document.getElementById("gameOverStats");
  let gameOverTableBody = document.getElementById("gameOverTableBody");

const getColumnClass = () => {
  const cols = parseInt(numColumns.value) || DEFAULT_COLS;
  // Bootstrap uses 12-column grid, calculate width per card
  const colSize = Math.floor(12 / cols);
  return `col-${colSize} mb-3`;
};

const createImageCard = (image) => {
  const col = document.createElement("div");
  col.className = getColumnClass();

  // Added data-image-url attribute to identify matching cards
  col.innerHTML = `
    <div class="flip-card flipped" data-image-url="${image.url}">
      <div class="flip-card-inner w-100">
        <div class="flip-card-front w-100 h-100 rounded-3 overflow-hidden">
          <img src="${image.url}" alt="NASA APOD" class="w-100 h-100 object-fit-cover">
        </div>
        <div class="flip-card-back w-100 h-100 rounded-3 bg-warning d-flex justify-content-center align-items-center">
          <span class="fs-1 fw-bold text-dark">?</span>
        </div>
      </div>
    </div>
  `;

  // Add click event to flip the card
  const flipCard = col.querySelector(".flip-card ");
  console.log("Adding click event to card:");
  console.log(flipCard);
  flipCard.addEventListener("click", () => handleCardClick(flipCard));

  return col;
};

const displayImages = (images) => {
  imagesRow.innerHTML = "";

  images.forEach((image) => {
    const card = createImageCard(image);
    imagesRow.appendChild(card);
  });

  // Set total pairs for win condition
  totalPairs = images.length / 2;
};

// ============================================
// UI - User interactions and event coordination
// ============================================
const showError = (errorType) => {
  let message;

  if (errorType === "network") {
    message =
      "An error occurred while fetching images, it might be a network issue (e.g., no internet). Please try again later.";
  } else {
    message =
      "An error occurred with the NASA API (their service may not be available right now!). Please try again later.";
  }

  errorMessage.textContent = message;
  errorModal.show();
};

const handleCardClick = (card) => {
  // Validation: prevent invalid clicks
  if (isChecking) return; // Don't allow clicks while checking for match
  if (!card.classList.contains("flipped")) return; // Only allow clicking face-down cards
  if (card.classList.contains("matched")) return; // Don't allow clicking matched cards
  if (flippedCards.includes(card)) return; // Don't allow clicking the same card twice

  // Flip the card (remove flipped class to show image)
  card.classList.remove("flipped");
  flippedCards.push(card);
  filterImages.imageUrl = card.getAttribute("data-image-url");
  flipCount++;

  // If two cards are flipped, check for match
  if (flippedCards.length === 2) {
    isChecking = true;
    const [firstCard, secondCard] = flippedCards;
    const firstImageUrl = firstCard.getAttribute("data-image-url");
    const secondImageUrl = secondCard.getAttribute("data-image-url");
    if (firstImageUrl === secondImageUrl) {
      handleMatch(firstCard, secondCard);
    } else {
      handleNoMatch(firstCard, secondCard);
    }
  }
};

// Handle when two cards match
const handleMatch = (firstCard, secondCard) => {
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");
  matchedPairs++;
  flippedCards = [];
  isChecking = false;
  updateStatsDisplay();
  checkWinCondition();
};

// Handle when two cards do not match
const handleNoMatch = (firstCard, secondCard) => {
  const delay = getDelayMs();
  setTimeout(() => {
    firstCard.classList.add("flipped");
    secondCard.classList.add("flipped");
    flippedCards = [];
    isChecking = false;
    // Next step: allow player to continue
  }, delay);
};

const validateSettings = () => {
  const rows = parseInt(numRows.value) || DEFAULT_ROWS;
  const cols = parseInt(numColumns.value) || DEFAULT_COLS;
  const totalCards = rows * cols;

  if (totalCards % 2 !== 0) {
    validationError.style.display = "block";
    return false;
  } else {
    validationError.style.display = "none";
    return true;
  }
};

const updateStatsDisplay = () => {
  const flipCountDisplay = document.getElementById("flipCountDisplay");
  const matchedPairsDisplay = document.getElementById("matchedPairsDisplay");
  const timerDisplay = document.getElementById("timerDisplay");
  if (flipCountDisplay) flipCountDisplay.textContent = flipCount;
  if (matchedPairsDisplay)
    matchedPairsDisplay.textContent = `${matchedPairs}/${totalPairs}`;
  if (timerDisplay) timerDisplay.textContent = formatTime(elapsedSeconds);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const startTimer = () => {
  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    elapsedSeconds++;
    updateStatsDisplay();
  }, 1000);
};

const handlePlayClick = async () => {
  // Validate player name: only letters and digits allowed
  const nameValue = playerName.value.trim();
  const nameRegex = /^[A-Za-z0-9]+$/;
  if (!nameValue || !nameRegex.test(nameValue)) {
    validationError.textContent =
      "Please enter a valid name (letters and digits only).";
    validationError.style.display = "block";
    playerName.classList.add("is-invalid");
    playerName.focus();
    return;
  } else {
    validationError.style.display = "none";
    playerName.classList.remove("is-invalid");
  }
  // Hide the login form and show the game area
  formSection.classList.add("d-none");
  nasaImagesContainer.classList.remove("d-none");

  // Reset game state and stats
  resetGameState();
  updateStatsDisplay();

  // Show loading spinner
  loadingModal.show();

  try {
    const data = await fetchNasaImages();
    const filteredImages = filterImages(data);
    // Create pairs and shuffle using Fisher-Yates
    const shuffledPairs = createPairs(filteredImages);
    displayImages(shuffledPairs);
    // Set totalPairs and update stats again
    totalPairs = shuffledPairs.length / 2;
    updateStatsDisplay();
    // Start timer
    startTimer();
    gameStarted = true;
  } catch (error) {
    // Determine error type
    if (error.message === "API") {
      showError("api");
    } else {
      showError("network");
    }
  } finally {
    // Hide loading spinner
    loadingModal.hide();
  }
};

const checkWinCondition = () => {
  if (matchedPairs === totalPairs) {
    clearInterval(gameTimer);
    gameTimer = null;
    // localStorage.removeItem("memoryGameScores");
    saveScore();
    showGameOverModal();
  }
};

const saveScore = () => {
  const player = playerName.value.trim() || "Anonymous";
  const score = matchedPairs; // You can use flipCount or another metric if you want
  let scores = JSON.parse(localStorage.getItem("memoryGameScores") || "[]");

  scores.push({ player, score });

  // Sort descending by score, keep only top 10
  scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem("memoryGameScores", JSON.stringify(scores));
};

const showGameOverModal = () => {
  // Get scores and sort
  let scores = JSON.parse(localStorage.getItem("memoryGameScores") || "[]");
  const player = playerName.value.trim() || "Anonymous";
  const score = matchedPairs;
  // Find player rank
  const rank =
    scores.findIndex((s) => s.player === player && s.score === score) + 1;
  // Build table rows for top 3
  let rows = "";
  scores.slice(0, 3).forEach((s, i) => {
    rows += `<tr><td>${i + 1}</td><td>${s.player}</td><td>${s.score}</td></tr>`;
  });
  // Fill modal content
  document.getElementById("gameOverStats").innerHTML = `
    <div>Number of cards played: ${totalPairs * 2}</div>
    <div>Number of attempts: ${flipCount}</div>
    <div>Score: ${score}. You are ranked ${rank} out of ${scores.length}</div>
  `;
  document.getElementById("gameOverTableBody").innerHTML = rows;
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("gameOverModal"));
  modal.show();
};

const bindEvents = () => {
  playButton.addEventListener("click", handlePlayClick);
  retryButton.addEventListener("click", () => {
    errorModal.hide();
    handlePlayClick();
  });
  numRows.addEventListener("change", validateSettings);
  numColumns.addEventListener("change", validateSettings);

  // Close settings modal on Save Settings click
  const saveSettingsBtn = document.querySelector(
    "#settingsModal .btn.btn-primary"
  );
  const settingsModalEl = document.getElementById("settingsModal");

  let settingsModalInstance = null;
  if (settingsModalEl) {
    settingsModalInstance =
      bootstrap.Modal.getOrCreateInstance(settingsModalEl);
  }
  if (saveSettingsBtn && settingsModalInstance) {
    saveSettingsBtn.addEventListener("click", () => {
      settingsModalInstance.hide();
    });
  }

  // Show leaderboard modal on High Scores click
  if (highScoresButton) {
    highScoresButton.addEventListener("click", showLeaderboard);
  }
};

const showLeaderboard = () => {
  // Get scores and sort
  let scores = JSON.parse(localStorage.getItem("memoryGameScores") || "[]");
  scores = scores.sort((a, b) => b.score - a.score).slice(0, 3);
  let rows = "";
  scores.forEach((s, i) => {
    rows += `<tr><td>${i + 1}</td><td>${s.player}</td><td>${s.score}</td></tr>`;
  });
  leaderboardTableBody.innerHTML = rows;
  leaderboardModal.show();
};

const init = () => {
  bindEvents();
};

// ============================================
// Initialize app when DOM is ready
// ============================================
document.addEventListener("DOMContentLoaded", function () {
  init();
  const backToLoginGameButton = document.getElementById(
    "backToLoginGameButton"
  );
  if (backToLoginGameButton) {
    backToLoginGameButton.addEventListener("click", function () {
      // Show the login form
      if (formSection) formSection.classList.remove("d-none");
      // Hide the game area
      if (nasaImagesContainer) nasaImagesContainer.classList.add("d-none");
      // Optionally reset the game state or clear images
      if (imagesRow) imagesRow.innerHTML = "";
    });
  }
});
