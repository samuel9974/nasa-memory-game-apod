// ============================================
// TASKS - Data management and business logic
// ============================================
const API_KEY = "5L4zgX5wTupy0j22joETfoZccJgdmAJUcoiZ6byy";
const DEFAULT_ROWS = 4;
const DEFAULT_COLS = 4;

function getImageCount() {
  const rows = parseInt(numRows.value) || DEFAULT_ROWS;
  const cols = parseInt(numColumns.value) || DEFAULT_COLS;

  return rows * cols;
}

function buildApiUrl(count) {
  return `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&count=${count}`;
}

async function fetchNasaImages() {
  const count = getImageCount();
  const response = await fetch(buildApiUrl(count));
  
  if (!response.ok) {
    // API error (e.g., invalid key, rate limit)
    throw new Error("API");
  }
  
  const data = await response.json();
  return data;
}

function filterImages(images) {
  return images.filter((image) => image.media_type === "image");
}

// ============================================
// DOM - All DOM manipulations and updates
// ============================================
const imagesRow = document.getElementById("imagesRow");
const playButton = document.getElementById("playButton");
const formSection = document.getElementById("formSection");
const playerName = document.getElementById("playerName");
const numRows = document.getElementById("numRows");
const numColumns = document.getElementById("numColumns");
const validationError = document.getElementById("validationError");
const loadingModal = new bootstrap.Modal(document.getElementById("loadingModal"));
const errorModal = new bootstrap.Modal(document.getElementById("errorModal"));
const errorMessage = document.getElementById("errorMessage");
const retryButton = document.getElementById("retryButton");

function createImageCard(image) {
  const col = document.createElement("div");
  col.className = "col-md-4 mb-3";
  col.innerHTML = `
    <div class="flip-card">
      <div class="flip-card-inner">
        <div class="flip-card-front">
          <img src="${image.url}" alt="NASA APOD">
        </div>
        <div class="flip-card-back">
          <span>?</span>
        </div>
      </div>
    </div>
  `;

  // Add click event to flip the card
  const flipCard = col.querySelector(".flip-card");
  flipCard.addEventListener("click", () => handleCardClick(flipCard));

  return col;
}

function displayImages(images) {
  imagesRow.innerHTML = "";

  images.forEach((image) => {
    const card = createImageCard(image);
    imagesRow.appendChild(card);
  });
}

// ============================================
// UI - User interactions and event coordination
// ============================================
function showError(errorType) {
  let message;
  
  if (errorType === "network") {
    message = "An error occurred while fetching images, it might be a network issue (e.g., no internet). Please try again later.";
  } else {
    message = "An error occurred with the NASA API (their service may not be available right now!). Please try again later.";
  }
  
  errorMessage.textContent = message;
  errorModal.show();
}

function handleCardClick(card) {
  card.classList.toggle("flipped");
}

function validateSettings() {
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
}

async function handlePlayClick() {
  // Show loading spinner
  loadingModal.show();

  try {
    const data = await fetchNasaImages();
    const filteredImages = filterImages(data);
    displayImages(filteredImages);
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
}

function bindEvents() {
  playButton.addEventListener("click", handlePlayClick);
  retryButton.addEventListener("click", () => {
    errorModal.hide();
    handlePlayClick();
  });
  numRows.addEventListener("change", validateSettings);
  numColumns.addEventListener("change", validateSettings);
}

function init() {
  bindEvents();
}

// ============================================
// Initialize app when DOM is ready
// ============================================
document.addEventListener("DOMContentLoaded", init);
