// backend/src/routes/suggestions.ts
import { Router } from "express";
import axios from "axios";
import { withTransaction, generateId } from "../utils/storage";

const router = Router();

// Your existing POST that saves free‐form suggestions…
router.post("/", /* … */);

// New endpoint: GET /api/suggestions/search?query=Inception
router.get("/search", async (req, res) => {
  const query = req.query.query as string;
  if (!query) return res.status(400).json({ error: "Query is required" });

  try {
    const tmdbKey = process.env.TMDB_API_KEY!;
    const tmdbRes = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: tmdbKey, query, page: 1 },
    });

    const results = tmdbRes.data.results.map((m: any) => ({
      id: m.id,
      title: m.title,
      year: m.release_date?.split("-")[0],
      overview: m.overview,
      poster: m.poster_path
        ? `https://image.tmdb.org/t/p/w200${m.poster_path}`
        : null,
    }));

    res.json(results);
  } catch (err: any) {
    console.error("TMDB lookup failed:", err.message);
    res.status(502).json({ error: "External API error" });
  }
});

export default router;
