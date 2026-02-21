import mongoose from "mongoose";

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/narrador-db";
    await mongoose.connect(uri);
    console.log("✅ MongoDB conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar MongoDB:", error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB desconectado");
  } catch (error) {
    console.error("❌ Erro ao desconectar MongoDB:", error);
  }
}
