import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import yts from "yt-search";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser
  app.use(express.json());

  // API Routes
  app.get("/api/trending", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const terms = ["trending tech", "latest technology", "new gadgets", "tech news", "future technology", "tech reviews"];
      const searchTerm = terms[(page - 1) % terms.length];
      
      const results = await yts(searchTerm);
      res.json({
        videos: results.videos.map((v) => ({
          id: v.videoId,
          title: v.title,
          channel: v.author.name,
          views: `${v.views.toLocaleString()} views • ${v.ago}`,
          duration: v.timestamp,
        }))
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch trending" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      
      if (!query) {
        return res.status(400).json({ error: "Query required" });
      }
      
      // Modify query slightly to get different results for subsequent pages
      const searchSuffix = page > 1 ? ` part ${page}` : '';
      const results = await yts(`${query}${searchSuffix}`);
      
      res.json({
        videos: results.videos.map((v) => ({
          id: v.videoId,
          title: v.title,
          channel: v.author.name,
          views: `${v.views.toLocaleString()} views • ${v.ago}`,
          duration: v.timestamp,
        }))
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
