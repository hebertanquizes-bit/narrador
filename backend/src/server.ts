import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/database";
import authRoutes from "./routes/auth";
import workspaceRoutes from "./routes/workspace";
import ragController from "./controllers/ragController";
import coNarratorController from "./controllers/coNarratorController";
import { setupCombatEvents } from "./sockets/combatEvents";
import { initializeRAG } from "./services/ragService";
import { isOllamaAvailable } from "./services/ollamaService";

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan("combined"));

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`📡 Usuário conectado: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`📡 Usuário desconectado: ${socket.id}`);
  });

  // Game events will be handled here in Phase 2
  socket.on("game:action", (data) => {
    console.log("Ação de jogo recebida:", data);
  });
});

// Setup combat events for real-time sync
setupCombatEvents(io);

// Seed endpoint - create test users
app.post("/api/seed", async (req: Request, res: Response) => {
  try {
    const { User } = await import("./models/User");
    const bcrypt = await import("bcryptjs");
    
    // Check if visitor already exists
    let visitor = await User.findOne({ email: "visitor@narrador.local" });
    if (!visitor) {
      const hashedPassword = await bcrypt.default.hash("visitor123", 10);
      visitor = new User({
        email: "visitor@narrador.local",
        name: "Visitante",
        password: hashedPassword,
      });
      await visitor.save();
      console.log("✅ Usuário visitante criado");
    }
    
    res.json({ message: "Database seeded", users: { visitor: visitor.email } });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ error: "Erro ao popular banco de dados" });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/rag", ragController);
app.use("/api/co-narrator", coNarratorController);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Erro:", err);

  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Database connection and server startup
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ Conectado ao banco de dados");

    // Initialize RAG system
    console.log("📚 Inicializando sistema RAG...");
    await initializeRAG();

    // Check Ollama availability
    const ollamaReady = await isOllamaAvailable();
    if (ollamaReady) {
      console.log("🤖 Ollama disponível e pronto");
    } else {
      console.warn("⚠️  Ollama não está disponível - alguns recursos IA estarão desativados");
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🎭 NARRADOR - Backend Server         ║
║  Porta: ${PORT}                        ║
║  Status: ✅ Rodando                   ║
║  Socket.IO: ✅ Pronto                 ║
║  RAG: ${ollamaReady ? "✅ Pronto" : "⚠️  Offline"}                 ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("📛 SIGTERM recebido, encerrando...");
  httpServer.close();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, httpServer, io };
