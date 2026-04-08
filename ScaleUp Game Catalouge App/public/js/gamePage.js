function getGameNameFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("game");
}

function findBestMatch(items, gameName) {
  const normalize = (str) => str.toLowerCase().trim();
  const target = normalize(gameName);

  return (
    items.find((item) => normalize(item.name) === target) ||
    items.find((item) => normalize(item.name).startsWith(target)) ||
    items.find((item) => normalize(item.name).includes(target)) ||
    items[0]
  );
}

async function searchSteamGame(gameName) {
  try {
    const response = await fetch(
      `/api/search?search=${encodeURIComponent(gameName)}`,
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const bestMatch = findBestMatch(data.items, gameName);
      const gameResponse = await fetch(`/api/game/${bestMatch.id}`);

      if (gameResponse.ok) {
        const game = await gameResponse.json();
        displayGameDetails(game);
        return;
      }
    }

    // Steam failed — try freetogame fallback
    console.warn("Not found on Steam, trying freetogame...");
    await fetchFromFreeToGame(gameName);
  } catch (error) {
    console.error("Error searching Steam:", error);
    await fetchFromFreeToGame(gameName);
  }
}

async function fetchFromFreeToGame(gameName) {
  try {
    const response = await fetch(
      `/api/freetogame/${encodeURIComponent(gameName)}`,
    );

    if (response.ok) {
      const game = await response.json();
      displayGameDetails(game);
    } else {
      displayError(`"${gameName}" was not found on Steam or FreeToGame.`);
    }
  } catch (error) {
    console.error("Freetogame fallback error:", error);
    displayError("Failed to load game details from any source.");
  }
}

function displayGameDetails(game) {
  const gameNameElement = document.querySelector(".gameName");
  if (gameNameElement) gameNameElement.textContent = game.name;

  const releaseDateElement = document.querySelector(".releaseDate");
  if (releaseDateElement)
    releaseDateElement.textContent = `Release Date: ${game.releaseDate || "Unknown"}`;

  const scoreElement = document.querySelector(".gameScore");
  if (scoreElement) {
    scoreElement.textContent = game.metacriticScore
      ? `Metacritic Score: ${game.metacriticScore}`
      : "Score: Not available";
  }

  const descriptionElement = document.querySelector(".gameDescription");
  if (descriptionElement)
    descriptionElement.innerHTML =
      game.fullDescription ||
      game.shortDescription ||
      "No description available";

  const platformsElement = document.querySelector(".platforms");
  if (platformsElement && game.platforms) {
    const availablePlatforms = [];
    if (game.platforms.windows) availablePlatforms.push("PC");
    if (game.platforms.mac) availablePlatforms.push("Mac");
    if (game.platforms.linux) availablePlatforms.push("Linux");
    if (game.platforms.ps5 || game.platforms.playstation)
      availablePlatforms.push("PlayStation");
    if (game.platforms.xbox) availablePlatforms.push("Xbox");
    platformsElement.textContent = `Available on: ${availablePlatforms.join(", ") || "Not specified"}`;
  }

  const imageGalleryElement = document.querySelector(".imageGallery");
  if (imageGalleryElement && game.screenshots) {
    imageGalleryElement.innerHTML = "";
    game.screenshots.forEach((screenshot) => {
      const img = document.createElement("img");
      img.src = screenshot.path_thumbnail || screenshot.path_full;
      img.alt = "Screenshot";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        const mainImageElement = document.querySelector(".mainImage");
        if (mainImageElement) mainImageElement.src = screenshot.path_full;
      });
      imageGalleryElement.appendChild(img);
    });
  }

  const mainImageElement = document.querySelector(".mainImage");
  if (mainImageElement && game.headerImage) {
    mainImageElement.src = game.headerImage;
  }

  // Show source badge if it came from freetogame
  if (game.source === "freetogame") {
    const sourceNote = document.createElement("p");
    sourceNote.textContent = "ℹ️ Limited info — this game is not on Steam.";
    sourceNote.style.cssText =
      "color: #aaa; font-size: 0.85rem; margin-top: 8px;";
    document.querySelector(".gameDescription")?.after(sourceNote);
  }
}

function displayError(message) {
  const descriptionElement = document.querySelector(".gameDescription");
  if (descriptionElement) {
    descriptionElement.innerHTML = message;
    descriptionElement.style.color = "red";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gameName = getGameNameFromURL();
  if (gameName) {
    searchSteamGame(gameName);
  } else {
    displayError("No game selected");
  }
});
