import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.userId = (decoded as any).userId;
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function workspaceAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Valida que o usuário acessa só seu workspace
  if (!req.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  // Este middleware pode ser estendido para validar workspaceId
  next();
}
// Alias para compatibilidade
export const authenticate = authMiddleware;