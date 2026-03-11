import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  const db = new Database("sandbox.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      agent TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      sender TEXT,
      payload TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );
  `);

  app.use(express.json());

  // API Routes
  app.get("/api/sessions", (req, res) => {
    const sessions = db.prepare("SELECT * FROM sessions ORDER BY created_at DESC").all();
    res.json(sessions);
  });

  app.post("/api/sessions", (req, res) => {
    const { agent } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare("INSERT INTO sessions (id, agent, status) VALUES (?, ?, ?)").run(id, agent, "running");
    
    // Initial event
    db.prepare("INSERT INTO events (session_id, sender, payload) VALUES (?, ?, ?)").run(
      id, 
      "system", 
      JSON.stringify({ text: `Session started with agent: ${agent}` })
    );

    res.json({ id, agent, status: "running" });
  });

  app.get("/api/sessions/:id/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC").all(req.params.id);
    res.json(events.map(e => ({ ...e, payload: JSON.parse(e.payload) })));
  });

  app.post("/api/sessions/:id/prompt", (req, res) => {
    const { text } = req.body;
    const sessionId = req.params.id;

    // Log user message
    db.prepare("INSERT INTO events (session_id, sender, payload) VALUES (?, ?, ?)").run(
      sessionId,
      "user",
      JSON.stringify({ text })
    );

    // Simulate agent response (in a real app, this would call the Sandbox Agent API)
    // For now, we'll just acknowledge it.
    setTimeout(() => {
      db.prepare("INSERT INTO events (session_id, sender, payload) VALUES (?, ?, ?)").run(
        sessionId,
        "agent",
        JSON.stringify({ text: `Processing your request: "${text}"... (Simulation mode)` })
      );
    }, 1000);

    res.json({ status: "ok" });
  });

  app.delete("/api/sessions/:id", (req, res) => {
    db.prepare("DELETE FROM events WHERE session_id = ?").run(req.params.id);
    db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
    res.json({ status: "deleted" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
