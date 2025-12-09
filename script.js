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
  try {
    const count = getImageCount();
    const response = await fetch(buildApiUrl(count));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching NASA images:", error);
    return [];
  }
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

function createImageCard(image) {
  const col = document.createElement("div");
  col.className = "col-md-4 mb-3";
  col.innerHTML = `
    <div class="card">
      <img src="${image.url}" class="card-img-top"
      style="height: 200px; object-fit: cover;">
    </div>
  `;
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
  const data = await fetchNasaImages();
  const filteredImages = filterImages(data);
  displayImages(filteredImages);
}

function bindEvents() {
  playButton.addEventListener("click", handlePlayClick);
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
