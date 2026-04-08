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

async function fetchSteamReviews(appId) {
  const reviewsContainer = document.getElementById("steamReviewsContainer");

  try {
    const response = await fetch(`/api/reviews/${appId}`);
    const data = await response.json();

    if (data.success === 1 && data.reviews && data.reviews.length > 0) {
      displaySteamReviews(data.reviews);
    } else {
      reviewsContainer.innerHTML =
        '<p class="loading-reviews">Steam reviews not available via API for this game.</p>';
    }
  } catch (error) {
    console.error("Error fetching Steam reviews:", error);
    reviewsContainer.innerHTML =
      '<p class="loading-reviews">Failed to load reviews</p>';
  }
}

function displaySteamReviews(reviews) {
  const reviewsContainer = document.getElementById("steamReviewsContainer");

  if (!reviews || reviews.length === 0) {
    reviewsContainer.innerHTML =
      '<p class="loading-reviews">No reviews available</p>';
    return;
  }

  reviewsContainer.innerHTML = "";

  reviews.slice(0, 25).forEach((review) => {
    const reviewCard = document.createElement("div");
    reviewCard.className = "review-card";

    const recommendation = review.voted_up ? "Recommended" : "Not Recommended";
    const recClass = review.voted_up ? "positive" : "negative";

    // Truncate long reviews
    let reviewText = review.review;
    if (reviewText.length > 400) {
      reviewText = reviewText.substring(0, 400) + "...";
    }

    reviewCard.innerHTML = `
      <div class="review-header">
        <img class="review-avatar" src="${review.author.avatar}" alt="${review.author.name}">
        <span class="review-author">${review.author.name}</span>
        <span class="review-recommended ${recClass}">${recommendation}</span>
      </div>
      <div class="review-text">${reviewText}</div>
      <div class="review-stats">
        <span>${review.votes_up || 0} people found this helpful</span>
        <span>${review.author.playtime_forever ? Math.floor(review.author.playtime_forever / 60) + " hrs" : "N/A"}</span>
      </div>
    `;

    reviewsContainer.appendChild(reviewCard);
  });
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
  if (game.appId) {
    fetchSteamReviews(game.appId);
  }
}

function displayError(message) {
  const descriptionElement = document.querySelector(".gameDescription");
  if (descriptionElement) {
    descriptionElement.innerHTML = message;
    descriptionElement.style.color = "red";
  }
}

function setupRateButton() {
  const rateButton = document.getElementById("rateButton");

  if (rateButton) {
    rateButton.addEventListener("click", () => {
      rateButton.classList.toggle("rated");

      if (rateButton.classList.contains("rated")) {
        rateButton.innerHTML = "★ Rated";
      } else {
        rateButton.innerHTML = "☆ Rate";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gameName = getGameNameFromURL();
  if (gameName) {
    searchSteamGame(gameName);
  } else {
    displayError("No game selected");
  }

  setupRateButton();
});
