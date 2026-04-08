function displayGames(games, containerId = "newGamesCards") {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  const fragment = document.createDocumentFragment();
  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "newCards";

    card.innerHTML = `
      <img src="${game.thumbnail}" alt="${game.title}" class="newImage" />
      <p class="newName" style="cursor: pointer; text-decoration: underline;">${game.title}</p>
      <p class="newGenre">Genre: ${game.genre}</p>
    `;

    // Only the name is clickable
    const nameElement = card.querySelector(".newName");
    nameElement.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `gamePage.html?game=${encodeURIComponent(game.title)}`;
    });

    fragment.appendChild(card);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

async function fetchNewReleases() {
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      "https://www.freetogame.com/api/games?sort-by=release-date",
    );

  try {
    const response = await fetch(url);
    const games = await response.json();
    displayGames(games.slice(0, 15));
  } catch (error) {
    console.error("Error fetching games:", error);
  }
}

async function fetchPopularGames() {
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      "https://www.freetogame.com/api/games?sort-by=popularity",
    );
  const response = await fetch(url);
  const games = await response.json();
  displayGames(games.slice(0, 15), "popularGamesCards");
}

// Top Shooters
async function fetchShooterGames() {
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      "https://www.freetogame.com/api/games?category=shooter&sort-by=popularity",
    );
  const response = await fetch(url);
  const games = await response.json();
  displayGames(games.slice(0, 15), "shooterGamesCards");
}

// Top MMORPGs
async function fetchMMORPGGames() {
  const url =
    "https://corsproxy.io/?" +
    encodeURIComponent(
      "https://www.freetogame.com/api/games?category=mmorpg&sort-by=popularity",
    );
  const response = await fetch(url);
  const games = await response.json();
  displayGames(games.slice(0, 15), "mmorpgGamesCards");
}

function setupCarousel(trackId, prevBtnId, nextBtnId) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -300, behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: 300, behavior: "smooth" });
    });
  }
}

// Initialize
// Initialize everything
fetchNewReleases();
fetchPopularGames();
fetchShooterGames();
fetchMMORPGGames();
setupCarousel("newGamesCards", "newReleasesPrevBtn", "newReleasesNextBtn");
setupCarousel("popularGamesCards", "popularPrevBtn", "popularNextBtn");
setupCarousel("shooterGamesCards", "shooterPrevBtn", "shooterNextBtn");
setupCarousel("mmorpgGamesCards", "mmorpgPrevBtn", "mmorpgNextBtn");
