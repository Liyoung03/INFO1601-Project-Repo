const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve all your HTML, CSS, JS files from the public folder
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// ─── SEARCH STEAM ─────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  try {
    const { search } = req.query;
    if (!search)
      return res.status(400).json({ error: "Search query required" });

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(search)}&l=english&cc=US`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ error: "Failed to search Steam" });
  }
});

// ─── GET GAME DETAILS FROM STEAM ──────────────────────────────────────────────
app.get("/api/game/:appid", async (req, res) => {
  try {
    const appid = req.params.appid;
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}`;

    const response = await fetch(url, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    const data = await response.json();

    if (!data[appid] || !data[appid].success) {
      return res.status(404).json({ error: "Game not found on Steam" });
    }

    const game = data[appid].data;

    res.json({
      appId: game.steam_appid,
      name: game.name,
      shortDescription: game.short_description || "No description available",
      fullDescription:
        game.detailed_description ||
        game.about_the_game ||
        "No description available",
      headerImage: game.header_image,
      screenshots: game.screenshots || [],
      releaseDate: game.release_date?.date || "Unknown",
      metacriticScore: game.metacritic?.score || null,
      platforms: game.platforms || {},
      source: "steam",
    });
  } catch (error) {
    console.error("Game details error:", error.message);
    res.status(500).json({ error: "Failed to fetch game details" });
  }
});

// ─── FREETOGAME FALLBACK ──────────────────────────────────────────────────────
// Used when a game is not on Steam (e.g. Valorant)
app.get("/api/freetogame/:name", async (req, res) => {
  try {
    const gameName = req.params.name.toLowerCase();
    const response = await fetch("https://www.freetogame.com/api/games");
    const games = await response.json();

    const match =
      games.find((g) => g.title.toLowerCase() === gameName) ||
      games.find((g) => g.title.toLowerCase().includes(gameName));

    if (!match) {
      return res.status(404).json({ error: "Game not found on FreeToGame" });
    }

    res.json({
      name: match.title,
      shortDescription: match.short_description,
      fullDescription: match.short_description,
      headerImage: match.thumbnail,
      screenshots: [],
      releaseDate: match.release_date,
      metacriticScore: null,
      platforms: { windows: match.platform?.includes("Windows") },
      genre: match.genre,
      source: "freetogame",
    });
  } catch (error) {
    console.error("FreeToGame fallback error:", error.message);
    res.status(500).json({ error: "Fallback also failed" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
