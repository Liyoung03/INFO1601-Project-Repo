let browseAllGames = [];
let browseFilteredGames = [];
let browseCurrentPage = 1;
const browseGamesPerPage = 20;

const platformSelect = document.getElementById("platformSection");
const timeframeSelect = document.getElementById("timeframeSection");
const genreSelect = document.getElementById("genreSection");
const gameListContent = document.getElementById("gameListContent");
const pagination = document.getElementById("pagination");

function populatePlatformDropdown() {
  platformSelect.innerHTML = "";
  const platforms = [
    { value: "all", label: "All Platforms" },
    { value: "windows", label: "Windows (PC)" },
    { value: "browser", label: "Browser (Web)" },
  ];

  platforms.forEach((platform) => {
    const option = document.createElement("option");
    option.value = platform.value;
    option.textContent = platform.label;
    platformSelect.appendChild(option);
  });
}

function populateTimeframeDropdown() {
  timeframeSelect.innerHTML = "";
  const timeframes = [
    { value: "release-date", label: "Newest First" },
    { value: "popularity", label: "Most Popular" },
    { value: "alphabetical", label: "A-Z" },
  ];

  timeframes.forEach((timeframe) => {
    const option = document.createElement("option");
    option.value = timeframe.value;
    option.textContent = timeframe.label;
    timeframeSelect.appendChild(option);
  });
}

function populateGenreDropdown() {
  genreSelect.innerHTML = "";
  const genres = new Set();
  browseAllGames.forEach((game) => {
    if (game.genre) genres.add(game.genre);
  });

  const sortedGenres = ["All Genres", ...Array.from(genres).sort()];

  sortedGenres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre === "All Genres" ? "all" : genre;
    option.textContent = genre;
    genreSelect.appendChild(option);
  });
}

function sortGames(sortBy) {
  switch (sortBy) {
    case "release-date":
      browseFilteredGames.sort((a, b) => {
        const dateA = new Date(a.release_date || "2000-01-01");
        const dateB = new Date(b.release_date || "2000-01-01");
        return dateB - dateA;
      });
      break;
    case "popularity":
      break;
    case "alphabetical":
      browseFilteredGames.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
}

function filterGames() {
  const platform = platformSelect.value;
  const genre = genreSelect.value;
  const timeframe = timeframeSelect.value;

  browseFilteredGames = browseAllGames.filter((game) => {
    if (platform === "all") return true;
    if (platform === "windows")
      return (
        game.platform?.includes("Windows") || game.platform?.includes("PC")
      );
    if (platform === "browser")
      return (
        game.platform?.includes("Browser") || game.platform?.includes("Web")
      );
    return true;
  });

  if (genre !== "all") {
    browseFilteredGames = browseFilteredGames.filter(
      (game) => game.genre === genre,
    );
  }

  sortGames(timeframe);
  browseCurrentPage = 1;
  displayGames();
  setupPagination();
}

function displayGames() {
  const startIndex = (browseCurrentPage - 1) * browseGamesPerPage;
  const endIndex = startIndex + browseGamesPerPage;
  const gamesToShow = browseFilteredGames.slice(startIndex, endIndex);

  if (gamesToShow.length === 0) {
    gameListContent.innerHTML = '<p class="no-games">No games found</p>';
    return;
  }

  gameListContent.innerHTML = "";

  gamesToShow.forEach((game, index) => {
    const globalIndex = startIndex + index + 1;
    const row = document.createElement("div");
    row.className = "gameRow";

    row.innerHTML = `
      <span class="gameNumber">${globalIndex}</span>
      <div class="gameInfo">
        <img src="${game.thumbnail}" alt="${game.title}" class="gameThumbnail" />
        <span class="gameName" data-game="${game.title}">${game.title}</span>
      </div>
      <span class="gamePlatform">${game.platform || "PC"}</span>
      <span class="gameGenre">${game.genre || "Not specified"}</span>
      <span class="gameReleaseDate">${game.release_date || "Unknown"}</span>
    `;

    const nameElement = row.querySelector(".gameName");
    nameElement.addEventListener("click", () => {
      window.location.href = `gamePage.html?game=${encodeURIComponent(game.title)}`;
    });

    gameListContent.appendChild(row);
  });

  setupPagination();
}

function setupPagination() {
  const totalPages = Math.ceil(browseFilteredGames.length / browseGamesPerPage);
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Previous";
  prevBtn.disabled = browseCurrentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (browseCurrentPage > 1) {
      browseCurrentPage--;
      displayGames();
    }
  });

  const pageSpan = document.createElement("span");
  pageSpan.textContent = `Page ${browseCurrentPage} of ${totalPages}`;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next →";
  nextBtn.disabled = browseCurrentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (browseCurrentPage < totalPages) {
      browseCurrentPage++;
      displayGames();
    }
  });

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageSpan);
  pagination.appendChild(nextBtn);
}

async function fetchAllGames() {
  try {
    const url =
      "https://corsproxy.io/?" +
      encodeURIComponent("https://www.freetogame.com/api/games");
    const response = await fetch(url);
    browseAllGames = await response.json();
    browseFilteredGames = [...browseAllGames];

    populatePlatformDropdown();
    populateTimeframeDropdown();
    populateGenreDropdown();
    sortGames("release-date");
    displayGames();
  } catch (error) {
    console.error("Failed to fetch games:", error);
    gameListContent.innerHTML = '<p class="error">Failed to load games</p>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("resetFilters");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      platformSelect.value = "all";
      timeframeSelect.value = "release-date";
      genreSelect.value = "all";
      filterGames();
    });
  }
});

platformSelect.addEventListener("change", filterGames);
timeframeSelect.addEventListener("change", filterGames);
genreSelect.addEventListener("change", filterGames);

fetchAllGames();
