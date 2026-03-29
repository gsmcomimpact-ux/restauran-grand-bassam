import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initial data structure
interface AppData {
  menu: any[];
  orders: any[];
  reservations: any[];
}

const loadData = (): AppData => {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      console.error("Error loading data:", e);
    }
  }
  return { menu: [], orders: [], reservations: [] };
};

const saveData = (data: AppData) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving data:", e);
  }
};

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  let data = loadData();

  // API Routes
  app.get("/api/menu", (req, res) => {
    res.json(data.menu);
  });

  app.post("/api/menu", (req, res) => {
    data.menu = req.body;
    saveData(data);
    io.emit("menu_updated", data.menu);
    res.json({ success: true });
  });

  app.get("/api/orders", (req, res) => {
    res.json(data.orders);
  });

  app.post("/api/orders", (req, res) => {
    const newOrder = req.body;
    data.orders = [newOrder, ...data.orders];
    saveData(data);
    io.emit("new_order", newOrder);
    res.json({ success: true });
  });

  app.post("/api/orders/update", (req, res) => {
    const { id, status } = req.body;
    data.orders = data.orders.map(o => o.id === id ? { ...o, status } : o);
    saveData(data);
    io.emit("order_updated", { id, status });
    res.json({ success: true });
  });

  app.post("/api/orders/delete", (req, res) => {
    const { id } = req.body;
    data.orders = data.orders.filter(o => o.id !== id);
    saveData(data);
    io.emit("order_deleted", id);
    res.json({ success: true });
  });

  app.get("/api/reservations", (req, res) => {
    res.json(data.reservations);
  });

  app.post("/api/reservations", (req, res) => {
    const newRes = req.body;
    data.reservations = [newRes, ...data.reservations];
    saveData(data);
    io.emit("new_reservation", newRes);
    res.json({ success: true });
  });

  app.post("/api/reservations/update", (req, res) => {
    const { id, status } = req.body;
    data.reservations = data.reservations.map(r => r.id === id ? { ...r, status } : r);
    saveData(data);
    io.emit("reservation_updated", { id, status });
    res.json({ success: true });
  });

  app.post("/api/reservations/delete", (req, res) => {
    const { id } = req.body;
    data.reservations = data.reservations.filter(r => r.id !== id);
    saveData(data);
    io.emit("reservation_deleted", id);
    res.json({ success: true });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
