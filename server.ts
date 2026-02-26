import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

const db = new Database("school_app.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    nickname TEXT,
    avatar TEXT,
    country TEXT,
    lang TEXT,
    xp INTEGER DEFAULT 0
  )
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { email, password, nickname, avatar, country, lang } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (email, password, nickname, avatar, country, lang) VALUES (?, ?, ?, ?, ?, ?)");
      const info = stmt.run(email, password, nickname || email.split('@')[0], avatar || '👤', country || 'Ukraine', lang || 'uk');
      res.json({ success: true, userId: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.patch("/api/user/:id", (req, res) => {
    const { nickname, avatar, country, lang, xp } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const stmt = db.prepare(`
        UPDATE users 
        SET nickname = ?, avatar = ?, country = ?, lang = ?, xp = ?
        WHERE id = ?
      `);
      stmt.run(
        nickname ?? user.nickname,
        avatar ?? user.avatar,
        country ?? user.country,
        lang ?? user.lang,
        xp ?? user.xp,
        req.params.id
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Socket.io Chat
  io.on("connection", (socket) => {
    socket.on("join", (room) => {
      socket.join(room);
    });

    socket.on("message", (data) => {
      // data: { sender: string, text: string, lang: string, avatar: string }
      io.emit("message", data);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const __dirname = path.resolve();
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
